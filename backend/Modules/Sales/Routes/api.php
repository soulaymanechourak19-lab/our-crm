<?php

use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\ProductController;

Route::get('products/categories/list', [ProductController::class, 'categories']);
Route::apiResource('products', ProductController::class);
Route::put('products/{product}/stock', [ProductController::class, 'updateStock']);

