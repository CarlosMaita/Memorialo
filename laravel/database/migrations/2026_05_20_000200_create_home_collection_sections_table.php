<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_collection_sections', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->string('subtitle', 320)->nullable();
            $table->foreignId('collection_id')->constrained('collections')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('visible')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_collection_sections');
    }
};
