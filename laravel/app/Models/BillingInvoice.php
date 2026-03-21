<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_id',
        'month',
        'commission_rate',
        'amount',
        'status',
        'payment_reference',
        'paid_at',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:4',
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'generated_at' => 'datetime',
        ];
    }
}