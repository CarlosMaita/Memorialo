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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('whatsapp_number')->nullable()->after('phone');
            $table->string('avatar')->nullable()->after('whatsapp_number');
            $table->boolean('is_provider')->default(false)->after('avatar');
            $table->foreignId('provider_id')->nullable()->after('is_provider')->constrained('providers')->nullOnDelete();
            $table->string('role')->default('user')->after('provider_id');
            $table->boolean('banned')->default(false)->after('role');
            $table->timestamp('banned_at')->nullable()->after('banned');
            $table->text('banned_reason')->nullable()->after('banned_at');
            $table->boolean('archived')->default(false)->after('banned_reason');
            $table->timestamp('archived_at')->nullable()->after('archived');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('provider_id');
            $table->dropColumn([
                'phone',
                'whatsapp_number',
                'avatar',
                'is_provider',
                'role',
                'banned',
                'banned_at',
                'banned_reason',
                'archived',
                'archived_at',
            ]);
        });
    }
};
