<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'booking_id',
        'artist_id',
        'user_id',
        'user_name',
        'user_avatar',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function artist(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'artist_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
