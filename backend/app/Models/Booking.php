<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_availability_id',
        'date',
        'time',
        'customer_name'
    ];

    public function tableAvailability()
    {
        return $this->belongsTo(TableAvailability::class);
    }

}

