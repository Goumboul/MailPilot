<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SendEmail extends Mailable
{
    use Queueable, SerializesModels;

    private string $renderedBody;

    public function __construct(string $subject, string $body)
    {
        $this->subject($subject);
        $this->renderedBody = $body;
    }

    public function build(): static
    {
        return $this->html($this->renderedBody);
    }
}
