<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->boolean('secondary_cta_enabled')->nullable()->after('main_content_bg_image_url');
            $table->string('secondary_cta_title', 180)->nullable()->after('secondary_cta_enabled');
            $table->string('secondary_cta_subtitle', 320)->nullable()->after('secondary_cta_title');
            $table->string('secondary_cta_button_text', 80)->nullable()->after('secondary_cta_subtitle');
            $table->string('secondary_cta_button_link', 255)->nullable()->after('secondary_cta_button_text');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->dropColumn([
                'secondary_cta_enabled',
                'secondary_cta_title',
                'secondary_cta_subtitle',
                'secondary_cta_button_text',
                'secondary_cta_button_link',
            ]);
        });
    }
};
