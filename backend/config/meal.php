<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Meal Timings Configuration
    |--------------------------------------------------------------------------
    |
    | This file centralizes the meal times for lunch and dinner rounds.
    | Update these arrays if the times (or notes) ever change.
    |
    */

    'lunch' => [
        'first_round' => [
            'times' => ['12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00'],
            'note'  => 'Must leave by 15:00',
        ],
        'second_round' => [
            'times' => ['15:00', '15:15', '15:30', '15:45', '16:00'],
            'note'  => 'Must leave by 17:30',
        ],
    ],

    'dinner' => [
        'main_round' => [
            'times' => ['20:00', '20:30', '21:00', '21:30'],
            'note'  => 'Dinner booking',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Restaurant Closed Days
    |--------------------------------------------------------------------------
    |
    | Monday = 1, Tuesday = 2 in Carbon's dayOfWeek. Customize if needed.
    |
    */
    'closed_days' => [1, 2], // Monday, Tuesday

    /*
    |--------------------------------------------------------------------------
    | Table Capacities
    |--------------------------------------------------------------------------
    |
    | Common capacities used in the application. Useful to centralize if these
    | ever change or if you add more capacities.
    |
    */
    'capacities' => [2, 4, 6],
];
