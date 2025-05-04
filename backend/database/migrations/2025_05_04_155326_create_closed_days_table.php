<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('closed_days', function (Blueprint $table) {
            /* one row per date → PK */
            $table->date('date')->primary();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('closed_days');
    }
};
