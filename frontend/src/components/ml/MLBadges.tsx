/**
 * ML Badges — Inline components for displaying ML predictions in tables.
 * Used in Leads, Customers, and CustomerDetail pages.
 */
import { useEffect, useState } from 'react';
import { predictChurn, scoreLead, segmentCustomer } from '../../services/mlService';

// ═══════════════════════════════════════════════════════════════════
//  Churn Risk Badge
// ═══════════════════════════════════════════════════════════════════

interface ChurnBadgeProps {
    customerId: number | string;
}

export function ChurnBadge({ customerId }: ChurnBadgeProps) {
    const [data, setData] = useState<{ probability?: number; risk_level?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        predictChurn(customerId)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [customerId]);

    if (loading) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>⏳</span>;
    if (!data || data.risk_level === undefined) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>;

    const config: Record<string, { color: string; bg: string; label: string }> = {
        low: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: '🟢 Low' },
        medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: '🟡 Medium' },
        high: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: '🔴 High' },
    };

    const c = config[data.risk_level] || config.low;

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            backgroundColor: c.bg, color: c.color,
        }}>
            {c.label}
            {data.probability !== undefined && (
                <span style={{ opacity: 0.7, fontSize: '10px' }}>
                    {(data.probability * 100).toFixed(0)}%
                </span>
            )}
        </span>
    );
}


// ═══════════════════════════════════════════════════════════════════
//  Lead Score Badge
// ═══════════════════════════════════════════════════════════════════

interface LeadScoreBadgeProps {
    leadId: number | string;
}

export function LeadScoreBadge({ leadId }: LeadScoreBadgeProps) {
    const [data, setData] = useState<{ score?: number; priority?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        scoreLead(leadId)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [leadId]);

    if (loading) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>⏳</span>;
    if (!data || data.score === undefined) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>;

    const score = data.score;
    const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#6366f1';
    const bg = score >= 70 ? 'rgba(239,68,68,0.12)' : score >= 40 ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
            <div style={{
                width: '50px', height: '6px', borderRadius: '3px',
                backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
            }}>
                <div style={{
                    width: `${Math.min(score, 100)}%`, height: '100%',
                    borderRadius: '3px', backgroundColor: color,
                }} />
            </div>
            <span style={{
                fontSize: '12px', fontWeight: 700, color,
                padding: '1px 6px', borderRadius: '8px', backgroundColor: bg,
            }}>
                {score.toFixed(0)}
            </span>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════
//  Customer Segment Badge
// ═══════════════════════════════════════════════════════════════════

interface SegmentBadgeProps {
    customerId: number | string;
}

export function SegmentBadge({ customerId }: SegmentBadgeProps) {
    const [data, setData] = useState<{ segment?: string; cluster_id?: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        segmentCustomer(customerId)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [customerId]);

    if (loading) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>⏳</span>;
    if (!data || !data.segment) return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>;

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const bgs = ['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.12)', 'rgba(236,72,153,0.12)', 'rgba(20,184,166,0.12)', 'rgba(249,115,22,0.12)'];
    const idx = (data.cluster_id ?? 0) % colors.length;

    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
            backgroundColor: bgs[idx], color: colors[idx],
        }}>
            {data.segment}
        </span>
    );
}