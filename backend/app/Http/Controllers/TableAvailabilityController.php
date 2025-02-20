<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TableAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $date = trim($request->query('date'));
        $mealType = trim($request->query('mealType')); // expected: "lunch" or "dinner"

        // Quick validation
        if (!$date || !$mealType) {
            return response()->json([], 400);
        }

        // Load the seeded availability records for the given date & mealType.
        // We expect records for capacities 2, 4, and 6.
        $availabilities = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get()
            ->keyBy('capacity'); // keys: 2, 4, 6

        if ($availabilities->isEmpty()) {
            return response()->json([]);
        }

        // Define time slot groups based on meal type.
        if ($mealType === 'lunch') {
            $firstRoundTimes = ['12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00'];
            $secondRoundTimes = ['15:00', '15:15', '15:30', '15:45', '16:00'];
        } else { // dinner
            $dinnerTimes = ['20:00', '20:30', '21:00', '21:30'];
        }

        // Helper function: For a given round's time set, compute available tables per capacity.
        // This subtracts the count of bookings (for that date and time set) from the seeded count.
        $getAvailabilityForRound = function (array $roundTimes) use ($date, $availabilities) {
            $availabilityByCapacity = [];
            foreach ([2, 4, 6] as $cap) {
                if (!isset($availabilities[$cap])) {
                    $availabilityByCapacity[(string)$cap] = 0;
                    continue;
                }
                $seeded = $availabilities[$cap]->available_count;
                $bookedCount = Booking::where('date', $date)
                    ->where('table_availability_id', $availabilities[$cap]->id)
                    ->whereIn('time', $roundTimes)
                    ->count();
                $remaining = max($seeded - $bookedCount, 0);
                $availabilityByCapacity[(string)$cap] = $remaining;
            }
            return $availabilityByCapacity;
        };

        if ($mealType === 'lunch') {
            $firstRoundAvailability = $getAvailabilityForRound($firstRoundTimes);
            $secondRoundAvailability = $getAvailabilityForRound($secondRoundTimes);

            $response = [
                'first_round' => [
                    'time' => $firstRoundTimes[0], // representative time (could be used as label)
                    'availability' => $firstRoundAvailability,
                    'note' => 'Must leave by 15:00'
                ],
                'second_round' => [
                    'time' => $secondRoundTimes[0],
                    'availability' => $secondRoundAvailability,
                    'note' => 'Must leave by 17:30'
                ],
            ];
        } else {
            $dinnerAvailability = $getAvailabilityForRound($dinnerTimes);
            $response = [
                'dinner_round' => [
                    'time' => $dinnerTimes[0],
                    'availability' => $dinnerAvailability,
                    'note' => 'Dinner booking'
                ],
            ];
        }

        return response()->json($response);
    }

    /**
     * Returns availability for a range of dates in a single request.
     *
     * Example usage:
     *  GET /api/table-availability-range?start=2025-02-01&end=2025-02-29&mealType=lunch
     */
    public function range(Request $request): \Illuminate\Http\JsonResponse
    {
        $start = $request->query('start');
        $end = $request->query('end');
        $mealType = $request->query('mealType'); // "lunch" or "dinner"

        // Validate input
        if (!$start || !$end || !$mealType) {
            return response()->json(['error' => 'Missing parameters (start, end, mealType)'], 400);
        }

        // Convert to Carbon for easier date manipulation
        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);
        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        // Step 1: Gather availability records for all dates in range
        $availabilities = TableAvailability::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->where('meal_type', $mealType)
            ->get();

        // Step 2: Gather all bookings in that range (for the relevant TableAvailability IDs)
        $availabilityIds = $availabilities->pluck('id');
        $bookings = Booking::whereIn('table_availability_id', $availabilityIds)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        // We'll build an associative array keyed by "YYYY-MM-DD".
        // For each date, we replicate the logic from the single-day index method.
        $results = [];

        // Let's iterate from $startDate to $endDate day by day.
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');

            // If restaurant is closed (Mon = 1 or Tue = 2):
            if ($current->dayOfWeek == 1 || $current->dayOfWeek == 2) {
                $results[$dateStr] = 'closed';
                $current->addDay();
                continue;
            }

            // Filter out all TableAvailability rows for this specific day
            $rowsForDay = $availabilities->where('date', $dateStr);

            if ($rowsForDay->isEmpty()) {
                // If no records, we might decide it's also "closed" or "no data"
                $results[$dateStr] = [];
                $current->addDay();
                continue;
            }

            // Build round structures for lunch or dinner
            if ($mealType === 'lunch') {
                $firstRoundTimes  = ['12:30','12:45','13:00','13:15','13:30','13:45','14:00'];
                $secondRoundTimes = ['15:00','15:15','15:30','15:45','16:00'];

                $firstRoundAvail  = $this->computeRoundAvailability($dateStr, $firstRoundTimes, $rowsForDay, $bookings);
                $secondRoundAvail = $this->computeRoundAvailability($dateStr, $secondRoundTimes, $rowsForDay, $bookings);

                $results[$dateStr] = [
                    'first_round' => [
                        'time' => $firstRoundTimes[0],
                        'availability' => $firstRoundAvail,
                        'note' => 'Must leave by 15:00',
                    ],
                    'second_round' => [
                        'time' => $secondRoundTimes[0],
                        'availability' => $secondRoundAvail,
                        'note' => 'Must leave by 17:30',
                    ],
                ];
            } else { // dinner
                $dinnerTimes = ['20:00','20:30','21:00','21:30'];
                $dinnerAvail = $this->computeRoundAvailability($dateStr, $dinnerTimes, $rowsForDay, $bookings);
                $results[$dateStr] = [
                    'dinner_round' => [
                        'time' => $dinnerTimes[0],
                        'availability' => $dinnerAvail,
                        'note' => 'Dinner booking',
                    ],
                ];
            }

            $current->addDay();
        }

        return response()->json($results);
    }

    /**
     * Utility: For a given date and round times, compute remaining capacity
     * for capacities [2, 4, 6], subtracting any existing bookings.
     *
     * @param  string  $dateStr         e.g. "2025-02-01"
     * @param  array   $roundTimes      e.g. ["12:30","12:45"]
     * @param  Collection $rowsForDay
     * @param  Collection $allBookings
     * @return array   e.g. ["2" => 4, "4" => 3, "6" => 3]
     */
    private function computeRoundAvailability($dateStr, array $roundTimes, $rowsForDay, $allBookings)
    {
        $availabilityByCapacity = [];
        foreach ([2,4,6] as $cap) {
            // Find the TableAvailability row for this capacity
            $taRow = $rowsForDay->where('capacity', $cap)->first();

            if (!$taRow) {
                // If no row, no capacity for that day
                $availabilityByCapacity["$cap"] = 0;
                continue;
            }

            $seededCount = $taRow->available_count;

            // Count how many bookings are in $allBookings that match:
            //  - same date
            //  - table_availability_id = $taRow->id
            //  - time in the roundTimes
            $bookedCount = $allBookings
                ->where('table_availability_id', $taRow->id)
                ->where('date', $dateStr)
                ->whereIn('time', $roundTimes)
                ->count();

            $remaining = max($seededCount - $bookedCount, 0);

            $availabilityByCapacity["$cap"] = $remaining;
        }

        return $availabilityByCapacity;
    }
}
