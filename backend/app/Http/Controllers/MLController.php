<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * MLController — Proxy between Laravel and the ML microservice.
 * Fetches real customer/lead data from DB, computes features, then calls ML service.
 */
class MLController extends Controller
{
    private string $aiUrl;

    public function __construct()
    {
        $this->aiUrl = env('AI_SERVICE_URL', 'http://ml-service:8001');
    }

    /**
     * Predict churn for a customer.
     * Computes RFM features from interactions, then calls ML service.
     */
    public function predictChurn(Request $request, string $customerId)
    {
        try {
            $customer = DB::table('customers')->where('id', $customerId)->first();
            if (!$customer) {
                return response()->json(['error' => 'Customer not found'], 404);
            }

            // Compute RFM features
            $lastInteraction = DB::table('interactions')
                ->where('customer_id', $customerId)
                ->max('date');

            $recency = $lastInteraction
                ? Carbon::parse($lastInteraction)->diffInDays(now())
                : 999;

            $frequency = DB::table('interactions')
                ->where('customer_id', $customerId)
                ->count();

            $monetary = (float) ($customer->loyalty_score ?? 0);

            // Compute engagement_rate from interactions + feedback
            $transactionCount = DB::table('transactions')->where('client_id', $customerId)->count();
            $feedbackCount = DB::table('feedback')->where('client_id', $customerId)->count();
            $engagementRate = $frequency + $transactionCount + $feedbackCount;

            $response = Http::timeout(10)->post("{$this->aiUrl}/predict/churn", [
                'recency' => $recency,
                'frequency' => $frequency,
                'monetary' => $monetary,
                'loyalty_score' => (int) ($customer->loyalty_score ?? 0),
                'age' => (int) ($customer->age ?? 30),
                'gender' => $customer->gender ?? 'M',
                'segment' => $customer->segment ?? 'Standard',
                'engagement_rate' => $engagementRate,
            ]);

            $data = $response->json();
            $data['customer_id'] = (int) $customerId;
            $data['customer_name'] = $customer->name ?? '';

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => 'ML service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Score a lead (0-100).
     * Computes lead features from DB, then calls ML service.
     */
    public function scoreLead(Request $request, string $leadId)
    {
        try {
            $lead = DB::table('leads')->where('id', $leadId)->first();
            if (!$lead) {
                return response()->json(['error' => 'Lead not found'], 404);
            }

            $statusMap = ['new' => 0, 'contacted' => 1, 'qualified' => 2, 'converted' => 3];
            $timeSinceCreation = Carbon::parse($lead->created_at)->diffInDays(now());

            $response = Http::timeout(10)->post("{$this->aiUrl}/score/lead", [
                'time_since_creation' => $timeSinceCreation,
                'status_encoded' => $statusMap[$lead->status] ?? 0,
                'has_phone' => !empty($lead->phone) ? 1 : 0,
                'has_email' => !empty($lead->email) ? 1 : 0,
                'company_name_length' => strlen($lead->company_name ?? ''),
            ]);

            $data = $response->json();
            $data['lead_id'] = (int) $leadId;
            $data['company_name'] = $lead->company_name ?? '';

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => 'ML service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Get customer segment.
     */
    public function segmentCustomer(Request $request, string $customerId)
    {
        try {
            $customer = DB::table('customers')->where('id', $customerId)->first();
            if (!$customer) {
                return response()->json(['error' => 'Customer not found'], 404);
            }

            $lastInteraction = DB::table('interactions')
                ->where('customer_id', $customerId)
                ->max('date');

            $recency = $lastInteraction
                ? Carbon::parse($lastInteraction)->diffInDays(now())
                : 999;

            $frequency = DB::table('interactions')
                ->where('customer_id', $customerId)
                ->count();

            // Compute engagement_rate from interactions + feedback + transactions
            $transactionCount = DB::table('transactions')->where('client_id', $customerId)->count();
            $feedbackCount = DB::table('feedback')->where('client_id', $customerId)->count();
            $engagementRate = $frequency + $transactionCount + $feedbackCount;

            $response = Http::timeout(10)->post("{$this->aiUrl}/segment/customer", [
                'recency' => $recency,
                'frequency' => $frequency,
                'monetary' => (float) ($customer->loyalty_score ?? 0),
                'loyalty_score' => (int) ($customer->loyalty_score ?? 0),
                'engagement_rate' => $engagementRate,
            ]);

            $data = $response->json();
            $data['customer_id'] = (int) $customerId;

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => 'ML service unavailable: ' . $e->getMessage()], 503);
        }
    }

    /**
     * Analyze sentiment of a text.
     */
    public function analyzeSentiment(Request $request)
    {
        $request->validate(['text' => 'required|string']);
        try {
            $response = Http::timeout(15)->post("{$this->aiUrl}/analyze/sentiment", [
                'text' => $request->text,
            ]);
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'ML service unavailable'], 503);
        }
    }

