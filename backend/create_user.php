<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Modules\User\Entities\User;

$email = 'dev@admin.com';
$u = User::withTrashed()->where('email', $email)->first();
if (!$u) {
    $u = new User();
    $u->email = $email;
    $u->name = 'Dev Admin';
}
$u->password = \Illuminate\Support\Facades\Hash::make('password123');
$u->role = 'admin';
$u->deleted_at = null;
$u->save();

echo "User $email created/reset with password: password123\n";
