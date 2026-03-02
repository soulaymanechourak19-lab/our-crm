<?php

use Modules\User\Entities\User;
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
