<?php

use Illuminate\Support\Facades\Route;
use Modules\CRM\Http\Controllers\LeadController;
use Modules\CRM\Http\Controllers\CustomerController;

Route::middleware('auth:sanctum')->prefix('api')->group(function () {
    // Lead routes
    Route::apiResource('leads', LeadController::class);
    Route::put('leads/{lead}/status', [LeadController::class, 'updateStatus']);
    Route::post('leads/{lead}/convert', [LeadController::class, 'convert']);
    
    // Customer routes
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{customer}/interactions', [CustomerController::class, 'addInteraction']);
    Route::get('customers/{customer}/interactions', [CustomerController::class, 'interactions']);
});