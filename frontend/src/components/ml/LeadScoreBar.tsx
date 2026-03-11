import React from 'react';

interface LeadScoreBarProps {
    score: number;
    priority: 'cold' | 'warm' | 'hot' | 'unknown';
}

/**
 * Displays a visual progress bar for lead score (0-100).
 */
const LeadScoreBar: React.FC<LeadScoreBarProps> = ({ score, priority }) => {
    const colorMap = {
        cold: '#6366f1',
        warm: '#f59e0b',
        hot: '#ef4444',
        unknown: '#6b7280',
    };

    const color = colorMap[priority] || colorMap.unknown;

    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ fontWeight: 600, color }}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Lead
                </span>
                <span style={{ fontWeight: 700 }}>{score.toFixed(0)}/100</span>
            </div>
            <div style={{
                width: '100%', height: '8px', borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
            }}>
                <div style={{
                    width: `${Math.min(score, 100)}%`, height: '100%',
                    borderRadius: '4px', backgroundColor: color,
                    transition: 'width 0.5s ease-in-out',
                }} />
            </div>
        </div>
    );
};

export default LeadScoreBar;
