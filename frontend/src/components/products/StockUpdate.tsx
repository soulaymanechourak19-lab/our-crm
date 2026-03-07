import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Product, updateStock } from '../../services/products';
import { useToast } from '../common/Toast';

interface StockUpdateProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSuccess: () => void;
}

const StockUpdate: React.FC<StockUpdateProps> = ({ isOpen, onClose, product, onSuccess }) => {
    const [stock, setStock] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (product) {
            setStock(product.stock);
        }
    }, [product, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        setIsLoading(true);
        try {
            await updateStock(product.id, stock);
            showToast('Stock updated successfully', 'success');
            onSuccess();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update stock', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!product) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Stock - ${product.name}`} size="sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-dark-300 mb-3">Quantity</label>

                    {/* Increment / Decrement */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setStock(Math.max(0, stock - 1))}
                            className="w-12 h-12 rounded-xl bg-dark-700 hover:bg-dark-600 text-white text-xl font-bold transition-all flex items-center justify-center"
                        >
                            −
                        </button>

                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-24 text-center text-2xl font-bold text-white bg-dark-900/50 border border-dark-600/50 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                            min={0}
                        />

                        <button
                            type="button"
                            onClick={() => setStock(stock + 1)}
                            className="w-12 h-12 rounded-xl bg-dark-700 hover:bg-dark-600 text-white text-xl font-bold transition-all flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>

                    {/* Quick adjust */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                        {[-10, -5, 5, 10, 25, 50].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setStock(Math.max(0, stock + n))}
                                className={`px-2 py-1 text-xs rounded-lg border transition-all ${n > 0
                                        ? 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                                        : 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                                    }`}
                            >
                                {n > 0 ? `+${n}` : n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-dark-700/50">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Stock'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default StockUpdate;
