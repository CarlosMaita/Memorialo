<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('marketplace_settings', 'provider_auto_approval_enabled')) {
            Schema::table('marketplace_settings', function (Blueprint $table) {
                $table->boolean('provider_auto_approval_enabled')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('marketplace_settings', 'provider_auto_approval_enabled')) {
            Schema::table('marketplace_settings', function (Blueprint $table) {
                $table->dropColumn('provider_auto_approval_enabled');
            });
        }
    }
};
