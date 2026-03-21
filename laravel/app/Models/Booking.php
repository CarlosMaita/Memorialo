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
            'metadata' => 'array',
        ];
    }
}