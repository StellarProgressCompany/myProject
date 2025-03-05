<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TableAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;         // For Mail::to(...)
use App\Mail\BookingConfirmationMail;        // For new BookingConfirmationMail(...)
use App\Mail\BookingReminderMail;            // For new BookingReminderMail(...)
use App\Mail\BookingFeedbackMail;            // For new BookingFeedbackMail(...)
use Carbon\Carbon;                           // For Carbon::parse(...)


class BookingController extends Controller
{
    /**
     * Return all bookings (with tableAvailability).
     */
    public function index()
    {
        $bookings = Booking::with('tableAvailability')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($bookings);
    }

    /**
     * Create a new booking (auto-assigning one or more tables).
     * Expected input (example):
     * {
     *   "date": "2025-03-01",
     *   "meal_type": "lunch",
     *   "reserved_time": "13:00",
     *   "total_adults": 2,
     *   "total_kids": 1,
     *   "full_name": "Oriol Calls",
     *   "phone": "+34 620 379 850",
     *   "email": "[email protected]",
     *   "special_requests": "Allergic to nuts",
     *   "gdpr_consent": true,
     *   "marketing_opt_in": false
     * }
     */
    /**
     * Create a new booking (auto-assigning one or more tables),
     * then send 3 emails (immediate confirmation, 24h reminder, and 3h post-meal feedback).
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'date'             => 'required|date_format:Y-m-d',
            'meal_type'        => 'required|in:lunch,dinner',
            'reserved_time'    => 'required|date_format:H:i:s',
            'total_adults'     => 'required|integer|min:1',
            'total_kids'       => 'required|integer|min:0',
            'full_name'        => 'required|string',
            'phone'            => 'nullable|string',
            'email'            => 'nullable|email', // We will rely on having an email to send
            'special_requests' => 'nullable|string',
            'gdpr_consent'     => 'boolean',
            'marketing_opt_in' => 'boolean',
        ]);

        $date      = $validatedData['date'];
        $mealType  = $validatedData['meal_type'];
        $time      = $validatedData['reserved_time'];
        $nAdults   = $validatedData['total_adults'];
        $nKids     = $validatedData['total_kids'];
        $nPeople   = $nAdults + $nKids;

        // Use the algorithm to decide which table(s) to assign for $nPeople
        $assignment = $this->assignTables($nPeople, $date, $mealType);

        if (isset($assignment['error'])) {
            return response()->json(['error' => $assignment['error']], 400);
        }

        // Wrap in a DB transaction so that availability decrement and booking creation is atomic.
        return DB::transaction(function () use ($assignment, $validatedData, $date, $mealType, $time, $nAdults, $nKids) {

            $bookings = [];

            foreach ($assignment as $assigned) {
                $capacity = $assigned['capacity'];

                // Get the specific TableAvailability row (for that date, meal_type, capacity).
                $availability = TableAvailability::where('date', $date)
                    ->where('meal_type', $mealType)
                    ->where('capacity', $capacity)
                    ->lockForUpdate()
                    ->first();

                if (!$availability || $availability->available_count <= 0) {
                    throw new \Exception("No table availability for capacity $capacity on $date ($mealType)");
                }

                // Decrement the available_count
                $availability->available_count -= 1;
                $availability->save();

                // Create the booking row
                $booking = Booking::create([
                    'table_availability_id' => $availability->id,
                    'reserved_time'         => $time,
                    'total_adults'          => $nAdults,
                    'total_kids'            => $nKids,
                    'full_name'             => $validatedData['full_name'],
                    'phone'                 => $validatedData['phone'] ?? null,
                    'email'                 => $validatedData['email'] ?? null,
                    'special_requests'      => $validatedData['special_requests'] ?? null,
                    'gdpr_consent'          => $validatedData['gdpr_consent'] ?? false,
                    'marketing_opt_in'      => $validatedData['marketing_opt_in'] ?? false,
                ]);

                // ---------------------------
                // Send the 3 emails (if email is present)
                // ---------------------------
                if (!empty($booking->email)) {

                    // 1) Immediate Confirmation
                    Mail::to($booking->email)
                        ->send(new BookingConfirmationMail($booking));

                    // Prepare the datetime of the meal
                    $mealDateTime = Carbon::parse("{$date} {$time}");

                    // 2) Reminder 24h before
                    //    We'll only schedule if that time is still in the future
                    $reminderTime = $mealDateTime->copy()->subHours(24);
                    if ($reminderTime->isFuture()) {
                        Mail::to($booking->email)
                            ->later($reminderTime, new BookingReminderMail($booking));
                    }

                    // 3) Feedback 3h after
                    //    We'll only schedule if that time is in the future
                    $feedbackTime = $mealDateTime->copy()->addHours(3);
                    if ($feedbackTime->isFuture()) {
                        Mail::to($booking->email)
                            ->later($feedbackTime, new BookingFeedbackMail($booking));
                    }
                }
                // ---------------------------

                $bookings[] = $booking;
            }

            return response()->json([
                'message' => 'Booked successfully!',
                'data'    => $bookings,
            ], 201);
        });
    }
    /**
     * Decide how to split $n guests across table(s) of capacity 2,4,6 for date+meal_type.
     * Returns array of assignments like [ ['capacity'=>2,'extra_chair'=>true], ... ]
     * OR returns ['error'=>'...'] if not possible.
     */
    private function assignTables($n, $date, $mealType)
    {
        // Fetch daily availability keyed by capacity
        $availabilities = TableAvailability::where('date', $date)
            ->where('meal_type', $mealType)
            ->get()
            ->keyBy('capacity');

        $isAvailable = function($cap) use ($availabilities) {
            return isset($availabilities[$cap]) && $availabilities[$cap]->available_count > 0;
        };

        // Must have at least 2 people
        if ($n < 2) {
            return ['error' => 'Booking must be for at least 2 people'];
        }

        // If there's an exact capacity match
        if (in_array($n, [2,4,6])) {
            if ($isAvailable($n)) {
                return [['capacity' => $n, 'extra_chair' => false]];
            } else {
                return ['error' => "No available table for $n people"];
            }
        }

        // Handle special cases for 3,5,7, etc
        if ($n == 3) {
            if ($isAvailable(2)) {
                return [['capacity' => 2, 'extra_chair' => true]];
            } elseif ($isAvailable(4)) {
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
                // combine two 4-person tables
                return [
                    ['capacity' => 4, 'extra_chair' => false],
                    ['capacity' => 4, 'extra_chair' => false],
                ];
            } else {
                return ['error' => "No available table combination for 7 people"];
            }
        }

        // For n > 7 or others, try a greedy approach
        $assignment = [];
        $remaining = $n;
        $capacities = [6,4,2]; // largest first

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
