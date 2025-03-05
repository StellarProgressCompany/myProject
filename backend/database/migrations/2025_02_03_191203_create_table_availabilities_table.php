<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_availabilities', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('meal_type');        // lunch or dinner
            $table->integer('capacity');        // e.g. 2, 4, or 6
            $table->integer('available_count'); // number of available tables for that capacity
            $table->timestamps();

            // each date+meal_type+capacity is unique
            $table->unique(['date', 'meal_type', 'capacity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_availabilities');
    }
};
