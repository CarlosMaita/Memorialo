<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('closure_day')->default(1);
            $table->unsignedTinyInteger('payment_grace_days')->default(5);
            $table->decimal('commission_rate', 6, 4)->default(0.0800);
            $table->string('last_closed_month', 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_settings');
    }
};
