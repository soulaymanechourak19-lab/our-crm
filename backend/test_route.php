<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$request = Illuminate\Http\Request::create('/api/register', 'POST', [
    'name' => 'Test Internal',
    'email' => 'test_internal_' . time() . '@test.com',
    'password' => 'password',
    'password_confirmation' => 'password',
    'role' => 'agent_commercial'
]);

$request->headers->set('Accept', 'application/json');

try {
    $response = $kernel->handle($request);
    echo "Status Code: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "Columns: " . implode(', ', \Illuminate\Support\Facades\Schema::getColumnListing('users')) . "\n";
