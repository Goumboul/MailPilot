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
            'name'              => ['sometimes', 'required', 'string', 'max:255'],
            'email_template_id' => ['sometimes', 'required', 'integer', 'exists:email_templates,id'],
            'conditions'        => ['sometimes', 'required', 'array', 'min:1'],
            'is_active'         => ['sometimes', 'boolean'],
        ];
    }
}
