<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    BookingController,
    TableAvailabilityController,
    ClosedDayController,
    OpenDayController,
    SystemSettingController,
    MealOverrideController,             // ← NEW
    MetaController
};

Route::get('/', fn () => response()->json(['message' => 'API root']));
Route::middleware('auth:sanctum')->get('/user', fn (Request $r) => $r->user());

/* Availability */
Route::get('/table-availability',       [TableAvailabilityController::class,'index']);
Route::get('/table-availability-range', [TableAvailabilityController::class,'range']);

/* Bookings CRUD */
Route::get   ('/bookings',           [BookingController::class,'index']);
Route::post  ('/bookings',           [BookingController::class,'store']);
Route::patch ('/bookings/{booking}', [BookingController::class,'update']);
Route::delete('/bookings/{booking}',  [BookingController::class,'destroy']);

/* Calendar overrides & settings */
Route::get ('/closed-days',        [ClosedDayController::class,'index']);
Route::post('/closed-days/toggle', [ClosedDayController::class,'toggle']);
Route::get ('/open-days',          [OpenDayController::class,'index']);
Route::post('/open-days/toggle',   [OpenDayController::class,'toggle']);

/* NEW meal-overrides */
Route::get ('/meal-overrides',         [MealOverrideController::class,'index']);
Route::post('/meal-overrides/toggle',  [MealOverrideController::class,'toggle']);

Route::get ('/settings/booking-open-from', [SystemSettingController::class,'show']);
Route::put ('/settings/booking-open-from', [SystemSettingController::class,'update']);

/* ─── Meta helpers consumed by the SPA ────────────────────────────── */
Route::get('/meta/horizon-days',     [MetaController::class,'horizonDays']);
Route::get('/meta/service-schedule', [MetaController::class,'serviceSchedule']);
Route::get('/meta/rooms', [MetaController::class, 'rooms']);
