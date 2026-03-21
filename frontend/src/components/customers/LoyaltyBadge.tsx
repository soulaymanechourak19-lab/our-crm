import React from 'react';

interface LoyaltyBadgeProps {
    tier: string;
    score: number;
    showProgress?: boolean;
}

const tierConfig: Record<string, { gradient: string; text: string; emoji: React.ReactNode }> = {
    Bronze: { gradient: 'linear-gradient(135deg, #92400e, #b45309)', text: '#fbbf24', emoji: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg> },
    Silver: { gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', text: '#e2e8f0', emoji: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg> },
    Gold: { gradient: 'linear-gradient(135deg, #b45309, #d97706)', text: '#fef3c7', emoji: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg> },
};

const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({ tier, score, showProgress = false }) => {
    const config = tierConfig[tier] || tierConfig.Bronze;

    return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold space-x-1.5"
            style={{ background: `${config.gradient}`, color: config.text, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <span>{config.emoji}</span>
            <span>{tier}</span>
            <span style={{ opacity: 0.7 }}>•</span>
            <span>{score}</span>
        </span>
    );
};

export default LoyaltyBadge;
