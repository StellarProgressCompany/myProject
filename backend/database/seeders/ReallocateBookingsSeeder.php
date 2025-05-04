<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\TableAvailability;
use App\Services\BookingAlgorithmService;

class ReallocateBookingsSeeder extends Seeder
{
    /**
     * Re-assign every existing booking using the real allocator.
     */
    public function run(): void
    {
        $this->command->info('⏳ Starting re-allocation of seeded bookings…');

        // 1) Grab all current bookings into memory
        $all = Booking::with('tableAvailability')
            ->get()
            ->map(fn($b) => [
                'reserved_time'    => $b->reserved_time,
                'total_adults'     => $b->total_adults,
                'total_kids'       => $b->total_kids,
                'full_name'        => $b->full_name,
                'phone'            => $b->phone,
                'email'            => $b->email,
                'special_requests' => $b->special_requests,
                'gdpr_consent'     => $b->gdpr_consent,
                'marketing_opt_in' => $b->marketing_opt_in,
                'long_stay'        => $b->long_stay,
                'date'             => $b->tableAvailability->date,
                'meal_type'        => $b->tableAvailability->meal_type,
            ]);

        // 2) Wipe out all old bookings & details
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        BookingDetail::truncate();
        Booking::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 3) Re-seat each booking via the allocator
        $algo = app(BookingAlgorithmService::class);

        foreach ($all as $payload) {
            $partySize = $payload['total_adults'] + $payload['total_kids'];
            $assign = $algo->tryAllocate(
                $payload['date'],
                $payload['meal_type'],
                $payload['reserved_time'],
                $partySize,
                $payload['long_stay']
            );

            if (isset($assign['error'])) {
                $this->command->warn("✗ Could not seat {$payload['full_name']} at {$payload['reserved_time']}: {$assign['error']}");
                continue;
            }

            DB::transaction(function() use ($assign, $payload) {
                $master = null;
                foreach ($assign as $i => $slot) {
                    $ta = TableAvailability::where('date', $payload['date'])
                        ->where('meal_type', $payload['meal_type'])
                        ->where('capacity', $slot['capacity'])
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($i === 0) {
                        // master booking row
                        $master = Booking::create([
                            'table_availability_id' => $ta->id,
                            'reserved_time'         => $payload['reserved_time'],
                            'total_adults'          => $payload['total_adults'],
                            'total_kids'            => $payload['total_kids'],
                            'full_name'             => $payload['full_name'],
                            'phone'                 => $payload['phone'],
                            'email'                 => $payload['email'],
                            'special_requests'      => $payload['special_requests'],
                            'gdpr_consent'          => $payload['gdpr_consent'],
                            'marketing_opt_in'      => $payload['marketing_opt_in'],
                            'long_stay'             => $payload['long_stay'],
                        ]);
                    } else {
                        // detail (extra table)
                        BookingDetail::create([
                            'booking_id'            => $master->id,
                            'table_availability_id' => $ta->id,
                            'capacity'              => $slot['capacity'],
                            'extra_chair'           => (bool) ($slot['extra_chair'] ?? false),
                        ]);
                    }
                }
            });
        }

        $this->command->info('✅ Re-allocation complete.');
    }
}
