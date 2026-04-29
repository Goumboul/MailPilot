<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class RecipientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'     => $this->faker->name(),
            'email'    => $this->faker->unique()->safeEmail(),
            'metadata' => [
                'mrr'     => $this->faker->randomElement([0, 49, 99, 199, 499]),
                'plan'    => $this->faker->randomElement(['free', 'starter', 'pro', 'enterprise']),
                'country' => $this->faker->countryCode(),
            ],
        ];
    }
}
