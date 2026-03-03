# Modular CRM Integration Guide

This guide is designed to help you easily merge new modules (like `feature/sales-module` from Person C) into the main integration branch without breaking the app.

Since the application uses a modular structure but currently keeps controllers in `app/Http/Controllers` and models in `Modules/.../Entities`, merging branches developed in isolation requires careful attention to namespaces, database migrations, and frontend routing.

---

## 🚀 1. Preparing the Merge

Always merge features into an integration branch first so you don't corrupt the stable `main` branch.

```bash
# Ensure you are on the latest integration branch
git checkout integration-all-modules
git pull origin integration-all-modules

# Merge the new feature (e.g., Sales Module)
git merge feature/sales-module
```

---

## 🛡️ 2. Resolving Backend Conflicts

When merging a new module, you will likely encounter merge conflicts in core configuration files.

### `composer.json` & `docker-compose.yml`
- **Rule of Thumb:** Always keep the structure from the **user module** (or the current integration branch). It has the stable `nwidart/laravel-modules` definitions and the 3-container Docker setup.
- Only add **new** dependencies or services introduced by the feature branch. Do not overwrite the base structure.

### `routes/api.php`
- The `api.php` file will conflict because every developer adds their routes here.
- Merge them sequentially. Ensure that the original Authentication routes (like `/login`, `/register`) remain untouched.
- **Security:** Ensure any new CRM/Sales routes are placed inside the Sanctum authorization middleware group:
  ```php
  Route::middleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 'auth:sanctum'])->group(function () {
      // Add Customer/Lead/Sales routes here
  });
  ```

---

## 🧩 3. Fixing PSR-4 Namespaces (Crucial step)

Because the project folder structure places Models inside `Modules/[Name]/Entities` but some branch developers might have created them in `App\Models`, you **must manually check** all new models.

1. Open the new models (e.g., `Product.php`, `Transaction.php`).
2. Update their namespace to exactly match their folder structure so `composer dump-autoload` works natively:
   ```php
   // ❌ Bad (throws Class Not Found error)
   namespace App\Models;

   // ✅ Good
   namespace Modules\Sales\Entities; 
   ```
3. Update the `use` import statements in the new Controllers to match this corrected namespace.

---

## 🗄️ 4. Preventing Database Migration Duplicates

A common issue when merging isolated branches is that developers might recreate tables that already exist (like `users` or `personal_access_tokens`), or try to alter them redundantly.

- Check `database/migrations/` and `Modules/*/Database/Migrations/`.
- **Delete any duplicate** migrations (e.g., if Person C made a migration to add a `role` column, but Person A already did that in the main module).
- This ensures `php artisan migrate --seed` runs perfectly without `SQLSTATE[42S21]: Column already exists` errors.

---

## 🎨 5. Merging Frontend Pages

### Layout & Navigation (`Layout.tsx`)
- Do not let feature branches introduce their own hardcoded sidebars in their page components (e.g., `SalesDashboard.tsx`).
- Remove any local `<aside className="sidebar">` and `<header className="top-bar">` from the new pages.
- Add the new navigation links to `src/components/Layout.tsx`.

### Contexts (`App.tsx`)
- If the new module introduces a React Context (like `SalesProvider`), ensure you wrap the entire application with it in `App.tsx`!
- **Example:**
  ```tsx
  <AuthProvider>
      <CRMProvider>
          <SalesProvider> <!-- Add new provider here! -->
              <Suspense fallback={<PageLoader />}>
                  <Routes>
                       {/* Routes ... */}
                  </Routes>
              </Suspense>
          </SalesProvider>
      </CRMProvider>
  </AuthProvider>
  ```
- Wrap all new routes inside the `<Layout title="Page Name">` component inside `PrivateRoute`.

---

## ✅ 6. Final Rebuild & Verification

After resolving the text conflicts and making the changes above, **always rebuild** to flush the cache.

```bash
# 1. Clean up stale containers and cached volumes
docker-compose down -v

# 2. Rebuild the application
docker-compose up -d --build

# 3. Verify backend started without looping migrations
docker logs our-crm-backend-1

# 4. Access the frontend to verify the application loads
# Check http://localhost:3000
```

Once you've done this, `git add`, `git commit`, and `git push`! You've successfully integrated the module.
