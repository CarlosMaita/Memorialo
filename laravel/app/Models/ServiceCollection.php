<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ServiceCollection extends Model
{
    use HasFactory;

    protected $table = 'collections';

    protected $fillable = [
        'title',
        'subtitle',
        'slug',
    ];

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'collection_service', 'collection_id', 'service_id')
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('collection_service.position');
    }
}
