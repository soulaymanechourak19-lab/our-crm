<?php

namespace Modules\Ticketing\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Event;
use Modules\Ticketing\Events\TicketCreated;
use Modules\Ticketing\Events\TicketStatusChanged;
use Modules\Ticketing\Events\TicketAssigned;
use Modules\Ticketing\Listeners\SendTicketCreatedNotification;
use Modules\Ticketing\Listeners\SendTicketStatusNotification;
use Modules\Ticketing\Listeners\SendTicketAssignedNotification;
use Modules\Ticketing\Listeners\LogTicketStatusChange;

class TicketingServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../Config/config.php', 'ticketing');
    }

    public function boot()
    {
        // Charger les migrations
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');

        // Charger les routes API
        Route::middleware('api')
            ->prefix('api')
            ->group(__DIR__ . '/../Routes/api.php');

        // Enregistrer les événements et listeners
        Event::listen(TicketCreated::class, SendTicketCreatedNotification::class);
        Event::listen(TicketStatusChanged::class, SendTicketStatusNotification::class);
        Event::listen(TicketStatusChanged::class, LogTicketStatusChange::class);
        Event::listen(TicketAssigned::class, SendTicketAssignedNotification::class);
    }
}
