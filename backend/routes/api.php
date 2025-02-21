<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\BookingController;
use App\Http\Controllers\TableAvailabilityController;

Route::get('/', function () {
    return response()->json(['message' => 'API root']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Simple test endpoint
Route::get('/test', function () {
    return response()->json(['message' => 'Hello from Laravel Backend!']);
});

// Table availability route
Route::get('/table-availability', [TableAvailabilityController::class, 'index']);
Route::get('/table-availability-range', [TableAvailabilityController::class, 'range']);

// Bookings routes
Route::post('/bookings', [BookingController::class, 'store']);
Route::get('/bookings', [BookingController::class, 'index']);
