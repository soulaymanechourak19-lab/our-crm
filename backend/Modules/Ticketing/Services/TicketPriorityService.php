<?php

namespace Modules\Ticketing\Services;

use Modules\Ticketing\Entities\Ticket;

/**
 * Service de priorisation automatique des tickets.
 * Détecte les mots-clés d'urgence dans la description.
 */
class TicketPriorityService
{
    /**
     * Détermine la priorité automatiquement basée sur la description.
     */
    public function detectPriority(string $description, ?string $sentimentUrgency = null): string
    {
        $text = mb_strtolower($description);

        // Si le chatbot a détecté un niveau d'urgence (ML/DL)
        if ($sentimentUrgency) {
            $urgency = mb_strtolower($sentimentUrgency);
            if (in_array($urgency, ['critical', 'critique', 'très urgent'])) {
                return Ticket::PRIORITY_CRITICAL;
            }
            if (in_array($urgency, ['high', 'urgent', 'haute', 'élevée'])) {
                return Ticket::PRIORITY_HIGH;
            }
            if (in_array($urgency, ['low', 'basse', 'faible'])) {
                return Ticket::PRIORITY_LOW;
            }
        }

        // Mots-clés de priorité critique
        $criticalKeywords = ['panne totale', 'système down', 'hors service', 'crash', 'data loss'];
        foreach ($criticalKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return Ticket::PRIORITY_CRITICAL;
            }
        }

        // Mots-clés de priorité haute (configurable)
        $highKeywords = config('ticketing.high_priority_keywords', [
            'urgent', 'critique', 'critical', 'emergency', 'urgence', 'panne', 'bloqué', 'bloquant'
        ]);
        foreach ($highKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return Ticket::PRIORITY_HIGH;
            }
        }

        return Ticket::PRIORITY_MEDIUM;
    }
}
