<?php
/**
 * Restaurant-level operational parameters
 * (single source of truth for the algorithm).
 *
 */

return [

    /*───────────────────────────────────────────────────────────
     | Seating rounds – start / end for every service window
     *───────────────────────────────────────────────────────────*/
    'rounds' => [
        'lunch' => [
            'first_round'  => [
                'start' => '13:00',
                'end'   => '14:59',
                'note'  => '1st lunch',
            ],
            'second_round' => [
                'start' => '15:00',
                'end'   => '17:30',
                'note'  => '2nd lunch',
            ],
        ],
        'dinner' => [
            'dinner_round' => [
                'start' => '20:00',
                'end'   => '23:30',
                'note'  => 'Dinner',
            ],
        ],
    ],

    /*───────────────────────────────────────────────────────────
     | Party-size slack ϵ   ( capacity ≥ party − ϵ )
     *───────────────────────────────────────────────────────────*/
    'party_to_eps' => [
        1 => 0,
        2 => 3,
        3 => 2,
        4 => 1,
    ],

    /*───────────────────────────────────────────────────────────
     | Slot granularity – minutes between successive booking slots
     *───────────────────────────────────────────────────────────*/
    'slot_step'    => 15,

    /*───────────────────────────────────────────────────────────
     | Physical table sizes available
     *───────────────────────────────────────────────────────────*/
    'capacities'   => [2, 4, 6],

    /*───────────────────────────────────────────────────────────
     | ZONE THRESHOLDS φ1..φ4 (five-zone policy)
     | Hard-coded values; widget will never re-derive these.
     *───────────────────────────────────────────────────────────*/
    'phi' => [
        'phi1' => 0.401,
        'phi2' => 0.547,
        'phi3' => 0.714,
        'phi4' => 0.800,
    ],

    /*───────────────────────────────────────────────────────────
     | Session parameters
     *───────────────────────────────────────────────────────────*/
    'tau'           => 1.75,    // hours incl. cleaning
    'omega'         => 1.50,    // long-stay multiplier
    'p_max'         => 14,      // largest party bookable online
    'beta'          => 0.05,    // walk-in buffer 5%
    'eta_max'       => 0.10,    // total invisible seats ≤10%
    'rebuild_times' => ['11:00', '17:00'], // daily shuffle
];
