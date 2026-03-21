<?php

namespace App\Services;

use Modules\User\Entities\Lead;
use Modules\User\Entities\LeadTracking;

class LeadQualificationService
{
    /**
     * Process incoming tracking data from external website.
     */
    public function processTrackingData(array $data): LeadTracking
    {
        // Find or create tracking record by session
        $tracking = LeadTracking::updateOrCreate(
            ['session_id' => $data['session_id']],
            [
                'lead_id' => $data['lead_id'] ?? null,
                'pages_viewed' => $data['pages_viewed'] ?? [],
                'time_on_site' => $data['time_on_site'] ?? 0,
                'entry_page' => $data['entry_page'] ?? null,
                'exit_page' => $data['exit_page'] ?? null,
                'device_type' => $data['device_type'] ?? null,
                'location' => $data['location'] ?? null,
                'ip_address' => $data['ip_address'] ?? null,
                'user_agent' => $data['user_agent'] ?? null,
                'last_activity' => now(),
            ]
        );

        // Calculate score
        $tracking->score = $this->calculateScore($tracking);
        $tracking->save();

        // If linked to a lead, auto-update status based on behavior
        if ($tracking->lead_id) {
            $this->updateLeadStatus($tracking);
        }

        return $tracking;
    }

    /**
     * Try to link a tracking session to an existing lead by email.
     */
    public function linkTrackingToLead(string $email, string $sessionId): ?Lead
    {
        $lead = Lead::where('email', $email)->first();
        if ($lead) {
            LeadTracking::where('session_id', $sessionId)
                ->update(['lead_id' => $lead->id]);
        }
        return $lead;
    }

    /**
     * Calculate a score (1-100) based on tracking behavior.
     */
    public function calculateScore(LeadTracking $tracking): int
    {
        $score = 0;

        // Pages viewed (max 30 points)
        $pageCount = is_array($tracking->pages_viewed) ? count($tracking->pages_viewed) : 0;
        $score += min(30, $pageCount * 5);

        // Time on site (max 30 points) - 1 point per 30 seconds
        $score += min(30, intdiv($tracking->time_on_site, 30));

        // Pricing page visit (20 points)
        if ($this->visitedPage($tracking, ['pricing', 'tarifs', 'plans'])) {
            $score += 20;
        }

        // Checkout / contact page visit (20 points)
        if ($this->visitedPage($tracking, ['checkout', 'cart', 'contact', 'demo', 'signup'])) {
            $score += 20;
        }

        return min(100, max(1, $score));
    }

    /**
     * Auto-update lead status based on tracking behavior.
     */
    protected function updateLeadStatus(LeadTracking $tracking): void
    {
        $lead = $tracking->lead;
        if (!$lead || $lead->isConverted() || $lead->isExpired()) return;

        $pages = is_array($tracking->pages_viewed) ? $tracking->pages_viewed : [];
        $pageCount = count($pages);

        // Visited checkout → hot
        if ($this->visitedPage($tracking, ['checkout', 'cart', 'signup', 'demo'])) {
            if (!$lead->isHot()) {
                $lead->update(['status' => 'hot']);
            }
            return;
        }

        // Time on site > 10 minutes → qualified
        if ($tracking->time_on_site > 600 && $lead->isNew() || $lead->isContacted()) {
            $lead->update(['status' => 'qualified']);
            return;
        }

        // Page views > 5 → contacted
        if ($pageCount > 5 && $lead->isNew()) {
            $lead->update(['status' => 'contacted']);
        }
    }

    /**
     * Check if tracking data includes a visit to specific page patterns.
     */
    protected function visitedPage(LeadTracking $tracking, array $keywords): bool
    {
        $pages = is_array($tracking->pages_viewed) ? $tracking->pages_viewed : [];
        foreach ($pages as $page) {
            foreach ($keywords as $keyword) {
                if (stripos($page, $keyword) !== false) {
                    return true;
                }
            }
        }
        return false;
    }
}
