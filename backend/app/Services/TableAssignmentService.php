<?php

namespace App\Services;

use App\Models\TableAvailability;

class TableAssignmentService
{
    /**
     * Determines which table(s) to assign based on the number of guests (n) and availability on the given date.
     * Returns an array of assignments like [ ['capacity' => 2, 'extra_chair' => true], ... ]
     * If there is an error, returns: ['error' => 'message']
     *
     * @param int    $n    Number of guests.
     * @param string $date Date in "Y-m-d" format.
     * @return array
     */
    public function assignTables($n, $date)
    {
        // Fetch daily availability keyed by capacity.
        $availabilities = TableAvailability::where('date', $date)
            ->get()
            ->keyBy('capacity');

        // Helper: returns true if a table of capacity $cap is available.
        $isAvailable = function ($cap) use ($availabilities) {
            return isset($availabilities[$cap]) && $availabilities[$cap]->available_count > 0;
        };

        // Minimum table size is 2.
        if ($n < 2) {
            return ['error' => 'Booking must be for at least 2 people'];
        }

        // --- Direct assignment if exact match ---
        if (in_array($n, [2, 4, 6])) {
            if ($isAvailable($n)) {
                return [['capacity' => $n, 'extra_chair' => false]];
            } else {
                return ['error' => "No available table for $n people"];
            }
        }

        // --- Handling special cases for 3, 5, 7, etc ---
        if ($n == 3) {
            // Prefer a 2-person table with an extra chair.
            if ($isAvailable(2)) {
                return [['capacity' => 2, 'extra_chair' => true]];
            } elseif ($isAvailable(4)) {
                // Otherwise use a 4-person table.
                return [['capacity' => 4, 'extra_chair' => true]];
            } else {
                return ['error' => "No available table for 3 people"];
            }
        }

        if ($n == 5) {
            if ($isAvailable(4)) {
                return [['capacity' => 4, 'extra_chair' => true]];
            } elseif ($isAvailable(6)) {
                return [['capacity' => 6, 'extra_chair' => true]];
            } else {
                return ['error' => "No available table for 5 people"];
            }
        }

        if ($n == 7) {
            if ($isAvailable(6)) {
                return [['capacity' => 6, 'extra_chair' => true]];
            } elseif ($isAvailable(4) && $availabilities[4]->available_count > 1) {
                // Combine two 4-person tables.
                return [
                    ['capacity' => 4, 'extra_chair' => false],
                    ['capacity' => 4, 'extra_chair' => false],
                ];
            } else {
                return ['error' => "No available table combination for 7 people"];
            }
        }

        // --- For n > 7 or other unmatched, try combining tables with a simple greedy approach ---
        $assignment = [];
        $remaining = $n;
        $capacities = [6, 4, 2]; // Largest first.

        foreach ($capacities as $cap) {
            while ($remaining > 0 && $isAvailable($cap)) {
                if ($cap >= $remaining) {
                    $assignment[] = ['capacity' => $cap, 'extra_chair' => false];
                    $remaining = 0;
                    break;
                } else {
                    $assignment[] = ['capacity' => $cap, 'extra_chair' => false];
                    $remaining -= $cap;
                }
            }
            if ($remaining <= 0) {
                break;
            }
        }

        if ($remaining > 0) {
            return ['error' => 'Not enough tables available to cover the booking'];
        }

        return $assignment;
    }
}
