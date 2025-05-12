<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    BookingController,
    TableAvailabilityController,
    ClosedDayController,
    OpenDayController,
    SystemSettingController,
    MealOverrideController,
    MetaController
};

Route::get('/', fn () => response()->json(['message' => 'API root']));
Route::middleware('auth:sanctum')->get('/user', fn (Request $r) => $r->user());

/* ──────────────  AVAILABILITY  ────────────── */
Route::get('/table-availability',        [TableAvailabilityController::class, 'index']);
Route::get('/table-availability-range',  [TableAvailabilityController::class, 'range']);
Route::get('/table-availability-multi',  [TableAvailabilityController::class, 'multi']);   // ★ NEW ★

/* ──────────────  BOOKINGS CRUD  ────────────── */
Route::get   ('/bookings',            [BookingController::class,'index']);
Route::post  ('/bookings',            [BookingController::class,'store']);
Route::patch ('/bookings/{booking}',  [BookingController::class,'update']);
Route::delete('/bookings/{booking}',  [BookingController::class,'destroy']);

/* ──────────────  CALENDAR OVERRIDES  ───────── */
Route::get ('/closed-days',          [ClosedDayController::class,'index']);
Route::post('/closed-days/toggle',   [ClosedDayController::class,'toggle']);
Route::get ('/open-days',            [OpenDayController::class,'index']);
Route::post('/open-days/toggle',     [OpenDayController::class,'toggle']);
Route::get ('/meal-overrides',       [MealOverrideController::class,'index']);
Route::post('/meal-overrides/toggle',[MealOverrideController::class,'toggle']);

/* ──────────────  SYSTEM SETTINGS  ──────────── */
Route::get ('/settings/booking-open-from', [SystemSettingController::class,'show']);
Route::put ('/settings/booking-open-from', [SystemSettingController::class,'update']);

/* ──────────────  META HELPERS  ─────────────── */
Route::get('/meta/horizon-days',     [MetaController::class,'horizonDays']);
Route::get('/meta/service-schedule', [MetaController::class,'serviceSchedule']);
Route::get('/meta/rooms',            [MetaController::class,'rooms']);
