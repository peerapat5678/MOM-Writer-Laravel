<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Backoffice authentication source
    |--------------------------------------------------------------------------
    |
    | The backoffice signs users in against an external user directory. These
    | values describe where that directory lives and which columns to use.
    |
    | - connection: a database connection defined in config/database.php
    | - table:      the table that stores the user records
    | - columns:    the logical -> physical column mapping used by the queries
    |
    */

    'connection' => env('BACKOFFICE_AUTH_CONNECTION', 'UserData'),

    'table' => env('BACKOFFICE_AUTH_TABLE', 'data_log_userv2'),

    'columns' => [
        'employee_code' => 'employee_code',
        'password' => 'pass_jwt',
        'status' => 'status',
    ],

    // Records must carry this status value to be allowed in. Set to null to skip.
    'active_status' => env('BACKOFFICE_AUTH_ACTIVE_STATUS', 'active'),

    /*
    |--------------------------------------------------------------------------
    | Token lifetimes
    |--------------------------------------------------------------------------
    |
    | Stateless, HMAC-signed JWTs are issued on login (signed with APP_KEY).
    | Nothing is stored server-side; each token carries its own expiry. The
    | refresh token defaults to 24 hours.
    |
    */

    'access_ttl' => (int) env('BACKOFFICE_ACCESS_TTL', 60),          // minutes
    'refresh_ttl' => (int) env('BACKOFFICE_REFRESH_TTL', 60 * 24),   // minutes (24h)

];
