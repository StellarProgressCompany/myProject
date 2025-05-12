<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('table_availabilities', function (Blueprint $table) {
            // 1) Drop the old unique index on (date, meal_type, capacity)
            $table->dropUnique('table_availabilities_date_meal_type_capacity_unique');

            // 2) Add the new room column (defaulting to "default")
            $table->string('room')
                ->default('default')
                ->after('meal_type');

            // 3) Re-create a unique index over date+meal_type+room+capacity
            $table->unique(['date', 'meal_type', 'room', 'capacity'], 'table_availabilities_date_meal_room_capacity_unique');
        });
    }

    public function down(): void
    {
        Schema::table('table_availabilities', function (Blueprint $table) {
            // 1) Drop the new unique index
            $table->dropUnique('table_availabilities_date_meal_room_capacity_unique');

            // 2) Drop the room column
            $table->dropColumn('room');

            // 3) Re-create the original unique index on date+meal_type+capacity
            $table->unique(['date', 'meal_type', 'capacity'], 'table_availabilities_date_meal_type_capacity_unique');
        });
    }
};
