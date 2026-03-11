import React from 'react';

interface SentimentDisplayProps {
    sentiment: 'negative' | 'neutral' | 'positive';
    stars: number;
    confidence: number;
    text?: string;
}

/**
 * Displays sentiment analysis results with stars and color coding.
 */
const SentimentDisplay: React.FC<SentimentDisplayProps> = ({ sentiment, stars, confidence, text }) => {
    const config = {
        negative: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', emoji: '😞', label: 'Negative' },
        neutral: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '😐', label: 'Neutral' },
        positive: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '😊', label: 'Positive' },
    };

    const { color, bg, emoji, label } = config[sentiment] || config.neutral;

    return (
        <div style={{
            padding: '14px 18px', borderRadius: '12px',
            backgroundColor: bg, border: `1px solid ${color}22`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{emoji}</span>
                    <span style={{ fontWeight: 600, color, fontSize: '14px' }}>{label}</span>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ fontSize: '14px', opacity: s <= stars ? 1 : 0.2 }}>⭐</span>
                    ))}
                </div>
            </div>

            {text && (
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0', lineHeight: 1.5 }}>
                    "{text.substring(0, 150)}{text.length > 150 ? '...' : ''}"
                </p>
            )}

            <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                Confidence: {(confidence * 100).toFixed(1)}%
            </div>
        </div>
    );
};

export default SentimentDisplay;
