<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\Recipient;
use App\Models\Rule;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Recipient::factory(15)->create();

        $templates = EmailTemplate::factory(4)->create();

        Rule::factory()->create([
            'name'              => 'Free plan users',
            'email_template_id' => $templates->get(0)->id,
            'conditions'        => [
                ['field' => 'plan', 'operator' => '=', 'value' => 'free'],
            ],
            'is_active' => true,
        ]);

        Rule::factory()->create([
            'name'              => 'High MRR accounts',
            'email_template_id' => $templates->get(1)->id,
            'conditions'        => [
                ['field' => 'mrr', 'operator' => '>=', 'value' => 199],
            ],
            'is_active' => true,
        ]);

        Rule::factory()->create([
            'name'              => 'US pro users',
            'email_template_id' => $templates->get(2)->id,
            'conditions'        => [
                ['field' => 'plan', 'operator' => '=', 'value' => 'pro'],
                ['field' => 'country', 'operator' => '=', 'value' => 'US'],
            ],
            'is_active' => false,
        ]);
    }
}
