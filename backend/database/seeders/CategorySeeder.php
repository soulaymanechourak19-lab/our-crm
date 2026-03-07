<?php

namespace Database\Seeders;

use Modules\Sales\Entities\Product;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Electronics', 'description' => 'Gaget and devices'],
            ['name' => 'Furniture', 'description' => 'Office and home furniture'],
            ['name' => 'Stationery', 'description' => 'Office supplies'],
            ['name' => 'Services', 'description' => 'Consulting and more'],
            ['name' => 'Software', 'description' => 'Digital products and licenses'],
        ];



        $products = [
            [
                'name' => 'MacBook Pro M2',
                'description' => 'Powerful laptop for professionals.',
                'price' => 1999.99,
                'stock' => 15,
                'category' => 'Electronics',
            ],
            [
                'name' => 'Ergonomic Office Chair',
                'description' => 'Comfortable chair for long working hours.',
                'price' => 299.00,
                'stock' => 25,
                'category' => 'Furniture',
            ],
            [
                'name' => 'Premium Notebook Set',
                'description' => 'High-quality paper notebooks for sketching and writing.',
                'price' => 24.50,
                'stock' => 100,
                'category' => 'Stationery',
            ],
            [
                'name' => 'Software Development Consulting',
                'description' => 'Expert advice on your next software project.',
                'price' => 150.00,
                'stock' => 999,
                'category' => 'Services',
            ],
            [
                'name' => 'Cloud Storage Plan (1TB)',
                'description' => 'Secure cloud storage for your data.',
                'price' => 9.99,
                'stock' => 999,
                'category' => 'Software',
            ],
            [
                'name' => 'Wireless Noise Cancelling Headphones',
                'description' => 'Immersive sound experience.',
                'price' => 349.00,
                'stock' => 40,
                'category' => 'Electronics',
            ],
            [
                'name' => 'Standing Desk',
                'description' => 'Adjustable height desk for better health.',
                'price' => 499.00,
                'stock' => 10,
                'category' => 'Furniture',
            ],
        ];

        foreach ($products as $productData) {
            Product::firstOrCreate(['name' => $productData['name']], $productData);
        }
    }
}
