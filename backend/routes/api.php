<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\LeadController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Mock user endpoint for frontend context
Route::get('/user', function (Request $request) {
    // Return the first user or a dummy user
    return User::first() ?? response()->json([
        'id' => 1,
        'name' => 'Demo User',
        'email' => 'demo@example.com',
        'role' => 'admin'
    ]);
});

// Lead routes (Open access)
Route::apiResource('leads', LeadController::class);
Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

// Customer routes (Open access)
Route::apiResource('customers', CustomerController::class);
Route::post('/customers/{customer}/interactions', [CustomerController::class, 'addInteraction']);
Route::get('/customers/{customer}/interactions', [CustomerController::class, 'interactions']);
