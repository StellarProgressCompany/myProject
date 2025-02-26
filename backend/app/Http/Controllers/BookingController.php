<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TableAvailability;
use App\Models\BookingDetail;
use App\Services\TableAssignmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    protected $tableAssignmentService;

    public function __construct(TableAssignmentService $tableAssignmentService)
    {
        $this->tableAssignmentService = $tableAssignmentService;
    }

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
        // Validate input.
        $validatedData = $request->validate([
            'date'          => 'required|date_format:Y-m-d',
            'time'          => 'required', // you might add a regex for "H:i:s"
            'customer_name' => 'nullable|string',
            'guests'        => 'required|integer|min:2',
        ]);

        $date   = $validatedData['date'];
        $time   = $validatedData['time'];
        $guests = $validatedData['guests'];

        // Use our service to decide which table(s) to assign.
        $assignment = $this->tableAssignmentService->assignTables($guests, $date);

        if (isset($assignment['error'])) {
            return response()->json(['error' => $assignment['error']], 400);
        }

        // Wrap the booking process in a transaction with error handling.
        try {
            $result = DB::transaction(function () use ($assignment, $date, $time, $validatedData, $guests) {
                // Create a master booking record.
                $booking = Booking::create([
                    'date'          => $date,
                    'time'          => $time,
                    'customer_name' => $validatedData['customer_name'] ?? 'Unknown',
                    'guest_count'   => $guests,
                ]);

                $bookingDetails = [];

                foreach ($assignment as $assign) {
                    $capacity    = $assign['capacity'];
                    $extraChairs = $assign['extra_chair'] ?? false;

                    // Retrieve the daily availability record for this capacity.
                    $availability = TableAvailability::where('capacity', $capacity)
                        ->where('date', $date)
                        ->lockForUpdate()
                        ->first();

                    if (!$availability || $availability->available_count <= 0) {
                        // Throw an exception if no table is available for the requested capacity.
                        throw new \Exception("No table available for capacity $capacity");
                    }

                    // Decrement the available count.
                    $availability->available_count -= 1;
                    $availability->save();

                    // Create a booking detail record.
                    $bookingDetail = BookingDetail::create([
                        'booking_id'            => $booking->id,
                        'table_availability_id' => $availability->id,
                        'capacity'              => $capacity,
                        'extra_chair'           => $extraChairs,
                    ]);
                    $bookingDetails[] = $bookingDetail;
                }

                return response()->json([
                    'message' => 'Booked successfully!',
                    'booking' => $booking,
                    'details' => $bookingDetails,
                ], 201);
            });
        } catch (\Exception $e) {
            // Return a clear error message if an exception occurs.
            return response()->json(['error' => $e->getMessage()], 400);
        }

        return $result;
    }

    /**
     * Returns a list of all bookings with details.
     */
    public function index()
    {
        $bookings = Booking::with('details.tableAvailability')->orderBy('created_at', 'desc')->get();
        return response()->json($bookings);
    }
}
