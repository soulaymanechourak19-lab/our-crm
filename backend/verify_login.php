<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Modules\User\Entities\User;

$u = User::where('email', 'admin@example.com')->first();
if ($u) {
    $match = \Illuminate\Support\Facades\Hash::check('password', $u->password);
    echo "User found: " . $u->email . "\n";
    echo "Password check: " . ($match ? "PASS" : "FAIL") . "\n";
} else {
    echo "User NOT FOUND!\n";
}
