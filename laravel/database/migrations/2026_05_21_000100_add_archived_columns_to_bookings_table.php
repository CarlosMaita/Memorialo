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
            if (! Schema::hasColumn('bookings', 'archived')) {
                $table->boolean('archived')->default(false)->after('status');
            }

            if (! Schema::hasColumn('bookings', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('archived');
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

            if (Schema::hasColumn('bookings', 'archived_at')) {
                $dropColumns[] = 'archived_at';
            }

            if (Schema::hasColumn('bookings', 'archived')) {
                $dropColumns[] = 'archived';
            }

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
