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
            // Uncomment the following line if you want to seed sample bookings:
            // BookingSeeder::class,
        ]);
    }
}
