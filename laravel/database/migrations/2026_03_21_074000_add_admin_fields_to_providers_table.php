<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('providers', function (Blueprint $table) {
            $table->timestamp('verified_at')->nullable()->after('verified');
            $table->string('verified_by')->nullable()->after('verified_at');
            $table->boolean('banned')->default(false)->after('verified_by');
            $table->timestamp('banned_at')->nullable()->after('banned');
            $table->string('banned_by')->nullable()->after('banned_at');
            $table->text('banned_reason')->nullable()->after('banned_by');
            $table->timestamp('unbanned_at')->nullable()->after('banned_reason');
            $table->string('unbanned_by')->nullable()->after('unbanned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('providers', function (Blueprint $table) {
            $table->dropColumn([
                'verified_at',
                'verified_by',
                'banned',
                'banned_at',
                'banned_by',
                'banned_reason',
                'unbanned_at',
                'unbanned_by',
            ]);
        });
    }
};