    /**
     * Get product recommendations for a customer.
     */
    public function recommend(Request $request, string $customerId)
    {
        try {
            $topK = $request->query('top_k', 5);
            $response = Http::timeout(10)->get("{$this->aiUrl}/recommend/{$customerId}", [
                'top_k' => $topK,
            ]);
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'ML service unavailable'], 503);
        }
    }

    /**
     * Train all models — Admin only.
     */
    public function trainAll()
    {
        try {
            $response = Http::timeout(120)->post("{$this->aiUrl}/train/all");
            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Training failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Health check.
     */
    public function health()
    {
        try {
            $response = Http::timeout(5)->get("{$this->aiUrl}/health");
            $data = $response->json();

            if ($data && isset($data['status']) && $data['status'] === 'healthy') {
                // 1. Avg Churn Risk (Normalized against actual loyalty range)
                $avgLoyalty = (float) (DB::table('customers')->avg('loyalty_score') ?? 0);
                $maxLoyalty = (float) (DB::table('customers')->max('loyalty_score') ?? 1);
                // Normalize: 0 loyalty = 100% churn risk, max loyalty = 0% churn risk
                $normalizedAvg = $maxLoyalty > 0 ? ($avgLoyalty / $maxLoyalty) * 100 : 50;
                $avgChurnRisk = round(max(0, min(100, 100 - $normalizedAvg)), 1);

                // 2. Sentiment Score (Percentage of feedback ratings >= 4)
                $totalFeedback = DB::table('feedback')->count();
                $positiveFeedback = DB::table('feedback')->where('rating', '>=', 4)->count();
                $sentimentScore = $totalFeedback > 0 ? round(($positiveFeedback / $totalFeedback) * 100) : 0;

                // 3. Top Segments
                $segments = DB::table('customers')
                    ->select('segment', DB::raw('count(*) as count'))
                    ->whereNotNull('segment')
                    ->groupBy('segment')
                    ->orderByDesc('count')
                    ->limit(4)
                    ->get();
                
                $totalSegmented = $segments->sum('count') ?: 1;
                $topSegments = $segments->map(function ($item) use ($totalSegmented) {
                    return [
                        'name' => ucfirst($item->segment),
                        'percent' => round(($item->count / $totalSegmented) * 100)
                    ];
                });

                if ($topSegments->isEmpty()) {
                     $topSegments = collect([
                         ['name' => 'New', 'percent' => 100]
                     ]);
                }

                // 4. Key Phrases
                $recentReviews = DB::table('feedback')
                    ->whereNotNull('review_text')
                    ->where('rating', '>=', 4)
                    ->orderByDesc('date')
                    ->limit(3)
                    ->pluck('review_text');

                $keyPhrases = $recentReviews->map(function ($text) {
                    $snippet = substr($text, 0, 30);
                    if (strlen($text) > 30) $snippet .= '...';
                    return '"' . $snippet . '"';
                });

                if ($keyPhrases->isEmpty()) {
                    $keyPhrases = ['"great service"', '"fast support"'];
                }

                $data['global_insights'] = [
                    'avgChurnRisk' => $avgChurnRisk,
                    'sentimentScore' => $sentimentScore,
                    'topSegments' => $topSegments,
                    'keyPhrases' => $keyPhrases
                ];
            }

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['status' => 'offline'], 503);
        }
    }
}