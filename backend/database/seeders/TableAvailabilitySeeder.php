<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TableAvailability;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

class TableAvailabilitySeeder extends Seeder
{
    public function run(): void
    {
        $ds = Config::get('restaurant_dataset', []);

        $horizonDays = $ds['seeding_horizon_days'] ?? 30;
        $rooms       = $ds['rooms']                ?? [];

        /* legacy fallback – single room */
        if (empty($rooms)) {
            $rooms = [
                'default' => [
                    'label'       => 'Main',
                    'position'    => 1,
                    'table_types' => $ds['table_types'] ?? [
                            ['capacity' => 2, 'available_count' => 4],
                            ['capacity' => 4, 'available_count' => 7],
                            ['capacity' => 6, 'available_count' => 7],
                        ],
                ],
            ];
        }

        $serviceSchedule = $ds['service_schedule'] ?? [];

        $start = Carbon::today();
        $end   = Carbon::today()->addDays($horizonDays - 1);

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dow       = $d->dayOfWeek;               // 0 = Sun … 6 = Sat
            $mealTypes = $serviceSchedule[$dow] ?? [];

            foreach ($mealTypes as $meal) {
                foreach ($rooms as $slug => $def) {
                    foreach ($def['table_types'] as $tbl) {
                        TableAvailability::create([
                            'date'            => $d->toDateString(),
                            'meal_type'       => $meal,
                            'room'            => $slug,
                            'capacity'        => $tbl['capacity'],
                            'available_count' => $tbl['available_count'],
                        ]);
                    }
                }
            }
        }

        $this->command->info('✅ Table availability stock (multi-room) generated.');
    }
}
