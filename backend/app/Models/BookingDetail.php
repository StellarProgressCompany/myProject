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

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function tableAvailability()
    {
        return $this->belongsTo(TableAvailability::class);
    }
}
