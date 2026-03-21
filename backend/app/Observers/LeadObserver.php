<?php

namespace App\Observers;

use Modules\User\Entities\Lead;

class LeadObserver
{
    /**
     * Handle the Lead "creating" event.
     * Auto-set expiration date based on source.
     */
    public function creating(Lead $lead): void
    {
        if (!$lead->source) {
            $lead->source = 'manual';
        }

        if (!$lead->expires_at) {
            $days = Lead::getExpirationDays($lead->source);
            $lead->expires_at = now()->addDays($days);
        }
    }

    /**
     * Handle the Lead "updating" event.
     */
    public function updating(Lead $lead): void
    {
        // If source changed and no manual expiration was set, recalculate
        if ($lead->isDirty('source') && !$lead->isDirty('expires_at')) {
            $days = Lead::getExpirationDays($lead->source);
            $lead->expires_at = now()->addDays($days);
        }
    }
}
