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
            BookingSeeder::class, // demo seeder – disabled via config when needed
        ]);
    }
}
