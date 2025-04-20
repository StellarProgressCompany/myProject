<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TableAvailability;
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
    /**
     * Return all bookings (with tableAvailability).
     */
    public function index()
    {
        $bookings = Booking::with('tableAvailability')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['data' => $bookings]);
    }

    /**
     * Create a new booking using five‑zone algorithm & SAA allocation.
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
            'email'            => 'nullable|email',
            'special_requests' => 'nullable|string',
            'gdpr_consent'     => 'boolean',
            'marketing_opt_in' => 'boolean',
            'long_stay'        => 'boolean',
        ]);

        $date     = $validatedData['date'];
        $mealType = $validatedData['meal_type'];
        $time     = $validatedData['reserved_time'];
        $nAdults  = $validatedData['total_adults'];
        $nKids    = $validatedData['total_kids'];
        $longStay = $validatedData['long_stay'] ?? false;
        $party    = $nAdults + $nKids;

        /* -------- five‑zone allocation ------------ */
        $algo = new BookingAlgorithmService();
        $assignment = $algo->tryAllocate(
            $date, $mealType, $time, $party, $longStay
        );

        if (isset($assignment['error'])) {
            return response()->json(['error' => $assignment['error']], 400);
        }

        /* -------- transaction: decrement stock + create booking rows -------- */
        return DB::transaction(function () use (
            $assignment, $validatedData, $date, $mealType, $time,
            $nAdults, $nKids, $longStay
        ) {

            $bookings = [];

            foreach ($assignment as $slot) {
                $capacity = $slot['capacity'];

                $availability = TableAvailability::where('date', $date)
                    ->where('meal_type', $mealType)
                    ->where('capacity', $capacity)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($availability->available_count <= 0) {
                    throw new \Exception("No table availability for cap $capacity");
                }

                $availability->decrement('available_count');

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
                    'long_stay'             => $longStay,
                ]);

                /* ---- confirmation, reminder & feedback mails ---- */
                if ($booking->email) {
                    Mail::to($booking->email)
                        ->send(new BookingConfirmationMail($booking));

                    $mealDT   = Carbon::parse("{$date} {$time}");
                    $reminder = $mealDT->copy()->subHours(24);
                    if ($reminder->isFuture()) {
                        Mail::to($booking->email)
                            ->later($reminder, new BookingReminderMail($booking));
                    }

                    $feedback = $mealDT->copy()->addHours(3);
                    if ($feedback->isFuture()) {
                        Mail::to($booking->email)
                            ->later($feedback, new BookingFeedbackMail($booking));
                    }
                }

                $bookings[] = $booking;
            }

            return response()->json([
                'message' => 'Booked successfully!',
                'data'    => $bookings,
            ], 201);
        });
    }

    /* -------------------------------------------------------------------- */
    /* NEW: edit a booking – PATCH /api/bookings/{id}                       */
    /* -------------------------------------------------------------------- */
    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'reserved_time' => 'sometimes|date_format:H:i:s',
            'total_adults'  => 'sometimes|integer|min:1',
            'total_kids'    => 'sometimes|integer|min:0',
            'full_name'     => 'sometimes|string',
            'phone'         => 'sometimes|nullable|string',
        ]);

        $booking->update($validated);

        return response()->json([
            'message' => 'Booking updated',
            'data'    => $booking->fresh('tableAvailability'),
        ]);
    }

    /* -------------------------------------------------------------------- */
    /* NEW: delete a booking – DELETE /api/bookings/{id}                    */
    /* -------------------------------------------------------------------- */
    public function destroy(Booking $booking)
    {
        DB::transaction(function () use ($booking) {
            // restore table availability count
            $ta = $booking->tableAvailability;
            if ($ta) {
                $ta->increment('available_count');
            }
            $booking->delete();
        });

        return response()->json(['message' => 'Booking deleted']);
    }
}
