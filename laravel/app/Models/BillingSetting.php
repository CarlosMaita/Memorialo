<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'closure_day',
        'payment_grace_days',
        'commission_rate',
        'last_closed_month',
    ];

    protected function casts(): array
    {
        return [
            'closure_day' => 'integer',
            'payment_grace_days' => 'integer',
            'commission_rate' => 'decimal:4',
        ];
    }
}
