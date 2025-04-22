<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\TableAvailabilityController;

/* Root */
Route::get('/', fn () => response()->json(['message' => 'API root']));

/* Auth stub */
Route::middleware('auth:sanctum')->get('/user', fn (Request $r) => $r->user());

/* Availability */
Route::get('/table-availability',        [TableAvailabilityController::class, 'index']);
Route::get('/table-availability-range',  [TableAvailabilityController::class, 'range']);

/* CurrentBookings */
Route::get   ('/bookings',          [BookingController::class, 'index']);
Route::post  ('/bookings',          [BookingController::class, 'store']);
Route::patch ('/bookings/{booking}',[BookingController::class, 'update']);
Route::delete('/bookings/{booking}',[BookingController::class, 'destroy']);
