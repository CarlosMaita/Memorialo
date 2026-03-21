<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'events';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'description',
        'event_date',
        'event_type',
        'location',
        'budget',
        'status',
        'contract_ids',
        'archived',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'contract_ids' => 'array',
            'archived' => 'boolean',
            'metadata' => 'array',
        ];
    }
}