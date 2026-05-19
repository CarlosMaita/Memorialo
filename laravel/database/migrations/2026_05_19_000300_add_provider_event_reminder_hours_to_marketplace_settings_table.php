<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->unsignedSmallInteger('provider_event_reminder_hours')
                ->default(48)
                ->after('main_content_bg_image_url');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->dropColumn('provider_event_reminder_hours');
        });
    }
};
