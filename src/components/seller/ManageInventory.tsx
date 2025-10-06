import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Product, Variant } from '../../constants/types';
import { Plus, Edit, Trash2, Search, MoreVertical, Filter, X, Grid, List, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ProductCard: React.FC<{ product: Product; onEdit: (product: Product) => void; onDelete: (productId: string) => void; onDuplicate: (product: Product) => void; onUpdateProduct: (productId: string, data: Partial<Product>) => void; }> = React.memo(({ product, onEdit, onDelete, onDuplicate, onUpdateProduct }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const totalInventory = useMemo(() => product.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0), [product.variants]);
  const price = useMemo(() => {
    const defaultVariant = product.variants.find(v => v.is_default);
    return defaultVariant?.price || product.pricing?.price || 0;
  }, [product.variants, product.pricing]);
  const currentGender = useMemo(() => product.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase())) || '', [product.tags]);
  const hasMetadata = product.product_type && currentGender;
  const status = !hasMetadata ? 'inactive' : (product.status || 'draft');
  const statusConfig = { active: { text: 'Active', className: 'bg-green-600 text-white' }, draft: { text: 'Draft', className: 'bg-yellow-600 text-white' }, inactive: { text: 'Inactive', className: 'bg-red-600 text-white' } };
  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGender = e.target.value;
    const otherTags = product.tags?.filter(t => !['male', 'female', 'unisex'].includes(t.toLowerCase())) || [];
    onUpdateProduct(product.id, { tags: newGender ? [...otherTags, newGender] : otherTags });
  };

  return (
    <motion.div layout className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg overflow-hidden flex flex-col group">
      <div className="relative">
        <img src={getShopifyThumbnail(product.images[0])} alt={product.title} loading="lazy" className="w-full h-56 object-cover bg-neutral-800 group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent" />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.className}`}>{currentStatus.text}</span>
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} className="p-2 bg-black/40 rounded-full text-white hover:bg-black/70"><MoreVertical size={18} /></button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10">
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
        <div className="flex items-center gap-2 mt-2 text-xs">
          <select value={product.product_type || ''} onChange={(e) => onUpdateProduct(product.id, { product_type: e.target.value })} onClick={(e) => e.stopPropagation()} className="bg-neutral-800/80 text-white rounded-md p-1 border border-neutral-700 w-full focus:ring-primary focus:border-primary">
            <option value="">Select Type</option>
            {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={currentGender} onChange={handleGenderChange} onClick={(e) => e.stopPropagation()} className="bg-neutral-800/80 text-white rounded-md p-1 border border-neutral-700 w-full focus:ring-primary focus:border-primary">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>
        <div className="mt-4 flex justify-between items-end flex-grow">
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

const ProductListItem: React.FC<{ product: Product; onEdit: (product: Product) => void; onDelete: (productId: string) => void; onDuplicate: (product: Product) => void; onUpdateProduct: (productId: string, data: Partial<Product>) => void; }> = React.memo(({ product, onEdit, onDelete, onDuplicate, onUpdateProduct }) => {
    const totalInventory = useMemo(() => product.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0), [product.variants]);
    const price = useMemo(() => {
        const defaultVariant = product.variants.find(v => v.is_default);
        return defaultVariant?.price || product.pricing?.price || 0;
    }, [product.variants, product.pricing]);
    const currentGender = useMemo(() => product.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase())) || '', [product.tags]);
    const hasMetadata = product.product_type && currentGender;
    const status = !hasMetadata ? 'inactive' : (product.status || 'draft');
    const statusConfig = { active: { text: 'Active', className: 'bg-green-600 text-white' }, draft: { text: 'Draft', className: 'bg-yellow-600 text-white' }, inactive: { text: 'Inactive', className: 'bg-red-600 text-white' } };
    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newGender = e.target.value;
        const otherTags = product.tags?.filter(t => !['male', 'female', 'unisex'].includes(t.toLowerCase())) || [];
        onUpdateProduct(product.id, { tags: newGender ? [...otherTags, newGender] : otherTags });
    };

    return (
        <motion.div layout className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-4 flex-grow">
                <img src={getShopifyThumbnail(product.images[0], '100x100')} alt={product.title} loading="lazy" className="w-16 h-16 rounded-md object-cover bg-neutral-800" />
                <p className="font-semibold text-white truncate flex-grow">{product.title}</p>
            </div>
            <div className="flex-shrink-0 flex items-center justify-between sm:justify-end gap-2 md:gap-4 mt-4 sm:mt-0">
                <div className="w-36">
                    <select value={product.product_type || ''} onChange={(e) => onUpdateProduct(product.id, { product_type: e.target.value })} className="bg-neutral-800/80 text-white rounded-md p-1 border border-neutral-700 w-full text-xs focus:ring-primary focus:border-primary">
                        <option value="">Select Type</option>
                        {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div className="w-28">
                    <select value={currentGender} onChange={handleGenderChange} className="bg-neutral-800/80 text-white rounded-md p-1 border border-neutral-700 w-full text-xs focus:ring-primary focus:border-primary">
                        <option value="">Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="unisex">Unisex</option>
                    </select>
                </div>
                <div className="w-24 text-center"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${currentStatus.className}`}>{currentStatus.text}</span></div>
                <div className={`w-28 text-center text-sm font-semibold ${totalInventory > 0 ? 'text-green-400' : 'text-red-400'}`}>{totalInventory} in stock</div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center mt-4 sm:mt-0 sm:border-l sm:border-neutral-700 sm:pl-4">
                <button onClick={() => onEdit(product)} className="p-2 text-neutral-400 hover:text-primary"><Edit size={16} /></button>
                <button onClick={() => onDuplicate(product)} className="p-2 text-neutral-400 hover:text-green-500"><Copy size={16} /></button>
                <button onClick={() => onDelete(product.id)} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
        </motion.div>
    );
});

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) { startPage = Math.max(1, endPage - maxPagesToShow + 1); }
    for (let i = startPage; i <= endPage; i++) { pageNumbers.push(i); }

    return (
        <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={20}/></button>
            {startPage > 1 && <span className="p-2">...</span>}
            {pageNumbers.map(num => <button key={num} onClick={() => onPageChange(num)} className={`px-4 py-2 rounded-md text-sm ${currentPage === num ? 'bg-primary text-white' : 'hover:bg-neutral-800'}`}>{num}</button>)}
            {endPage < totalPages && <span className="p-2">...</span>}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={20}/></button>
        </div>
    );
};

