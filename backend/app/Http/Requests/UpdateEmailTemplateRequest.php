<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $templateId = $this->route('email_template')?->id;

        return [
            'name'    => ['required', 'string', 'max:255', "unique:email_templates,name,{$templateId}"],
            'subject' => ['required', 'string', 'max:500'],
            'body'    => ['required', 'string'],
        ];
    }
}
