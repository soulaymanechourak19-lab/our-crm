/**
 * MLDashboard — AI/ML status panel for the Dashboard page.
 * Shows model health, metrics, and train button.
 */
import { useEffect, useState } from 'react';
import { checkMLHealth, trainAllModels } from '../../services/mlService';

export default function MLDashboard() {
    const [health, setHealth] = useState<'online' | 'offline' | 'loading'>('loading');
    const [models, setModels] = useState<Record<string, boolean | string>>({});
    const [training, setTraining] = useState(false);
    const [trainResult, setTrainResult] = useState<any>(null);

    // Mock global stats for demonstration of ML insights
    const globalInsights = {
        avgChurnRisk: 14.5, // 14.5% global churn risk
        sentimentScore: 82, // 82% positive sentiment
        keyPhrases: ['"great ai features"', '"fast support"', '"could be cheaper"'],
        topSegments: [
            { name: 'Champions', percent: 35 },
            { name: 'At Risk', percent: 15 },
            { name: 'Newbies', percent: 20 },
            { name: 'Loyal', percent: 30 },
        ]
    };

    useEffect(() => {
        checkMLHealth().then(data => {
            if (data.status === 'healthy') {
                setHealth('online');
                setModels(data.models_ready || {});
            } else {
                setHealth('offline');
            }
        }).catch(() => setHealth('offline'));
    }, []);

    const handleTrain = async () => {
        setTraining(true);
        setTrainResult(null);
        try {
            const result = await trainAllModels();
            setTrainResult(result);
            
            // Refresh health and model status after training
            const healthData = await checkMLHealth();
            if (healthData.status === 'healthy') {
                setHealth('online');
                setModels(healthData.models_ready || {});
            } else {
                setHealth('offline');
            }
        } catch {
            setTrainResult({ error: true });
        } finally {
            setTraining(false);
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
            borderRadius: '16px', padding: '24px', border: '1px solid rgba(99,102,241,0.2)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '12px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    }}>🤖</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                            AI / ML Service
                        </h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                            Machine Learning & Intelligence Artificielle
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: health === 'online' ? 'rgba(16,185,129,0.15)' : health === 'offline' ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
                    color: health === 'online' ? '#10b981' : health === 'offline' ? '#ef4444' : '#94a3b8',
                }}>
                    <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: health === 'online' ? '#10b981' : health === 'offline' ? '#ef4444' : '#94a3b8',
                    }} />
                    {health === 'online' ? 'Online' : health === 'offline' ? 'Offline' : 'Checking...'}
                </div>
            </div>

            {/* Model Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {[
                    { key: 'churn', label: 'Churn', icon: '🔴', metric: 'XGBoost' },
                    { key: 'scoring', label: 'Lead Score', icon: '📊', metric: 'Gradient Boost' },
                    { key: 'segmentation', label: 'Segments', icon: '👥', metric: 'K-Means' },
                    { key: 'recommender', label: 'Recommend', icon: '🎯', metric: 'Neural CF' },
                    { key: 'sentiment', label: 'Sentiment', icon: '💬', metric: 'BERT' },
                ].map(m => (
                    <div key={m.key} style={{
                        padding: '14px', borderRadius: '12px', textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{m.icon}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '2px' }}>{m.label}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{m.metric}</div>
                        <div style={{
                            marginTop: '8px', fontSize: '11px', fontWeight: 600,
                            color: models[m.key] ? '#10b981' : '#f59e0b',
                        }}>
                            {typeof models[m.key] === 'string' ? models[m.key] : models[m.key] ? '✅ Trained' : '⏳ Not trained'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Train Button */}
            <button
                onClick={handleTrain}
                disabled={training}
                style={{
                    width: '100%', padding: '10px', borderRadius: '10px',
                    border: 'none', cursor: training ? 'not-allowed' : 'pointer',
                    background: training ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', fontSize: '13px', fontWeight: 600,
                    opacity: training ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                }}
            >
                {training ? '⏳ Training models...' : '🔄 Retrain All Models'}
            </button>

            {/* Global ML Insights */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🌍</span> Global AI Insights
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Churn Rate insight */}
                    <div style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Avg Portfolio Churn Risk
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '8px', gap: '8px' }}>
                            <span style={{ fontSize: '28px', fontWeight: 700, color: '#f87171' }}>{globalInsights.avgChurnRisk}%</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                +2.1%
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', backgroundColor: '#334155', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                            <div style={{ width: `${globalInsights.avgChurnRisk}%`, height: '100%', backgroundColor: '#ef4444' }} />
                        </div>
                    </div>

                    {/* Sentiment insight */}
                    <div style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Global Customer Sentiment
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '8px', gap: '8px' }}>
                            <span style={{ fontSize: '28px', fontWeight: 700, color: '#34d399' }}>{globalInsights.sentimentScore}%</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                Positive
                            </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {globalInsights.keyPhrases.map((phrase, i) => (
                                <span key={i} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{phrase}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {trainResult && (
                <div style={{
                    marginTop: '10px', padding: '10px', borderRadius: '8px', fontSize: '12px',
                    backgroundColor: trainResult.error ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                    color: trainResult.error ? '#fca5a5' : '#6ee7b7',
                }}>
                    {trainResult.error
                        ? '❌ Training failed. Check logs.'
                        : `✅ ${trainResult.status === 'success' ? 'All models trained successfully!' : JSON.stringify(trainResult.status)}`
                    }
                </div>
            )}
        </div>
    );
}