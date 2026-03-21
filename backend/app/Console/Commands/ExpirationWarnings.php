<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\User\Entities\Lead;
use Illuminate\Support\Facades\Mail;
use App\Mail\LeadExpirationWarningMail;

class ExpirationWarnings extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'leads:expiration-warnings';

    /**
     * The console command description.
     */
    protected $description = 'Sends a warning email to agents for leads expiring within 3 days.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Sending expiration warnings for leads...');

        $warningThreshold = now()->addDays(3);

        $expiringLeads = Lead::with('creator')
            ->where('expired', false)
            ->whereNotIn('status', ['converted', 'expired'])
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [now(), $warningThreshold])
            ->get();

        $emailsSent = 0;

        foreach ($expiringLeads as $lead) {
            $agent = $lead->creator;

            if ($agent && $agent->email) {
                try {
                    Mail::to($agent->email)->send(new LeadExpirationWarningMail($lead));
                    $emailsSent++;
                } catch (\Exception $e) {
                    $this->error("Failed to send warning for Lead ID {$lead->id}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Sent {$emailsSent} expiration warnings to commercial agents.");
    }
}
