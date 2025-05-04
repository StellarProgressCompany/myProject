<?php

namespace App\Http\Controllers;

use App\Models\OpenDay;
use Illuminate\Http\Request;
use App\Services\CalendarService;

class OpenDayController extends Controller
{
    private CalendarService $calendar;

    public function __construct(CalendarService $calendar)
    {
        $this->calendar = $calendar;
    }

    /** GET /api/open-days */
    public function index()
    {
        return response()->json(
            OpenDay::orderBy('date')->pluck('date')
        );
    }

    /** POST /api/open-days/toggle  { date: YYYY-MM-DD } */
    public function toggle(Request $request)
    {
        $date = $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ])['date'];

        $existing = OpenDay::find($date);

        if ($existing) {
            // remove open-exception
            $existing->delete();
            $state = 'removed';
        } else {
            // add open-exception and make sure stock exists
            OpenDay::create(['date' => $date]);
            $this->calendar->ensureStockForDate($date);
            $state = 'added';
        }

        return response()->json(compact('date', 'state'));
    }
}
