import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Product, Variant } from '../../constants/types';
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductEditor from './ProductEditor';

const ProductListItem: React.FC<{ 
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onUpdateVariant: (productId: string, variantId: string, data: Partial<Variant>) => void;
}> = ({ product, onEdit, onDelete, onUpdateVariant }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalInventory = useMemo(() => {
    return product.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0);
  }, [product.variants]);

  const handleVariantChange = (variantId: string, field: 'price' | 'quantity', value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
        if (field === 'quantity') {
            onUpdateVariant(product.id, variantId, { inventory: { ...product.variants.find(v=>v.id === variantId)?.inventory, quantity: numericValue } });
        } else {
            onUpdateVariant(product.id, variantId, { [field]: numericValue });
        }
    }
  };

  return (
    <motion.div layout className="bg-background-light rounded-lg border border-neutral-700 overflow-hidden">
      <div className="p-4 flex items-center space-x-4">
        <img src={product.images[0]} alt={product.title} className="w-20 h-20 rounded-md object-cover bg-neutral-800" />
        <div className="flex-grow">
          <p className="font-bold text-white">{product.title}</p>
          <p className="text-sm text-neutral-400">{product.variants.length} variant(s)</p>
          <p className={`text-sm font-semibold ${totalInventory > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalInventory} units in stock
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-neutral-400 hover:text-white">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button onClick={() => onEdit(product)} className="p-2 text-blue-500 hover:text-blue-400"><Edit size={18} /></button>
          <button onClick={() => onDelete(product.id)} className="p-2 text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
        </div>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-neutral-700"
          >
            <div className="space-y-2 mt-4">
              {product.variants.map(variant => (
                <div key={variant.id} className="grid grid-cols-3 gap-4 items-center bg-background p-2 rounded-md">
                  <p className="text-sm text-neutral-300 col-span-1">{variant.title}</p>
                  <div className="col-span-1">
                    <label className="text-xs text-neutral-500">Price</label>
                    <input 
                      type="number" 
                      defaultValue={variant.price}
                      onBlur={(e) => handleVariantChange(variant.id, 'price', e.target.value)}
                      className="w-full bg-neutral-800 text-white rounded-md p-1 text-sm border border-neutral-700"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-neutral-500">Stock</label>
                    <input 
                      type="number" 
                      defaultValue={variant.inventory?.quantity || 0}
                      onBlur={(e) => handleVariantChange(variant.id, 'quantity', e.target.value)}
                      className="w-full bg-neutral-800 text-white rounded-md p-1 text-sm border border-neutral-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ManageInventory: React.FC = () => {
    const { seller } = useSellerAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const fetchProducts = useCallback(async (pageNum: number, search: string = '') => {
        if (!seller?.token) return;
        setIsLoading(true);
        try {
            // Note: The API does not support search, so filtering is done client-side.
            const response = await api.Seller.GetProducts(seller.token, pageNum);
            if (response.ok) {
                const newProducts = response.body || [];
                setProducts(prev => pageNum === 1 ? newProducts : [...prev, ...newProducts]);
                setHasMore(newProducts.length > 0);
            } else {
                setError('Failed to fetch products.');
            }
        } catch (err) {
            setError('An error occurred while fetching products.');
        } finally {
            setIsLoading(false);
        }
    }, [seller?.token]);

    useEffect(() => {
        fetchProducts(1, searchQuery);
    }, [fetchProducts, searchQuery]);

    const handleLoadMore = () => {
        if (hasMore && !isLoading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchProducts(nextPage, searchQuery);
        }
    };

    const handleOpenEditorForCreate = () => {
        setEditingProduct(null);
        setIsEditorOpen(true);
    };

    const handleOpenEditorForUpdate = (product: Product) => {
        setEditingProduct(product);
        setIsEditorOpen(true);
    };

    const handleCloseEditor = () => {
        setIsEditorOpen(false);
        setEditingProduct(null);
        setPage(1); // Reset page
        fetchProducts(1, searchQuery); // Refresh products
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            if (!seller?.token) return;
            const response = await api.Seller.DeleteProduct(seller.token, productId);
            if (response.ok) {
                alert('Product deleted successfully');
                setProducts(prev => prev.filter(p => p.id !== productId));
            } else {
                alert('Failed to delete product.');
            }
        }
    };

    const handleUpdateVariant = async (productId: string, variantId: string, data: Partial<Variant>) => {
        if (!seller?.token) return;
        const product = products.find(p => p.id === productId);
        const variant = product?.variants.find(v => v.id === variantId);
        if (!product || !variant) return;

        const updatedVariant = { ...variant, ...data };
        const updatedProduct = {
            ...product,
            variants: product.variants.map(v => v.id === variantId ? updatedVariant : v)
        };

        const response = await api.Seller.UpdateProduct(seller.token, updatedProduct);
        if (response.ok) {
            // alert('Variant updated!');
            setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        } else {
            alert('Failed to update variant.');
        }
    };

    const filteredProducts = useMemo(() => 
        products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    , [products, searchQuery]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Inventory</h2>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input 
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-background-light border border-neutral-700 rounded-md pl-10 pr-4 py-2 text-white focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <button onClick={handleOpenEditorForCreate} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                        <Plus size={20} />
                        <span>Create Product</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading && page === 1 && <p className="text-center text-neutral-400">Loading products...</p>}
                {!isLoading && filteredProducts.length === 0 && <p className="text-center text-neutral-400">No products found.</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                
                {filteredProducts.map(product => (
                    <ProductListItem 
                        key={product.id} 
                        product={product} 
                        onEdit={handleOpenEditorForUpdate}
                        onDelete={handleDeleteProduct}
                        onUpdateVariant={handleUpdateVariant}
                    />
                ))}
            </div>

            {hasMore && !isLoading && (
                <div className="mt-6 text-center">
                    <button onClick={handleLoadMore} className="text-primary hover:underline">
                        Load More
                    </button>
                </div>
            )}
            {isLoading && page > 1 && <p className="text-center text-neutral-400 mt-4">Loading more...</p>}

            <AnimatePresence>
                {isEditorOpen && (
                    <ProductEditor
                        product={editingProduct}
                        onClose={handleCloseEditor}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ManageInventory;
