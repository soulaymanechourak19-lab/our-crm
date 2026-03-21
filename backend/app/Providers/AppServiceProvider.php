<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\User\Entities\Lead;
use App\Observers\LeadObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Lead::observe(LeadObserver::class);
    }
}
