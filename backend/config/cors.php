<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configured for Laravel Sanctum SPA authentication with a React frontend
    | running on localhost:3000. withCredentials must be true on the frontend
    | and supports_credentials must be true here.
    |
    | NOTE: When supports_credentials is true, allowed_origins CANNOT be ['*'].
    | You must list explicit origins.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
