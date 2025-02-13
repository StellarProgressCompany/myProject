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
        // If you have a TableTypeSeeder, you can call it here.
        // Then seed table availabilities for the next 30 days
        $this->call([
            // TableTypeSeeder::class, // remove if you're not actually using TableType
            TableAvailabilitySeeder::class,
        ]);
    }
}
