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
        'verified',
        'rating',
        'total_bookings',
        'services',
    ];

    protected function casts(): array
    {
        return [
            'verified' => 'boolean',
            'services' => 'array',
            'rating' => 'decimal:2',
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
