<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_terms', function (Blueprint $table) {
            $table->id();
            $table->string('term', 160);
            $table->string('term_normalized', 180);
            $table->date('month_start');
            $table->unsignedInteger('search_count')->default(0);
            $table->boolean('is_manual')->default(false);
            $table->timestamps();

            $table->unique(['term_normalized', 'month_start']);
            $table->index(['month_start', 'search_count']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_terms');
    }
};
