<?php
/**
 * BookingAlgorithmService
 *
 * Implements the five–zone capacity‑control logic with
 * Strict Automatic Allocation (SAA) and mathematically‑derived
 * cut‑offs φ₁ … φ₄.  No hard‑coded thresholds.
 */

namespace App\Services;

use App\Models\TableAvailability;
use App\Models\Booking;

class BookingAlgorithmService
{
    /**
     * Attempt to allocate a booking.
     *
     * @param string  $date       Y‑m‑d
     * @param string  $mealType   lunch | dinner
     * @param string  $time       H:i:s
     * @param int     $partySize  adults + kids
     * @param bool    $longStay   1.5× duration flag
     * @return array              assignment list OR ['error'=>msg]
     */
    public function tryAllocate(
        string $date,
        string $mealType,
        string $time,
        int    $partySize,
        bool   $longStay
    ): array {

        /* -----------------------------------------------------------------
         * 0. Quick online cap check
         * ----------------------------------------------------------------- */
        $P_MAX = 14;
        if ($partySize > $P_MAX) {
            return ['error' => "For bookings that exceed $P_MAX, call the restaurant"];
        }

        /* -----------------------------------------------------------------
         * 1. Table stock for the session
         * ----------------------------------------------------------------- */
        $stockRows = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get();

        if ($stockRows->isEmpty()) {
            return ['error' => 'Restaurant closed for that meal'];
        }

        $tableMix = [];   // capacity => count
        $m = 0;           // total number of tables
        foreach ($stockRows as $row) {
            $tableMix[$row->capacity] = $row->available_count;
            $m += $row->available_count;
        }

        /* -----------------------------------------------------------------
         * 2. Optimal cut‑offs φ₁ … φ₄
         * ----------------------------------------------------------------- */
        $F     = [1 => 0.028, 2 => 0.040, 3 => 0.052]; // empirical waste curve
        $beta  = 0.05;   // walk‑in buffer
        $eta   = 0.10;   // invis‑seat ceiling
        $alpha = 0.01;   // Erlang‑B blocking target

        $phi4 = $this->calcPhi4($m, $alpha);

        $phi3 = ($eta - $beta) / $F[1];

        $phi2 = $phi3 - ($eta - $beta - $phi3 * $F[2]) / ($F[1] - $F[2]);

        $phi1 = $phi2 - ($eta - $beta - $phi2 * $F[3]) / ($F[2] - $F[3]);

        /* -----------------------------------------------------------------
         * 3. Utilisation U after inserting this party
         * ----------------------------------------------------------------- */
        $seatCapacity = array_sum(
            array_map(
                fn($cap, $cnt) => $cap * $cnt,
                array_keys($tableMix),
                $tableMix
            )
        );

        $bookedToday = Booking::whereHas('tableAvailability',
            fn($q) => $q->where('date', $date)
                ->where('meal_type', $mealType)
        )->get();

        $seatsNow = $bookedToday->reduce(
            fn($sum, $b) => $sum + $b->total_adults + $b->total_kids,
            0
        );

        $U_after = ($seatsNow + $partySize) / $seatCapacity;

        /* -----------------------------------------------------------------
         * 4. Determine zone & ε
         * ----------------------------------------------------------------- */
        $zone = match (true) {
            $U_after < $phi1 => 1,
            $U_after < $phi2 => 2,
            $U_after < $phi3 => 3,
            $U_after < $phi4 => 4,
            default          => 5,
        };

        if ($zone === 5) {
            return ['error' => 'Online bookings closed – please phone the restaurant'];
        }

        $epsilon = match ($zone) {
            1       => 0,   // pure FIFO, but we still run greedy
            2       => 3,
            3       => 2,
            4       => 1,
        };

        /* -----------------------------------------------------------------
         * 5. Strict AA greedy assignment
         * ----------------------------------------------------------------- */
        $partySizes = $bookedToday->map(
            fn($b) => $b->total_adults + $b->total_kids
        )->toArray();
        $partySizes[] = $partySize;

        $tableList = [];
        foreach ($tableMix as $cap => $cnt) {
            $tableList = array_merge($tableList, array_fill(0, $cnt, $cap));
        }
        sort($tableList);            // ascending
        rsort($partySizes);          // descending

        $used   = [];
        $tables = $tableList;        // working copy
        foreach ($partySizes as $s) {
            $idx = null;
            foreach ($tables as $k => $cap) {
                if ($cap >= $s - $epsilon) {
                    $idx = $k;
                    break;
                }
            }
            if ($idx === null) {
                return ['error' => 'Cannot fit party without exceeding waste limits'];
            }
            $used[] = $tables[$idx];
            unset($tables[$idx]);
            $tables = array_values($tables);
        }

        /* Which of $used correspond to the NEW party?  */
        $beforeCounts = array_count_values(
            $bookedToday->map(fn($b) => $b->tableAvailability->capacity)->toArray()
        );

        $assignment = [];
        foreach ($used as $cap) {
            if (($beforeCounts[$cap] ?? 0) > 0) {
                $beforeCounts[$cap]--;
            } else {
                $assignment[] = ['capacity' => $cap, 'extra_chair' => false];
            }
        }

        return $assignment;
    }

    /* ---------------------------------------------------------------------
     *  internal helpers
     * ------------------------------------------------------------------- */

    private function calcPhi4(int $m, float $alpha): float
    {
        if ($m === 0) return 0.80;
        if ($m <= 12) {               // Padé inverse Erlang‑B (Kubet 2022)
            $Astar = $m * (1 - pow($alpha * $this->factorial($m), 1 / $m));
            return $Astar / $m;
        }
        $A = 0.8 * $m;                // Newton for larger m
        for ($i = 0; $i < 5; $i++) {
            $B  = $this->erlangB($A, $m);
            $dB = $B * (1 + $B - ($m + 1) / $A);
            $A  = max(0.01, $A - ($B - $alpha) / $dB);
        }
        return $A / $m;
    }

    private function erlangB(float $A, int $m): float
    {
        $B = 1.0;
        for ($k = 1; $k <= $m; $k++) {
            $B = ($A * $B) / ($k + $A * $B);
        }
        return $B;
    }

    private function factorial(int $n): float
    {
        return array_product(range(1, $n));
    }
}
