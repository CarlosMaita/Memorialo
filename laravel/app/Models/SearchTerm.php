<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SearchTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'term',
        'term_normalized',
        'month_start',
        'search_count',
        'is_manual',
    ];

    protected function casts(): array
    {
        return [
            'month_start' => 'date',
            'search_count' => 'integer',
            'is_manual' => 'boolean',
        ];
    }
}
