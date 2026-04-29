<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'              => ['required', 'string', 'max:255'],
            'email_template_id' => ['required', 'integer', 'exists:email_templates,id'],
            'conditions'        => ['required', 'array', 'min:1'],
            'is_active'         => ['boolean'],
        ];
    }
}
