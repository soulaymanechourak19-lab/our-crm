<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // Commercial Agent User
        User::create([
            'name' => 'Commercial Agent',
            'email' => 'agent@example.com',
            'password' => Hash::make('password'),
            'role' => 'agent_commercial',
        ]);
        
        // SAV Agent User
        User::create([
            'name' => 'SAV Agent',
            'email' => 'sav@example.com',
            'password' => Hash::make('password'),
            'role' => 'agent_sav',
        ]);
    }
}
