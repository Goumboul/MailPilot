<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EmailTemplateFactory extends Factory
{
    public function definition(): array
    {
        $templates = [
            [
                'name'    => 'Welcome Email',
                'subject' => 'Welcome to MailPilot, {{name}}!',
                'body'    => "Hi {{name}},\n\nWelcome aboard! We're glad you joined us on the {{plan}} plan.\n\nBest,\nThe MailPilot Team",
            ],
            [
                'name'    => 'Trial Expiry Reminder',
                'subject' => 'Your trial ends soon, {{name}}',
                'body'    => "Hi {{name}},\n\nYour free trial expires in 3 days. Upgrade now to keep access.\n\nBest,\nThe MailPilot Team",
            ],
            [
                'name'    => 'Upgrade Prompt',
                'subject' => 'Unlock more with MailPilot Pro',
                'body'    => "Hi {{name}},\n\nYou're on the {{plan}} plan. Upgrade to Pro and get unlimited sends.\n\nBest,\nThe MailPilot Team",
            ],
            [
                'name'    => 'Monthly Report',
                'subject' => 'Your monthly report is ready',
                'body'    => "Hi {{name}},\n\nHere is your activity summary for this month.\n\nBest,\nThe MailPilot Team",
            ],
            [
                'name'    => 'Churn Win-Back',
                'subject' => 'We miss you, {{name}}',
                'body'    => "Hi {{name}},\n\nIt has been a while. Come back and see what's new.\n\nBest,\nThe MailPilot Team",
            ],
        ];

        $tpl = $this->faker->unique()->randomElement($templates);

        return [
            'name'    => $tpl['name'],
            'subject' => $tpl['subject'],
            'body'    => $tpl['body'],
        ];
    }
}
