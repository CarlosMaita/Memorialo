<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $table = 'contracts';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'booking_id',
        'artist_id',
        'artist_user_id',
        'artist_name',
        'artist_email',
        'artist_whatsapp',
        'client_id',
        'client_name',
        'client_email',
        'client_whatsapp',
        'event_id',
        'status',
        'terms',
        'artist_signature',
        'provider_signed_at',
        'client_signature',
        'rejection_reason',
        'completed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'terms' => 'array',
            'artist_signature' => 'array',
            'client_signature' => 'array',
            'metadata' => 'array',
            'provider_signed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
