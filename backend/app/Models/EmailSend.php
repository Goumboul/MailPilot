<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailSend extends Model
{
    use HasFactory;

    protected $fillable = [
        'rule_id',
        'recipient_id',
        'email_template_id',
        'status',
        'attempt_count',
        'scheduled_at',
        'sent_at',
        'failed_at',
        'last_error',
    ];

    protected $casts = [
        'attempt_count' => 'integer',
        'scheduled_at'  => 'datetime',
        'sent_at'       => 'datetime',
        'failed_at'     => 'datetime',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(Rule::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(Recipient::class);
    }

    public function emailTemplate(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class);
    }

    public function emailLogs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }
}
