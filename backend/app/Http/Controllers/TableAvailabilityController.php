<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TableAvailabilityController extends Controller
{
    /**
     * Returns availability for a SINGLE day + mealType
     * e.g. GET /api/table-availability?date=2025-03-10&mealType=lunch
     */
    public function index(Request $request)
    {
        $date = trim($request->query('date'));
        $mealType = trim($request->query('mealType')); // "lunch" or "dinner"
        if (!$date || !$mealType) {
            return response()->json([], 400);
        }

        // Grab the relevant TableAvailability rows
        $availabilities = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get()
            ->keyBy('capacity');

        if ($availabilities->isEmpty()) {
            return response()->json([]);
        }

        // Example time-round sets
        if ($mealType === 'lunch') {
            $firstRoundTimes  = ['12:30','12:45','13:00','13:15','13:30','13:45','14:00'];
            $secondRoundTimes = ['15:00','15:15','15:30','15:45','16:00'];

            $firstRound = $this->computeRoundAvailability($availabilities, $firstRoundTimes);
            $secondRound = $this->computeRoundAvailability($availabilities, $secondRoundTimes);

            return response()->json([
                'first_round' => [
                    'time' => $firstRoundTimes[0],
                    'availability' => $firstRound,
                    'note' => 'Must leave by 15:00'
                ],
                'second_round' => [
                    'time' => $secondRoundTimes[0],
                    'availability' => $secondRound,
                    'note' => 'Must leave by 17:30'
                ],
            ]);
        } else {
            // dinner
            $dinnerTimes = ['20:00','20:30','21:00','21:30'];
            $dinnerRound = $this->computeRoundAvailability($availabilities, $dinnerTimes);

            return response()->json([
                'dinner_round' => [
                    'time' => $dinnerTimes[0],
                    'availability' => $dinnerRound,
                    'note' => 'Dinner booking'
                ],
            ]);
        }
    }

    /**
     * Returns availability for a RANGE of dates
     * e.g. /api/table-availability-range?start=2025-02-26&end=2025-03-26&mealType=lunch
     */
    public function range(Request $request): \Illuminate\Http\JsonResponse
    {
        $start = $request->query('start');
        $end = $request->query('end');
        $mealType = $request->query('mealType'); // "lunch" or "dinner"

        if (!$start || !$end || !$mealType) {
            return response()->json(['error' => 'Missing parameters (start, end, mealType)'], 400);
        }

        $startDate = Carbon::parse($start);
        $endDate   = Carbon::parse($end);

        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        // Get all table_availability rows in the range for the given meal_type
        $availabilities = TableAvailability::whereBetween('date', [
            $startDate->format('Y-m-d'),
            $endDate->format('Y-m-d')
        ])
            ->where('meal_type', $mealType)
            ->get();

        // Grab all relevant bookings (by referencing the above table_availabilities)
        $availabilityIds = $availabilities->pluck('id');
        $bookings = Booking::whereIn('table_availability_id', $availabilityIds)->get();

        $results = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');

            // For example, Monday(1) or Tuesday(2) => closed
            if ($current->dayOfWeek == 1 || $current->dayOfWeek == 2) {
                $results[$dateStr] = 'closed';
                $current->addDay();
                continue;
            }

            // Filter table_availability rows for this date
            $rowsForDay = $availabilities->where('date', $dateStr);

            if ($rowsForDay->isEmpty()) {
                // means no data => closed or empty
                $results[$dateStr] = [];
                $current->addDay();
                continue;
            }

            // Build round availability
            if ($mealType === 'lunch') {
                $firstRoundTimes  = ['12:30','12:45','13:00','13:15','13:30','13:45','14:00'];
                $secondRoundTimes = ['15:00','15:15','15:30','15:45','16:00'];

                $firstRound = $this->computeRoundAvailability($rowsForDay, $firstRoundTimes, $bookings);
                $secondRound = $this->computeRoundAvailability($rowsForDay, $secondRoundTimes, $bookings);

                $results[$dateStr] = [
                    'first_round' => [
                        'time' => $firstRoundTimes[0],
                        'availability' => $firstRound,
                        'note' => 'Must leave by 15:00',
                    ],
                    'second_round' => [
                        'time' => $secondRoundTimes[0],
                        'availability' => $secondRound,
                        'note' => 'Must leave by 17:30',
                    ],
                ];
            } else {
                // dinner
                $dinnerTimes = ['20:00','20:30','21:00','21:30'];
                $dinnerRound = $this->computeRoundAvailability($rowsForDay, $dinnerTimes, $bookings);

                $results[$dateStr] = [
                    'dinner_round' => [
                        'time' => $dinnerTimes[0],
                        'availability' => $dinnerRound,
                        'note' => 'Dinner booking',
                    ],
                ];
            }

            $current->addDay();
        }

        return response()->json($results);
    }

    private function computeRoundAvailability($tableAvailabilities, array $roundTimes, $allBookings = null)
    {
        if ($allBookings === null) {
            $ids = $tableAvailabilities->pluck('id');
            $allBookings = Booking::whereIn('table_availability_id', $ids)->get();
        }

        // If we are computing the second lunch round, block tables whose long‑stay
        // bookings started in the first round (before 15:00)
        $isSecondLunch = in_array('15:00', $roundTimes);

        $availabilityByCapacity = [];
        foreach ([2, 4, 6] as $cap) {
            $taRow = $tableAvailabilities->where('capacity', $cap)->first();
            if (!$taRow) {
                $availabilityByCapacity["$cap"] = 0;
                continue;
            }

            $seeded = $taRow->available_count;

            $booked = $allBookings
                ->where('table_availability_id', $taRow->id)
                ->filter(function ($b) use ($roundTimes, $isSecondLunch) {
                    // direct clash
                    if (in_array($b->reserved_time, $roundTimes)) {
                        return true;
                    }
                    // long‑stay from first round blocks second round
                    if ($isSecondLunch && $b->long_stay && $b->reserved_time < '15:00:00') {
                        return true;
                    }
                    return false;
                })->count();

            $availabilityByCapacity["$cap"] = max($seeded - $booked, 0);
        }

        return $availabilityByCapacity;
    }

}
