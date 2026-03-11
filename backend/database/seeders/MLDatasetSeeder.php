<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\Feedback;
use App\Models\Campaign;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Carbon\Carbon;

class MLDatasetSeeder extends Seeder
{
    public function run()
    {
        // Increase memory limit and execution time for massive data generation
        ini_set('memory_limit', '2G');
        ini_set('max_execution_time', '0');

        $faker = Faker::create('fr_FR');
        
        echo "Starting ML Dataset Generation...\n";
        
        // 1. Generate 1,000 extra Customers for a good variety
        echo "1. Generating 1000 Customers with AI Demographics...\n";
        
        // Disable observer/events for speed
        $customers = [];
        $segments = ['VIP', 'Standard', 'Occasionnel', 'Nouveau'];
        $now = now();
        
        // Get existing customer count to start from
        $existingCustomerIds = DB::table('customers')->pluck('id')->toArray();
        if (empty($existingCustomerIds)) {
            // Need some initial customers if empty
            for ($i = 0; $i < 50; $i++) {
                $existingCustomerIds[] = DB::table('customers')->insertGetId([
                    'name' => $faker->firstName . ' ' . $faker->lastName,
                    'email' => $faker->unique()->safeEmail,
                    'phone' => $faker->phoneNumber,
                    'loyalty_score' => $faker->numberBetween(0, 500),
                    'age' => $faker->numberBetween(18, 70),
                    'gender' => $faker->randomElement(['M', 'F']),
                    'segment' => $faker->randomElement($segments),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        } else {
             // Update existing customers with demographics if they don't have it
             DB::table('customers')->whereNull('age')->update([
                 'age' => DB::raw('FLOOR(RAND() * 52) + 18'),
                 'gender' => DB::raw("IF(RAND() > 0.5, 'M', 'F')"),
                 'segment' => DB::raw("ELT(FLOOR(RAND() * 4) + 1, 'VIP', 'Standard', 'Occasionnel', 'Nouveau')")
             ]);
        }

        // Add 1000 new customers for volume
        $customerChunks = [];
        for ($i = 0; $i < 1000; $i++) {
            $customerChunks[] = [
                'name' => $faker->firstName . ' ' . $faker->lastName,
                'email' => $faker->unique()->safeEmail,
                'phone' => $faker->phoneNumber,
                'loyalty_score' => $faker->numberBetween(0, 1000),
                'age' => $faker->numberBetween(18, 70),
                'gender' => $faker->randomElement(['M', 'F']),
                'segment' => $faker->randomElement($segments),
                'created_at' => $faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d H:i:s'),
                'updated_at' => $now,
            ];
        }
        $chunks = array_chunk($customerChunks, 200);
        foreach ($chunks as $chunk) {
            DB::table('customers')->insert($chunk);
        }
        
        $allCustomerIds = DB::table('customers')->pluck('id')->toArray();
        
        // 2. Ensure we have products
        $productIds = DB::table('products')->pluck('id')->toArray();
        if (empty($productIds)) {
             echo "Generating basic Products...\n";
             $cats = ['Soin visage', 'Corps & Bain', 'Maquillage', 'Parfums'];
             for ($i = 0; $i < 50; $i++) {
                 $productIds[] = DB::table('products')->insertGetId([
                     'name' => 'Produit ' . $faker->word . ' ' . $faker->word,
                     'description' => $faker->sentence,
                     'category' => $faker->randomElement($cats),
                     'price' => $faker->randomFloat(2, 10, 300),
                     'stock' => $faker->numberBetween(10, 500),
                     'created_at' => $now,
                     'updated_at' => $now,
                 ]);
             }
        }
        
        // 3. Generate 10,000 Transactions (Achats)
        echo "2. Generating 10,000 Transactions...\n";
        $products = DB::table('products')->select('id', 'price')->get()->keyBy('id')->toArray();
        
        $transactionChunks = [];
        for ($i = 0; $i < 10000; $i++) {
            $pid = $faker->randomElement($productIds);
            $qty = $faker->numberBetween(1, 5);
            $price = $products[$pid]->price;
            
            $transactionChunks[] = [
                'client_id' => $faker->randomElement($allCustomerIds),
                'product_id' => $pid,
                'quantity' => $qty,
                'price' => $price * $qty,
                'date' => $faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d H:i:s'),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        
        foreach (array_chunk($transactionChunks, 500) as $chunk) {
            DB::table('transactions')->insert($chunk);
        }
        
        // 4. Generate 2,000 Feedback/Avis
        echo "3. Generating 2,000 Reviews (Feedback)...\n";
        $feedbackChunks = [];
        
        $positiveReviews = ["Excellent produit", "Très satisfait", "Je recommande à 100%", "Parfait", "Bon rapport qualité/prix", "Super!"];
        $neutralReviews = ["Pas mal", "Correct", "Moyen", "Conforme à la description", "Peut mieux faire"];
        $negativeReviews = ["Déçu", "Qualité médiocre", "Ne fonctionne pas", "Très mauvais", "À éviter", "Trop cher pour ce que c'est"];
        
        for ($i = 0; $i < 2000; $i++) {
            $rating = $faker->numberBetween(1, 100);
            
            if ($rating >= 70) {
                $r = $faker->numberBetween(4, 5);
                $txt = $positiveReviews[array_rand($positiveReviews)];
            } elseif ($rating >= 30) {
                $r = 3;
                $txt = $neutralReviews[array_rand($neutralReviews)];
            } else {
                $r = $faker->numberBetween(1, 2);
                $txt = $negativeReviews[array_rand($negativeReviews)];
            }
            
            $feedbackChunks[] = [
                'client_id' => $faker->randomElement($allCustomerIds),
                'product_id' => $faker->randomElement($productIds),
                'rating' => $r,
                'review_text' => $txt,
                'date' => $faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d H:i:s'),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        foreach (array_chunk($feedbackChunks, 500) as $chunk) {
            DB::table('feedback')->insert($chunk);
        }
        
        // 5. Generate 5,000 Marketing Campaigns interactions
        echo "4. Generating 5,000 Campaign Interactions...\n";
        $campaignChunks = [];
        $offers = ['Promo 20%', 'Livraison Gratuite', 'Vente Privée', 'Cadeau Anniversaire', 'Nouvelle Collection'];
        $responses = ['Cliqué', 'Ouvert', 'Ignoré', 'Désabonné'];
        
        for ($i = 0; $i < 5000; $i++) {
            $campaignChunks[] = [
                'client_id' => $faker->randomElement($allCustomerIds),
                'offer_type' => $faker->randomElement($offers),
                'date_sent' => $faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d H:i:s'),
                'response' => $faker->randomElement($responses),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        foreach (array_chunk($campaignChunks, 500) as $chunk) {
            DB::table('campaigns')->insert($chunk);
        }
        
        echo "✅ ML Dataset Seeder Complete! Over 18,000 rows of ML training data generated.\n";
    }
}
