<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provider extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'business_name',
        'category',
        'description',
        'representative',
        'legal_entity_type',
        'identification_number',
        'verified',
        'verified_at',
        'verified_by',
        'banned',
        'banned_at',
        'banned_by',
        'banned_reason',
        'unbanned_at',
        'unbanned_by',
        'rating',
        'total_bookings',
        'services',
    ];

    protected function casts(): array
    {
        return [
            'representative' => 'array',
            'verified' => 'boolean',
            'banned' => 'boolean',
            'services' => 'array',
            'rating' => 'decimal:2',
            'verified_at' => 'datetime',
            'banned_at' => 'datetime',
            'unbanned_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function offeredServices(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
