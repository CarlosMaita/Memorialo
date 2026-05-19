<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketplaceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'enabled_cities',
        'banners_section_enabled',
        'relevant_services_section_enabled',
        'relevant_services_title',
        'relevant_services_subtitle',
        'relevant_service_ids',
        'main_content_accent',
        'main_content_title',
        'main_content_subtitle',
        'main_content_primary_button_text',
        'main_content_primary_button_link',
        'main_content_secondary_button_text',
        'main_content_secondary_button_link',
    ];

    protected function casts(): array
    {
        return [
            'enabled_cities' => 'array',
            'banners_section_enabled' => 'boolean',
            'relevant_services_section_enabled' => 'boolean',
            'relevant_service_ids' => 'array',
        ];
    }
}
