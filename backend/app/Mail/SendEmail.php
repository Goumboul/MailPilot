<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SendEmail extends Mailable
{
    use SerializesModels;

    public string $renderedBody;

    public function __construct(
        string $subject,
        string $body,
        public string $recipientEmail,
    ) {
        $this->subject($subject);
        $this->renderedBody = $body;
    }

    public function build(): self
    {
        return $this->html($this->renderedBody);
    }
}
