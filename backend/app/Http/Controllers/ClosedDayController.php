<?php

namespace App\Http\Controllers;

use App\Models\ClosedDay;
use Illuminate\Http\Request;
use App\Services\CalendarService;

class ClosedDayController extends Controller
{
    private CalendarService $calendar;

    public function __construct(CalendarService $calendar)
    {
        $this->calendar = $calendar;
    }

    /** GET /api/closed-days */
    public function index()
    {
        return response()->json(
            ClosedDay::orderBy('date')->pluck('date')
        );
    }

    /** POST /api/closed-days/toggle {date} */
    public function toggle(Request $request)
    {
        $date = $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ])['date'];

        $existing = ClosedDay::find($date);

        if ($existing) {
            // RE-OPEN day: delete flag and regenerate stock
            $existing->delete();
            $this->calendar->ensureStockForDate($date);
            $state = 'opened';
        } else {
            // CLOSE day: create flag (no further action)
            ClosedDay::create(['date' => $date]);
            $state = 'closed';
        }

        return response()->json([
            'date'  => $date,
            'state' => $state,
        ]);
    }
}
