<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\TableAvailability;
use App\Models\BookingDetail;
use App\Services\TableAssignmentService;
use App\Http\Resources\BookingResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * @var TableAssignmentService
     */
    protected $tableAssignmentService;

    /**
     * BookingController constructor.
     *
     * @param  TableAssignmentService  $tableAssignmentService
     */
    public function __construct(TableAssignmentService $tableAssignmentService)
    {
        $this->tableAssignmentService = $tableAssignmentService;
    }

    /**
     * Store (create) a new booking request.
     *
     * Expected fields:
     *  - date (Y-m-d)
     *  - time (e.g. "14:00:00")
     *  - customer_name (optional)
     *  - guests (number of guests, min:2)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validate input.
        $validatedData = $request->validate([
            'date'          => 'required|date_format:Y-m-d',
            'time'          => 'required', // Could add more specific validation (e.g., regex)
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

                    // Retrieve the daily availability record for this capacity (lock for update).
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

                // Return the newly created booking in a standardized format
                return (new BookingResource($booking->load('details.tableAvailability')))
                    ->additional([
                        'message' => 'Booked successfully!',
                        'details' => $bookingDetails, // if you want to keep the raw details
                    ]);
            });

            return $result;
        } catch (\Exception $e) {
            // Return a clear error message if an exception occurs.
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Returns a list of all bookings with their details.
     *
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index()
    {
        $bookings = Booking::with('details.tableAvailability')
            ->orderBy('created_at', 'desc')
            ->get();

        // Return a standardized collection using the BookingResource.
        return BookingResource::collection($bookings);
    }
}
