<?php

namespace Modules\Ticketing\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Ticketing\Entities\Ticket;

class TicketStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public string $oldStatus,
        public string $newStatus,
        public ?int $changedBy = null
    ) {
    }
}
