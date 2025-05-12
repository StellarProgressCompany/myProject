<?php

namespace App\Services;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Deterministic “smallest-waste” allocation engine.
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
        bool   $longStay = false,
        ?string $room    = null,
    ): array {
        return DB::transaction(function () use (
            $date, $mealType, $reservedTime, $partySize, $longStay, $room
        ) {

            /* lock stock rows (optionally filtered by room) */
            $rows = TableAvailability::where('date', $date)
                ->where('meal_type', $mealType)
                ->when($room, fn ($q) => $q->where('room', $room))
                ->lockForUpdate()
                ->get();

            if ($rows->isEmpty()) {
                return ['error' => 'No tables configured for the selected criteria.'];
            }

            $rowsByCapacity = $rows->groupBy('capacity');

            /* free-table counts within this round ------------------ */
            $roundKey   = $this->detectRound($reservedTime, $mealType);
            $roundTimes = $this->roundTimeWindow($mealType, $roundKey);

            $free = [];
            foreach ($this->capacities as $cap) {
                $capRows = $rowsByCapacity[$cap] ?? collect();
                $totalFree = 0;

                foreach ($capRows as $row) {
                    $booked = Booking::where('table_availability_id', $row->id)
                        ->whereBetween('reserved_time', [$roundTimes['start'], $roundTimes['end']])
                        ->count();

                    if ($roundKey === 'second_round') {
                        $booked += Booking::where('table_availability_id', $row->id)
                            ->where('reserved_time', '<', $roundTimes['start'])
                            ->where('long_stay', true)
                            ->count();
                    }
                    $totalFree += max($row->available_count - $booked, 0);
                }
                $free[$cap] = $totalFree;
            }

            /* greedy packer --------------------------------------- */
            $required = $partySize;
            $assign   = [];

            sort($this->capacities);

            while ($required > 0) {
                $eps     = $this->epsMap[$required] ?? 0;
                $bestCap = null;

                /* ① perfect/ε fit */
                foreach ($this->capacities as $cap) {
                    if ($free[$cap] <= 0) continue;
                    if ($required <= $cap && ($cap - $required) <= $eps) {
                        $bestCap = $cap; break;
                    }
                }

                /* ② otherwise largest ≤ required */
                if ($bestCap === null) {
                    foreach (array_reverse($this->capacities) as $cap) {
                        if ($free[$cap] > 0 && $cap <= $required) {
                            $bestCap = $cap; break;
                        }
                    }
                }

                /* ③ fallback smallest free anywhere */
                if ($bestCap === null) {
                    foreach ($this->capacities as $cap) {
                        if ($free[$cap] > 0) { $bestCap = $cap; break; }
                    }
                }

                if ($bestCap === null) {
                    return ['error' => 'Not enough free tables.'];
                }

                $free[$bestCap]--;
                $required -= min($required, $bestCap);

                $assign[] = [
                    'capacity'    => $bestCap,
                    'room'        => $this->pickRoomForCapacity($rowsByCapacity[$bestCap]),
                    'extra_chair' => ($required > 0 && $required < 1),
                ];
            }

            return $assign;
        });
    }

    /*--------------------------------------------------------------
 | pickRoomForCapacity – first room that still has stock
 *-------------------------------------------------------------*/
    private function pickRoomForCapacity($rows)
    {
        foreach ($rows as $row) {
            $current = Booking::where('table_availability_id', $row->id)->count();
            if ($current < $row->available_count) {
                return $row->room;
            }
        }
        return $rows->first()->room;   // shouldn’t happen
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
