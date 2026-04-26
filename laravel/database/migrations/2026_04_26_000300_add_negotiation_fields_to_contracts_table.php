<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->timestamp('provider_signed_at')->nullable()->after('artist_signature');
            $table->string('rejection_reason')->nullable()->after('client_signature');
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['provider_signed_at', 'rejection_reason']);
        });
    }
};
