<?php

namespace App\Http\Controllers;

use App\Models\ClosedDay;
use Illuminate\Http\Request;

/**
 * AJAX helper for the admin “operational settings” panel.
 */
class ClosedDayController extends Controller
{
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
            $existing->delete();
            $state = 'opened';
        } else {
            ClosedDay::create(['date' => $date]);
            $state = 'closed';
        }

        return response()->json([
            'date'  => $date,
            'state' => $state,
        ]);
    }
}
