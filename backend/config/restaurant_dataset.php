<?php
/**
 * Operational dataset used by seeders and runtime code.
 * Edit this file to adapt the software to a new venue – no code changes required.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | How far ahead to pre-generate stock (in days)
    |--------------------------------------------------------------------------
    */
    'seeding_horizon_days' => 90,   // ← updated from 30 → 90

    /*
    |--------------------------------------------------------------------------
    | Table mix
    |--------------------------------------------------------------------------
    | One entry per table size you own:
    |   capacity  → seats per table
    |   available_count → how many such tables exist
    */
    'table_types' => [
        ['capacity' => 2, 'available_count' => 4],
        ['capacity' => 4, 'available_count' => 7],
        ['capacity' => 6, 'available_count' => 7],
    ],

    /*
    |--------------------------------------------------------------------------
    | Weekly service schedule
    |--------------------------------------------------------------------------
    | Keys are Carbon day-of-week integers (0 = Sun … 6 = Sat).
    | Value is an array of meal types served that day.
    | Empty array ⇒ restaurant closed.
    */
    'service_schedule' => [
        0 => ['lunch', 'dinner'], // Sunday
        1 => [],                  // Monday    (closed)
        2 => [],                  // Tuesday   (closed)
        3 => ['lunch'],           // Wednesday
        4 => ['lunch'],           // Thursday
        5 => ['lunch', 'dinner'], // Friday
        6 => ['lunch', 'dinner'], // Saturday
    ],

    /*
    |--------------------------------------------------------------------------
    | Default slot used by the demo-booking seeder
    |--------------------------------------------------------------------------
    */
    'default_reserved_time' => '12:30:00',

    /*
    |--------------------------------------------------------------------------
    | Demo booking (turn off in production)
    |--------------------------------------------------------------------------
    */
    'demo_booking' => [
        'enabled'          => true,
        'full_name'        => 'Test User',
        'phone'            => '+34 600000000',
        'email'            => 'test@example.com',
        'special_requests' => 'No special requests',
        'gdpr_consent'     => true,
        'marketing_opt_in' => false,
    ],
];
