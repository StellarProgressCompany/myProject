<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Booking;
use App\Models\TableAvailability;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;

class BookingSeeder extends Seeder
{
    /**
     * Seed the bookings table with sample bookings.
     */
    public function run(): void
    {
        $demo = Config::get('restaurant_dataset.demo_booking', []);

        /* stop immediately if demo bookings are disabled */
        if (!($demo['enabled'] ?? false)) {
            return;
        }

        $today = Carbon::today()->toDateString();
        $availabilities = TableAvailability::where('date', $today)
            ->where('meal_type', 'lunch')
            ->get();

        foreach ($availabilities as $availability) {
            if ($availability->available_count > 0) {
                Booking::create([
                    'table_availability_id' => $availability->id,
                    'reserved_time'         => Config::get('restaurant_dataset.default_reserved_time', '12:30:00'),
                    'total_adults'          => 2,
                    'total_kids'            => 0,
                    'full_name'             => $demo['full_name']        ?? 'Test User',
                    'phone'                 => $demo['phone']            ?? null,
                    'email'                 => $demo['email']            ?? null,
                    'special_requests'      => $demo['special_requests'] ?? null,
                    'gdpr_consent'          => $demo['gdpr_consent']     ?? false,
                    'marketing_opt_in'      => $demo['marketing_opt_in'] ?? false,
                ]);
            }
        }
    }
}
