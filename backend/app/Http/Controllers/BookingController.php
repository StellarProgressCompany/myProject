<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\TableAvailability;
use App\Models\ClosedDay;
use App\Models\SystemSetting;
use App\Models\MealOverride;                          // ← NEW
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingReminderMail;
use App\Mail\BookingFeedbackMail;
use Carbon\Carbon;
use App\Services\BookingAlgorithmService;

class BookingController extends Controller
{
    /*───────────────────────────────────────────────────────────
      List all bookings (admin)
    ───────────────────────────────────────────────────────────*/
    public function index()
    {
        $bookings = Booking::with('tableAvailability')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    /*───────────────────────────────────────────────────────────
      Create a new booking (public / admin)
    ───────────────────────────────────────────────────────────*/
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'             => 'required|date_format:Y-m-d',
            'meal_type'        => 'required|in:lunch,dinner',
            'reserved_time'    => 'required|date_format:H:i:s',
            'total_adults'     => 'required|integer|min:1',
            'total_kids'       => 'required|integer|min:0',
            'full_name'        => 'required|string',
            'phone'            => 'nullable|string',
            'email'            => 'nullable|email',
            'special_requests' => 'nullable|string',
            'gdpr_consent'     => 'boolean',
            'marketing_opt_in' => 'boolean',
            'long_stay'        => 'boolean',
        ]);

        /* ❌ booking-window not yet open */
        $openFrom = SystemSetting::getValue('booking_open_from');
        if ($openFrom && $validated['date'] < $openFrom) {
            return response()->json([
                'error' => 'Bookings are not yet open for this date.'
            ], 400);
        }

        /* ❌ full-day closure */
        if (ClosedDay::where('date', $validated['date'])->exists()) {
            return response()->json([
                'error' => 'The restaurant is closed on the selected date.'
            ], 400);
        }

        /* ❌ per-meal closure */
        if (
            MealOverride::where('date', $validated['date'])
                ->where("{$validated['meal_type']}_closed", true)
                ->exists()
        ) {
            return response()->json([
                'error' => 'The selected service (lunch/dinner) is closed on that date.'
            ], 400);
        }

        /* run allocation algorithm */
        $partySize = $validated['total_adults'] + $validated['total_kids'];
        $longStay  = $validated['long_stay'] ?? false;

        $algo   = new BookingAlgorithmService();
        $assign = $algo->tryAllocate(
            $validated['date'],
            $validated['meal_type'],
            $validated['reserved_time'],
            $partySize,
            $longStay,
        );

        if (isset($assign['error'])) {
            return response()->json(['error' => $assign['error']], 400);
        }

        /* persist booking & details atomically */
        return DB::transaction(function () use ($validated, $assign, $longStay) {
            $master = null;

            foreach ($assign as $i => $slot) {
                $ta = TableAvailability::where('date',        $validated['date'])
                    ->where('meal_type',   $validated['meal_type'])
                    ->where('capacity',    $slot['capacity'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($i === 0) {
                    $master = Booking::create([
                        'table_availability_id' => $ta->id,
                        'reserved_time'         => $validated['reserved_time'],
                        'total_adults'          => $validated['total_adults'],
                        'total_kids'            => $validated['total_kids'],
                        'full_name'             => $validated['full_name'],
                        'phone'                 => $validated['phone'] ?? null,
                        'email'                 => $validated['email'] ?? null,
                        'special_requests'      => $validated['special_requests'] ?? null,
                        'gdpr_consent'          => $validated['gdpr_consent'] ?? false,
                        'marketing_opt_in'      => $validated['marketing_opt_in'] ?? false,
                        'long_stay'             => $longStay,
                    ]);
                } else {
                    BookingDetail::create([
                        'booking_id'            => $master->id,
                        'table_availability_id' => $ta->id,
                        'capacity'              => $slot['capacity'],
                        'extra_chair'           => (bool) ($slot['extra_chair'] ?? false),
                    ]);
                }
            }

            /* optional e-mails */
            if ($master->email) {
                Mail::to($master->email)->send(new BookingConfirmationMail($master));

                $mealDT = Carbon::parse(
                    "{$master->tableAvailability->date} {$master->reserved_time}"
                );
                $remind = $mealDT->copy()->subHours(24);
                $survey = $mealDT->copy()->addHours(3);

                if ($remind->isFuture()) {
                    Mail::to($master->email)->later($remind, new BookingReminderMail($master));
                } else {
                    Mail::to($master->email)->send(new BookingReminderMail($master));
                }

                if ($survey->isFuture()) {
                    Mail::to($master->email)->later($survey, new BookingFeedbackMail($master));
                }
            }

            return response()->json([
                'message' => 'Booked successfully!',
                'data'    => $master->load(['tableAvailability', 'details']),
            ], 201);
        });
    }

    /*───────────────────────────────────────────────────────────
      Update / delete  (admin)
    ───────────────────────────────────────────────────────────*/
    public function update(Request $request, Booking $booking)
    {
        $booking->update($request->validate([
            'reserved_time' => 'sometimes|date_format:H:i:s',
            'total_adults'  => 'sometimes|integer|min:1',
            'total_kids'    => 'sometimes|integer|min:0',
            'full_name'     => 'sometimes|string',
            'phone'         => 'sometimes|nullable|string',
        ]));

        return response()->json([
            'message' => 'booking updated',
            'data'    => $booking->fresh('tableAvailability'),
        ]);
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->json(['message' => 'booking deleted']);
    }
}
