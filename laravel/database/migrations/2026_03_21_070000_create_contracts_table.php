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
        Schema::create('contracts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('booking_id')->nullable();
            $table->string('artist_id')->nullable();
            $table->string('artist_user_id')->nullable();
            $table->string('artist_name')->nullable();
            $table->string('artist_email')->nullable();
            $table->string('artist_whatsapp')->nullable();
            $table->string('client_id')->nullable();
            $table->string('client_name')->nullable();
            $table->string('client_email')->nullable();
            $table->string('client_whatsapp')->nullable();
            $table->string('event_id')->nullable();
            $table->string('status')->default('draft');
            $table->json('terms')->nullable();
            $table->json('artist_signature')->nullable();
            $table->json('client_signature')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('booking_id');
            $table->index('artist_id');
            $table->index('artist_user_id');
            $table->index('client_id');
            $table->index('event_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
