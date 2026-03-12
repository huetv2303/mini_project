<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'image' => fake()->imageUrl(640, 480, 'categories', true),
            'status' => fake()->boolean(80) ? 1 : 0, // 80% chance of being active
            'sort_order' => fake()->numberBetween(0, 100),
            'is_featured' => fake()->boolean(20) ? 1 : 0, // 20% chance of being featured
        ];
}
