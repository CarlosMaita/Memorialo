<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->string('main_content_bg_type', 20)->default('gradient')->after('main_content_secondary_button_link');
            $table->string('main_content_bg_color', 50)->nullable()->after('main_content_bg_type');
            $table->string('main_content_bg_gradient', 500)->nullable()->after('main_content_bg_color');
            $table->string('main_content_bg_image_url', 1000)->nullable()->after('main_content_bg_gradient');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->dropColumn([
                'main_content_bg_type',
                'main_content_bg_color',
                'main_content_bg_gradient',
                'main_content_bg_image_url',
            ]);
        });
    }
};
