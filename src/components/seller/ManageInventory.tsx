import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Product, Variant } from '../../constants/types';
import { Plus, Edit, Trash2, Search, MoreVertical, Filter, X, Grid, List, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductEditor from './ProductEditor';

const getShopifyThumbnail = (url: string, size: string = '400x400') => {
    if (!url || !url.includes("shopify.com")) return url || 'https://via.placeholder.com/400';
    try {
        const parts = url.split('?');
        const path = parts[0];
        const query = parts[1] ? `?${parts[1]}` : '';
        const lastDotIndex = path.lastIndexOf('.');
        if (lastDotIndex === -1) return url;
        
        const pathWithoutExt = path.substring(0, lastDotIndex);
        const ext = path.substring(lastDotIndex);
        
        return `${pathWithoutExt}_${size}${ext}${query}`;
    } catch (e) {
        return url;
    }
};

const productTypes = ["T-Shirt", "Polo Shirt", "Shirt", "Kurta", "Shalwar Kameez", "Trousers", "Jeans", "Shorts", "Jacket", "Zipper", "Hoodie", "Sweatshirt", "Dupatta", "Scarf", "Bag", "Shoe", "Sandal", "Belt", "Watch", "Accessory"];

const ProductCard: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: Product) => void;
}> = React.memo(({ product, onEdit, onDelete, onDuplicate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const totalInventory = useMemo(() => 
    product.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0)
  , [product.variants]);

  const price = useMemo(() => {
    const defaultVariant = product.variants.find(v => v.is_default);
    return defaultVariant?.price || product.pricing?.price || 0;
  }, [product.variants, product.pricing]);

  const hasMetadata = product.product_type && product.tags?.some(t => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
  const status = !hasMetadata ? 'inactive' : (product.status || 'draft');

  const statusConfig = {
      active: { text: 'Active', className: 'bg-green-600 text-white' },
      draft: { text: 'Draft', className: 'bg-yellow-600 text-white' },
      inactive: { text: 'Inactive', className: 'bg-red-600 text-white' },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <motion.div layout className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg overflow-hidden flex flex-col group">
      <div className="relative">
        <img 
          src={getShopifyThumbnail(product.images[0])} 
          alt={product.title} 
          loading="lazy" 
          className="w-full h-56 object-cover bg-neutral-800 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.className}`}>
          {currentStatus.text}
        </span>
        <div className="absolute top-3 right-3">
            <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} className="p-2 bg-black/40 rounded-full text-white hover:bg-black/70">
                    <MoreVertical size={18} />
                </button>
                <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10"
                    >
                        <button onClick={() => { onEdit(product); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Edit</button>
                        <button onClick={() => { onDuplicate(product); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800">Duplicate</button>
                        <button onClick={() => { onDelete(product.id); setIsMenuOpen(false); }} className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-neutral-800">Delete</button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">{product.title}</h3>
        <p className="text-sm text-neutral-400 flex-grow">{product.product_type || <span className='text-red-400'>No Type</span>}</p>
        
        <div className="mt-4 flex justify-between items-end">
            <div>
                <p className="text-xs text-neutral-500">Price</p>
                <p className="text-lg font-semibold text-white">Rs. {price.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs text-neutral-500 text-right">Stock</p>
                <p className={`text-lg font-semibold ${totalInventory > 0 ? 'text-green-400' : 'text-red-400'}`}>{totalInventory}</p>
            </div>
        </div>
      </div>
    </motion.div>
  );
});

const ProductListItem: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: Product) => void;
}> = React.memo(({ product, onEdit, onDelete, onDuplicate }) => {
    const totalInventory = useMemo(() => 
        product.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0)
    , [product.variants]);

    const price = useMemo(() => {
        const defaultVariant = product.variants.find(v => v.is_default);
        return defaultVariant?.price || product.pricing?.price || 0;
    }, [product.variants, product.pricing]);

    const hasMetadata = product.product_type && product.tags?.some(t => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
    const status = !hasMetadata ? 'inactive' : (product.status || 'draft');

    const statusConfig = {
        active: { text: 'Active', className: 'bg-green-600 text-white' },
        draft: { text: 'Draft', className: 'bg-yellow-600 text-white' },
        inactive: { text: 'Inactive', className: 'bg-red-600 text-white' },
    };
    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
        <motion.div layout className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <img 
                    src={getShopifyThumbnail(product.images[0], '100x100')} 
                    alt={product.title} 
                    loading="lazy" 
                    className="w-16 h-16 rounded-md object-cover bg-neutral-800"
                />
                <div className="flex-grow">
                    <p className="font-semibold text-white truncate">{product.title}</p>
                    <p className="text-sm text-neutral-400">{product.product_type || <span className='text-red-400'>No Type</span>}</p>
                </div>
            </div>
            
            <div className="flex-grow flex items-center justify-between sm:justify-end gap-4 mt-4 sm:mt-0">
                <div className="w-24 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.className}`}>
                        {currentStatus.text}
                    </span>
                </div>
                <div className="w-24 text-center">
                    <p className="text-sm text-neutral-300">Rs. {price.toLocaleString()}</p>
                </div>
                <div className={`w-28 text-center text-sm font-semibold ${totalInventory > 0 ? 'text-green-400' : 'text-red-400'}`}>{totalInventory} in stock</div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center mt-4 sm:mt-0">
                <button onClick={() => onEdit(product)} className="p-2 text-neutral-400 hover:text-primary"><Edit size={16} /></button>
                <button onClick={() => onDuplicate(product)} className="p-2 text-neutral-400 hover:text-green-500"><Copy size={16} /></button>
                <button onClick={() => onDelete(product.id)} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
        </motion.div>
    );
});

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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ status: 'all', stock: 'all', productType: 'all' });
    const [viewMode, setViewMode] = useState('grid');
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchProducts = useCallback(async (pageNum: number) => {
        if (!seller?.token) return;
        setIsLoading(true);
        try {
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
        fetchProducts(1);
    }, [fetchProducts]);

    useEffect(() => {
        if (isInitialLoad && products.length > 8) {
            setViewMode('list');
            setIsInitialLoad(false);
        }
    }, [products, isInitialLoad]);

    const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    const clearFilters = () => {
        setFilters({ status: 'all', stock: 'all', productType: 'all' });
        setIsFilterOpen(false);
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const searchMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            const hasMetadata = p.product_type && p.tags?.some(t => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
            const status = !hasMetadata ? 'inactive' : (p.status || 'draft');

            const statusMatch = filters.status === 'all' || status === filters.status;
            
            const totalInventory = p.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0);
            const stockMatch = filters.stock === 'all' || 
                               (filters.stock === 'inStock' && totalInventory > 0) || 
                               (filters.stock === 'outOfStock' && totalInventory === 0);

            const typeMatch = filters.productType === 'all' || p.product_type === filters.productType;

            return searchMatch && statusMatch && stockMatch && typeMatch;
        });
    }, [products, searchQuery, filters]);

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
        setPage(1);
        fetchProducts(1);
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

    const handleDuplicateProduct = async (productToDuplicate: Product) => {
        if (!seller?.token) return;
        if (!window.confirm(`Are you sure you want to duplicate "${productToDuplicate.title}"?`)) return;

        const createPayload = { ...productToDuplicate, id: "", title: `Copy of ${productToDuplicate.title}` };
        const response = await api.Seller.CreateProduct(seller.token, createPayload as Product);

        if (response.ok) {
            alert('Product duplicated successfully!');
            setPage(1);
            fetchProducts(1);
        } else {
            alert(`Failed to duplicate product: ${response.body?.message || 'Unknown error'}`);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">Inventory</h2>
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input 
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700 rounded-md pl-10 pr-4 py-2 w-full text-white focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <div className="relative">
                        <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center space-x-2 bg-neutral-900/50 backdrop-blur-sm border border-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-800">
                            <Filter size={16} />
                            <span className="hidden sm:inline">Filters</span>
                        </button>
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-72 bg-neutral-900/80 backdrop-blur-md border border-neutral-700 rounded-md shadow-lg z-20 p-4 space-y-4"
                                >
                                    <h4 className="font-semibold text-white">Filter By</h4>
                                    <div>
                                        <label className="text-sm text-neutral-400">Status</label>
                                        <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-2 text-sm border border-neutral-700 mt-1">
                                            <option value="all">All Statuses</option>
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-400">Stock</label>
                                        <select value={filters.stock} onChange={e => handleFilterChange('stock', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-2 text-sm border border-neutral-700 mt-1">
                                            <option value="all">All Stock</option>
                                            <option value="inStock">In Stock</option>
                                            <option value="outOfStock">Out of Stock</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-neutral-400">Product Type</label>
                                        <select value={filters.productType} onChange={e => handleFilterChange('productType', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-2 text-sm border border-neutral-700 mt-1">
                                            <option value="all">All Types</option>
                                            {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                                        <button onClick={clearFilters} className="text-sm text-neutral-400 hover:text-white px-3 py-1 rounded">Clear</button>
                                        <button onClick={() => setIsFilterOpen(false)} className="text-sm bg-primary text-white px-4 py-1 rounded-md hover:bg-primary/90">Done</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center bg-neutral-900/50 backdrop-blur-sm border border-neutral-700 rounded-md">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-l-md ${viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-neutral-800'}`}><Grid size={16}/></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-r-md ${viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-neutral-800'}`}><List size={16}/></button>
                    </div>
                    <button onClick={handleOpenEditorForCreate} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex-shrink-0">
                        <Plus size={20} />
                        <span className="hidden sm:inline">Create</span>
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                    {isLoading && page === 1 && Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg overflow-hidden">
                            <div className="w-full h-56 bg-neutral-800 animate-pulse"></div>
                            <div className="p-4">
                                <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-neutral-700 rounded w-1/2 animate-pulse"></div>
                                <div className="mt-4 flex justify-between items-end">
                                    <div className="h-5 bg-neutral-700 rounded w-1/4 animate-pulse"></div>
                                    <div className="h-5 bg-neutral-700 rounded w-1/4 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!isLoading && filteredProducts.length === 0 && 
                        <div className="col-span-full text-center py-12 bg-neutral-900/50 backdrop-blur-sm border border-dashed border-neutral-700 rounded-lg">
                            <h3 className="mt-4 text-xl font-semibold text-white">No products match your filters</h3>
                            <p className="mt-1 text-neutral-400">Try adjusting your search or filters.</p>
                            <button onClick={clearFilters} className="mt-4 text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">Clear Filters</button>
                        </div>
                    }
                    {error && <p className="col-span-full text-center text-red-500">{error}</p>}
                    
                    {filteredProducts.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            onEdit={handleOpenEditorForUpdate}
                            onDelete={handleDeleteProduct}
                            onDuplicate={handleDuplicateProduct}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-4 mt-4">
                    {isLoading && page === 1 && Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg p-4 h-24 animate-pulse"></div>
                    ))}
                     {!isLoading && filteredProducts.length === 0 && 
                        <div className="col-span-full text-center py-12 bg-neutral-900/50 backdrop-blur-sm border border-dashed border-neutral-700 rounded-lg">
                            <h3 className="mt-4 text-xl font-semibold text-white">No products match your filters</h3>
                            <p className="mt-1 text-neutral-400">Try adjusting your search or filters.</p>
                            <button onClick={clearFilters} className="mt-4 text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">Clear Filters</button>
                        </div>
                    }
                    {error && <p className="col-span-full text-center text-red-500">{error}</p>}

                    {filteredProducts.map(product => (
                        <ProductListItem
                            key={product.id}
                            product={product}
                            onEdit={handleOpenEditorForUpdate}
                            onDelete={handleDeleteProduct}
                            onDuplicate={handleDuplicateProduct}
                        />
                    ))}
                </div>
            )}

            {hasMore && !isLoading && filteredProducts.length > 0 && (
                <div className="mt-6 text-center">
                    <button onClick={() => fetchProducts(page + 1)} className="text-primary hover:underline">
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