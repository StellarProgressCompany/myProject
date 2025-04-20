<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_availability_id',
        'reserved_time',
        'total_adults',
        'total_kids',
        'full_name',
        'phone',
        'email',
        'special_requests',
        'gdpr_consent',
        'marketing_opt_in',
        'long_stay',
    ];

    /* ──────────── relations ──────────── */

    public function tableAvailability()
    {
        return $this->belongsTo(TableAvailability::class);
    }

    /** extra tables when one party spans several tables */
    public function details()
    {
        return $this->hasMany(BookingDetail::class);
    }
}
