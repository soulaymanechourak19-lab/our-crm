/**
 * ML Service client — calls the Laravel backend ML proxy endpoints.
 * All requests go through Laravel (auth + RFM computation), NOT directly to the ML service.
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const getHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    Accept: 'application/json',
});

// ── Chatbot ──────────────────────────────────────────────────────
export const sendChatMessage = async (message: string) => {
    const res = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message }),
    });
    return res.json();
};

// ── Churn Prediction ─────────────────────────────────────────────
export const predictChurn = async (customerId: number | string) => {
    const res = await fetch(`${API_URL}/ml/churn/${customerId}`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return res.json();
};

// ── Lead Scoring ─────────────────────────────────────────────────
export const scoreLead = async (leadId: number | string) => {
    const res = await fetch(`${API_URL}/ml/lead-score/${leadId}`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return res.json();
};

// ── Segment Client ───────────────────────────────────────────────
export const segmentCustomer = async (customerId: number | string) => {
    const res = await fetch(`${API_URL}/ml/segment/${customerId}`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return res.json();
};

// ── Sentiment ────────────────────────────────────────────────────
export const analyzeSentiment = async (text: string) => {
    const res = await fetch(`${API_URL}/ml/sentiment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text }),
    });
    return res.json();
};

// ── Recommendations ──────────────────────────────────────────────
export const getRecommendations = async (customerId: number | string, topK: number = 5) => {
    const res = await fetch(`${API_URL}/ml/recommend/${customerId}?top_k=${topK}`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return res.json();
};

// ── Train All (admin) ────────────────────────────────────────────
export const trainAllModels = async () => {
    const res = await fetch(`${API_URL}/ml/train`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return res.json();
};

// ── Health Check ─────────────────────────────────────────────────
export const checkMLHealth = async () => {
    try {
        const res = await fetch(`${API_URL}/ml/health`, { headers: getHeaders() });
        return res.json();
    } catch {
        return { status: 'offline' };
    }
};