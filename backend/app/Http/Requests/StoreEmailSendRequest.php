<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmailSendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rule_id'           => ['nullable', 'integer', 'exists:rules,id'],
            'recipient_id'      => ['required', 'integer', 'exists:recipients,id'],
            'email_template_id' => ['required', 'integer', 'exists:email_templates,id'],
            'scheduled_at'      => ['nullable', 'date'],
        ];
    }
}
