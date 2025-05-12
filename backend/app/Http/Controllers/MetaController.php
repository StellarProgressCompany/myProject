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

    /** GET /api/meta/rooms → ordered list for front-end drop-downs */
    public function rooms()
    {
        $rooms = Config::get('restaurant_dataset.rooms', []);

        $payload = collect($rooms)
            ->map(fn ($def, $slug) => [
                'key'      => $slug,
                'label'    => $def['label']      ?? ucfirst($slug),
                'position' => $def['position']   ?? 999,
            ])
            ->values()
            ->sortBy('position')
            ->all();

        return response()->json($payload);
    }
}
