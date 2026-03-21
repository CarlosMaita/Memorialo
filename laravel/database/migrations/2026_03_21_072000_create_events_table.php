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
        Schema::create('events', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('event_date')->nullable();
            $table->string('event_type')->nullable();
            $table->string('location')->nullable();
            $table->decimal('budget', 10, 2)->nullable();
            $table->string('status')->default('planning');
            $table->json('contract_ids')->nullable();
            $table->boolean('archived')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('event_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};