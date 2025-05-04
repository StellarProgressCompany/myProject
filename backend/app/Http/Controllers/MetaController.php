<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Config;

/**
 * Read-only meta-data endpoints used by the SPA.
 */
class MetaController extends Controller
{
    /** GET /api/meta/horizon-days → int */
    public function horizonDays()
    {
        // How far ahead the seeders generated stock (defaults to 30 days)
        return response()->json(
            (int) Config::get('restaurant_dataset.seeding_horizon_days', 30)
        );
    }

    /** GET /api/meta/service-schedule → array */
    public function serviceSchedule()
    {
        return response()->json(
            Config::get('restaurant_dataset.service_schedule', [])
        );
    }
}
