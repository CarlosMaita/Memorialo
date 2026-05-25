<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            if (! Schema::hasColumn('bookings', 'archived_by_client')) {
                $table->boolean('archived_by_client')->default(false)->after('archived_at');
            }

            if (! Schema::hasColumn('bookings', 'archived_at_client')) {
                $table->timestamp('archived_at_client')->nullable()->after('archived_by_client');
            }

            if (! Schema::hasColumn('bookings', 'archived_by_provider')) {
                $table->boolean('archived_by_provider')->default(false)->after('archived_at_client');
            }

            if (! Schema::hasColumn('bookings', 'archived_at_provider')) {
                $table->timestamp('archived_at_provider')->nullable()->after('archived_by_provider');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            $dropColumns = [];

            if (Schema::hasColumn('bookings', 'archived_at_provider')) {
                $dropColumns[] = 'archived_at_provider';
            }

            if (Schema::hasColumn('bookings', 'archived_by_provider')) {
                $dropColumns[] = 'archived_by_provider';
            }

            if (Schema::hasColumn('bookings', 'archived_at_client')) {
                $dropColumns[] = 'archived_at_client';
            }

            if (Schema::hasColumn('bookings', 'archived_by_client')) {
                $dropColumns[] = 'archived_by_client';
            }

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
