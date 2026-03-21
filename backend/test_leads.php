<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \Modules\User\Entities\User::where('email', 'dev@admin.com')->first();
if (!$user) {
    die("User not found\n");
}
\Illuminate\Support\Facades\Auth::login($user);
$request = \Illuminate\Http\Request::create('/api/leads', 'GET');
$response = app(\App\Http\Controllers\LeadController::class)->index($request);

if ($response instanceof \Illuminate\Http\JsonResponse) {
    echo json_encode($response->getData(true), JSON_PRETTY_PRINT);
} else {
    echo json_encode($response->toArray(), JSON_PRETTY_PRINT);
}
