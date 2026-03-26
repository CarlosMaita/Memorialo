<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notification_deliveries', function (Blueprint $table) {
            $table->id();
            $table->uuid('notification_id')->nullable();
            $table->string('notification_type');
            $table->unsignedBigInteger('recipient_user_id')->nullable();
            $table->string('recipient_email')->nullable();
            $table->string('recipient_key');
            $table->string('channel', 32);
            $table->string('status', 32)->default('pending');
            $table->string('dedupe_key', 255);
            $table->string('provider', 32)->default('log');
            $table->string('provider_message_id')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['recipient_user_id', 'channel'], 'notification_deliveries_user_channel_idx');
            $table->index(['status', 'channel'], 'notification_deliveries_status_channel_idx');
            $table->index('dedupe_key');
            $table->unique(
                ['dedupe_key', 'channel', 'recipient_key'],
                'notification_deliveries_dedupe_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_deliveries');
    }
};
