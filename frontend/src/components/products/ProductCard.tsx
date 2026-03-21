import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { Product } from '../../services/products';
import Badge from '../common/Badge';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onStockUpdate: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onStockUpdate }) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();

    const getStockVariant = (stock: number): 'success' | 'warning' | 'danger' => {
        if (stock > 10) return 'success';
        if (stock >= 5) return 'warning';
        return 'danger';
    };

    const getStockLabel = (stock: number): string => {
        if (stock > 10) return 'In Stock';
        if (stock >= 5) return 'Low Stock';
        if (stock > 0) return 'Critical';
        return 'Out of Stock';
    };

    return (
        <div className="glass-card p-5 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[var(--text-primary)] font-semibold truncate">{product.name}</h3>
                    <Badge variant="info" className="mt-1">{product.category}</Badge>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Edit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Description */}
            {product.description && (
                <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">{product.description}</p>
            )}

            {/* Price */}
            <div className="mb-4">
                <span className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(product.price)}</span>
            </div>

            {/* Stock */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant={getStockVariant(product.stock)}>
                        {getStockLabel(product.stock)}
                    </Badge>
                    <span className="text-[var(--text-secondary)] text-sm">{product.stock} units</span>
                </div>

                {/* Quick stock buttons */}
                <button
                    onClick={() => onStockUpdate(product)}
                    className="text-xs text-[var(--text-secondary)] hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-all"
                >
                    Update Stock
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
