<?php

namespace App\Services;

use Illuminate\Support\Collection;

class AvailabilityService
{
    /**
     * Computes remaining capacity for given round times.
     *
     * @param string     $dateStr    Date in "Y-m-d" format (e.g., "2025-02-01").
     * @param array      $roundTimes Array of time strings (e.g., ["12:30", "12:45"]).
     * @param Collection $rowsForDay Collection of TableAvailability records for the day.
     * @param Collection $allBookings Collection of bookings for the day.
     * @return array   Associative array like ["2" => 4, "4" => 3, "6" => 3].
     */
    public function computeRoundAvailability(string $dateStr, array $roundTimes, Collection $rowsForDay, Collection $allBookings)
    {
        $availabilityByCapacity = [];
        foreach ([2, 4, 6] as $cap) {
            // Find the TableAvailability row for this capacity.
            $taRow = $rowsForDay->where('capacity', $cap)->first();

            if (!$taRow) {
                // If no row, no capacity for that day.
                $availabilityByCapacity["$cap"] = 0;
                continue;
            }

            $seededCount = $taRow->available_count;

            // Count bookings that match the date, table availability ID, and time round.
            $bookedCount = $allBookings
                ->where('table_availability_id', $taRow->id)
                ->where('date', $dateStr)
                ->whereIn('time', $roundTimes)
                ->count();

            $availabilityByCapacity["$cap"] = max($seededCount - $bookedCount, 0);
        }
        return $availabilityByCapacity;
    }
}
