<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use App\Models\ClosedDay;
use App\Models\SystemSetting;
use App\Models\MealOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use App\Services\CalendarService;

/**
 * Table-availability endpoints (single-day / range / multi-room).
 */
class TableAvailabilityController extends Controller
{
    /** Payload string flags */
    private const CLOSED_INDICATOR  = 'closed';
    private const BLOCKED_INDICATOR = 'blocked';

    private CalendarService $calendar;

    public function __construct(CalendarService $calendar)
    {
        $this->calendar = $calendar;
    }

    /* ================================================================
     *  Common helpers
     * ============================================================= */
    private function minutesStep(): int
    {
        return (int) Config::get('restaurant.slot_step', 15);
    }

    private function serviceSchedule(): array
    {
        return Config::get('restaurant_dataset.service_schedule', []);
    }

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

    /**
     * Compute availability for **one room** (or the collection passed in).
     */
    private function computeRoundAvailability(
        $tableAvailabilities,
        array $roundTimes,
        $allBookings = null
    ): array {
        if ($allBookings === null) {
            $ids         = $tableAvailabilities->pluck('id');
            $allBookings = Booking::whereIn('table_availability_id', $ids)->get();
        }

        $caps     = Config::get('restaurant.capacities', [2, 4, 6]);
        $isSecond = in_array(
            Config::get('restaurant.rounds.lunch.second_round.start'),
            $roundTimes,
            true
        );

        $availability = [];
        foreach ($caps as $cap) {
            $taRow  = $tableAvailabilities->firstWhere('capacity', $cap);
            $seeded = $taRow?->available_count ?? 0;

            $booked = $allBookings
                ->where('table_availability_id', $taRow?->id)
                ->filter(function ($b) use ($roundTimes, $isSecond) {
                    if (in_array($b->reserved_time, $roundTimes, true)) {
                        return true;
                    }
                    return $isSecond && $b->long_stay && $b->reserved_time < $roundTimes[0];
                })
                ->count();

            $availability["$cap"] = max($seeded - $booked, 0);
        }

        return $availability;
    }

    /* ================================================================
     *  (A)  ORIGINAL single-room endpoint  (/api/table-availability)
     * ============================================================= */
    public function index(Request $request)
    {
        $date     = trim($request->query('date', ''));
        $mealType = trim($request->query('mealType', ''));
        $room     = trim($request->query('room', ''));

        if (! $date || ! in_array($mealType, ['lunch', 'dinner'], true)) {
            return response()->json([], 400);
        }

        /* seed stock if needed */
        $this->calendar->ensureStockForDate($date);

        /* quick-out indicators (closed / blocked) */
        if (ClosedDay::where('date', $date)->exists()) {
            return response()->json(self::CLOSED_INDICATOR);
        }
        if (
            MealOverride::where('date', $date)
                ->where("{$mealType}_closed", true)
                ->exists()
        ) {
            return response()->json(self::CLOSED_INDICATOR);
        }
        $openFrom = SystemSetting::getValue('booking_open_from');
        if ($openFrom && $date < $openFrom) {
            return response()->json(self::BLOCKED_INDICATOR);
        }

        /* fetch rows (optionally filtered by room) */
        $rows = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->when($room, fn ($q) => $q->where('room', $room))
            ->get()
            ->keyBy('capacity');

        if ($rows->isEmpty()) {
            return response()->json([]);
        }

        $roundCfg = Config::get("restaurant.rounds.$mealType");
        $payload  = [];

        foreach ($roundCfg as $key => $def) {
            $times         = $this->buildTimeGrid($def['start'], $def['end']);
            $payload[$key] = [
                'time'         => $def['start'],
                'availability' => $this->computeRoundAvailability($rows, $times),
                'note'         => $def['note'],
            ];
        }

        return response()->json($payload);
    }


