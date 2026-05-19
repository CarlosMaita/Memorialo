<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('collections') && ! Schema::hasColumn('collections', 'subtitle')) {
            Schema::table('collections', function (Blueprint $table) {
                $table->string('subtitle', 320)->nullable()->after('title');
            });
        }

        if (Schema::hasTable('collection_service') && ! Schema::hasColumn('collection_service', 'position')) {
            Schema::table('collection_service', function (Blueprint $table) {
                $table->unsignedInteger('position')->default(0)->after('service_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('collection_service') && Schema::hasColumn('collection_service', 'position')) {
            Schema::table('collection_service', function (Blueprint $table) {
                $table->dropColumn('position');
            });
        }

        if (Schema::hasTable('collections') && Schema::hasColumn('collections', 'subtitle')) {
            Schema::table('collections', function (Blueprint $table) {
                $table->dropColumn('subtitle');
            });
        }
    }
};
