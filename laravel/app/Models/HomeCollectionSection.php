<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomeCollectionSection extends Model
{
    protected $fillable = [
        'title',
        'subtitle',
        'collection_id',
        'sort_order',
        'visible',
    ];

    protected $casts = [
        'visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(ServiceCollection::class, 'collection_id');
    }
}
