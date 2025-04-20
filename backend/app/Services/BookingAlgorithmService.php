<?php
/**
 * BookingAlgorithmService
 *
 * Five‑zone capacity‑control with round‑aware utilisation.
 */

namespace App\Services;

use App\Models\TableAvailability;
use App\Models\Booking;

class BookingAlgorithmService
{
    /* ─────────────────────────────────────────────── */
    /* public entry                                    */
    /* ─────────────────────────────────────────────── */
    public function tryAllocate(
        string $date,
        string $mealType,
        string $time,
        int    $partySize,
        bool   $longStay
    ): array {

        /* online cap */
        if ($partySize > 14) {
            return ['error' => 'Groups >14 must book by phone'];
        }

        /* load table stock */
        $stockRows = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get();

        if ($stockRows->isEmpty()) {
            return ['error' => 'Restaurant closed for that service'];
        }

        $tableMix = $stockRows->pluck('available_count', 'capacity')->toArray();
        $m        = array_sum($tableMix);          // # tables in that session

        /* φ‑cut‑offs */
        $phi = $this->computeCutOffs($m);

        /* bookings that clash with *this* round only  */
        $bookedRound = $this->overlappingBookings($date, $mealType, $time);

        $seatsNow = $bookedRound->sum(fn ($b) => $b->total_adults + $b->total_kids);
        $seatCap  = collect($tableMix)->map(fn ($cnt, $cap) => $cap * $cnt)->sum();
        $U_after  = ($seatsNow + $partySize) / $seatCap;

        /* zone / ε */
        [$zone, $eps] = $this->zoneAndEps($U_after, $phi);
        if ($zone === 5) {
            return ['error' => 'Online widget closed – please phone the restaurant'];
        }

        /* run SAA greedy */
        $partySizes = $bookedRound->map(fn ($b) => $b->total_adults + $b->total_kids)->toArray();
        $partySizes[] = $partySize;

        $assignment = $this->greedyAssign($partySizes, $tableMix, $eps);
        if (isset($assignment['error'])) {
            return $assignment;
        }

        return $this->diffAgainstExisting($assignment, $bookedRound);
    }

    /* ─────────────────────────────────────────────── */
    /* helpers                                         */
    /* ─────────────────────────────────────────────── */

    private function detectRound(string $mealType, string $time): string
    {
        if ($mealType === 'lunch') {
            return $time < '15:00:00' ? 'lunch_first' : 'lunch_second';
        }
        return 'dinner';
    }

    /** only bookings that overlap the candidate’s round */
    private function overlappingBookings(string $date, string $mealType, string $time)
    {
        $round = $this->detectRound($mealType, $time);

        return Booking::whereHas('tableAvailability', function ($q) use ($date, $mealType) {
            $q->where('date', $date)->where('meal_type', $mealType);
        })
            ->where(function ($q) use ($round) {
                if ($round === 'lunch_first') {
                    $q->where('reserved_time', '<', '15:00:00');
                } elseif ($round === 'lunch_second') {
                    $q->whereBetween('reserved_time', ['15:00:00', '19:59:59'])
                        ->orWhere(function ($q2) {
                            $q2->where('reserved_time', '<', '15:00:00')
                                ->where('long_stay', true);          // spill‑over
                        });
                } else { // dinner
                    $q->where('reserved_time', '>=', '20:00:00');
                }
            })
            ->get();
    }

    private function computeCutOffs(int $m): array
    {
        /* waste curve */
        $F = [1 => 0.028, 2 => 0.040, 3 => 0.052];
        $beta = 0.05;
        $eta  = 0.10;
        $alpha= 0.01;

        $phi4 = $this->calcPhi4($m, $alpha);
        $phi3 = ($eta - $beta) / $F[1];
        $phi2 = $phi3 - ($eta - $beta - $phi3 * $F[2]) / ($F[1] - $F[2]);
        $phi1 = $phi2 - ($eta - $beta - $phi2 * $F[3]) / ($F[2] - $F[3]);

        return [$phi1, $phi2, $phi3, $phi4];
    }

    private function zoneAndEps(float $U, array $phi): array
    {
        [$p1, $p2, $p3, $p4] = $phi;
        if ($U < $p1) return [1, 0];
        if ($U < $p2) return [2, 3];
        if ($U < $p3) return [3, 2];
        if ($U < $p4) return [4, 1];
        return [5, null];
    }

    /** descending‑first‑fit greedy */
    private function greedyAssign(array $partySizes, array $tableMix, int $eps)
    {
        rsort($partySizes);
        $tables = [];
        foreach ($tableMix as $cap => $cnt) {
            $tables = array_merge($tables, array_fill(0, $cnt, $cap));
        }
        sort($tables);                        // ascending capacity

        $used = [];
        foreach ($partySizes as $s) {
            $idx = null;
            foreach ($tables as $k => $cap) {
                if ($cap >= $s - $eps) {
                    $idx = $k;
                    break;
                }
            }
            if ($idx === null) {
                return ['error' => 'Cannot fit party without breaching limits'];
            }
            $used[] = $tables[$idx];
            unset($tables[$idx]);
            $tables = array_values($tables);
        }
        return $used;
    }

    /** keep only the tables newly reserved by the candidate */
    private function diffAgainstExisting(array $usedCaps, $bookedRound): array
    {
        $prevCounts = array_count_values(
            $bookedRound->map(fn ($b) => $b->tableAvailability->capacity)->toArray()
        );

        $new = [];
        foreach ($usedCaps as $cap) {
            if (($prevCounts[$cap] ?? 0) > 0) {
                $prevCounts[$cap]--;
            } else {
                $new[] = ['capacity' => $cap, 'extra_chair' => false];
            }
        }
        return $new;
    }

    /* ───── Erlang helpers (unchanged) ──── */
    private function calcPhi4(int $m, float $alpha): float
    {
        if ($m === 0) return 0.80;
        if ($m <= 12) {
            $Astar = $m * (1 - pow($alpha * $this->factorial($m), 1 / $m));
            return $Astar / $m;
        }
        $A = 0.8 * $m;
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
