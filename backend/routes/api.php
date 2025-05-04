<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\TableAvailabilityController;
use App\Http\Controllers\ClosedDayController;
use App\Http\Controllers\OpenDayController;
use App\Http\Controllers\SystemSettingController;

/* Root */
Route::get('/', fn()=>response()->json(['message'=>'API root']));

/* Auth stub */
Route::middleware('auth:sanctum')->get('/user', fn(Request $r)=>$r->user());

/* Availability */
Route::get('/table-availability',       [TableAvailabilityController::class,'index']);
Route::get('/table-availability-range', [TableAvailabilityController::class,'range']);

/* Bookings CRUD */
Route::get   ('/bookings',           [BookingController::class,'index']);
Route::post  ('/bookings',           [BookingController::class,'store']);
Route::patch ('/bookings/{booking}', [BookingController::class,'update']);
Route::delete('/bookings/{booking}', [BookingController::class,'destroy']);

/* Operational settings */
Route::get ('/closed-days',        [ClosedDayController::class,'index']);
Route::post('/closed-days/toggle', [ClosedDayController::class,'toggle']);
Route::get ( '/open-days',         [OpenDayController::class, 'index' ] );
Route::post( '/open-days/toggle',  [OpenDayController::class, 'toggle'] );

Route::get ('/settings/booking-open-from', [SystemSettingController::class,'show']);
Route::put ('/settings/booking-open-from', [SystemSettingController::class,'update']);
