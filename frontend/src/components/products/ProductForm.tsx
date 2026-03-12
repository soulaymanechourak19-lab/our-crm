import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { Product, ProductFormData, createProduct, updateProduct } from '../../services/products';
import { useToast } from '../common/Toast';

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, product, onSuccess }) => {
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price,
                stock: product.stock,
                category: product.category,
            });
        } else {
            setFormData({ name: '', description: '', price: 0, stock: 0, category: '' });
        }
        if (isOpen) setErrors({});
    }, [product, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name!]: name === 'price' || name === 'stock' ? Number(value.replace(',', '.')) : value,
        }));
        if (errors[name!]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name!];
                return next;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsLoading(true);

        try {
            if (product) {
                await updateProduct(product.id, formData);
                showToast('Product updated successfully', 'success');
            } else {
                await createProduct(formData);
                showToast('Product created successfully', 'success');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const fieldErrors: Record<string, string> = {};
                Object.entries(err.response.data.errors).forEach(([key, value]) => {
                    fieldErrors[key] = (value as string[])[0];
                });
                setErrors(fieldErrors);
            } else {
                showToast(err.response?.data?.message || 'An error occurred', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add Product'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    error={errors.name}
                    required
                />

                <Input
                    label="Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Product description (optional)"
                    multiline
                    rows={3}
                    error={errors.description}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Price"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        error={errors.price}
                        required
                        min="0"
                        step="0.01"
                    />

                    <Input
                        label="Stock"
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                        error={errors.stock}
                        required
                        min="0"
                    />
                </div>

                <Input
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Electronics"
                    error={errors.category}
                    required
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductForm;
