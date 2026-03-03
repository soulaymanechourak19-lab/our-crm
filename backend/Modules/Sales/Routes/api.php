<?php

use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\ProductController;

Route::middleware('auth:sanctum')->prefix('api')->group(function () {
    // Product routes
    Route::apiResource('products', ProductController::class);
    Route::put('products/{product}/stock', [ProductController::class, 'updateStock']);
    Route::get('products/categories/list', [ProductController::class, 'categories']);
});
