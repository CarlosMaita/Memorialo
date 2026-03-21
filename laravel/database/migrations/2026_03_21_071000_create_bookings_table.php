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
        Schema::create('bookings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('artist_id')->nullable();
            $table->string('artist_user_id')->nullable();
            $table->string('artist_name')->nullable();
            $table->string('user_id')->nullable();
            $table->string('client_name')->nullable();
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->string('date')->nullable();
            $table->string('start_time')->nullable();
            $table->unsignedInteger('duration')->nullable();
            $table->string('event_type')->nullable();
            $table->string('location')->nullable();
            $table->text('special_requests')->nullable();
            $table->decimal('total_price', 10, 2)->default(0);
            $table->string('status')->default('pending');
            $table->string('plan_id')->nullable();
            $table->string('plan_name')->nullable();
            $table->string('contract_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('artist_id');
            $table->index('artist_user_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('contract_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};