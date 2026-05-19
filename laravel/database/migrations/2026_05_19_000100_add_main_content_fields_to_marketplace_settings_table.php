<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->string('main_content_accent', 120)->nullable()->after('relevant_service_ids');
            $table->string('main_content_title', 180)->nullable()->after('main_content_accent');
            $table->string('main_content_subtitle', 320)->nullable()->after('main_content_title');
            $table->string('main_content_primary_button_text', 80)->nullable()->after('main_content_subtitle');
            $table->string('main_content_primary_button_link', 255)->nullable()->after('main_content_primary_button_text');
            $table->string('main_content_secondary_button_text', 80)->nullable()->after('main_content_primary_button_link');
            $table->string('main_content_secondary_button_link', 255)->nullable()->after('main_content_secondary_button_text');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->dropColumn([
                'main_content_accent',
                'main_content_title',
                'main_content_subtitle',
                'main_content_primary_button_text',
                'main_content_primary_button_link',
                'main_content_secondary_button_text',
                'main_content_secondary_button_link',
            ]);
        });
    }
};
