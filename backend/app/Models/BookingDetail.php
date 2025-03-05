<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'table_availability_id',
        'capacity',
        'extra_chair',
    ];

    /**
     * BookingDetail belongs to a master booking.
     */
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * BookingDetail references a TableAvailability record.
     */
    public function tableAvailability()
    {
        return $this->belongsTo(TableAvailability::class);
    }
}
