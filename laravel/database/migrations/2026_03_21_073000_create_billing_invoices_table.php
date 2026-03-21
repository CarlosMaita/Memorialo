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
        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained()->cascadeOnDelete();
            $table->string('month', 7);
            $table->decimal('commission_rate', 6, 4)->default(0.0800);
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('status', 30)->default('pending');
            $table->string('payment_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(['provider_id', 'month']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billing_invoices');
    }
};
