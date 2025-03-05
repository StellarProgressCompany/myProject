<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Booking;
use App\Models\TableAvailability;
use Carbon\Carbon;

class BookingSeeder extends Seeder
{
    /**
     * Seed the bookings table with sample bookings.
     */
    public function run(): void
    {
        // For demonstration, create a sample booking for each available TableAvailability row
        // on today's lunch (adjust as needed for testing)
        $today = Carbon::today()->toDateString();
        $availabilities = TableAvailability::where('date', $today)
            ->where('meal_type', 'lunch')
            ->get();

        foreach ($availabilities as $availability) {
            // Only create a booking if there is available capacity
            if ($availability->available_count > 0) {
                Booking::create([
                    'table_availability_id' => $availability->id,
                    'reserved_time'         => '12:30:00',
                    'total_adults'          => 2,
                    'total_kids'            => 0,
                    'full_name'             => 'Test User',
                    'phone'                 => '+34 600000000',
                    'email'                 => 'test@example.com',
                    'special_requests'      => 'No special requests',
                    'gdpr_consent'          => true,
                    'marketing_opt_in'      => false,
                ]);
            }
        }
    }
}
