<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * All API routes use Bearer token authentication (Sanctum token mode),
     * not cookie/session auth, so CSRF verification is not needed or appropriate.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
        'sanctum/*',
    ];
}
