<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpenDay extends Model
{
    public $incrementing = false;
    public $timestamps   = true;
    protected $primaryKey = 'date';
    protected $keyType    = 'string';

    protected $fillable = ['date'];
}
