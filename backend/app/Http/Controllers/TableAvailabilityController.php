<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Http\Request;

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
}
