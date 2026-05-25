<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'bookings';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'artist_id',
        'artist_user_id',
        'artist_name',
        'user_id',
        'client_name',
        'client_email',
        'client_phone',
        'date',
        'start_time',
        'duration',
        'event_type',
        'location',
        'special_requests',
        'total_price',
        'status',
        'archived',
        'archived_at',
        'archived_by_client',
        'archived_at_client',
        'archived_by_provider',
        'archived_at_provider',
        'plan_id',
        'plan_name',
        'contract_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'duration' => 'integer',
            'total_price' => 'decimal:2',
            'archived' => 'boolean',
            'archived_at' => 'datetime',
            'archived_by_client' => 'boolean',
            'archived_at_client' => 'datetime',
            'archived_by_provider' => 'boolean',
            'archived_at_provider' => 'datetime',
            'metadata' => 'array',
        ];
    }
}
