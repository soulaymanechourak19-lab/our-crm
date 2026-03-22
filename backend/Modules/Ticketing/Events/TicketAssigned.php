<?php

namespace Modules\Ticketing\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Ticketing\Entities\Ticket;

class TicketAssigned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public ?int $previousAgentId = null,
        public ?int $newAgentId = null
    ) {
    }
}
