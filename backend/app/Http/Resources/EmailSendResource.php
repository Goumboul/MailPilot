<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailSendResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'rule_id'           => $this->rule_id,
            'recipient_id'      => $this->recipient_id,
            'email_template_id' => $this->email_template_id,
            'status'            => $this->status,
            'attempt_count'     => $this->attempt_count,
            'scheduled_at'      => $this->scheduled_at,
            'sent_at'           => $this->sent_at,
            'failed_at'         => $this->failed_at,
            'last_error'        => $this->last_error,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
        ];
    }
}
