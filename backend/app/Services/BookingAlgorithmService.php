<?php
/**
 * BookingAlgorithmService
 *
 * Five-zone capacity-control with round-aware utilisation.
 */

namespace App\Services;

use App\Models\TableAvailability;
use App\Models\Booking;
use Illuminate\Support\Facades\Config;

class BookingAlgorithmService
{
    /* ------------------------------------------------------------------
     | Public entry point
     * -----------------------------------------------------------------*/
    public function tryAllocate(
        string $date,
        string $mealType,
        string $time,
        int    $partySize,
        bool   $longStay,
    ): array {

        // online party-size guardrail (now configurable)
        $maxOnline = Config::get('restaurant.online_max_group_size', 14);
        if ($partySize > $maxOnline) {
            return ['error' => "Groups >$maxOnline must book by phone"];
        }

        /* ---------- load static stock for that service ---------- */
        $stockRows = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get();

        if ($stockRows->isEmpty()) {
            return ['error' => 'Restaurant closed for that service'];
        }

        $tableMix = $stockRows->pluck('available_count', 'capacity')->toArray();
        $m        = array_sum($tableMix);                       // tables in session

        /* φ cut-offs */
        $phi = $this->computeCutOffs($m);

        /* overlapping bookings → same round only */
        $bookedRound = $this->overlappingBookings($date, $mealType, $time);

        $seatsNow = $bookedRound->sum(fn ($b) => $b->total_adults + $b->total_kids);
        $seatCap  = collect($tableMix)->map(fn ($cnt, $cap) => $cap * $cnt)->sum();
        $U_after  = ($seatsNow + $partySize) / $seatCap;

        /* zone / ε */
        [$zone, $eps] = $this->zoneAndEps($U_after, $phi);
        if ($zone === 5) {
            return ['error' => 'Online widget closed – please phone the restaurant'];
        }

        /* -------------------- SAA greedy -------------------- */
        $partySizes   = $bookedRound->pluck('total_adults', null)
            ->zip($bookedRound->pluck('total_kids'))
            ->map(fn ($pair) => $pair[0] + $pair[1])
            ->toArray();
        $partySizes[] = $partySize;

        $assignment = $this->greedyAssign($partySizes, $tableMix, $eps);
        if (isset($assignment['error'])) {
            return $assignment;
        }

        return $this->diffAgainstExisting($assignment, $bookedRound);
    }

    /* ------------------------------------------------------------------
     | Helpers
     * -----------------------------------------------------------------*/

    private function detectRound(string $mealType, string $time): string
    {
        $lunchSecond = Config::get('restaurant.rounds.lunch.second_round.start', '15:00');
        $dinnerStart = Config::get('restaurant.rounds.dinner.dinner_round.start', '20:00');

        if ($mealType === 'lunch') {
            return $time < "$lunchSecond:00" ? 'lunch_first' : 'lunch_second';
        }
        return 'dinner';
    }

    /** Only bookings that overlap the candidate’s round */
    private function overlappingBookings(string $date, string $mealType, string $time)
    {
        $lunchSecond = Config::get('restaurant.rounds.lunch.second_round.start', '15:00');
        $dinnerStart = Config::get('restaurant.rounds.dinner.dinner_round.start', '20:00');

        $round = $this->detectRound($mealType, $time);

        return Booking::whereHas('tableAvailability', function ($q) use ($date, $mealType) {
            $q->where('date', $date)->where('meal_type', $mealType);
        })
            ->where(function ($q) use ($round, $lunchSecond, $dinnerStart) {
                if ($round === 'lunch_first') {
                    $q->where('reserved_time', '<', "$lunchSecond:00");
                } elseif ($round === 'lunch_second') {
                    $q->whereBetween('reserved_time', ["$lunchSecond:00", '19:59:59'])
                        ->orWhere(function ($q2) use ($lunchSecond) {
                            $q2->where('reserved_time', '<', "$lunchSecond:00")
                                ->where('long_stay', true); // spill-over
                        });
                } else { // dinner
                    $q->where('reserved_time', '>=', "$dinnerStart:00");
                }
            })
            ->get();
    }

    /* ---- the rest of the file (cut-off maths, Erlang helpers, etc.) is unchanged ---- */
    /*  ▼▼▼ keep everything below exactly as it was ▼▼▼                                     */

    private function computeCutOffs(int $m): array
    {
        $F    = [1 => 0.028, 2 => 0.040, 3 => 0.052];
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

    private function greedyAssign(array $partySizes, array $tableMix, int $eps)
    {
        rsort($partySizes);
        $tables = [];
        foreach ($tableMix as $cap => $cnt) {
            $tables = array_merge($tables, array_fill(0, $cnt, $cap));
        }
        sort($tables); // ascending capacity

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
