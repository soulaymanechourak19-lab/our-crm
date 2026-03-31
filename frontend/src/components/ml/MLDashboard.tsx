/**
 * MLDashboard — AI/ML status panel for the Dashboard page.
 * Shows model health, metrics, and train button.
 */
import { useEffect, useState } from 'react';
import { checkMLHealth, trainAllModels } from '../../services/mlService';
import { Timer } from 'lucide-react';

/* ── SVG Icons (Lucide/Feather) ───────────────────────── */
const svgs = {
    ai: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.73-3H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9.5" cy="15.5" r="1" fill="currentColor"/><circle cx="14.5" cy="15.5" r="1" fill="currentColor"/></svg>,
    refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.65-6.35L11 10"/><path d="M3 2v6h6"/><path d="M21 12a9 9 0 1 0-2.65 6.35L13 14"/></svg>,
    globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    churn: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="23" y2="12"/><line x1="23" y1="8" x2="19" y2="12"/></svg>,
    scoring: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    segmentation: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    recommender: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    sentiment: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

export default function MLDashboard() {
    const [health, setHealth] = useState<'online' | 'offline' | 'loading'>('loading');
    const [models, setModels] = useState<Record<string, boolean | string>>({});
    const [training, setTraining] = useState(false);
    const [trainResult, setTrainResult] = useState<any>(null);

    const [globalInsights, setGlobalInsights] = useState({
        avgChurnRisk: 0,
        sentimentScore: 0,
        keyPhrases: [] as string[],
        topSegments: [] as { name: string, percent: number }[]
    });

    useEffect(() => {
        checkMLHealth().then(data => {
            if (data.status === 'healthy') {
                setHealth('online');
                setModels(data.models_ready || {});
                if (data.global_insights) {
                    setGlobalInsights(data.global_insights);
                }
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
                if (healthData.global_insights) {
                    setGlobalInsights(healthData.global_insights);
                }
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
            background: 'var(--bg-card)',
            borderRadius: '16px', padding: '28px', border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(12px)',
            transition: 'background 0.3s ease'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '46px', height: '46px', borderRadius: '12px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #6c5ce7, #e84393)',
                        color: '#fff', boxShadow: '0 4px 15px rgba(108, 92, 231, 0.35)'
                    }}>
                        {svgs.ai}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                            AI / ML Service
                        </h2>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Predictive Intelligence & Models
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700,
                    backgroundColor: health === 'online' ? 'rgba(0, 184, 148, 0.15)' : health === 'offline' ? 'rgba(255, 118, 117, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: health === 'online' ? '#00b894' : health === 'offline' ? '#ff7675' : '#94a3b8',
                    border: `1px solid ${health === 'online' ? 'rgba(0, 184, 148, 0.3)' : health === 'offline' ? 'rgba(255, 118, 117, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`
                }}>
                    <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: health === 'online' ? '#00b894' : health === 'offline' ? '#ff7675' : '#94a3b8',
                        boxShadow: `0 0 8px ${health === 'online' ? '#00b894' : health === 'offline' ? '#ff7675' : '#94a3b8'}`
                    }} />
                    {health === 'online' ? 'System Online' : health === 'offline' ? 'System Offline' : 'Checking...'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                    { key: 'churn', label: 'Churn Risk', icon: svgs.churn, metric: 'XGBoost', color: '#ff7675' },
                    { key: 'scoring', label: 'Lead Score', icon: svgs.scoring, metric: 'Gradient Boost', color: '#00cec9' },
                    { key: 'segmentation', label: 'Segments', icon: svgs.segmentation, metric: 'K-Means', color: '#a29bfe' },
                    { key: 'recommender', label: 'Recommend', icon: svgs.recommender, metric: 'Neural CF', color: '#e84393' },
                    { key: 'sentiment', label: 'Sentiment', icon: svgs.sentiment, metric: 'BERT', color: '#74b9ff' },
                ].map(m => (
                    <div key={m.key} style={{
                        padding: '18px 14px', borderRadius: '14px', textAlign: 'center',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--indigo-500)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: m.color }}>
                            {m.icon}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{m.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{m.metric}</div>
                        <div style={{
                            marginTop: '12px', fontSize: '11px', fontWeight: 700,
                            color: models[m.key] ? '#00b894' : '#fdcb6e',
                            background: models[m.key] ? 'rgba(0, 184, 148, 0.1)' : 'rgba(253, 203, 110, 0.1)',
                            padding: '4px 8px', borderRadius: '6px', display: 'inline-block'
                        }}>
                            {typeof models[m.key] === 'string' ? models[m.key] : models[m.key] ? 'Trained' : 'Not trained'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Train Button */}
            <button
                onClick={handleTrain}
                disabled={training}
                style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    border: 'none', cursor: training ? 'not-allowed' : 'pointer',
                    background: training ? 'rgba(108, 92, 231, 0.5)' : 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
                    color: '#fff', fontSize: '14px', fontWeight: 700,
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: training ? 'none' : '0 4px 15px rgba(108, 92, 231, 0.3)'
                }}
                onMouseEnter={(e) => { if(!training) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { if(!training) e.currentTarget.style.transform = 'none'; }}
            >
                {training ? (
                    <><Timer size={16} className="animate-spin" /> Training models...</>
                ) : (
                    <>{svgs.refresh} Retrain All Models</>
                )}
            </button>

            {/* Global ML Insights */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#00cec9' }}>{svgs.globe}</span> Global AI Insights
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Churn Rate insight */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 118, 117, 0.2)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Avg Portfolio Churn Risk
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px', gap: '12px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 800, color: '#ff7675', letterSpacing: '-1px' }}>{globalInsights.avgChurnRisk}%</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: globalInsights.avgChurnRisk > 50 ? '#ff7675' : globalInsights.avgChurnRisk > 25 ? '#fdcb6e' : '#00b894', backgroundColor: globalInsights.avgChurnRisk > 50 ? 'rgba(255, 118, 117, 0.1)' : globalInsights.avgChurnRisk > 25 ? 'rgba(253, 203, 110, 0.1)' : 'rgba(0, 184, 148, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                {globalInsights.avgChurnRisk > 50 ? 'High Risk' : globalInsights.avgChurnRisk > 25 ? 'Medium Risk' : 'Low Risk'}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
                            <div style={{ width: `${globalInsights.avgChurnRisk}%`, height: '100%', background: 'linear-gradient(90deg, #ff7675, #e84393)' }} />
                        </div>
                    </div>

                    {/* Sentiment insight */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(0, 184, 148, 0.2)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Global Customer Sentiment
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '12px', gap: '12px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 800, color: '#00b894', letterSpacing: '-1px' }}>{globalInsights.sentimentScore}%</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#00b894', backgroundColor: 'rgba(0, 184, 148, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                Positive
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {globalInsights.keyPhrases.map((phrase, i) => (
                                <span key={i} style={{ backgroundColor: 'var(--bg-card)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>{phrase}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {trainResult && (
                <div style={{
                    marginTop: '20px', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    backgroundColor: trainResult.error ? 'rgba(255, 118, 117, 0.1)' : 'rgba(0, 184, 148, 0.1)',
                    color: trainResult.error ? '#ff7675' : '#00b894',
                    border: `1px solid ${trainResult.error ? 'rgba(255, 118, 117, 0.2)' : 'rgba(0, 184, 148, 0.2)'}`,
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    {trainResult.error
                        ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle'}}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Training failed. Check logs.</>
                        : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle'}}><polyline points="20 6 9 17 4 12" /></svg> {trainResult.status === 'success' ? 'All models trained successfully!' : JSON.stringify(trainResult.status)}</>
                    }
                </div>
            )}
        </div>
    );
}