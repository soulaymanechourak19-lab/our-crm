<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    app(\Database\Seeders\MLDatasetSeeder::class)->run();
    echo "SUCCESS\n";
} catch (\Throwable $e) {
    echo "ERROR:\n";
    echo $e->getMessage() . "\n";
    echo $e->getFile() . ":" . $e->getLine() . "\n";
}
