<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Models\Recipient;

class TemplateRenderer
{
    public function render(EmailTemplate $template, Recipient $recipient): array
    {
        $variables = array_merge(
            [
                'name'  => $recipient->name,
                'email' => $recipient->email,
            ],
            $recipient->metadata ?? []
        );

        return [
            'subject' => $this->interpolate($template->subject, $variables),
            'body'    => $this->interpolate($template->body, $variables),
        ];
    }

    private function interpolate(string $text, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $text = str_replace('{{' . $key . '}}', (string) $value, $text);
        }

        return $text;
    }
}
