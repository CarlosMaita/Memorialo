<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('billing_suspended_at')->nullable()->after('banned_reason');
            $table->text('billing_suspension_reason')->nullable()->after('billing_suspended_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'billing_suspended_at',
                'billing_suspension_reason',
            ]);
        });
    }
};
