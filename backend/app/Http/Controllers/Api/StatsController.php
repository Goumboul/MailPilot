<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailSend;
use App\Models\EmailTemplate;
use App\Models\Recipient;
use App\Models\Rule;

class StatsController extends Controller
{
    public function __invoke(): array
    {
        return [
            'recipients' => Recipient::count(),
            'templates'  => EmailTemplate::count(),
            'rules'      => Rule::count(),
            'sends'      => EmailSend::count(),
        ];
    }
}
