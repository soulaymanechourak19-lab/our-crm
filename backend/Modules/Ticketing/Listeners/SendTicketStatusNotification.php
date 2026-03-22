<?php

namespace Modules\Ticketing\Listeners;

use Modules\Ticketing\Events\TicketStatusChanged;
use Modules\Ticketing\Services\TicketNotificationService;

class SendTicketStatusNotification
{
    public function handle(TicketStatusChanged $event): void
    {
        $service = new TicketNotificationService();
        $service->notifyStatusChanged($event->ticket, $event->oldStatus, $event->newStatus);
    }
}
