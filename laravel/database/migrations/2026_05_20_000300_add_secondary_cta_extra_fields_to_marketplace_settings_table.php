<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->string('secondary_cta_accent', 120)->nullable()->after('secondary_cta_button_link');
            $table->string('secondary_cta_bg_type', 20)->nullable()->after('secondary_cta_accent');
            $table->string('secondary_cta_bg_color', 50)->nullable()->after('secondary_cta_bg_type');
            $table->string('secondary_cta_bg_gradient', 500)->nullable()->after('secondary_cta_bg_color');
            $table->string('secondary_cta_bg_image_url', 1000)->nullable()->after('secondary_cta_bg_gradient');
            $table->string('secondary_cta_button_color', 10)->nullable()->after('secondary_cta_bg_image_url');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->dropColumn([
                'secondary_cta_accent',
                'secondary_cta_bg_type',
                'secondary_cta_bg_color',
                'secondary_cta_bg_gradient',
                'secondary_cta_bg_image_url',
                'secondary_cta_button_color',
            ]);
        });
    }
};
