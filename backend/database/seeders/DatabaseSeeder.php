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
        // Admin User
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'Admin User',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        // Commercial Agent User
        User::firstOrCreate(
            ['email' => 'agent@example.com'],
            [
                'name'     => 'Commercial Agent',
                'password' => Hash::make('password'),
                'role'     => 'agent_commercial',
            ]
        );

        // SAV Agent User
        User::firstOrCreate(
            ['email' => 'sav@example.com'],
            [
                'name'     => 'SAV Agent',
                'password' => Hash::make('password'),
                'role'     => 'agent_sav',
            ]
        );
    }
}
