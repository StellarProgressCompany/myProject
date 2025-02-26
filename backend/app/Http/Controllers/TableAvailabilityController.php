<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TableAvailabilityController extends Controller
{
    protected $availabilityService;

    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    public function index(Request $request)
    {
        $date = trim($request->query('date'));
        $mealType = trim($request->query('mealType')); // expected: "lunch" or "dinner"

        // Quick validation.
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

        // Compute availability using the AvailabilityService.
        if ($mealType === 'lunch') {
            $firstRoundAvailability = $this->availabilityService->computeRoundAvailability(
                $date,
                $firstRoundTimes,
                $availabilities,
                Booking::where('date', $date)->get()
            );
            $secondRoundAvailability = $this->availabilityService->computeRoundAvailability(
                $date,
                $secondRoundTimes,
                $availabilities,
                Booking::where('date', $date)->get()
            );

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
            $dinnerAvailability = $this->availabilityService->computeRoundAvailability(
                $date,
                $dinnerTimes,
                $availabilities,
                Booking::where('date', $date)->get()
            );
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

    public function range(Request $request): \Illuminate\Http\JsonResponse
    {
        $start = $request->query('start');
        $end = $request->query('end');
        $mealType = $request->query('mealType'); // "lunch" or "dinner"

        // Validate input.
        if (!$start || !$end || !$mealType) {
            return response()->json(['error' => 'Missing parameters (start, end, mealType)'], 400);
        }

        // Convert to Carbon for easier date manipulation.
        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);
        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        // Step 1: Gather availability records for all dates in range.
        $availabilities = TableAvailability::whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->where('meal_type', $mealType)
            ->get();

        // Step 2: Gather all bookings in that range (for the relevant TableAvailability IDs).
        $availabilityIds = $availabilities->pluck('id');
        $bookings = Booking::whereIn('table_availability_id', $availabilityIds)
            ->whereBetween('date', [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')])
            ->get();

        // Build an associative array keyed by "YYYY-MM-DD".
        $results = [];

        // Iterate from $startDate to $endDate day by day.
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');

            // If restaurant is closed (Mon = 1 or Tue = 2).
            if ($current->dayOfWeek == 1 || $current->dayOfWeek == 2) {
                $results[$dateStr] = 'closed';
                $current->addDay();
                continue;
            }

            // Filter out all TableAvailability rows for this specific day.
            $rowsForDay = $availabilities->where('date', $dateStr);

            if ($rowsForDay->isEmpty()) {
                $results[$dateStr] = [];
                $current->addDay();
                continue;
            }

            if ($mealType === 'lunch') {
                $firstRoundTimes  = ['12:30','12:45','13:00','13:15','13:30','13:45','14:00'];
                $secondRoundTimes = ['15:00','15:15','15:30','15:45','16:00'];

                $firstRoundAvail  = $this->availabilityService->computeRoundAvailability($dateStr, $firstRoundTimes, $rowsForDay, $bookings);
                $secondRoundAvail = $this->availabilityService->computeRoundAvailability($dateStr, $secondRoundTimes, $rowsForDay, $bookings);

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
                $dinnerAvail = $this->availabilityService->computeRoundAvailability($dateStr, $dinnerTimes, $rowsForDay, $bookings);
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
}
