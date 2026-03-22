<?php

namespace Modules\Ticketing\Listeners;

use Modules\Ticketing\Events\TicketAssigned;
use Modules\Ticketing\Services\TicketNotificationService;

class SendTicketAssignedNotification
{
    public function handle(TicketAssigned $event): void
    {
        $service = new TicketNotificationService();
        $service->notifyAgentAssigned($event->ticket);
    }
}
