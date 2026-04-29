<?php

namespace App\Jobs;

use App\Mail\SendEmail;
use App\Models\EmailLog;
use App\Models\EmailSend;
use App\Services\TemplateRenderer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendEmailJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(public EmailSend $emailSend) {}

    public function handle(TemplateRenderer $renderer): void
    {
        $this->emailSend->load('recipient', 'emailTemplate');

        // Idempotency guard: skip if already successfully sent
        if ($this->emailSend->status === 'sent') {
            return;
        }

        // Mark as processing and increment attempt counter
        $this->emailSend->update(['status' => 'processing']);
        $this->emailSend->increment('attempt_count');

        EmailLog::create([
            'email_send_id' => $this->emailSend->id,
            'event'         => 'attempted',
            'payload'       => ['attempt' => $this->emailSend->attempt_count],
        ]);

        try {
            $rendered = $renderer->render(
                $this->emailSend->emailTemplate,
                $this->emailSend->recipient
            );

            Mail::to($this->emailSend->recipient->email)
                ->send(new SendEmail(
                    subject        : $rendered['subject'],
                    body           : $rendered['body'],
                    recipientEmail : $this->emailSend->recipient->email,
                ));

            $this->emailSend->update([
                'status'  => 'sent',
                'sent_at' => now(),
            ]);

            EmailLog::create([
                'email_send_id' => $this->emailSend->id,
                'event'         => 'sent',
                'payload'       => ['subject' => $rendered['subject']],
            ]);
        } catch (Throwable $e) {
            $this->emailSend->update([
                'status'     => 'failed',
                'failed_at'  => now(),
                'last_error' => $e->getMessage(),
            ]);

            EmailLog::create([
                'email_send_id' => $this->emailSend->id,
                'event'         => 'failed',
                'payload'       => ['error' => $e->getMessage()],
            ]);

            // Re-throw so Laravel's queue worker retries based on $tries + $backoff
            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        // All retries exhausted — ensure status reflects final failure
        $this->emailSend->updateQuietly([
            'status'     => 'failed',
            'failed_at'  => now(),
            'last_error' => $e->getMessage(),
        ]);

        EmailLog::create([
            'email_send_id' => $this->emailSend->id,
            'event'         => 'failed',
            'payload'       => [
                'error'   => $e->getMessage(),
                'final'   => true,
                'retries' => $this->emailSend->attempt_count,
            ],
        ]);
    }
}
