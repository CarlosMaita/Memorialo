<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationDelivery extends Model
{
    protected $fillable = [
        'notification_id',
        'notification_type',
        'recipient_user_id',
        'recipient_email',
        'recipient_key',
        'channel',
        'status',
        'dedupe_key',
        'provider',
        'provider_message_id',
        'attempts',
        'queued_at',
        'sent_at',
        'failed_at',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'queued_at' => 'datetime',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }
}
