<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'image_url',
        'link',
        'visible',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'visible' => 'boolean',
            'order' => 'integer',
        ];
    }
}
