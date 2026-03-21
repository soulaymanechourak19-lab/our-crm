<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\User\Entities\Lead;

class CheckExpiredLeads extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'leads:check-expiration';

    /**
     * The console command description.
     */
    protected $description = 'Marks leads as expired if they have passed their expiration date.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired leads...');

        $expiredCount = Lead::where('expired', false)
            ->whereNotIn('status', ['converted', 'expired'])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update([
                'expired' => true,
                'status' => 'expired'
            ]);

        $this->info("Successfully marked {$expiredCount} leads as expired.");
    }
}
