<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;


define('LARAVEL_START', microtime(true));

file_put_contents(__DIR__.'/../request.log', date('Y-m-d H:i:s') . ': ' . ($_SERVER['REQUEST_URI'] ?? 'CLI') . ' ' . ($_SERVER['REQUEST_METHOD'] ?? 'CLI') . PHP_EOL, FILE_APPEND);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
