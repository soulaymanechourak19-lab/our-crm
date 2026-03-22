<?php

namespace Modules\Ticketing\Services;

use Modules\Ticketing\Entities\Ticket;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Service de notification par email pour les tickets.
 * Envoie des emails au client lors de la création, changement de statut, etc.
 */
class TicketNotificationService
{
    /**
     * Notifie le client de la création d'un ticket.
     */
    public function notifyTicketCreated(Ticket $ticket): void
    {
        $customer = $ticket->customer;
        if (!$customer || !$customer->email) {
            return;
        }

        try {
            Mail::raw(
                "Bonjour {$customer->name},\n\n" .
                "Votre ticket #{$ticket->ticket_number} a été créé avec succès.\n\n" .
                "Titre : {$ticket->title}\n" .
                "Priorité : {$ticket->priority}\n" .
                "Statut : {$ticket->status}\n\n" .
                "Notre équipe SAV va traiter votre demande dans les plus brefs délais.\n\n" .
                "Cordialement,\nL'équipe Support",
                function ($message) use ($customer, $ticket) {
                    $message->to($customer->email, $customer->name)
                            ->subject("Ticket #{$ticket->ticket_number} créé - {$ticket->title}");
                }
            );
        } catch (\Exception $e) {
            Log::warning("Failed to send ticket creation email: " . $e->getMessage());
        }
    }

    /**
     * Notifie le client d'un changement de statut.
     */
    public function notifyStatusChanged(Ticket $ticket, string $oldStatus, string $newStatus): void
    {
        $customer = $ticket->customer;
        if (!$customer || !$customer->email) {
            return;
        }

        $statusLabels = [
            'open'        => 'Ouvert',
            'in_progress' => 'En cours',
            'resolved'    => 'Résolu',
            'closed'      => 'Fermé',
        ];

        try {
            Mail::raw(
                "Bonjour {$customer->name},\n\n" .
                "Le statut de votre ticket #{$ticket->ticket_number} a été mis à jour.\n\n" .
                "Ancien statut : " . ($statusLabels[$oldStatus] ?? $oldStatus) . "\n" .
                "Nouveau statut : " . ($statusLabels[$newStatus] ?? $newStatus) . "\n\n" .
                ($newStatus === 'resolved' ? "Votre demande a été résolue. Si le problème persiste, n'hésitez pas à nous recontacter.\n\n" : '') .
                "Cordialement,\nL'équipe Support",
                function ($message) use ($customer, $ticket, $statusLabels, $newStatus) {
                    $message->to($customer->email, $customer->name)
                            ->subject("Ticket #{$ticket->ticket_number} - " . ($statusLabels[$newStatus] ?? $newStatus));
                }
            );
        } catch (\Exception $e) {
            Log::warning("Failed to send ticket status email: " . $e->getMessage());
        }
    }

    /**
     * Notifie l'agent de l'assignation d'un ticket.
     */
    public function notifyAgentAssigned(Ticket $ticket): void
    {
        $agent = $ticket->assignedAgent;
        if (!$agent || !$agent->email) {
            return;
        }

        try {
            Mail::raw(
                "Bonjour {$agent->name},\n\n" .
                "Un nouveau ticket vous a été assigné.\n\n" .
                "Ticket : #{$ticket->ticket_number}\n" .
                "Titre : {$ticket->title}\n" .
                "Priorité : {$ticket->priority}\n" .
                "Client : " . ($ticket->customer->name ?? 'Non spécifié') . "\n\n" .
                "Cordialement,\nLe système CRM",
                function ($message) use ($agent, $ticket) {
                    $message->to($agent->email, $agent->name)
                            ->subject("Nouveau ticket assigné - #{$ticket->ticket_number}");
                }
            );
        } catch (\Exception $e) {
            Log::warning("Failed to send ticket assignment email: " . $e->getMessage());
        }
    }
}
