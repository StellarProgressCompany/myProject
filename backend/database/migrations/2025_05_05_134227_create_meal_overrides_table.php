<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_overrides', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();          // YYYY-MM-DD
            $table->boolean('lunch_closed')->default(false);
            $table->boolean('dinner_closed')->default(false);
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_overrides');
    }
};
