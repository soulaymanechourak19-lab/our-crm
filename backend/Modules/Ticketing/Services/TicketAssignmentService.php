<?php

namespace Modules\Ticketing\Services;

use Modules\Ticketing\Entities\Ticket;
use Modules\User\Entities\User;
use Illuminate\Support\Facades\DB;

/**
 * Service d'auto-attribution des tickets.
 * Assigne le ticket à l'agent SAV le moins occupé.
 */
class TicketAssignmentService
{
    /**
     * Trouve et assigne l'agent SAV le moins occupé.
     */
    public function assignToLeastBusyAgent(Ticket $ticket): ?User
    {
        // Trouver l'agent SAV avec le moins de tickets ouverts
        $agent = User::where('role', User::ROLE_AGENT_SAV)
            ->select('users.*')
            ->selectSub(
                DB::table('tickets')
                    ->selectRaw('COUNT(*)')
                    ->whereColumn('tickets.assigned_to', 'users.id')
                    ->whereIn('tickets.status', [Ticket::STATUS_OPEN, Ticket::STATUS_IN_PROGRESS]),
                'open_tickets_count'
            )
            ->orderBy('open_tickets_count', 'asc')
            ->first();

        // Si aucun agent SAV, chercher un admin
        if (!$agent) {
            $agent = User::where('role', User::ROLE_ADMIN)->first();
        }

        if ($agent) {
            $ticket->assigned_to = $agent->id;
            $ticket->save();
        }

        return $agent;
    }

    /**
     * Réassigne un ticket à un agent spécifique.
     */
    public function assignToAgent(Ticket $ticket, int $agentId): void
    {
        $ticket->assigned_to = $agentId;
        $ticket->save();
    }
}
