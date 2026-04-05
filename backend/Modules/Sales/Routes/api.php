<?php

use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('api')->group(function () {
    // Product routes will be added here by Person C
    // Route::apiResource('products', 'ProductController');
});
