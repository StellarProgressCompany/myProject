<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TableAvailability;
use Carbon\Carbon;

class TableAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds for table availabilities.
     */
    public function run(): void
    {
        // Generate data for the next 30 days
        $startDate = Carbon::today();
        $endDate   = Carbon::today()->addDays(29);

        // Define the available table types (capacities) and counts
        $tableTypes = [
            ['capacity' => 2, 'available_count' => 4],
            ['capacity' => 4, 'available_count' => 7],
            ['capacity' => 6, 'available_count' => 7],
        ];

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, etc.
            $dayOfWeek = $date->dayOfWeek;

            // Determine which meal types apply:
            // - Monday (1) & Tuesday (2) => restaurant is closed (skip)
            // - Wednesday (3) & Thursday (4) => lunch only
            // - Friday (5), Saturday (6), Sunday (0) => lunch & dinner
            $mealTypes = [];
            if ($dayOfWeek === 3 || $dayOfWeek === 4) {
                $mealTypes = ['lunch'];
            } elseif (in_array($dayOfWeek, [5, 6, 0])) {
                $mealTypes = ['lunch', 'dinner'];
            } else {
                // Skip Monday & Tuesday
                continue;
            }

            // Create a record for each meal type and table capacity
            foreach ($mealTypes as $mealType) {
                foreach ($tableTypes as $type) {
                    TableAvailability::create([
                        'date'            => $date->toDateString(),
                        'meal_type'       => $mealType,
                        'capacity'        => $type['capacity'],
                        'available_count' => $type['available_count'],
                    ]);
                }
            }
        }
    }
}
