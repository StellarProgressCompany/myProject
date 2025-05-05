<?php

namespace App\Http\Controllers;

use App\Models\MealOverride;
use Illuminate\Http\Request;
use App\Services\CalendarService;

class MealOverrideController extends Controller
{
    private CalendarService $calendar;

    public function __construct(CalendarService $calendar)
    {
        $this->calendar = $calendar;
    }

    /** GET  /api/meal-overrides */
    public function index()
    {
        return response()->json(
            MealOverride::orderBy('date')
                ->get(['date', 'lunch_closed', 'dinner_closed'])
        );
    }

    /** POST /api/meal-overrides/toggle { date, meal_type } */
    public function toggle(Request $request)
    {
        $data = $request->validate([
            'date'      => 'required|date_format:Y-m-d',
            'meal_type' => 'required|in:lunch,dinner',
        ]);

        $row = MealOverride::firstOrCreate(
            ['date' => $data['date']],
            ['lunch_closed' => false, 'dinner_closed' => false]
        );

        if ($data['meal_type'] === 'lunch') {
            $row->lunch_closed = ! $row->lunch_closed;
        } else {
            $row->dinner_closed = ! $row->dinner_closed;
        }

        /* If both are now false we no longer need the row */
        if (! $row->lunch_closed && ! $row->dinner_closed) {
            $row->delete();
            $state = 'removed';
        } else {
            $row->save();
            $state = 'updated';
        }

        /* Make sure stock exists when (re)-opening */
        if ($state === 'updated'
            && (! $row->lunch_closed || ! $row->dinner_closed)) {
            $this->calendar->ensureStockForDate($data['date']);
        }

        return response()->json([
            'date'          => $data['date'],
            'state'         => $state,
            'lunch_closed'  => $row->lunch_closed ?? false,
            'dinner_closed' => $row->dinner_closed ?? false,
        ]);
    }
}
