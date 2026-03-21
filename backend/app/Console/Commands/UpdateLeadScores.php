<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\User\Entities\Lead;
use App\Services\LeadQualificationService;

class UpdateLeadScores extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'leads:update-scores';

    /**
     * The console command description.
     */
    protected $description = 'Recalculates tracking scores for active leads based on tracking events.';

    /**
     * Execute the console command.
     */
    public function handle(LeadQualificationService $qualificationService)
    {
        $this->info('Recalculating lead tracking scores...');

        // Only update active, non-expired, non-converted leads
        $activeLeads = Lead::where('expired', false)
            ->whereNotIn('status', ['converted', 'expired'])
            ->with(['trackingEvents' => function($query) {
                // Get the latest tracking event for score calculation
                $query->orderBy('last_activity', 'desc')->take(1);
            }])
            ->get();

        $updatedCount = 0;

        foreach ($activeLeads as $lead) {
            $latestTracking = $lead->trackingEvents->first();

            if ($latestTracking) {
                $newScore = $qualificationService->calculateScore($latestTracking);

                if ($latestTracking->score !== $newScore) {
                    $latestTracking->update(['score' => $newScore]);
                    $updatedCount++;
                }

                // If score passes certain thresholds, this might be a good place
                // to emit an event or notify the commercial agent
            }
        }

        $this->info("Updated {$updatedCount} lead scores based on latest tracking data.");
    }
}
