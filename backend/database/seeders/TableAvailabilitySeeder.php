<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TableAvailability;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

class TableAvailabilitySeeder extends Seeder
{
    /**
     * Run the database seeds for table availabilities.
     */
    public function run(): void
    {
        /* ───────── read dataset ───────── */
        $ds = Config::get('restaurant_dataset');

        $horizonDays     = $ds['seeding_horizon_days'] ?? 30;
        $tableTypes      = $ds['table_types']          ?? [];
        $serviceSchedule = $ds['service_schedule']     ?? [];

        /* ───────── safety fallback (should never trigger) ───────── */
        if (empty($tableTypes)) {
            $tableTypes = [
                ['capacity' => 2, 'available_count' => 4],
                ['capacity' => 4, 'available_count' => 7],
                ['capacity' => 6, 'available_count' => 7],
            ];
        }

        $startDate = Carbon::today();
        $endDate   = Carbon::today()->addDays($horizonDays - 1);

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dayOfWeek = $date->dayOfWeek;    // 0 (Sun) … 6 (Sat)

            $mealTypes = $serviceSchedule[$dayOfWeek] ?? [];
            if (empty($mealTypes)) {
                continue;                    // closed
            }

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
