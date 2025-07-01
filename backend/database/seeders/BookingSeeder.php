<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TableAvailability;
use App\Models\Booking;
use Faker\Factory as Faker;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        /* ─── read the toggle ─── */
        $demo = config('restaurant_dataset.demo_booking', []);

        if (empty($demo['enabled'])) {
            $this->command->info('Demo bookings disabled – skipping BookingSeeder.');
            return;
        }

        $faker           = Faker::create();
        $specialRequests = [
            'Window seat please',
            'Celebrating birthday',
            'High chair needed',
            'Vegetarian menu',
            'Allergic to nuts',
            'Anniversary celebration',
            'Quiet corner',
            'No special requests',
        ];

        // Pre-build time slots for each meal
        $slots = [
            'lunch'  => $this->buildSlots(13, 0, 16, 0),
            'dinner' => $this->buildSlots(20, 0, 22, 0),
        ];

        TableAvailability::chunkById(500, function ($chunk) use ($faker, $specialRequests, $slots) {
            foreach ($chunk as $stock) {
                // Was floor($stock->available_count / 2); now use all tables
                $maxToBook = $stock->available_count;
                $count     = $maxToBook > 0 ? rand(0, $maxToBook) : 0;

                for ($i = 0; $i < $count; $i++) {
// inside the foreach where Booking::create([ … ]) is called:
                    Booking::create([
                        'table_availability_id' => $stock->id,
                        'total_adults'          => min($stock->capacity, rand(1, $stock->capacity)),
                        'total_kids'            => rand(0, 2),
                        'reserved_time'         => $faker->randomElement($slots[$stock->meal_type]),
                        'full_name'             => $faker->name,
                        'phone'                 => $faker->phoneNumber,
                        'email'                 => $faker->safeEmail,
                        'special_requests'      => $faker->randomElement($specialRequests),
                        'gdpr_consent'          => true,
                        'marketing_opt_in'      => $faker->boolean(30),
                        'long_stay'             => $faker->boolean(10),
                    ]);

                }
            }
        });

        $this->command->info('✅ Demo bookings generated.');
    }

    /** Generate HH:MM:00 slots every 15 minutes */
    private function buildSlots(int $fromH, int $fromM, int $toH, int $toM): array
    {
        $out = [];
        for ($h = $fromH, $m = $fromM;
             ($h < $toH) || ($h === $toH && $m <= $toM);
             ($m += 15) >= 60 && ($h += 1) && ($m = 0)
        ) {
            $out[] = sprintf('%02d:%02d:00', $h, $m);
        }
        return $out;
    }
}
