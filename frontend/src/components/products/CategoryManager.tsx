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
        return <div className="text-dark-400 text-sm">Loading categories...</div>;
    }

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-dark-300">Categories</h4>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onSelectCategory?.('')}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${!selectedCategory
                        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                        : 'text-dark-400 border-dark-600/50 hover:text-white hover:bg-dark-700'
                        }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onSelectCategory?.(cat)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${selectedCategory === cat
                            ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                            : 'text-dark-400 border-dark-600/50 hover:text-white hover:bg-dark-700'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            {categories.length === 0 && (
                <p className="text-xs text-dark-500">No categories yet. Create a product to add one.</p>
            )}
        </div>
    );
};

export default CategoryManager;
