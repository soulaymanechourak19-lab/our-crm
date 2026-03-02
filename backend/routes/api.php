<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\LeadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Combined routes for User Module + CRM Module.
|
*/

// ── Public routes ────────────────────────────────────────────────────────

Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ── Protected routes (require valid Sanctum token) ──────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // User / Auth
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ── CRM: Leads ──────────────────────────────────────────────────────
    Route::apiResource('leads', LeadController::class);
    Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

    // ── CRM: Customers ──────────────────────────────────────────────────
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{customer}/interactions', [CustomerController::class, 'addInteraction']);
    Route::get('/customers/{customer}/interactions', [CustomerController::class, 'interactions']);

    // ── Admin-only routes ───────────────────────────────────────────────
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});

Route::fallback(function () {
    return response()->json(['message' => 'Route not found'], 404);
});

Route::options('/{any}', function () {
    return response()->noContent();
})->where('any', '.*');
