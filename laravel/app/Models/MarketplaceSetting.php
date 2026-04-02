<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketplaceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'enabled_cities',
    ];

    protected function casts(): array
    {
        return [
            'enabled_cities' => 'array',
        ];
    }
}
