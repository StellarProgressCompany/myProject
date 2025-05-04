<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            TableAvailabilitySeeder::class,
            BookingSeeder::class,           // heavier random bookings now
            ReallocateBookingsSeeder::class // then re-seat them for minimal waste
        ]);
    }
}
