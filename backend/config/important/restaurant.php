<?php
/**
 * Restaurant-wide configuration.
 *
 * Keep every operational value that you might tweak per venue / season
 * in ONE place instead of hard-coding them throughout the code-base.
 */

return [

    /* -----------------------------------------------------------------
     | Seating & stock
     * -----------------------------------------------------------------*/
    'capacities'            => [2, 4, 6],   // table sizes offered
    'online_max_group_size' => 14,          // cap for self-service widget

    /* minutes between two successive slots when we build a time grid */
    'slot_step'             => 15,

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

    /* -----------------------------------------------------------------
     | Five-zone / SAA algorithm knobs
     * -----------------------------------------------------------------*/
    'algorithm' => [

        /* walk-in buffer β, seat-waste envelope η, service-level α */
        'beta'  => 0.05,
        'eta'   => 0.10,
        'alpha' => 0.01,

        /* Empirical seat-waste curves  F(ε)  for ε = 1,2,3  */
        'waste' => [
            1 => 0.028,
            2 => 0.040,
            3 => 0.052,
        ],

        /* Slack ε by zone (Γ-5) →   zone 1 = Γ = 0 */
        'slack' => [
            1 => 0,
            2 => 3,
            3 => 2,
            4 => 1,
        ],

        /* Hard-override the four φ cut-offs (or leave null to auto-compute) */
        'override_cutoffs' => null, // e.g. [0.40, 0.55, 0.70, 0.80]

        /* Turn-time τ (minutes) and long-stay multiplier ω */
        'tau'   => 105,
        'omega' => 1.5,

        /* Daily re-optimisation instants  – 24 h format HH:MM */
        'rebuild_times' => ['11:00', '17:00'],
    ],
];
