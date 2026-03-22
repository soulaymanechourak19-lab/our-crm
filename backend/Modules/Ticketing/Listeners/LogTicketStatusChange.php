<?php

namespace Modules\Ticketing\Listeners;

use Modules\Ticketing\Events\TicketStatusChanged;
use Modules\Ticketing\Entities\TicketHistory;

class LogTicketStatusChange
{
    public function handle(TicketStatusChanged $event): void
    {
        TicketHistory::create([
            'ticket_id'  => $event->ticket->id,
            'changed_by' => $event->changedBy,
            'field'      => 'status',
            'old_value'  => $event->oldStatus,
            'new_value'  => $event->newStatus,
        ]);
    }
}
