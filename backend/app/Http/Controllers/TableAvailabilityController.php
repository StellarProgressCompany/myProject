<?php

namespace App\Http\Controllers;

use App\Models\TableAvailability;
use App\Models\Booking;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use App\Http\Resources\TableAvailabilityResource;

class TableAvailabilityController extends Controller
{
    /**
     * @var AvailabilityService
     */
    protected $availabilityService;

    /**
     * TableAvailabilityController constructor.
     *
     * @param AvailabilityService $availabilityService
     */
    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    /**
     * Show availability for a single day (and a specified meal type).
     *
     * Expected query params:
     *  - date=YYYY-MM-DD
     *  - mealType=lunch|dinner
     *
     * @param  \Illuminate\Http\Request  $request
     * @return TableAvailabilityResource|\Illuminate\Http\JsonResponse
     */
    public function showDailyAvailability(Request $request)
    {
        $date = trim($request->query('date'));
        $mealType = trim($request->query('mealType')); // "lunch" or "dinner"

        // Quick validation.
        if (!$date || !$mealType) {
            return response()->json(['error' => 'Missing date or mealType'], 400);
        }

        // Convert to Carbon for potential checks (like closed days).
        $carbonDate = Carbon::parse($date);

        // Check if restaurant is closed on this day.
        $closedDays = Config::get('meal.closed_days', [1, 2]); // Monday, Tuesday
        if (in_array($carbonDate->dayOfWeek, $closedDays)) {
            return new TableAvailabilityResource(['closed' => true]);
        }

        // Gather the day availability data
        $dayAvailability = $this->generateDayAvailability($carbonDate->format('Y-m-d'), $mealType);

        // Wrap in resource
        return new TableAvailabilityResource($dayAvailability);
    }

    /**
     * Show availability for a range of days (start to end) for a specified meal type.
     *
     * Expected query params:
     *  - start=YYYY-MM-DD
     *  - end=YYYY-MM-DD
     *  - mealType=lunch|dinner
     *
     * @param  \Illuminate\Http\Request  $request
     * @return TableAvailabilityResource|\Illuminate\Http\JsonResponse
     */
    public function showRangeAvailability(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');
        $mealType = $request->query('mealType'); // "lunch" or "dinner"

        // Validate input.
        if (!$start || !$end || !$mealType) {
            return response()->json(['error' => 'Missing parameters (start, end, mealType)'], 400);
        }

        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);
        if ($endDate->lt($startDate)) {
            return response()->json(['error' => 'end must be after start'], 400);
        }

        // Build an associative array keyed by YYYY-MM-DD
        $results = [];
        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            $dateString = $current->format('Y-m-d');

            // Check closed day
            $closedDays = Config::get('meal.closed_days', [1, 2]);
            if (in_array($current->dayOfWeek, $closedDays)) {
                $results[$dateString] = ['closed' => true];
            } else {
                // Compute availability for that day
                $results[$dateString] = $this->generateDayAvailability($dateString, $mealType);
            }

            $current->addDay();
        }

        // Return as a single resource that contains the entire range structure
        return new TableAvailabilityResource($results);
    }

    /**
     * Private helper that computes the availability structure for a single day
     * and a specific meal type (e.g., 'lunch' or 'dinner').
     *
     * @param  string  $dateString
     * @param  string  $mealType
     * @return array
     */
    private function generateDayAvailability(string $dateString, string $mealType): array
    {
        // Load the seeded availability for this date & mealType
        $availabilities = TableAvailability::where('date', $dateString)
            ->where('meal_type', $mealType)
            ->get()
            ->keyBy('capacity');

        // If no records, means no availability (or not scheduled).
        if ($availabilities->isEmpty()) {
            return [];
        }

        // Gather all bookings for that date (not capacity-specific yet,
        // the computeRoundAvailability method handles filtering).
        $bookingsForDay = Booking::where('date', $dateString)->get();

        // Pull from config
        $mealConfig = Config::get("meal.{$mealType}", []);

        // For lunch, we might have first_round & second_round
        // For dinner, we might have main_round, etc.

        // If the config is missing or not properly structured, return empty.
        if (empty($mealConfig)) {
            return [];
        }

        // We'll build the response round-by-round.
        $response = [];

        foreach ($mealConfig as $roundName => $roundData) {
            $times = $roundData['times'] ?? [];
            $note = $roundData['note'] ?? '';

            // Compute availability for this round.
            $roundAvailability = $this->availabilityService->computeRoundAvailability(
                $dateString,
                $times,
                $availabilities,
                $bookingsForDay
            );

            $response[$roundName] = [
                'time'        => $times[0] ?? null, // representative time
                'availability'=> $roundAvailability,
                'note'        => $note,
            ];
        }

        return $response;
    }
}
