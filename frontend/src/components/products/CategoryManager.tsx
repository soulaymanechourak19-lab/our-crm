import React, { useState, useEffect } from 'react';
import { getCategories } from '../../services/products';
import Badge from '../common/Badge';


interface CategoryManagerProps {
    onSelectCategory?: (category: string) => void;
    selectedCategory?: string;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onSelectCategory, selectedCategory }) => {
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch {
            // Ignore errors
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-[var(--text-secondary)] text-sm">Loading categories...</div>;
    }

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--text-secondary)]">Categories</h4>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onSelectCategory?.('')}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${!selectedCategory
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onSelectCategory?.(cat)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${selectedCategory === cat
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            {categories.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">No categories yet. Create a product to add one.</p>
            )}
        </div>
    );
};

export default CategoryManager;
