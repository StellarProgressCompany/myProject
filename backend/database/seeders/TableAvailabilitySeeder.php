<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TableAvailability;
use Carbon\Carbon;

class TableAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Generate data for the next 30 days
        $startDate = Carbon::today();
        $endDate   = Carbon::today()->addDays(29);

        // We have 3 "capacities": 2, 4, or 6 seats
        $tableTypes = [
            ['capacity' => 2, 'available_count' => 4],
            ['capacity' => 4, 'available_count' => 3],
            ['capacity' => 6, 'available_count' => 3],
        ];

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
            $dayOfWeek = $date->dayOfWeek;

            // Determine which meal types apply
            // Monday (1) & Tuesday (2) => closed => skip
            // Wed (3), Thu (4) => lunch only
            // Fri (5), Sat (6), Sun (0) => lunch & dinner
            $mealTypes = [];
            if ($dayOfWeek === 3 || $dayOfWeek === 4) {
                $mealTypes = ['lunch'];
            } elseif (in_array($dayOfWeek, [5, 6, 0])) {
                $mealTypes = ['lunch', 'dinner'];
            } else {
                // Monday or Tuesday => skip (no availability)
                continue;
            }

            // For each meal type, create records for each capacity
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
