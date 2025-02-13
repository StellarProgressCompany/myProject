<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TableAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * Accepts a booking request.
     * Expected fields:
     *  - date (Y-m-d)
     *  - time (e.g. "14:00:00")
     *  - customer_name (optional)
     *  - guests (number of guests)
     */
    public function store(Request $request)
    {
        // Validate input
        $validatedData = $request->validate([
            'date'          => 'required|date_format:Y-m-d',
            'time'          => 'required', // you might add a regex for "H:i:s"
            'customer_name' => 'nullable|string',
            'guests'        => 'required|integer|min:2',
        ]);

        $date   = $validatedData['date'];
        $time   = $validatedData['time'];
        $guests = $validatedData['guests'];

        // Use our helper method to decide which table(s) to assign.
        $assignment = $this->assignTables($guests, $date);

        if (isset($assignment['error'])) {
            return response()->json(['error' => $assignment['error']], 400);
        }

        // Wrap the booking process in a transaction so that availability decrement and booking(s)
        // creation happen atomically.
        return DB::transaction(function () use ($assignment, $date, $time, $validatedData) {
            $bookings = [];

            foreach ($assignment as $assign) {
                $capacity = $assign['capacity'];

                // Retrieve the daily availability record for this capacity.
                $availability = TableAvailability::where('capacity', $capacity)
                    ->where('date', $date)
                    ->lockForUpdate()
                    ->first();

                if (!$availability || $availability->available_count <= 0) {
                    throw new \Exception("No table available for capacity $capacity");
                }

                // Decrement the available count.
                $availability->available_count -= 1;
                $availability->save();

                // Create a booking record.
                $booking = Booking::create([
                    'table_availability_id' => $availability->id,
                    'date'                  => $date,
                    'time'                  => $time,
                    'customer_name'         => $validatedData['customer_name'] ?? 'Unknown',
                ]);
                $bookings[] = $booking;
            }

            return response()->json([
                'message' => 'Booked successfully!',
                'data'    => $bookings,
            ], 201);
        });
    }

    /**
     * Determines which table(s) to assign based on the number of guests (n) and availability on the given date.
     * Returns an array of assignments like [ ['capacity' => 2, 'extra_chair' => true], ... ]
     * If there is an error, returns: ['error' => 'message']
     */
    private function assignTables($n, $date)
    {
        // Fetch daily availability keyed by capacity
        $availabilities = TableAvailability::where('date', $date)
            ->get()
            ->keyBy('capacity');

        // Helper: returns true if a table of capacity $cap is available
        $isAvailable = function ($cap) use ($availabilities) {
            return isset($availabilities[$cap]) && $availabilities[$cap]->available_count > 0;
        };

        // Minimum table size is 2
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
            // Prefer a 2-person table with an extra chair
            if ($isAvailable(2)) {
                return [['capacity' => 2, 'extra_chair' => true]];
            } elseif ($isAvailable(4)) {
                // Otherwise use a 4-person table
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
                // Combine two 4-person tables
                return [
                    ['capacity' => 4, 'extra_chair' => false],
                    ['capacity' => 4, 'extra_chair' => false],
                ];
            } else {
                return ['error' => "No available table combination for 7 people"];
            }
        }

        // --- For n > 7 or other unmatched, try combining tables with a simple greedy approach
        $assignment = [];
        $remaining = $n;
        $capacities = [6, 4, 2]; // largest first

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

    /**
     * Returns a list of all bookings (with TableAvailability) if needed
     */
    public function index()
    {
        $bookings = Booking::with('tableAvailability')->orderBy('created_at', 'desc')->get();
        return response()->json($bookings);
    }
}
