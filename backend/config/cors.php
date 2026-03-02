<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
<<<<<<< HEAD
    | Configured for Laravel Sanctum SPA authentication with a React frontend
    | running on localhost:3000. withCredentials must be true on the frontend
    | and supports_credentials must be true here.
    |
    | NOTE: When supports_credentials is true, allowed_origins CANNOT be ['*'].
    | You must list explicit origins.
=======
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
>>>>>>> feature/crm-module
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

<<<<<<< HEAD
    'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
=======
    'allowed_origins' => ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
>>>>>>> feature/crm-module

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
