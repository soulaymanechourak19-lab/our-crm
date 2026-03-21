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
        low: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>, label: 'Low Risk' },
        medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, label: 'Medium Risk' },
        high: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>, label: 'High Risk' },
        unknown: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, label: 'Unknown' },
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
