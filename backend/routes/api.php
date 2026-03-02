<?php

use Modules\User\Http\Controllers\AuthController;
use Modules\User\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Public and authenticated API routes for the CRM User Module.
|
*/

// Public routes
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require valid Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Admin-only routes
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});

Route::fallback(function () {
    return response()->json(['message' => 'DEBUG: API Fallback hit'], 404);
});

Route::options('/{any}', function () {
    return response()->noContent();
})->where('any', '.*');
