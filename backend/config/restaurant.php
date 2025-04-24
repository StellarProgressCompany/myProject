<?php
/**
 * Restaurant-wide configuration.
 *
 * Keep every operational value that you might tweak per venue / season
 * in ONE place instead of hard-coding them throughout the codebase.
 */

return [

    /* -----------------------------------------------------------------
     | Seating & stock
     * -----------------------------------------------------------------*/
    'capacities'              => [2, 4, 6],   // table sizes offered
    'online_max_group_size'   => 14,          // cap for self-service widget

    /* minutes between two successive slots when we build a time grid */
    'slot_step'               => 15,

    /* -----------------------------------------------------------------
     | Service rounds
     |   └──  format HH:MM (24 h)
     * -----------------------------------------------------------------*/
    'rounds' => [

        'lunch' => [
            'first_round' => [
                'start'      => '13:00',
                'end'        => '14:00',
                'must_leave' => '15:00',
                'note'       => 'Must leave by 15:00',
            ],
            'second_round' => [
                'start'      => '15:00',
                'end'        => '16:00',
                'must_leave' => '17:30',
                'note'       => 'Must leave by 17:30',
            ],
        ],

        'dinner' => [
            'dinner_round' => [
                'start'      => '20:00',
                'end'        => '22:00',
                'must_leave' => null,
                'note'       => 'Dinner booking',
            ],
        ],
    ],
];
