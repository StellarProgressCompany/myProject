<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

/**
 * Table-availability endpoints
 */
class TableAvailabilityController extends Controller
{
    /* ------------------------------------------------------------
     | Helpers
     * -----------------------------------------------------------*/
    private function minutesStep(): int
    {
        return (int) Config::get('restaurant.slot_step', 15);
    }

    /** Return an array of HH:MM strings between $start and $end (inclusive) */
    private function buildTimeGrid(string $start, string $end): array
    {
        [$sh, $sm] = array_map('intval', explode(':', $start));
        [$eh, $em] = array_map('intval', explode(':', $end));

        $slots = [];
        for ($m = $sh * 60 + $sm; $m <= $eh * 60 + $em; $m += $this->minutesStep()) {
            $slots[] = sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
        }
        return $slots;
    }

    /** Generic round-availability computer */
    private function computeRoundAvailability($tableAvailabilities, array $roundTimes, $allBookings = null)
    {
        if ($allBookings === null) {
            $ids         = $tableAvailabilities->pluck('id');
            $allBookings = Booking::whereIn('table_availability_id', $ids)->get();
        }

        $caps      = Config::get('restaurant.capacities', [2, 4, 6]);
        $isSecond  = in_array(Config::get('restaurant.rounds.lunch.second_round.start'), $roundTimes, true);

        $availability = [];
        foreach ($caps as $cap) {
            $taRow = $tableAvailabilities->firstWhere('capacity', $cap);

            $seeded = $taRow?->available_count ?? 0;

            $booked = $allBookings
                ->where('table_availability_id', $taRow?->id)
                ->filter(function ($b) use ($roundTimes, $isSecond) {
                    if (in_array($b->reserved_time, $roundTimes, true)) {
                        return true;
                    }
                    // spill-over from 1st → 2nd lunch (if long-stay)
                    return $isSecond && $b->long_stay && $b->reserved_time < $roundTimes[0];
                })
                ->count();

            $availability["$cap"] = max($seeded - $booked, 0);
        }

        return $availability;
    }

    /* ------------------------------------------------------------
     | /api/table-availability?date=YYYY-MM-DD&mealType=lunch|dinner
     * -----------------------------------------------------------*/
    public function index(Request $request)
    {
        $date     = trim($request->query('date', ''));
        $mealType = trim($request->query('mealType', ''));

        if (!$date || !in_array($mealType, ['lunch', 'dinner'], true)) {
            return response()->json([], 400);
        }

        $rows = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get()
            ->keyBy('capacity');

        if ($rows->isEmpty()) {
            return response()->json([]);
        }

        $roundCfg = Config::get("restaurant.rounds.$mealType");
        $payload  = [];

        foreach ($roundCfg as $key => $def) {
            $times             = $this->buildTimeGrid($def['start'], $def['end']);
            $payload[$key]     = [
                'time'         => $def['start'],
                'availability' => $this->computeRoundAvailability($rows, $times),
                'note'         => $def['note'],
            ];
        }

        return response()->json($payload);
    }

    /* ------------------------------------------------------------
     | /api/table-availability-range?start=YYYY-MM-DD&end=YYYY-MM-DD...
     * -----------------------------------------------------------*/
    public function range(Request $request): \Illuminate\Http\JsonResponse
    {
        $start    = $request->query('start');
        $end      = $request->query('end');
        $mealType = $request->query('mealType');

        if (!$start || !$end || !in_array($mealType, ['lunch', 'dinner'], true)) {
            return response()->json(['error' => 'Missing parameters (start,end,mealType)'], 400);
        }

        $startDate = Carbon::parse($start);
        $endDate   = Carbon::parse($end);
        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        $rows = TableAvailability::whereBetween('date', [$start, $end])
            ->where('meal_type', $mealType)
            ->get();

        $availabilityIds = $rows->pluck('id');
        $bookings        = Booking::whereIn('table_availability_id', $availabilityIds)->get();

        $roundCfg = Config::get("restaurant.rounds.$mealType");
        $results  = [];

        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $dateStr = $cursor->format('Y-m-d');

            // Monday & Tuesday → closed
            if (in_array($cursor->dayOfWeek, [1, 2], true)) {
                $results[$dateStr] = 'closed';
                $cursor->addDay();
                continue;
            }

            $dayRows = $rows->where('date', $dateStr);
            if ($dayRows->isEmpty()) {
                $results[$dateStr] = [];
                $cursor->addDay();
                continue;
            }

            $payload = [];
            foreach ($roundCfg as $key => $def) {
                $grid        = $this->buildTimeGrid($def['start'], $def['end']);
                $payload[$key] = [
                    'time'         => $def['start'],
                    'availability' => $this->computeRoundAvailability($dayRows, $grid, $bookings),
                    'note'         => $def['note'],
                ];
            }
            $results[$dateStr] = $payload;

            $cursor->addDay();
        }

        return response()->json($results);
    }
}
