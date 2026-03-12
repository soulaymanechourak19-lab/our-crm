<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Leads: " . DB::table('leads')->count() . "\n";
    echo "Customers: " . DB::table('customers')->count() . "\n";
    echo "Products: " . DB::table('products')->count() . "\n";
    
    // Test dashboard controller manually
    $req = request();
    $res = app()->make('App\Http\Controllers\DashboardController')->getStats($req);
    echo "Dashboard GetStats output:\n";
    echo $res->getContent();
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
