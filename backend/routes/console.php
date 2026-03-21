<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Run Lead expiration checks daily
Schedule::command('leads:check-expiration')->daily();

// Send warnings for leads expiring within 3 days (daily)
Schedule::command('leads:expiration-warnings')->daily();

// Update lead scores from tracking data (hourly)
Schedule::command('leads:update-scores')->hourly();
