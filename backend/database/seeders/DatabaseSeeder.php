<?php

namespace Database\Seeders;

use Modules\User\Entities\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Uses firstOrCreate so this is safe to run multiple times (idempotent).
     */
    public function run(): void
    {
        $users = [
            [
                'email'    => 'admin@example.com',
                'name'     => 'Admin User',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ],
            [
                'email'    => 'agent@example.com',
                'name'     => 'Commercial Agent',
                'password' => Hash::make('password'),
                'role'     => 'agent_commercial',
            ],
            [
                'email'    => 'sav@example.com',
                'name'     => 'SAV Agent',
                'password' => Hash::make('password'),
                'role'     => 'agent_sav',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::withTrashed()->where('email', $userData['email'])->first();

            if ($user) {
                $user->update($userData);
                if ($user->trashed()) {
                    $user->restore();
                }
            } else {
                User::create($userData);
            }
        }
    }
}
