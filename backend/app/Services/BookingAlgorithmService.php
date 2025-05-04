<?php

namespace App\Services;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Deterministic “smallest-waste” allocation engine.
 *
 * Signature matches what the controller already expects:
 *   tryAllocate($date, $mealType, $reservedTime, $partySize, $longStay = false): array
 *
 * It returns a list like
 *   [
 *     ['capacity' => 4, 'extra_chair' => false],
 *     ['capacity' => 2, 'extra_chair' => true],
 *   ]
 * or `['error' => '…']` when seating is impossible.
 */
class BookingAlgorithmService
{
    private array $cfg;
    private array $capacities;
    private array $epsMap;

    public function __construct()
    {
        $this->cfg        = Config::get('restaurant');
        $this->capacities = $this->cfg['capacities']     ?? [2, 4, 6];
        $this->epsMap     = $this->cfg['party_to_eps']   ?? [];
    }

    /*───────────────────────────────────────────────────────────
     | Public API – called from BookingController
     *───────────────────────────────────────────────────────────*/
    public function tryAllocate(
        string $date,
        string $mealType,
        string $reservedTime,
        int    $partySize,
        bool   $longStay = false
    ): array {
        return DB::transaction(function () use ($date, $mealType, $reservedTime, $partySize, $longStay) {

            /* ── lock stock rows for this service ───────────────────*/
            $rows = TableAvailability::where('date', $date)
                ->where('meal_type', $mealType)
                ->lockForUpdate()
                ->get()
                ->keyBy('capacity');

            if ($rows->isEmpty()) {
                return ['error' => 'No tables configured for the selected date / service.'];
            }

            /* ── free-table counts for the chosen round ─────────────*/
            $roundKey   = $this->detectRound($reservedTime, $mealType);
            $roundTimes = $this->roundTimeWindow($mealType, $roundKey);

            $free = [];
            foreach ($this->capacities as $cap) {
                $row = $rows->get($cap);
                if (! $row) {
                    $free[$cap] = 0;
                    continue;
                }

                // bookings occupying this capacity in the *same* round
                $booked = Booking::where('table_availability_id', $row->id)
                    ->whereBetween('reserved_time', [$roundTimes['start'], $roundTimes['end']])
                    ->count();

                // spill-over from 1st → 2nd lunch when long-stay
                if ($roundKey === 'second_round') {
                    $booked += Booking::where('table_availability_id', $row->id)
                        ->where('reserved_time', '<', $roundTimes['start'])
                        ->where('long_stay', true)
                        ->count();
                }

                $free[$cap] = max($row->available_count - $booked, 0);
            }

            /* ── greedy “smallest-waste” packer ─────────────────────*/
            $required = $partySize;
            $assign   = [];

            sort($this->capacities);                // 2 → 4 → 6, always

            while ($required > 0) {

                $eps = $this->epsMap[$required] ?? 0;
                $bestCap = null;

                /* ① perfect / ε-fit on the smallest possible table */
                foreach ($this->capacities as $cap) {
                    if ($free[$cap] <= 0) {
                        continue;
                    }
                    if ($required <= $cap && ($cap - $required) <= $eps) {
                        $bestCap = $cap;
                        break;
                    }
                }

                /* ② otherwise: largest table that is ≤ seats-remaining */
                if ($bestCap === null) {
                    foreach (array_reverse($this->capacities) as $cap) {
                        if ($free[$cap] > 0 && $cap <= $required) {
                            $bestCap = $cap;
                            break;
                        }
                    }
                }

                /* ③ still nothing? grab the absolutely smallest free table */
                if ($bestCap === null) {
                    foreach ($this->capacities as $cap) {
                        if ($free[$cap] > 0) {
                            $bestCap = $cap;
                            break;
                        }
                    }
                }

                if ($bestCap === null) {
                    return ['error' => 'Not enough free tables to seat this party.'];
                }

                /* record assignment */
                $extraChair = ($required > $bestCap);        // ε case
                $assign[]   = [
                    'capacity'    => $bestCap,
                    'extra_chair' => $extraChair,
                ];

                /* update counters */
                $free[$bestCap]--;
                $required -= min($required, $bestCap);
            }

            return $assign;
        });
    }

    /*───────────────────────────────────────────────────────────
     | Helpers
     *───────────────────────────────────────────────────────────*/
    public function detectRound(string $hhmmss, string $meal): string
    {
        [$h, $m] = array_map('intval', explode(':', substr($hhmmss, 0, 5)));
        $time    = sprintf('%02d:%02d', $h, $m);
        $rounds  = $this->cfg['rounds'][$meal];

        if ($meal === 'lunch') {
            return ($time < $rounds['second_round']['start'])
                ? 'first_round'
                : 'second_round';
        }

        return 'dinner_round';
    }

    private function roundTimeWindow(string $meal, string $round): array
    {
        $def = $this->cfg['rounds'][$meal][$round] ?? ['start' => '00:00', 'end' => '23:59'];
        return [
            'start' => $def['start'] . ':00',
            'end'   => $def['end']   . ':00',
        ];
    }
}
