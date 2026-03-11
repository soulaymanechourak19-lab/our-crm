import React from 'react';

interface ChurnRiskBadgeProps {
    riskLevel: 'low' | 'medium' | 'high' | 'unknown';
    probability?: number;
}

/**
 * Displays a color-coded churn risk badge.
 */
const ChurnRiskBadge: React.FC<ChurnRiskBadgeProps> = ({ riskLevel, probability }) => {
    const config = {
        low: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '✅', label: 'Low Risk' },
        medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '⚠️', label: 'Medium Risk' },
        high: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🔴', label: 'High Risk' },
        unknown: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '❓', label: 'Unknown' },
    };

    const { color, bg, icon, label } = config[riskLevel] || config.unknown;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            backgroundColor: bg, color, fontSize: '13px', fontWeight: 600,
        }}>
            <span>{icon}</span>
            <span>{label}</span>
            {probability !== undefined && (
                <span style={{ opacity: 0.7, fontSize: '11px' }}>
                    ({(probability * 100).toFixed(0)}%)
                </span>
            )}
        </div>
    );
};

export default ChurnRiskBadge;
