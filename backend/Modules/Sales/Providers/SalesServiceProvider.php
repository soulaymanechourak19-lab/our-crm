<?php

namespace Modules\Sales\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;


class SalesServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../Config/config.php', 'sales');
    }

    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');

        Route::middleware('api')
            ->prefix('api')
            ->group(__DIR__ . '/../Routes/api.php');
    }
}
