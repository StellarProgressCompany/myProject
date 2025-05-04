<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the table.
     */
    public function up(): void
    {
        Schema::create('calendar_overrides', function (Blueprint $table) {
            /* one row per date → PK */
            $table->date('date')->primary();

            /*
             * 'open'  → force-open this date even if the weekly schedule says closed
             * 'closed'→ force-close this date even if the weekly schedule says open
             */
            $table->enum('state', ['open', 'closed']);
        });
    }

    /**
     * Drop the table.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_overrides');
    }
};
