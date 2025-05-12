<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\TableAvailability;
use App\Models\ClosedDay;
use App\Models\SystemSetting;
use App\Models\MealOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingReminderMail;
use App\Mail\BookingFeedbackMail;
use Carbon\Carbon;
use App\Services\BookingAlgorithmService;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    /*───────────────────────────────────────────────────────────
      List all bookings (admin)
    ───────────────────────────────────────────────────────────*/
    public function index()
    {
        $bookings = Booking::with('tableAvailability', 'details')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $bookings]);
    }

    /*───────────────────────────────────────────────────────────
      Create a new booking (public / admin)
    ───────────────────────────────────────────────────────────*/
    public function store(Request $request)
    {
        $rooms = array_keys(config('restaurant_dataset.rooms', []));

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
            'room'             => ['nullable', 'string', Rule::in($rooms)],
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
        $room      = $validated['room']      ?? null;

        $algo   = new BookingAlgorithmService();
        $assign = $algo->tryAllocate(
            $validated['date'],
            $validated['meal_type'],
            $validated['reserved_time'],
            $partySize,
            $longStay,
            $room,
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
                    ->where('room',        $slot['room'])
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

            /* optional e-mails (unchanged) */
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
        $data = $request->validate([
            'reserved_time'     => 'sometimes|date_format:H:i:s',
            'total_adults'      => 'sometimes|integer|min:1',
            'total_kids'        => 'sometimes|integer|min:0',
            'full_name'         => 'sometimes|string',
            'phone'             => 'sometimes|nullable|string',
            'email'             => 'sometimes|nullable|email',
            /* manual table move – pick any other capacity that still has stock */
            'capacity_override' => 'sometimes|integer|in:2,4,6',
        ]);

        return DB::transaction(function () use ($data, $booking) {

            $origTA   = $booking->tableAvailability;  // eager-loaded
            $date     = $origTA->date;
            $mealType = $origTA->meal_type;
            $room     = $origTA->room;

            /*────────────────────────────────────────────────
              1) Manual re-assign (no algorithm)
            ────────────────────────────────────────────────*/
            if (isset($data['capacity_override'])) {
                $cap = $data['capacity_override'];
                unset($data['capacity_override']);

                $target = TableAvailability::where('date', $date)
                    ->where('meal_type', $mealType)
                    ->where('room',      $room)
                    ->where('capacity',  $cap)
                    ->lockForUpdate()
                    ->first();

                if (! $target) {
                    return response()->json(['error' => 'No such table capacity on that date.'], 400);
                }

                $occupied = Booking::where('table_availability_id', $target->id)
                    ->where('id', '!=', $booking->id)
                    ->count();

                if ($occupied >= $target->available_count) {
                    return response()->json(['error' => 'No free table of that capacity.'], 400);
                }

                $booking->table_availability_id = $target->id;
            }

            /*────────────────────────────────────────────────
              2) Fields that may require re-allocation
            ────────────────────────────────────────────────*/
            $partyChanged = array_key_exists('total_adults', $data)
                || array_key_exists('total_kids', $data);
            $timeChanged  = array_key_exists('reserved_time', $data);

            if ($partyChanged || $timeChanged) {
                $partySize = ($data['total_adults'] ?? $booking->total_adults)
                    + ($data['total_kids']   ?? $booking->total_kids);
                $timeHHMM  = $data['reserved_time'] ?? $booking->reserved_time;
                $longStay  = $booking->long_stay;

                $algo   = new BookingAlgorithmService();
                $assign = $algo->tryAllocate(
                    $date,
                    $mealType,
                    $timeHHMM,
                    $partySize,
                    $longStay,
                    $room
                );

                if (isset($assign['error'])) {
                    return response()->json(['error' => $assign['error']], 400);
                }

                // Remove existing extra-details
                $booking->details()->delete();

                // Persist new assignment
                $first = true;
                foreach ($assign as $slot) {
                    $ta = TableAvailability::where('date',      $date)
                        ->where('meal_type', $mealType)
                        ->where('room',      $slot['room'])
                        ->where('capacity',  $slot['capacity'])
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($first) {
                        $booking->update([
                            'table_availability_id' => $ta->id,
                            'reserved_time'         => $timeHHMM,
                            'total_adults'          => $data['total_adults'] ?? $booking->total_adults,
                            'total_kids'            => $data['total_kids']   ?? $booking->total_kids,
                            'full_name'             => $data['full_name']    ?? $booking->full_name,
                            'phone'                 => $data['phone']        ?? $booking->phone,
                            'email'                 => $data['email']        ?? $booking->email,
                        ]);
                        $first = false;
                    } else {
                        BookingDetail::create([
                            'booking_id'            => $booking->id,
                            'table_availability_id' => $ta->id,
                            'capacity'              => $slot['capacity'],
                            'extra_chair'           => (bool) ($slot['extra_chair'] ?? false),
                        ]);
                    }
                }
            } else {
                // No re-allocation needed: just update other fields
                $booking->update($data);
            }

            return response()->json([
                'message' => 'booking updated',
                'data'    => $booking->fresh(['tableAvailability', 'details']),
            ]);
        });
    }

    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->json(['message' => 'booking deleted']);
    }
}
