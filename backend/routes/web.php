<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/debug-config', function () {
    try {
        DB::connection()->getPdo();
        $dbStatus = "Connected to " . DB::connection()->getDatabaseName();
    } catch (\Exception $e) {
        $dbStatus = "Connection failed: " . $e->getMessage();
    }

    return response()->json([
        'default' => config('database.default'),
        'connections' => config('database.connections'),
        'env_db_connection' => env('DB_CONNECTION'),
        'db_status' => $dbStatus,
    ]);
});
