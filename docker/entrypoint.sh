#!/bin/bash
set -e

echo "⏳ Waiting for MySQL to be ready..."
MYSQL_HOST="${DB_HOST:-mysql}"
MYSQL_PORT="${DB_PORT:-3306}"
MAX_RETRIES=30
RETRY_COUNT=0

until (echo > /dev/tcp/"$MYSQL_HOST"/"$MYSQL_PORT") >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "❌ MySQL did not become ready after $MAX_RETRIES attempts. Exiting."
        exit 1
    fi
    echo "   MySQL not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES) — retrying in 2s..."
    sleep 2
done
echo "✅ MySQL is ready."

cd /var/www/html

# Ensure .env file exists
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
fi

# Install/update PHP dependencies (needed because the vendor-cache volume may be empty)
echo "📦 Installing Composer dependencies..."
composer install --no-interaction --optimize-autoloader

# Generate app key if not set
if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

echo "🔧 Running migrations..."
php artisan migrate --force

# Run module migrations only if the module system is available
# if php artisan list 2>/dev/null | grep -q "module:migrate"; then
#     echo "🔧 Running module migrations..."
#     php artisan module:migrate --force
# else
#     echo "⚠️  Module system not available, skipping module migrations."
# fi


echo "🌱 Running seeders (idempotent)..."
php artisan db:seed --force

echo "🚀 Caching config and routes..."
php artisan config:cache
php artisan route:cache

# Fix storage permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

echo "✅ Backend ready. Starting Apache..."
exec apache2-foreground
