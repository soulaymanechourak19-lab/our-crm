<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Admin User
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Commercial Agent
        User::factory()->create([
            'name' => 'Agent Commercial',
            'email' => 'agent@example.com',
            'password' => bcrypt('password'),
            'role' => 'agent_commercial',
        ]);

        $this->call([
            CategorySeeder::class,
        ]);
    }
}
