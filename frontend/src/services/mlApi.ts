
// ── Types ────────────────────────────────────────────────────────────────────

export interface ChurnPrediction {
    probability: number;
    risk_level: 'low' | 'medium' | 'high';
    features: {
        recency: number;
        frequency: number;
        monetary: number;
        loyalty_score: number;
    };
}

export interface LeadScore {
    score: number;
    priority: 'cold' | 'warm' | 'hot';
    features: Record<string, any>;
}

export interface CustomerSegment {
    cluster_id: number;
    segment: string;
    features: Record<string, any>;
}

export interface ProductRecommendation {
    product_id: number;
    score: number;
}

export interface RecommendationResult {
    customer_id: number;
    recommendations: ProductRecommendation[];
    note?: string;
}

export interface SentimentResult {
    sentiment: 'negative' | 'neutral' | 'positive';
    stars: number;
    confidence: number;
    text: string;
}

export interface ModelHealth {
    status: string;
    service: string;
    models: Record<string, boolean | string>;
}

export interface TrainingResult {
    status: string;
    results: Record<string, any>;
}

// ── API Client ───────────────────────────────────────────────────────────────

const ML_BASE = process.env.REACT_APP_ML_URL || 'http://localhost:8001';

const mlApi = {
    // Health
    health: () => fetch(`${ML_BASE}/health`).then(r => r.json()) as Promise<ModelHealth>,

    // Training
    trainAll: () => fetch(`${ML_BASE}/train/all`, { method: 'POST' }).then(r => r.json()) as Promise<TrainingResult>,

    // Churn
    predictChurn: (data: { recency: number; frequency: number; monetary: number; loyalty_score?: number }) =>
        fetch(`${ML_BASE}/predict/churn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()) as Promise<ChurnPrediction>,

    // Lead Scoring
    scoreLead: (data: { time_since_creation: number; status_encoded: number; has_phone?: number; has_email?: number; company_name_length?: number }) =>
        fetch(`${ML_BASE}/score/lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()) as Promise<LeadScore>,

    // Segmentation
    segmentCustomer: (data: { recency: number; frequency: number; monetary: number; loyalty_score?: number }) =>
        fetch(`${ML_BASE}/segment/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()) as Promise<CustomerSegment>,

    // Recommendations
    recommend: (customerId: number, topK: number = 5) =>
        fetch(`${ML_BASE}/recommend/${customerId}?top_k=${topK}`).then(r => r.json()) as Promise<RecommendationResult>,

    // Sentiment
    analyzeSentiment: (text: string) =>
        fetch(`${ML_BASE}/analyze/sentiment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        }).then(r => r.json()) as Promise<SentimentResult>,

    analyzeSentimentBatch: (texts: string[]) =>
        fetch(`${ML_BASE}/analyze/sentiment/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts }),
        }).then(r => r.json()) as Promise<{ results: SentimentResult[] }>,
};

export default mlApi;
