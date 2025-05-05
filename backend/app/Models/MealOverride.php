<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Stores per-meal exceptions (close lunch and/or dinner).
 * If both flags are true, the whole day is effectively closed.
 */
class MealOverride extends Model
{
    protected $fillable = [
        'date',
        'lunch_closed',
        'dinner_closed',
        'reason',
    ];
}
