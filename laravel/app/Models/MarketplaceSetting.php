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
        'main_content_bg_type',
        'main_content_bg_color',
        'main_content_bg_gradient',
        'main_content_bg_image_url',
        'secondary_cta_enabled',
        'secondary_cta_title',
        'secondary_cta_subtitle',
        'secondary_cta_button_text',
        'secondary_cta_button_link',
        'secondary_cta_accent',
        'secondary_cta_bg_type',
        'secondary_cta_bg_color',
        'secondary_cta_bg_gradient',
        'secondary_cta_bg_image_url',
        'secondary_cta_button_color',
        'provider_event_reminder_hours',
        'provider_auto_approval_enabled',
    ];

    protected function casts(): array
    {
        return [
            'enabled_cities' => 'array',
            'banners_section_enabled' => 'boolean',
            'relevant_services_section_enabled' => 'boolean',
            'relevant_service_ids' => 'array',
            'secondary_cta_enabled' => 'boolean',
            'provider_auto_approval_enabled' => 'boolean',
        ];
    }
}
