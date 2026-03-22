<?php

namespace Modules\Ticketing\Listeners;

use Modules\Ticketing\Events\TicketCreated;
use Modules\Ticketing\Services\TicketNotificationService;

class SendTicketCreatedNotification
{
    public function handle(TicketCreated $event): void
    {
        $service = new TicketNotificationService();
        $service->notifyTicketCreated($event->ticket);
    }
}
