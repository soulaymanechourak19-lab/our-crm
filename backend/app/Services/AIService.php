<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AIService — Client for the ML Microservice.
 *
 * Provides methods to call all ML endpoints:
 * - Churn prediction
 * - Lead scoring
 * - Customer segmentation
 * - Product recommendations
 * - Sentiment analysis
 */
class AIService
{
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = env('ML_SERVICE_URL', 'http://ml-service:8001');
        $this->timeout = 30;
    }

    // ── Health ────────────────────────────────────────────────────────────

    public function health(): array
    {
        return $this->get('/health');
    }

    // ── Training ─────────────────────────────────────────────────────────

    public function trainAll(): array
    {
        return $this->post('/train/all', [], 120);
    }

    public function trainChurn(): array
    {
        return $this->post('/train/churn', [], 60);
    }

    public function trainScoring(): array
    {
        return $this->post('/train/scoring', [], 60);
    }

    public function trainSegmentation(): array
    {
        return $this->post('/train/segmentation', [], 60);
    }

    public function trainRecommender(): array
    {
        return $this->post('/train/recommender', [], 120);
    }

    // ── Churn Prediction ─────────────────────────────────────────────────

    public function predictChurn(int $recency, int $frequency, float $monetary, int $loyaltyScore = 0): array
    {
        return $this->post('/predict/churn', [
            'recency' => $recency,
            'frequency' => $frequency,
            'monetary' => $monetary,
            'loyalty_score' => $loyaltyScore,
        ]);
    }

    public function predictChurnBatch(array $customers): array
    {
        return $this->post('/predict/churn/batch', ['customers' => $customers]);
    }

    // ── Lead Scoring ─────────────────────────────────────────────────────

    public function scoreLead(int $timeSinceCreation, int $statusEncoded, int $hasPhone = 1,
                              int $hasEmail = 1, int $companyNameLength = 10): array
    {
        return $this->post('/score/lead', [
            'time_since_creation' => $timeSinceCreation,
            'status_encoded' => $statusEncoded,
            'has_phone' => $hasPhone,
            'has_email' => $hasEmail,
            'company_name_length' => $companyNameLength,
        ]);
    }

    public function scoreLeadBatch(array $leads): array
    {
        return $this->post('/score/lead/batch', ['leads' => $leads]);
    }

    // ── Customer Segmentation ────────────────────────────────────────────

    public function segmentCustomer(int $recency, int $frequency, float $monetary, int $loyaltyScore = 0): array
    {
        return $this->post('/segment/customer', [
            'recency' => $recency,
            'frequency' => $frequency,
            'monetary' => $monetary,
            'loyalty_score' => $loyaltyScore,
        ]);
    }

    public function segmentAll(array $customers): array
    {
        return $this->post('/segment/all', ['customers' => $customers]);
    }

    // ── Recommendations ──────────────────────────────────────────────────

    public function recommend(int $customerId, int $topK = 5): array
    {
        return $this->get("/recommend/{$customerId}?top_k={$topK}");
    }

    // ── Sentiment Analysis ───────────────────────────────────────────────

    public function analyzeSentiment(string $text): array
    {
        return $this->post('/analyze/sentiment', ['text' => $text]);
    }

    public function analyzeSentimentBatch(array $texts): array
    {
        return $this->post('/analyze/sentiment/batch', ['texts' => $texts]);
    }

    // ── HTTP Helpers ─────────────────────────────────────────────────────

    protected function get(string $endpoint): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get($this->baseUrl . $endpoint);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning("ML Service GET {$endpoint} failed", [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['error' => "ML service returned {$response->status()}"];
        } catch (\Exception $e) {
            Log::error("ML Service GET {$endpoint} exception", ['message' => $e->getMessage()]);
            return ['error' => $e->getMessage()];
        }
    }

    protected function post(string $endpoint, array $data = [], int $timeout = null): array
    {
        try {
            $response = Http::timeout($timeout ?? $this->timeout)
                ->post($this->baseUrl . $endpoint, $data);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning("ML Service POST {$endpoint} failed", [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return ['error' => "ML service returned {$response->status()}"];
        } catch (\Exception $e) {
            Log::error("ML Service POST {$endpoint} exception", ['message' => $e->getMessage()]);
            return ['error' => $e->getMessage()];
        }
    }
}
