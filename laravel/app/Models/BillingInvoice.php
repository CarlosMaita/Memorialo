<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_id',
        'month',
        'period_start',
        'period_end',
        'commission_rate',
        'contract_count',
        'total_sales',
        'amount',
        'status',
        'due_date',
        'grace_period_end',
        'payment_reference',
        'payment_submitted_at',
        'paid_at',
        'payment_reviewed_at',
        'payment_reviewed_by',
        'payment_rejection_reason',
        'billing_snapshot',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:4',
            'period_start' => 'date',
            'period_end' => 'date',
            'contract_count' => 'integer',
            'total_sales' => 'decimal:2',
            'amount' => 'decimal:2',
            'due_date' => 'datetime',
            'grace_period_end' => 'datetime',
            'payment_submitted_at' => 'datetime',
            'paid_at' => 'datetime',
            'payment_reviewed_at' => 'datetime',
            'billing_snapshot' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }
}
