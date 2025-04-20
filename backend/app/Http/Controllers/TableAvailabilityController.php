<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Table‑availability endpoints
 *
 *  • /api/table‑availability?date=YYYY‑MM‑DD&mealType=lunch|dinner
 *  • /api/table‑availability-range?start=YYYY‑MM‑DD&end=YYYY‑MM‑DD&mealType=lunch|dinner
 *
 *  ⚠️ Lunch 1st‑round times were updated to the official spec
 *     (13 :00 – 14 :00 @ 15 min grid).
 */
class TableAvailabilityController extends Controller
{
    /**
     * Return availability for one day + meal‑type
     */
    public function index(Request $request)
    {
        $date     = trim($request->query('date'));
        $mealType = trim($request->query('mealType'));   // "lunch" | "dinner"

        if (!$date || !$mealType) {
            return response()->json([], 400);
        }

        $availabilities = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get()
            ->keyBy('capacity');

        if ($availabilities->isEmpty()) {
            return response()->json([]);
        }

        /* ---------- official turn‑sets ---------- */
        if ($mealType === 'lunch') {
            $firstRoundTimes  = ['13:00','13:15','13:30','13:45','14:00'];
            $secondRoundTimes = ['15:00','15:15','15:30','15:45','16:00'];

            return response()->json([
                'first_round'  => [
                    'time'         => $firstRoundTimes[0],
                    'availability' => $this->computeRoundAvailability($availabilities, $firstRoundTimes),
                    'note'         => 'Must leave by 15:00',
                ],
                'second_round' => [
                    'time'         => $secondRoundTimes[0],
                    'availability' => $this->computeRoundAvailability($availabilities, $secondRoundTimes),
                    'note'         => 'Must leave by 17:30',
                ],
            ]);
        }

        /* dinner */
        $dinnerTimes = ['20:00','20:15','20:30','20:45','21:00','21:15','21:30','21:45','22:00'];

        return response()->json([
            'dinner_round' => [
                'time'         => $dinnerTimes[0],
                'availability' => $this->computeRoundAvailability($availabilities, $dinnerTimes),
                'note'         => 'Dinner booking',
            ],
        ]);
    }

    /**
     * Availability for a date‑range (inclusive)
     */
    public function range(Request $request): \Illuminate\Http\JsonResponse
    {
        $start    = $request->query('start');
        $end      = $request->query('end');
        $mealType = $request->query('mealType');

        if (!$start || !$end || !$mealType) {
            return response()->json(['error' => 'Missing parameters (start,end,mealType)'], 400);
        }

        $startDate = Carbon::parse($start);
        $endDate   = Carbon::parse($end);
        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        $availabilities = TableAvailability::whereBetween('date', [
            $startDate->format('Y-m-d'),
            $endDate->format('Y-m-d'),
        ])
            ->where('meal_type', $mealType)
            ->get();

        $availabilityIds = $availabilities->pluck('id');
        $bookings        = Booking::whereIn('table_availability_id', $availabilityIds)->get();

        $results = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');

            if ($current->dayOfWeek === 1 || $current->dayOfWeek === 2) {
                $results[$dateStr] = 'closed';
                $current->addDay();
                continue;
            }

            $rowsForDay = $availabilities->where('date', $dateStr);
            if ($rowsForDay->isEmpty()) {
                $results[$dateStr] = [];
                $current->addDay();
                continue;
            }

            if ($mealType === 'lunch') {
                $firstRoundTimes  = ['13:00','13:15','13:30','13:45','14:00'];
                $secondRoundTimes = ['15:00','15:15','15:30','15:45','16:00'];

                $results[$dateStr] = [
                    'first_round'  => [
                        'time'         => $firstRoundTimes[0],
                        'availability' => $this->computeRoundAvailability($rowsForDay, $firstRoundTimes, $bookings),
                        'note'         => 'Must leave by 15:00',
                    ],
                    'second_round' => [
                        'time'         => $secondRoundTimes[0],
                        'availability' => $this->computeRoundAvailability($rowsForDay, $secondRoundTimes, $bookings),
                        'note'         => 'Must leave by 17:30',
                    ],
                ];
            } else {
                $dinnerTimes = ['20:00','20:15','20:30','20:45','21:00','21:15','21:30','21:45','22:00'];

                $results[$dateStr] = [
                    'dinner_round' => [
                        'time'         => $dinnerTimes[0],
                        'availability' => $this->computeRoundAvailability($rowsForDay, $dinnerTimes, $bookings),
                        'note'         => 'Dinner booking',
                    ],
                ];
            }

            $current->addDay();
        }

        return response()->json($results);
    }

    /**
     * Shared helper
     */
    private function computeRoundAvailability($tableAvailabilities, array $roundTimes, $allBookings = null)
    {
        if ($allBookings === null) {
            $ids          = $tableAvailabilities->pluck('id');
            $allBookings  = Booking::whereIn('table_availability_id', $ids)->get();
        }

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
                    if (in_array($b->reserved_time, $roundTimes)) {
                        return true;
                    }
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
