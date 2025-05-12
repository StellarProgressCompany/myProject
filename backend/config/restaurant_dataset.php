<?php
/**
 * Operational dataset – edit to adapt the engine
 * to a concrete venue (no code changes required)
 */

return [

    /*--------------------------------------------------------------
     | How far ahead to pre-generate stock (in days)
     *-------------------------------------------------------------*/
    'seeding_horizon_days' => 90,

    /*--------------------------------------------------------------
     | SPACE / ROOM definition
     | key  – slug (dns-safe, lowercase, no spaces)
     | label- human-readable name (shown in dashboards/widgets)
     | position – sort order in admin UI
     | table_types – capacity mix for THIS room only
     *-------------------------------------------------------------*/
    'rooms' => [

        'interior' => [
            'label'       => 'Interior',
            'position'    => 1,
            'table_types' => [
                ['capacity' => 2, 'available_count' => 4],
                ['capacity' => 4, 'available_count' => 6],
                ['capacity' => 6, 'available_count' => 2],
            ],
        ],

        'terrace' => [
            'label'       => 'Terraza',
            'position'    => 2,
            'table_types' => [
                ['capacity' => 2, 'available_count' => 4],
                ['capacity' => 4, 'available_count' => 4],
            ],
        ],
    ],

    /*--------------------------------------------------------------
     | Weekly service schedule
     | (unchanged – still global, not room-specific)
     *-------------------------------------------------------------*/
    'service_schedule' => [
        0 => ['lunch', 'dinner'], // Sun
        1 => [],                  // Mon
        2 => [],                  // Tue
        3 => ['lunch'],           // Wed
        4 => ['lunch'],           // Thu
        5 => ['lunch', 'dinner'], // Fri
        6 => ['lunch', 'dinner'], // Sat
    ],

    /*--------------------------------------------------------------
     | Demo booking toggle etc. (unchanged)
     *-------------------------------------------------------------*/
    'default_reserved_time' => '12:30:00',
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
