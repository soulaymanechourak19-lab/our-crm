<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Modules\User\Entities\User;
use Faker\Factory as Faker;
use Carbon\Carbon;

class LeadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create('fr_FR');
        
        echo "Generating 100 Leads...\n";

        // Let's get the commercial agent user id to assign these leads to.
        $agent = User::where('role', 'agent_commercial')->first();
        $agentId = $agent ? $agent->id : 1; 

        $statuses = ['new', 'contacted', 'qualified', 'converted'];
        
        $leads = [];
        $now = Carbon::now();

        for ($i = 0; $i < 100; $i++) {
            $leads[] = [
                'company_name' => $faker->company,
                'contact_name' => $faker->firstName . ' ' . $faker->lastName,
                'email'        => $faker->unique()->safeEmail,
                'phone'        => $faker->phoneNumber,
                'status'       => $faker->randomElement($statuses),
                'created_by'   => $agentId,
                'created_at'   => $faker->dateTimeBetween('-6 months', 'now')->format('Y-m-d H:i:s'),
                'updated_at'   => $now->format('Y-m-d H:i:s'),
            ];
        }

        // Insert in chunks to avoid memory issues, though 100 is small anyway
        DB::table('leads')->insert($leads);

        echo "✅ 100 leads successfully generated.\n";
    }
}
