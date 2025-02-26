<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'time',
        'customer_name',
        'guest_count',
    ];

    /**
     * A master booking has many booking details.
     */
    public function details()
    {
        return $this->hasMany(BookingDetail::class);
    }
}
