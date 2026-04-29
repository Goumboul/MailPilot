<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmailSendRequest;
use App\Http\Resources\EmailLogResource;
use App\Http\Resources\EmailSendResource;
use App\Jobs\SendEmailJob;
use App\Models\EmailSend;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailSendController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return EmailSendResource::collection(EmailSend::latest()->get());
    }

    public function store(StoreEmailSendRequest $request): EmailSendResource
    {
        $emailSend = EmailSend::create([
            'rule_id'           => $request->rule_id,
            'recipient_id'      => $request->recipient_id,
            'email_template_id' => $request->email_template_id,
            'status'            => 'pending',
            'attempt_count'     => 0,
            'scheduled_at'      => $request->scheduled_at ?? now(),
        ]);

        SendEmailJob::dispatch($emailSend);

        return new EmailSendResource($emailSend);
    }

    public function show(EmailSend $emailSend): EmailSendResource
    {
        return new EmailSendResource($emailSend);
    }

    public function logs(EmailSend $emailSend): AnonymousResourceCollection
    {
        return EmailLogResource::collection(
            $emailSend->emailLogs()->orderBy('created_at')->get()
        );
    }

    public function destroy(EmailSend $emailSend): JsonResponse
    {
        $emailSend->delete();

        return response()->json(null, 204);
    }
}
