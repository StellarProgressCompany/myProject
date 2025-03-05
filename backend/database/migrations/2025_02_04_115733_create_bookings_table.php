<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_availability_id')->constrained()->onDelete('cascade');

            // Instead of storing date/time, we only store the chosen time.
            // (The date is in table_availability.)
            $table->time('reserved_time');

            // Breakdown of guests
            $table->unsignedInteger('total_adults')->default(1);
            $table->unsignedInteger('total_kids')->default(0);

            // Contact & personal info
            $table->string('full_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('special_requests')->nullable();

            // Consents
            $table->boolean('gdpr_consent')->default(false);
            $table->boolean('marketing_opt_in')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
