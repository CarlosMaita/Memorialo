<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->boolean('relevant_services_section_enabled')->default(true)->after('banners_section_enabled');
            $table->string('relevant_services_title')->nullable()->after('relevant_services_section_enabled');
            $table->string('relevant_services_subtitle')->nullable()->after('relevant_services_title');
            $table->json('relevant_service_ids')->nullable()->after('relevant_services_subtitle');
        });
    }

    public function down(): void
    {
        Schema::table('marketplace_settings', function (Blueprint $table) {
            $table->dropColumn([
                'relevant_services_section_enabled',
                'relevant_services_title',
                'relevant_services_subtitle',
                'relevant_service_ids',
            ]);
        });
    }
};
