<?php

namespace Database\Factories;

use App\Models\EmailTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

class RuleFactory extends Factory
{
    public function definition(): array
    {
        $conditions = [
            [['field' => 'plan', 'operator' => '=', 'value' => 'free']],
            [['field' => 'mrr', 'operator' => '>', 'value' => 100]],
            [['field' => 'plan', 'operator' => '=', 'value' => 'pro']],
            [
                ['field' => 'mrr', 'operator' => '>=', 'value' => 0],
                ['field' => 'country', 'operator' => '=', 'value' => 'US'],
            ],
            [['field' => 'plan', 'operator' => '!=', 'value' => 'enterprise']],
        ];

        return [
            'name'              => $this->faker->words(3, true) . ' rule',
            'email_template_id' => EmailTemplate::factory(),
            'conditions'        => $this->faker->randomElement($conditions),
            'is_active'         => $this->faker->boolean(80),
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
