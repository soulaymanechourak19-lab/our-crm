import React from 'react';
import { ProductRecommendation } from '../../services/mlApi';

interface RecommendationListProps {
    recommendations: ProductRecommendation[];
    productNames?: Record<number, string>;
}

/**
 * Displays a list of recommended products with scores.
 */
const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations, productNames }) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div style={{ padding: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                No recommendations available yet.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.map((rec, index) => (
                <div key={rec.product_id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '8px',
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.15)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: 'rgba(99,102,241,0.2)', color: '#818cf8',
                            fontSize: '12px', fontWeight: 700,
                        }}>
                            {index + 1}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>
                            {productNames?.[rec.product_id] || `Product #${rec.product_id}`}
                        </span>
                    </div>
                    <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981',
                    }}>
                        {(rec.score * 100).toFixed(0)}% match
                    </span>
                </div>
            ))}
        </div>
    );
};

export default RecommendationList;
