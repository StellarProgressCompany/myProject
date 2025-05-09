<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TableAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'meal_type',
        'capacity',
        'available_count',
        'position',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
