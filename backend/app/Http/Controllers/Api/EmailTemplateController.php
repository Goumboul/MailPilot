<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmailTemplateRequest;
use App\Http\Requests\UpdateEmailTemplateRequest;
use App\Http\Resources\EmailTemplateResource;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailTemplateController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EmailTemplateResource::collection(EmailTemplate::all());
    }

    public function store(StoreEmailTemplateRequest $request): EmailTemplateResource
    {
        $template = EmailTemplate::create($request->validated());

        return new EmailTemplateResource($template);
    }

    public function show(EmailTemplate $emailTemplate): EmailTemplateResource
    {
        return new EmailTemplateResource($emailTemplate);
    }

    public function update(UpdateEmailTemplateRequest $request, EmailTemplate $emailTemplate): EmailTemplateResource
    {
        $emailTemplate->update($request->validated());

        return new EmailTemplateResource($emailTemplate);
    }

    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        $emailTemplate->delete();

        return response()->json(null, 204);
    }
}
