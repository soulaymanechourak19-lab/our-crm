<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Modules\User\Entities\User;

$email = 'dev@admin.com';
$password = 'password123';

$u = User::where('email', $email)->first();
if ($u) {
    $match = \Illuminate\Support\Facades\Hash::check($password, $u->password);
    echo "Email: $email\n";
    echo "Match: " . ($match ? "YES" : "NO") . "\n";
    echo "Hash: " . $u->password . "\n";
} else {
    echo "User $email NOT FOUND\n";
}
