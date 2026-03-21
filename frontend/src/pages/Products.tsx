import React, { useEffect, useState, useCallback } from 'react';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import ProductCard from '../components/products/ProductCard';
import ProductForm from '../components/products/ProductForm';
import Skeleton from '../components/common/Skeleton';
import StockUpdate from '../components/products/StockUpdate';
import CategoryManager from '../components/products/CategoryManager';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { Product, getProducts, deleteProduct } from '../services/products';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../components/common/Toast';


const Products: React.FC = () => {
    const { formatCurrency, currency } = useCurrency();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [isStockUpdateOpen, setIsStockUpdateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { showToast } = useToast();


    // Fetch products
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getProducts({ page, search, category });
            setProducts(response.data);
            setLastPage(response.last_page);
        } catch (error) {
            showToast('Failed to load products', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [page, search, category, showToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleCategorySelect = (cat: string) => {
        setCategory(cat === category ? '' : cat);
        setPage(1);
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        try {
            await deleteProduct(selectedProduct.id);
            showToast('Product deleted successfully', 'success');
            fetchProducts();
            setIsDeleteOpen(false);
        } catch {
            showToast('Failed to delete product', 'error');
        }
    };

    const openEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsProductFormOpen(true);
    };

    const openStock = (product: Product) => {
        setSelectedProduct(product);
        setIsStockUpdateOpen(true);
    };

    const openDelete = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-64">
                    <Input
                        value={search}
                        onChange={handleSearch}
                        placeholder="Search products..."
                    />
                </div>

                <div className="flex-1 overflow-x-auto">
                    <CategoryManager onSelectCategory={handleCategorySelect} selectedCategory={category} />
                </div>

                <div className="flex-shrink-0">
                    <Button onClick={() => { setSelectedProduct(null); setIsProductFormOpen(true); }}>
                        + Add Product
                    </Button>
                </div>
            </Card>

            {/* Product Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={`skel-${i}`} className="glass-card p-5 space-y-4">
                            <Skeleton height={140} borderRadius="12px" className="mb-4" />
                            <Skeleton height={20} width="70%" />
                            <Skeleton height={14} width="50%" />
                            <div className="flex justify-between items-center pt-3">
                                <Skeleton height={24} width="30%" />
                                <Skeleton height={32} width="80px" borderRadius="12px" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={openEdit}
                            onDelete={openDelete}
                            onStockUpdate={openStock}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-[var(--text-secondary)]">
                    No products found. Try adjusting your filters.
                </div>
            )}

            {/* Pagination */}
            <Pagination currentPage={page} lastPage={lastPage} onPageChange={setPage} />

            {/* Modals */}
            <ProductForm
                isOpen={isProductFormOpen}
                onClose={() => setIsProductFormOpen(false)}
                product={selectedProduct}
                onSuccess={fetchProducts}
            />

            <StockUpdate
                isOpen={isStockUpdateOpen}
                onClose={() => setIsStockUpdateOpen(false)}
                product={selectedProduct}
                onSuccess={fetchProducts}
            />

            <ConfirmationDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Product"
                message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
                confirmText="Delete Product"
            />
        </div>
    );
};

export default Products;
