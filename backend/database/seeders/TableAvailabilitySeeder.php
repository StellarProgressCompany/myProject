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
        /* ─── read dataset ─── */
        // ⬇️ drop the 'important.' prefix
        $ds = Config::get('restaurant_dataset', []);

        $horizonDays     = $ds['seeding_horizon_days'] ?? 30;
        $tableTypes      = $ds['table_types']          ?? [];
        $serviceSchedule = $ds['service_schedule']     ?? [];

        /* ─── fallback ─── */
        if (empty($tableTypes)) {
            $tableTypes = [
                ['capacity' => 2, 'available_count' => 4],
                ['capacity' => 4, 'available_count' => 7],
                ['capacity' => 6, 'available_count' => 7],
            ];
        }

        $start = Carbon::today();
        $end   = Carbon::today()->addDays($horizonDays - 1);

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dow       = $d->dayOfWeek;               // 0 = Sun … 6 = Sat
            $mealTypes = $serviceSchedule[$dow] ?? [];

            if (empty($mealTypes)) {
                continue;                            // closed
            }

            foreach ($mealTypes as $meal) {
                foreach ($tableTypes as $t) {
                    TableAvailability::create([
                        'date'            => $d->toDateString(),
                        'meal_type'       => $meal,
                        'capacity'        => $t['capacity'],
                        'available_count' => $t['available_count'],
                    ]);
                }
            }
        }

        $this->command->info('✅ Table availability stock generated.');
    }
}
