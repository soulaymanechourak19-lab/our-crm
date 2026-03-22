<?php

namespace Modules\Ticketing\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\Ticketing\Entities\Ticket;

class TicketCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(public Ticket $ticket)
    {
    }
}
