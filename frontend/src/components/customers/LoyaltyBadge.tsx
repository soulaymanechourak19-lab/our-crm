import React from 'react';

interface LoyaltyBadgeProps {
    tier: string;
    score: number;
    showProgress?: boolean;
}

const tierConfig: Record<string, { gradient: string; text: string; emoji: string }> = {
    Bronze: { gradient: 'linear-gradient(135deg, #92400e, #b45309)', text: '#fbbf24', emoji: '🥉' },
    Silver: { gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', text: '#e2e8f0', emoji: '🥈' },
    Gold: { gradient: 'linear-gradient(135deg, #b45309, #d97706)', text: '#fef3c7', emoji: '🥇' },
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
