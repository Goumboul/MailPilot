<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Models\Recipient;

class TemplateRenderer
{
    public function render(EmailTemplate $template, Recipient $recipient): array
    {
        $variables = array_merge(
            ['name' => $recipient->name, 'email' => $recipient->email],
            $recipient->metadata ?? []
        );

        return [
            'subject' => $this->replaceVariables($template->subject, $variables),
            'body'    => $this->replaceVariables($template->body, $variables),
        ];
    }

    private function replaceVariables(string $content, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', (string) $value, $content);
        }

        return $content;
    }
}
