<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('provider_request_status', 20)->default('none')->after('provider_id');
            $table->timestamp('provider_requested_at')->nullable()->after('provider_request_status');
            $table->timestamp('provider_approved_at')->nullable()->after('provider_requested_at');
            $table->foreignId('provider_approved_by')->nullable()->after('provider_approved_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('provider_approved_by');
            $table->dropColumn([
                'provider_request_status',
                'provider_requested_at',
                'provider_approved_at',
            ]);
        });
    }
};
