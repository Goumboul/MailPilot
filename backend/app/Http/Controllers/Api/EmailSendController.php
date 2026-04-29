<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmailLogResource;
use App\Http\Resources\EmailSendResource;
use App\Models\EmailSend;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailSendController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EmailSendResource::collection(
            EmailSend::with(['recipient', 'emailTemplate', 'rule.emailTemplate'])
                ->latest()
                ->get()
        );
    }

    public function show(EmailSend $emailSend): EmailSendResource
    {
        return new EmailSendResource(
            $emailSend->load(['recipient', 'emailTemplate', 'rule.emailTemplate'])
        );
    }

    public function logs(EmailSend $emailSend): AnonymousResourceCollection
    {
        return EmailLogResource::collection(
            $emailSend->emailLogs()->latest('created_at')->get()
        );
    }
}
