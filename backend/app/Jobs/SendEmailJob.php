<?php

namespace App\Jobs;

use App\Mail\SendEmail;
use App\Models\EmailLog;
use App\Models\EmailSend;
use App\Services\TemplateRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(private readonly int $emailSendId) {}

    public function handle(TemplateRenderer $renderer): void
    {
        $emailSend = EmailSend::with(['recipient', 'emailTemplate'])->find($this->emailSendId);

        if (! $emailSend) {
            Log::warning('SendEmailJob: EmailSend not found', ['id' => $this->emailSendId]);

            return;
        }

        if ($emailSend->status === 'sent') {
            return;
        }

        $emailSend->update(['status' => 'processing', 'attempt_count' => $emailSend->attempt_count + 1]);

        $rendered = $renderer->render($emailSend->emailTemplate, $emailSend->recipient);

        Mail::to($emailSend->recipient->email)->send(
            new SendEmail($rendered['subject'], $rendered['body'])
        );

        $emailSend->update(['status' => 'sent', 'sent_at' => now()]);

        EmailLog::create([
            'email_send_id' => $emailSend->id,
            'event'         => 'sent',
            'payload'       => ['message' => 'Email delivered successfully.'],
        ]);
    }

    public function failed(Throwable $e): void
    {
        $emailSend = EmailSend::find($this->emailSendId);

        if (! $emailSend) {
            return;
        }

        $emailSend->update([
            'status'     => 'failed',
            'failed_at'  => now(),
            'last_error' => $e->getMessage(),
        ]);

        EmailLog::create([
            'email_send_id' => $emailSend->id,
            'event'         => 'failed',
            'payload'       => ['error' => $e->getMessage()],
        ]);

        Log::error('SendEmailJob: final failure', [
            'email_send_id' => $this->emailSendId,
            'error'         => $e->getMessage(),
        ]);
    }
}
