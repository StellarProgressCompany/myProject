<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;

/**
 * Currently only exposes “booking_open_from”
 */
class SystemSettingController extends Controller
{
    /** GET /api/settings/booking-open-from */
    public function show()
    {
        return response()->json([
            'booking_open_from' => SystemSetting::getValue('booking_open_from'),
        ]);
    }

    /** PUT /api/settings/booking-open-from */
    public function update(Request $request)
    {
        $date = $request->validate([
            'booking_open_from' => 'required|date_format:Y-m-d',
        ])['booking_open_from'];

        SystemSetting::setValue('booking_open_from', $date);

        return response()->json(['booking_open_from' => $date]);
    }
}
