<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Generic key-value store for runtime-tunable settings
 */
class SystemSetting extends Model
{
    public    $timestamps   = false;
    protected $primaryKey   = 'key';
    public    $incrementing = false;
    protected $keyType      = 'string';

    protected $fillable = ['key','value'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $row = static::find($key);
        return $row?->value ?? $default;
    }

    public static function setValue(string $key, string $value): void
    {
        static::updateOrCreate(['key'=>$key], ['value'=>$value]);
    }
}
