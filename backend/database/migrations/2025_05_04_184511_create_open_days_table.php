<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('open_days', function (Blueprint $table) {
            $table->date('date')->primary();        // YYYY-MM-DD
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('open_days');
    }
};
