<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'email_send_id' => $this->email_send_id,
            'event'         => $this->event,
            'payload'       => $this->payload,
            'created_at'    => $this->created_at,
        ];
    }
}