    /* ================================================================
     *  (B)  ORIGINAL multi-day endpoint (/api/table-availability-range)
     * ============================================================= */
    public function range(Request $request)
    {
        $start    = $request->query('start');
        $end      = $request->query('end');
        $mealType = $request->query('mealType');
        $room     = $request->query('room');

        if (! $start || ! $end || ! in_array($mealType, ['lunch', 'dinner'], true)) {
            return response()->json(['error' => 'Missing parameters (start,end,mealType)'], 400);
        }

        $startDate = Carbon::parse($start);
        $endDate   = Carbon::parse($end);
        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        /* seed stock for each date in range */
        for ($d = $startDate->copy(); $d->lte($endDate); $d->addDay()) {
            $this->calendar->ensureStockForDate($d->format('Y-m-d'));
        }

        $rows = TableAvailability::whereBetween('date', [$start, $end])
            ->where('meal_type', $mealType)
            ->when($room, fn ($q) => $q->where('room', $room))
            ->get();

        $availabilityIds = $rows->pluck('id');
        $bookings        = Booking::whereIn('table_availability_id', $availabilityIds)->get();

        $roundCfg = Config::get("restaurant.rounds.$mealType");
        $schedule = $this->serviceSchedule();
        $openFrom = SystemSetting::getValue('booking_open_from');
        $results  = [];

        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $dateStr = $cursor->format('Y-m-d');

            /* full day closed? */
            if (ClosedDay::where('date', $dateStr)->exists()) {
                $results[$dateStr] = self::CLOSED_INDICATOR;
                $cursor->addDay();
                continue;
            }

            /* per-meal closed? */
            if (
                MealOverride::where('date', $dateStr)
                    ->where("{$mealType}_closed", true)
                    ->exists()
            ) {
                $results[$dateStr] = self::CLOSED_INDICATOR;
                $cursor->addDay();
                continue;
            }

            /* booking window not open yet? */
            if ($openFrom && $dateStr < $openFrom) {
                $results[$dateStr] = self::BLOCKED_INDICATOR;
                $cursor->addDay();
                continue;
            }

            /* weekly schedule */
            $dow         = $cursor->dayOfWeek;
            $servedMeals = $schedule[$dow] ?? [];
            if (empty($servedMeals)) {
                $results[$dateStr] = self::CLOSED_INDICATOR;
                $cursor->addDay();
                continue;
            }
            if (! in_array($mealType, $servedMeals, true)) {
                $results[$dateStr] = [];
                $cursor->addDay();
                continue;
            }

            /* build availability */
            $dayRows = $rows->where('date', $dateStr);
            if ($dayRows->isEmpty()) {
                $results[$dateStr] = [];
                $cursor->addDay();
                continue;
            }

            $payload = [];
            foreach ($roundCfg as $key => $def) {
                $grid = $this->buildTimeGrid($def['start'], $def['end']);
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

    /* ================================================================
 *  (C)  NEW  multi-room endpoint  (/api/table-availability-multi)
 *       returns ALL rooms in one payload
 * ============================================================= */
    public function multi(Request $request)
    {
        $date     = trim($request->query('date', ''));
        $mealType = trim($request->query('mealType', ''));

        if (! $date || ! in_array($mealType, ['lunch', 'dinner'], true)) {
            return response()->json(['error' => 'date and mealType required'], 400);
        }

        /* seed stock */
        $this->calendar->ensureStockForDate($date);

        /* same close / block guards as single-room */
        if (ClosedDay::where('date', $date)->exists()) {
            return response()->json(self::CLOSED_INDICATOR);
        }
        if (
            MealOverride::where('date', $date)
                ->where("{$mealType}_closed", true)
                ->exists()
        ) {
            return response()->json(self::CLOSED_INDICATOR);
        }
        $openFrom = SystemSetting::getValue('booking_open_from');
        if ($openFrom && $date < $openFrom) {
            return response()->json(self::BLOCKED_INDICATOR);
        }

        /* pull ALL rooms’ rows */
        $rows = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([]);
        }

        $roundCfg  = Config::get("restaurant.rounds.$mealType");
        $bookings  = Booking::whereIn('table_availability_id', $rows->pluck('id'))->get();
        $grouped   = $rows->groupBy('room');
        $payload   = [];

        foreach ($roundCfg as $roundKey => $def) {
            $payload[$roundKey] = [
                'time'  => $def['start'],
                'note'  => $def['note'],
                'rooms' => [],
            ];
        }

        foreach ($grouped as $roomSlug => $roomRows) {
            foreach ($roundCfg as $roundKey => $def) {
                $grid = $this->buildTimeGrid($def['start'], $def['end']);
                $payload[$roundKey]['rooms'][$roomSlug] =
                    $this->computeRoundAvailability($roomRows, $grid, $bookings);
            }
        }

        return response()->json($payload);
    }
}
