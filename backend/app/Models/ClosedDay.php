<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Simple key-only model that stores a date when the whole
 * restaurant is closed (e.g. public holiday).
 */
class ClosedDay extends Model
{
    public $timestamps     = false;
    protected $primaryKey  = 'date';
    public    $incrementing = false;
    protected $keyType     = 'string';

    protected $fillable = ['date'];
}
