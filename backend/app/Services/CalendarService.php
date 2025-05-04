<?php

namespace App\Services;

use App\Models\TableAvailability;
use App\Models\ClosedDay;
use App\Models\OpenDay;
use App\Models\SystemSetting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

class CalendarService
{
    /**
     * Create TableAvailability rows for $date if they don't exist.
     */
    public function ensureStockForDate(string $date): void
    {
        if (TableAvailability::where('date', $date)->exists()) {
            return;   // already seeded
        }

        $dow       = Carbon::parse($date)->dayOfWeek;           // 0=Sun…6=Sat
        $mealTypes = Config::get("restaurant_dataset.service_schedule.{$dow}", []);

        foreach ($mealTypes as $meal) {
            foreach (Config::get('restaurant_dataset.table_types', []) as $type) {
                TableAvailability::create([
                    'date'            => $date,
                    'meal_type'       => $meal,
                    'capacity'        => $type['capacity'],
                    'available_count' => $type['available_count'],
                ]);
            }
        }
    }

    /**
     * True ⇢ restaurant should accept bookings on $date.
     */
    public function isOpen(string $date): bool
    {
        /* 1) explicit manual close beats everything */
        if (ClosedDay::where('date', $date)->exists()) {
            return false;
        }

        /* 2) explicit manual open beats weekly schedule */
        if (OpenDay::where('date', $date)->exists()) {
            return true;
        }

        /* 3) global booking-window not yet open? */
        $openFrom = SystemSetting::getValue('booking_open_from');
        if ($openFrom && $date < $openFrom) {
            return false;
        }

        /* 4) fall back to weekly service_schedule */
        $dow   = Carbon::parse($date)->dayOfWeek;
        $meals = Config::get("restaurant_dataset.service_schedule.{$dow}", []);

        return ! empty($meals);
    }
}
