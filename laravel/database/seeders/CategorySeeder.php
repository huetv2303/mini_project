<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define some main root categories
        $rootCategories = [
            'Electronics',
            'Fashion',
            'Home & Garden',
            'Sports & Outdoors',
            'Books'
        ];

        foreach ($rootCategories as $name) {
            $root = \App\Models\Category::create([
                'name' => $name,
                'description' => "Main category for $name",
                'status' => 1,
            ]);

            // Create 3-5 subcategories for each root category using the factory
            \App\Models\Category::factory(rand(3, 5))->create([
                'parent_id' => $root->id
            ]);
        }
    }
}
