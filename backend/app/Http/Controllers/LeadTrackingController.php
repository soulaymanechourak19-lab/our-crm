<?php

namespace App\Http\Controllers;

use App\Services\LeadQualificationService;
use Modules\User\Entities\Lead;
use Modules\User\Entities\LeadTracking;
use Illuminate\Http\Request;

class LeadTrackingController extends Controller
{
    protected LeadQualificationService $qualificationService;

    public function __construct(LeadQualificationService $qualificationService)
    {
        $this->qualificationService = $qualificationService;
    }

    /**
     * Receive tracking data from external website (public endpoint).
     */
    public function track(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string|max:255',
            'pages_viewed' => 'nullable|array',
            'pages_viewed.*' => 'string',
            'time_on_site' => 'nullable|integer|min:0',
            'entry_page' => 'nullable|string|max:500',
            'exit_page' => 'nullable|string|max:500',
            'device_type' => 'nullable|string|max:50',
            'email' => 'nullable|email',
        ]);

        // Add server-side data
        $validated['ip_address'] = $request->ip();
        $validated['user_agent'] = $request->userAgent();

        // Try to link to existing lead by email
        if (!empty($validated['email'])) {
            $lead = Lead::where('email', $validated['email'])->first();
            if ($lead) {
                $validated['lead_id'] = $lead->id;
            }
        }

        $tracking = $this->qualificationService->processTrackingData($validated);

        return response()->json([
            'success' => true,
            'score' => $tracking->score,
            'session_id' => $tracking->session_id,
        ]);
    }

    /**
     * Get tracking history for a lead (authenticated).
     */
    public function getTrackingHistory(Lead $lead)
    {
        $tracking = $lead->trackingEvents()
            ->orderBy('last_activity', 'desc')
            ->paginate(20);

        return response()->json($tracking);
    }

    /**
     * Generate JavaScript tracking snippet for external website.
     */
    public function generateScript(Request $request)
    {
        $apiUrl = config('app.url') . '/api/tracking/event';

        $script = <<<JS
(function() {
    var sessionId = localStorage.getItem('crm_session') || 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('crm_session', sessionId);

    var startTime = Date.now();
    var pagesViewed = [window.location.pathname];

    function sendTracking() {
        var data = {
            session_id: sessionId,
            pages_viewed: pagesViewed,
            time_on_site: Math.floor((Date.now() - startTime) / 1000),
            entry_page: pagesViewed[0],
            exit_page: window.location.pathname,
            device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        };

        navigator.sendBeacon('{$apiUrl}', new Blob([JSON.stringify(data)], {type: 'application/json'}));
    }

    // Track page changes (SPA support)
    var pushState = history.pushState;
    history.pushState = function() {
        pushState.apply(this, arguments);
        pagesViewed.push(window.location.pathname);
    };

    // Send on page leave
    window.addEventListener('beforeunload', sendTracking);

    // Send every 60 seconds
    setInterval(sendTracking, 60000);
})();
JS;

        return response($script)->header('Content-Type', 'application/javascript');
    }
}