const ITEMS_PER_PAGE = 12;

const ManageInventory: React.FC = () => {
    const { seller } = useSellerAuth();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ status: 'all', stock: 'all', productType: 'all' });
    const [viewMode, setViewMode] = useState('grid');

    const fetchAllProducts = useCallback(async () => {
        if (!seller?.token) return;
        setIsLoading(true);
        let allFetchedProducts: Product[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
            try {
                const response = await api.Seller.GetProducts(seller.token, page);
                if (response.ok && response.body) {
                    const newProducts = response.body as Product[];
                    if (newProducts.length > 0) {
                        allFetchedProducts = [...allFetchedProducts, ...newProducts];
                        page++;
                    } else {
                        hasMore = false;
                    }
                } else {
                    setError('Failed to fetch products.');
                    hasMore = false;
                }
            } catch (err) {
                setError('An error occurred while fetching products.');
                hasMore = false;
            }
        }
        setAllProducts(allFetchedProducts);
        if (allFetchedProducts.length > 8) {
            setViewMode('list');
        }
        setIsLoading(false);
    }, [seller?.token]);

    useEffect(() => {
        fetchAllProducts();
    }, [fetchAllProducts]);

    const handleFilterChange = (filterType: keyof typeof filters, value: string) => { setFilters(prev => ({ ...prev, [filterType]: value })); setCurrentPage(1); };
    const clearFilters = () => { setFilters({ status: 'all', stock: 'all', productType: 'all' }); setIsFilterOpen(false); setCurrentPage(1); };

    const handleUpdateProduct = async (productId: string, data: Partial<Product>) => {
        if (!seller?.token) return;
        const originalProducts = [...allProducts];
        const productToUpdate = allProducts.find(p => p.id === productId);
        if (!productToUpdate) return;
        const updatedProduct = { ...productToUpdate, ...data };
        setAllProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        const response = await api.Seller.UpdateProduct(seller.token, updatedProduct);
        if (!response.ok) { alert('Failed to update product.'); setAllProducts(originalProducts); }
    };

    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => {
            const searchMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
            const currentGender = p.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase())) || '';
            const hasMetadata = p.product_type && currentGender;
            const status = !hasMetadata ? 'inactive' : (p.status || 'draft');
            const statusMatch = filters.status === 'all' || status === filters.status;
            const totalInventory = p.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0);
            const stockMatch = filters.stock === 'all' || (filters.stock === 'inStock' && totalInventory > 0) || (filters.stock === 'outOfStock' && totalInventory === 0);
            const typeMatch = filters.productType === 'all' || p.product_type === filters.productType;
            return searchMatch && statusMatch && stockMatch && typeMatch;
        });
    }, [allProducts, searchQuery, filters]);

    const totalPages = useMemo(() => Math.ceil(filteredProducts.length / ITEMS_PER_PAGE), [filteredProducts]);
    const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredProducts, currentPage]);

    const handleOpenEditorForCreate = () => { setEditingProduct(null); setIsEditorOpen(true); };
    const handleOpenEditorForUpdate = (product: Product) => { setEditingProduct(product); setIsEditorOpen(true); };
    const handleCloseEditor = () => { setIsEditorOpen(false); setEditingProduct(null); fetchAllProducts(); };
    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            if (!seller?.token) return;
            const response = await api.Seller.DeleteProduct(seller.token, productId);
            if (response.ok) { alert('Product deleted successfully'); fetchAllProducts(); } else { alert('Failed to delete product.'); }
        }
    };
    const handleDuplicateProduct = async (productToDuplicate: Product) => {
        if (!seller?.token || !window.confirm(`Are you sure you want to duplicate "${productToDuplicate.title}"?`)) return;
        const createPayload = { ...productToDuplicate, id: "", title: `Copy of ${productToDuplicate.title}` };
        const response = await api.Seller.CreateProduct(seller.token, createPayload as Product);
        if (response.ok) { alert('Product duplicated successfully!'); fetchAllProducts(); } else { alert(`Failed to duplicate product: ${response.body?.message || 'Unknown error'}`); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-white">Inventory ({filteredProducts.length})</h2>
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="relative flex-grow"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700 rounded-md pl-10 pr-4 py-2 w-full text-white focus:ring-primary focus:border-primary" /></div>
                    <div className="relative">
                        <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center space-x-2 bg-neutral-900/50 backdrop-blur-sm border border-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-800"><Filter size={16} /><span className="hidden sm:inline">Filters</span></button>
                        <AnimatePresence>{isFilterOpen && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-72 bg-neutral-900/80 backdrop-blur-md border border-neutral-700 rounded-md shadow-lg z-20 p-4 space-y-4">
                            <h4 className="font-semibold text-white">Filter By</h4>
                            <div><label className="text-sm text-neutral-400">Status</label><select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-2 text-sm border border-neutral-700 mt-1"><option value="all">All Statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="inactive">Inactive</option></select></div>
                            <div><label className="text-sm text-neutral-400">Stock</label><select value={filters.stock} onChange={e => handleFilterChange('stock', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-2 text-sm border border-neutral-700 mt-1"><option value="all">All Stock</option><option value="inStock">In Stock</option><option value="outOfStock">Out of Stock</option></select></div>
                            <div><label className="text-sm text-neutral-400">Product Type</label><select value={filters.productType} onChange={e => handleFilterChange('productType', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-2 text-sm border border-neutral-700 mt-1"><option value="all">All Types</option>{productTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800"><button onClick={clearFilters} className="text-sm text-neutral-400 hover:text-white px-3 py-1 rounded">Clear</button><button onClick={() => setIsFilterOpen(false)} className="text-sm bg-primary text-white px-4 py-1 rounded-md hover:bg-primary/90">Done</button></div>
                        </motion.div>)}</AnimatePresence>
                    </div>
                    <div className="flex items-center bg-neutral-900/50 backdrop-blur-sm border border-neutral-700 rounded-md"><button onClick={() => setViewMode('grid')} className={`p-2 rounded-l-md ${viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-neutral-800'}`}><Grid size={16}/></button><button onClick={() => setViewMode('list')} className={`p-2 rounded-r-md ${viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-neutral-800'}`}><List size={16}/></button></div>
                    <button onClick={handleOpenEditorForCreate} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex-shrink-0"><Plus size={20} /><span className="hidden sm:inline">Create</span></button>
                </div>
            </div>

            {isLoading ? (
                <p className="text-center text-neutral-400 py-12">Loading all products...</p>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                    {paginatedProducts.map(product => <ProductCard key={product.id} product={product} onEdit={handleOpenEditorForUpdate} onDelete={handleDeleteProduct} onDuplicate={handleDuplicateProduct} onUpdateProduct={handleUpdateProduct} />)}
                </div>
            ) : (
                <div className="space-y-4 mt-4">
                    {paginatedProducts.map(product => <ProductListItem key={product.id} product={product} onEdit={handleOpenEditorForUpdate} onDelete={handleDeleteProduct} onDuplicate={handleDuplicateProduct} onUpdateProduct={handleUpdateProduct} />)}
                </div>
            )}

            {!isLoading && filteredProducts.length === 0 && (
                <div className="text-center py-12 bg-neutral-900/50 backdrop-blur-sm border border-dashed border-neutral-700 rounded-lg mt-4">
                    <h3 className="mt-4 text-xl font-semibold text-white">No products match your filters</h3>
                    <p className="mt-1 text-neutral-400">Try adjusting your search or filters.</p>
                    <button onClick={clearFilters} className="mt-4 text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">Clear Filters</button>
                </div>
            )}

            {!isLoading && totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}

            <AnimatePresence>{isEditorOpen && <ProductEditor product={editingProduct} onClose={handleCloseEditor} />}</AnimatePresence>
        </motion.div>
    );
};

export default ManageInventory;
