import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { useSellerQueue } from '../../contexts/SellerQueueContext';
import * as api from '../../api/sellerApi';
import { Product, SizingGuide, QueueItem } from '../../constants/types';
import { productTypes } from '../../constants/sizing';
import { Plus, Edit, Trash2, Search, Filter, X, Copy, Globe, Link2, Link2Off, Loader, Package, RefreshCw, Ruler, Save, Upload, AlertTriangle, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductEditor from './ProductEditor';
import SizingGuideEditor from './SizingGuideEditor';
import ShopifyScrape from './ShopifyScrape';

interface InventoryDiagnostics {
    source: 'products' | 'queue';
    apiCount: number;
    uniqueCount: number;
    duplicateIds: string[];
    pagesLoaded?: number;
    sampleIds: string[];
}

const dedupeById = <T extends { id: string }>(items: T[]) => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const unique = items.filter((item) => {
        const id = String(item.id);
        if (seen.has(id)) {
            duplicates.push(id);
            return false;
        }
        seen.add(id);
        return true;
    });

    return { unique, duplicates };
};

const logInventoryDiagnostics = (label: string, items: Array<{ id: string; title?: string; updated_at?: string }>, duplicates: string[] = []) => {
    const ids = items.map((item) => String(item.id));
    console.groupCollapsed(`[inventory-debug] ${label}`);
    console.log('count', items.length);
    console.log('ids', ids);
    if (duplicates.length > 0) {
        console.warn('duplicate_ids', duplicates);
    }
    console.log('sample', items.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        updated_at: item.updated_at,
    })));
    console.groupEnd();
};

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

export const getTotalStock = (product: Product): number => {
    const variantTotal = product.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) ?? 0;
    if (variantTotal > 0) return variantTotal;
    return product.inventory?.quantity || 0;
};

const getQueueIssues = (product: Product, item: QueueItem) => {
    const missingFields: string[] = [];
    if (!product.title?.trim()) missingFields.push('Title');
    if (!product.product_type) missingFields.push('Product Type');
    const gender = product.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
    if (!gender) missingFields.push('Gender');
    const requiresSizing = Boolean(product.options?.find(option => option.name.toLowerCase() === 'size')?.values?.length);
    // Check sizing guide from multiple locations per API spec:
    // - product.sizing_guide (legacy/direct location)
    // - product.enrichment?.sizing_guide (mirrored location)
    // - item.enrichment?.sizing_guide (top-level authoritative location)
    const sizingGuide = product.sizing_guide?.size_chart
        || (product as any).enrichment?.sizing_guide
        || (item as any).enrichment?.sizing_guide;
    if (requiresSizing && (!sizingGuide || Object.keys(sizingGuide).length === 0)) {
        missingFields.push('Sizing Guide');
    }
    if (getTotalStock(product) <= 0) missingFields.push('Inventory');
    const apiErrors = item.errors || [];
    return { missingFields, apiErrors };
};

const statusTone = (status?: string) => {
    switch ((status || '').toLowerCase()) {
        case 'active':
        case 'ready':
        case 'promoted':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
        case 'draft':
        case 'queued':
        case 'synced':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
        case 'enrichment_pending':
        case 'embedding_pending':
            return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
        case 'failed':
        case 'inactive':
            return 'border-red-500/30 bg-red-500/10 text-red-300';
        default:
            return 'border-white/20 bg-white/5 text-neutral-300';
    }
};

const ProductRow: React.FC<{
    product: Product;
    selected: boolean;
    onSelect: (id: string, shift?: boolean) => void;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    onDuplicate: (product: Product) => void;
}> = React.memo(({ product, selected, onSelect, onEdit, onDelete, onDuplicate }) => {
    const totalInventory = useMemo(() => getTotalStock(product), [product]);
    const price = useMemo(() => {
        const defaultVariant = product.variants?.find(v => v.is_default);
        return defaultVariant?.price || product.pricing?.price || 0;
    }, [product.variants, product.pricing]);
    const status = product.status || 'draft';

    return (
        <tr className={`border-t border-white/10 ${selected ? 'bg-white/[0.04]' : ''}`}>
            <td className="px-3 py-2">
                <input type="checkbox" checked={selected} onChange={(e) => onSelect(product.id, e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey)} className="accent-[#f43f5e]" />
            </td>
            <td className="px-3 py-2">
                <div className="flex items-start gap-2">
                    <img src={getShopifyThumbnail(product.images?.[0], '100x100')} alt={product.title || 'Product'} className="h-10 w-10 rounded border border-white/10 object-cover" loading="lazy" decoding="async" />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-100">{product.title || 'Untitled product'}</p>
                        <p className="truncate text-[10px] text-neutral-500">{product.id}</p>
                    </div>
                </div>
            </td>
            <td className="px-3 py-2 text-neutral-300">{product.product_type || '-'}</td>
            <td className="px-3 py-2 text-neutral-300">
                Rs. {price.toLocaleString()}
                <p className="mt-1 text-[10px] text-neutral-500">{product.variants?.length || 0} variants</p>
            </td>
            <td className={`px-3 py-2 ${totalInventory > 0 ? 'text-neutral-300' : 'text-red-300'}`}>{totalInventory}</td>
            <td className="px-3 py-2">
                <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${statusTone(status)}`}>{status}</span>
            </td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(product)} className="rounded border border-white/15 p-2 text-neutral-200 hover:bg-white/10" title="Edit product"><Edit size={14} /></button>
                    <button onClick={() => onDuplicate(product)} className="rounded border border-white/15 p-2 text-neutral-200 hover:bg-white/10" title="Duplicate product"><Copy size={14} /></button>
                    <button onClick={() => onDelete(product.id)} className="rounded border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10" title="Delete product"><Trash2 size={14} /></button>
                </div>
            </td>
        </tr>
    );
});

const QueueRow: React.FC<{
    item: QueueItem;
    selected: boolean;
    onSelect: (id: string, shift?: boolean) => void;
    onEdit: (product: Product, queueId: string) => void;
    onPromote: (id: string) => void;
    onReject: (id: string, reason?: string) => void;
}> = ({ item, selected, onSelect, onEdit, onPromote, onReject }) => {
    const product = item.product;
    const { missingFields, apiErrors } = getQueueIssues(product, item);
    const totalStock = getTotalStock(product);
    const isOutOfStock = totalStock <= 0;
    const isReady = item.status === 'ready';

    return (
        <tr className={`border-t border-white/10 ${selected ? 'bg-white/[0.04]' : ''}`}>
            <td className="px-3 py-2">
                <input type="checkbox" checked={selected} onChange={(e) => onSelect(item.id, e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey)} className="accent-[#f43f5e]" />
            </td>
            <td className="px-3 py-2">
                <div className="flex items-start gap-2">
                    <img src={getShopifyThumbnail(product.images?.[0], '100x100')} alt={product.title || 'Draft'} className="h-10 w-10 rounded border border-white/10 object-cover" loading="lazy" decoding="async" />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-100">{product.title || 'Untitled product'}</p>
                        <p className="truncate text-[10px] text-neutral-500">{product.product_type || 'Type unset'} · {product.variants?.length || 0} variants</p>
                    </div>
                </div>
            </td>
            <td className="px-3 py-2">
                <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${statusTone(item.status)}`}>{item.status.replace(/_/g, ' ')}</span>
            </td>
            <td className="px-3 py-2">
                {missingFields.length === 0 && apiErrors.length === 0 ? (
                    <span className="text-neutral-500">-</span>
                ) : (
                    <div className="flex flex-wrap items-center gap-1">
                        <AlertTriangle size={12} className="text-red-300" />
                        {missingFields.map((field) => (
                            <span key={field} className="rounded border border-red-400/25 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">{field}</span>
                        ))}
                        {apiErrors.slice(0, 2).map((apiError, index) => (
                            <span key={`${apiError}-${index}`} className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-neutral-400">{apiError}</span>
                        ))}
                        {apiErrors.length > 2 ? <span className="text-[10px] text-neutral-500">+{apiErrors.length - 2} more</span> : null}
                    </div>
                )}
            </td>
            <td className={`px-3 py-2 ${isOutOfStock ? 'text-red-300' : 'text-neutral-300'}`}>{totalStock}</td>
            <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(product, item.id)} className="rounded border border-white/15 p-2 text-neutral-200 hover:bg-white/10" title={isOutOfStock ? 'Add stock' : 'Edit and fix'}><Edit size={14} /></button>
                    {isReady ? (
                        <button
                            onClick={() => onPromote(item.id)}
                            disabled={isOutOfStock}
                            title={isOutOfStock ? 'Set stock before publishing' : 'Publish product'}
                            className="rounded border border-emerald-400/25 p-2 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                            <UploadCloud size={14} />
                        </button>
                    ) : null}
                    <button
                        onClick={() => {
                            const reason = prompt('Reason for discarding? (optional)');
                            // Call reject regardless of reason - it's optional per API spec
                            onReject(item.id, reason || undefined);
                        }}
                        className="rounded border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10"
                        title="Discard draft"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => (
    <div className="mt-3 flex items-center justify-between px-3 pb-3 text-xs text-neutral-400">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="rounded border border-white/15 px-2 py-1 text-neutral-200 disabled:opacity-40">Prev</button>
            <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="rounded border border-white/15 px-2 py-1 text-neutral-200 disabled:opacity-40">Next</button>
        </div>
    </div>
);

const BulkSizingGuideModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    selectedProductIds: string[];
    allProducts: Product[];
    onSave: () => void;
}> = ({ isOpen, onClose, selectedProductIds, allProducts, onSave }) => {
    const { seller } = useSellerAuth();
    const [sizingGuide, setSizingGuide] = useState<SizingGuide>({
        size_chart: {},
        size_fit: '',
        measurement_unit: 'inch'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Calculate union of sizes
    const availableSizes = useMemo(() => {
        const sizes = new Set<string>();
        const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id));
        selectedProducts.forEach(product => {
            const sizeOption = product.options.find(o => o.name.toLowerCase() === 'size');
            sizeOption?.values.forEach(v => sizes.add(v));
        });
        return Array.from(sizes);
    }, [selectedProductIds, allProducts]);

    // Infer product type from selection (first selected)
    const inferredProductType = useMemo(() => {
        const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.id));
        if (selectedProducts.length > 0) return selectedProducts[0].product_type;
        return undefined;
    }, [selectedProductIds, allProducts]);

    const handleSave = async () => {
        if (!seller?.token) return;
        setIsSaving(true);
        try {
            const response = await api.Seller.UpdateProductSizingGuide(seller.token, selectedProductIds, sizingGuide);
            if (response.ok) {
                alert('Sizing guide updated for selected products!');
                onSave();
                onClose();
            } else {
                alert('Failed to update sizing guide.');
            }
        } catch (error) {
            alert('An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-lg border border-white/10 bg-[#121212] w-full max-w-3xl max-h-[90vh] flex flex-col"
            >
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">Bulk Update Sizing Guide</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><X /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    <p className="text-neutral-400 mb-6">
                        Updating sizing guide for {selectedProductIds.length} products. 
                        Detected sizes: {availableSizes.join(', ') || 'None'}
                    </p>
                    <SizingGuideEditor 
                        value={sizingGuide} 
                        onChange={setSizingGuide} 
                        productType={inferredProductType}
                        availableSizes={availableSizes}
                    />
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
                    >
                        {isSaving ? 'Saving...' : <><Save size={18} /> Apply to Selected</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const BulkAttributesModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    selectedProductIds: string[];
    onSave: (attributes: { product_type?: string, gender?: string }) => Promise<void>;
}> = ({ isOpen, onClose, selectedProductIds, onSave }) => {
    const [productType, setProductType] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave({ 
            product_type: productType || undefined, 
            gender: gender || undefined 
        });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-lg border border-white/10 bg-[#121212] w-full max-w-md flex flex-col"
            >
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">Bulk Update Attributes</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><X /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-neutral-400">
                        Updating {selectedProductIds.length} products. Leave fields empty to keep existing values.
                    </p>
                    
                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Product Type</label>
                        <select 
                            value={productType} 
                            onChange={(e) => setProductType(e.target.value)}
                            className="w-full rounded border border-white/20 bg-[#080808] p-2 text-xs text-neutral-100"
                        >
                            <option value="">No Change</option>
                            {productTypes.map(type => (
                                <option key={type} value={type} className="bg-neutral-900">{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Gender</label>
                        <select 
                            value={gender} 
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full rounded border border-white/20 bg-[#080808] p-2 text-xs text-neutral-100"
                        >
                            <option value="">No Change</option>
                            <option value="male" className="bg-neutral-900">Male</option>
                            <option value="female" className="bg-neutral-900">Female</option>
                            <option value="unisex" className="bg-neutral-900">Unisex</option>
                        </select>
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
                    >
                        {isSaving ? 'Saving...' : <><Save size={18} /> Update Products</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ImportProductsPanel: React.FC<{ onImported: () => void }> = ({ onImported }) => {
    const { seller } = useSellerAuth();
    const [status, setStatus] = useState<api.Shopify.ConnectionStatus | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [shopInput, setShopInput] = useState('');
    const [actionKey, setActionKey] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const loadStatus = useCallback(async () => {
        if (!seller?.token) return;
        setIsLoadingStatus(true);
        const response = await api.Shopify.GetStatus(seller.token);
        setStatus(response.ok ? (response.body as api.Shopify.ConnectionStatus) : null);
        setIsLoadingStatus(false);
    }, [seller?.token]);

    useEffect(() => { void loadStatus(); }, [loadStatus]);

    const connected = Boolean(status?.connected);
    const connectionType = status?.connection_type;

    const openOAuth = () => {
        const shop = shopInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
        if (!seller?.token || !shop) return setMessage({ type: 'error', text: 'Enter your Shopify store URL first.' });
        window.open(api.Shopify.GetAuthUrl(seller.token, shop), '_blank', 'noopener,noreferrer');
        setMessage({ type: 'info', text: 'Approve the connection in the new tab, then refresh this page.' });
    };

    const runSync = async () => {
        if (!seller?.token) return;
        setActionKey('sync');
        setMessage(null);
        const response = await api.Shopify.Sync(seller.token);
        setActionKey('');
        if (!response.ok) return setMessage({ type: 'error', text: 'Sync failed. Reconnect the store or try again shortly.' });
        setMessage({ type: 'success', text: `Sync completed. ${(response.body as api.Shopify.SyncResponse)?.count ?? 0} product(s) queued for review.` });
        onImported();
    };

    const disconnect = async () => {
        if (!seller?.token || !confirm('Disconnect your Shopify store?')) return;
        setActionKey('disconnect');
        setMessage(null);
        const response = await api.Shopify.Disconnect(seller.token);
        setActionKey('');
        if (!response.ok) return setMessage({ type: 'error', text: 'Disconnect failed. Please try again.' });
        setMessage({ type: 'success', text: 'Shopify store disconnected.' });
        void loadStatus();
    };

    return (
        <div className="space-y-4">
            <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        <div>
                            <h3 className="text-sm font-semibold">Shopify connection</h3>
                            <p className="mt-1 text-xs text-neutral-500">Imported products land in your draft queue for review before they go live.</p>
                        </div>
                    </div>
                    <span className={`rounded border px-2 py-1 text-[10px] uppercase tracking-[0.08em] ${connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/20 bg-white/5 text-neutral-400'}`}>
                        {isLoadingStatus ? 'Checking' : connected ? `${connectionType === 'active' ? 'OAuth' : 'Public'} · ${status?.shop || 'connected'}` : 'Not connected'}
                    </span>
                </div>

                {message ? (
                    <p className={`mt-3 rounded border px-3 py-2 text-xs ${message.type === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-300' : message.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-white/15 bg-[#0e0e0e] text-neutral-300'}`}>
                        {message.text}
                    </p>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                        Shopify store URL
                        <input
                            value={shopInput}
                            onChange={(event) => setShopInput(event.target.value)}
                            placeholder="your-store.myshopify.com"
                            className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500"
                        />
                    </label>
                    <div className="flex flex-wrap items-end gap-2">
                        <button onClick={openOAuth} className="inline-flex items-center gap-1 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100">
                            <Link2 size={13} /> Connect with OAuth
                        </button>
                        {connected && connectionType === 'active' ? (
                            <button onClick={() => void runSync()} disabled={!!actionKey} className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
                                {actionKey === 'sync' ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync products
                            </button>
                        ) : null}
                        {connected ? (
                            <button onClick={() => void disconnect()} disabled={!!actionKey} className="inline-flex items-center gap-1 rounded border border-red-400/25 px-3 py-2 text-xs text-red-300 disabled:opacity-40">
                                <Link2Off size={13} /> Disconnect
                            </button>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
                <div className="flex items-center gap-2">
                    <Upload size={16} className="text-primary" />
                    <div>
                        <h3 className="text-sm font-semibold">Public store scrape</h3>
                        <p className="mt-1 text-xs text-neutral-500">No OAuth needed. Pulls the public catalog of a Shopify storefront into your draft queue.</p>
                    </div>
                </div>
                <div className="mt-4">
                    <ShopifyScrape onScrapeComplete={(count) => {
                        setMessage({ type: 'success', text: `Scraped ${count} product${count === 1 ? '' : 's'} into your draft queue.` });
                        onImported();
                    }} />
                </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
                <p className="text-xs text-neutral-500">
                    WooCommerce and CSV imports are handled by Juno operations. Send your product export to your account manager and it will arrive in this queue.
                </p>
            </section>
        </div>
    );
};

type InventoryTab = 'active' | 'queue' | 'create' | 'import';

const ITEMS_PER_PAGE = 12;

const ManageInventory: React.FC = () => {
    const { seller } = useSellerAuth();
    const { refresh: refreshQueueContext, pendingCount: queuePendingCount } = useSellerQueue();
    const [activeTab, setActiveTab] = useState<InventoryTab>('active');
    
    // Active Products State
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    
    // Queue Items State
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [queueSearchQuery, setQueueSearchQuery] = useState('');
    const [queueStatusFilter, setQueueStatusFilter] = useState<'all' | 'queued' | 'synced' | 'enrichment_pending' | 'embedding_pending' | 'ready' | 'promoted' | 'failed'>('all');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    
    // Editor State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingQueueId, setEditingQueueId] = useState<string | undefined>(undefined);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ status: 'all', stock: 'all', productType: 'all' });
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [isBulkSizingModalOpen, setIsBulkSizingModalOpen] = useState(false);
    const [isBulkAttributesModalOpen, setIsBulkAttributesModalOpen] = useState(false);
    const [diagnostics, setDiagnostics] = useState<InventoryDiagnostics | null>(null);

    const fetchAllProducts = useCallback(async () => {
        if (!seller?.token) return;
        setIsLoading(true);
        setError(null);
        try {
            const pages: Product[][] = [];
            const seenIds = new Set<string>();
            const duplicateIds: string[] = [];
            let page = 1;
            let shouldContinue = true;

            while (shouldContinue && page <= 20) {
                const response = await api.Seller.GetProducts(seller.token, page);
                if (!response.ok || !Array.isArray(response.body)) {
                    if (page === 1) {
                        setError('Failed to fetch products.');
                    }
                    break;
                }

                const incoming = response.body as Product[];
                if (incoming.length === 0) {
                    break;
                }

                pages.push(incoming);

                const pageNewIds = incoming
                    .map((item) => String(item.id))
                    .filter((id) => {
                        if (seenIds.has(id)) {
                            duplicateIds.push(id);
                            return false;
                        }
                        seenIds.add(id);
                        return true;
                    });

                // Stop if the API ignores `page` and returns only already-seen rows.
                shouldContinue = pageNewIds.length > 0 && incoming.length >= ITEMS_PER_PAGE;
                page += 1;
            }

            const merged = pages.flat();
            const { unique, duplicates } = dedupeById(merged);
            logInventoryDiagnostics('products', unique.map((item) => ({ id: item.id, title: item.title, updated_at: item.updated_at })), [...duplicateIds, ...duplicates]);
            setDiagnostics({
                source: 'products',
                apiCount: merged.length,
                uniqueCount: unique.length,
                duplicateIds: [...duplicateIds, ...duplicates],
                pagesLoaded: pages.length,
                sampleIds: unique.slice(0, 8).map((item) => item.id),
            });
            setAllProducts(unique);
        } catch (err) {
            setError('An error occurred while fetching products.');
        } finally {
            setIsLoading(false);
        }
    }, [seller?.token]);

    const fetchQueueItems = useCallback(async () => {
        if (!seller?.token) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Seller.Queue.List(seller.token);
            if (response.ok && response.body) {
                const sorted = [...(response.body as QueueItem[])].sort((a, b) => 
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                );
                const { unique, duplicates } = dedupeById(sorted);
                logInventoryDiagnostics(
                    'queue',
                    unique.map((item) => ({ id: item.id, title: item.product?.title, updated_at: item.updated_at })),
                    duplicates,
                );
                setDiagnostics({
                    source: 'queue',
                    apiCount: sorted.length,
                    uniqueCount: unique.length,
                    duplicateIds: duplicates,
                    sampleIds: unique.slice(0, 8).map((item) => item.id),
                });
                setQueueItems(unique);
            } else {
                setError('Failed to fetch products.');
            }
        } catch (err) {
            setError('An error occurred while fetching queue items.');
        } finally {
            setIsLoading(false);
        }
    }, [seller?.token]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedProductIds(new Set());
        if (activeTab === 'active') {
            fetchAllProducts();
        } else if (activeTab === 'queue') {
            fetchQueueItems();
        }
    }, [activeTab, fetchAllProducts, fetchQueueItems]);

    useEffect(() => {
        setLastSelectedIndex(null);
    }, [currentPage, searchQuery, queueSearchQuery, queueStatusFilter, filters, activeTab]);

    const handleFilterChange = (filterType: keyof typeof filters, value: string) => { setFilters(prev => ({ ...prev, [filterType]: value })); setCurrentPage(1); };
    const isDataTab = activeTab === 'active' || activeTab === 'queue';
    const clearFilters = () => { setFilters({ status: 'all', stock: 'all', productType: 'all' }); setIsFilterOpen(false); setCurrentPage(1); };

    const filteredProducts = useMemo(() => {
        return allProducts
            .filter(p => {
                const searchMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
                const statusMatch = filters.status === 'all' || (p.status || 'draft') === filters.status;
                const totalInventory = p.variants.reduce((total, v) => total + (v.inventory?.quantity || 0), 0);
                const stockMatch = filters.stock === 'all' || (filters.stock === 'inStock' && totalInventory > 0) || (filters.stock === 'outOfStock' && totalInventory === 0);
                const typeMatch = filters.productType === 'all' || p.product_type === filters.productType;
                return searchMatch && statusMatch && stockMatch && typeMatch;
            })
            .sort((a, b) => {
                const getPriority = (p: Product) => {
                    const status = p.status || 'draft';
                    if (status === 'active') return 0;
                    if (status === 'archived') return 2;
                    return 1;
                };
                return getPriority(a) - getPriority(b);
            });
    }, [allProducts, searchQuery, filters]);

    const totalPages = useMemo(() => Math.ceil(filteredProducts.length / ITEMS_PER_PAGE), [filteredProducts]);
    const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredProducts, currentPage]);

    const filteredQueueItems = useMemo(() => {
        return queueItems.filter((item) => {
            const query = queueSearchQuery.trim().toLowerCase();
            const matchesQuery = !query
                || item.product?.title?.toLowerCase().includes(query)
                || item.product?.handle?.toLowerCase().includes(query);
            const matchesStatus = queueStatusFilter === 'all' || item.status === queueStatusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [queueItems, queueSearchQuery, queueStatusFilter]);

    const paginatedQueueItems = useMemo(
        () => filteredQueueItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [filteredQueueItems, currentPage],
    );
    const queueTotalPages = useMemo(() => Math.ceil(filteredQueueItems.length / ITEMS_PER_PAGE), [filteredQueueItems.length]);

    const handleOpenEditorForCreate = () => { 
        setEditingProduct(null); 
        setEditingQueueId(undefined);
        setIsEditorOpen(true); 
    };
    
    const handleOpenEditorForUpdate = (product: Product) => { 
        setEditingProduct(product); 
        setEditingQueueId(undefined);
        setIsEditorOpen(true); 
    };

    const handleOpenEditorForQueue = (product: Product, queueId: string) => {
        setEditingProduct(product);
        setEditingQueueId(queueId);
        setIsEditorOpen(true);
    };

    const handleCloseEditor = () => { 
        setIsEditorOpen(false); 
        setEditingProduct(null); 
        setEditingQueueId(undefined);
        if (activeTab === 'active') fetchAllProducts();
        else fetchQueueItems();
    };

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
        if (response.ok) { alert('Product duplicated (added to queue)!'); fetchQueueItems(); setActiveTab('queue'); } else { alert(`Failed to duplicate product: ${response.body?.message || 'Unknown error'}`); }
    };

    const handleSelectProduct = (id: string, shiftPressed: boolean = false) => {
        const items = activeTab === 'active' ? paginatedProducts : paginatedQueueItems;
        const currentIndex = items.findIndex(item => (activeTab === 'active' ? (item as Product).id : (item as QueueItem).id) === id);
        
        if (shiftPressed && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, currentIndex);
            const end = Math.max(lastSelectedIndex, currentIndex);
            const rangeIds = items.slice(start, end + 1).map(item => (activeTab === 'active' ? (item as Product).id : (item as QueueItem).id));
            
            setSelectedProductIds(prev => {
                const newSet = new Set(prev);
                rangeIds.forEach(rangeId => newSet.add(rangeId));
                return newSet;
            });
        } else {
            setSelectedProductIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        }
        setLastSelectedIndex(currentIndex);
    };

    const handleSelectAll = () => {
        const items = activeTab === 'active' ? filteredProducts : filteredQueueItems;
        const itemIds = items.map(item => (activeTab === 'active' ? (item as Product).id : (item as QueueItem).id));
        
        if (selectedProductIds.size === itemIds.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(itemIds));
        }
    };

    const handleBulkSizingGuide = () => {
        setIsBulkSizingModalOpen(true);
    };

    const handleBulkAttributes = () => {
        setIsBulkAttributesModalOpen(true);
    };

    const handleBulkAttributesSave = async (attributes: { product_type?: string, gender?: string }) => {
        if (!seller?.token) return;

        const updates = Array.from(selectedProductIds).map(async (id) => {
            let product: Product | undefined;
            let queueId: string | undefined;

            if (activeTab === 'active') {
                product = allProducts.find(p => p.id === id);
            } else {
                const qItem = queueItems.find(item => item.id === id);
                if (qItem) {
                    product = qItem.product;
                    queueId = qItem.id;
                }
            }
            if (!product) return;

            const updatedData: Partial<Product> = {};

            if (attributes.product_type) {
                updatedData.product_type = attributes.product_type;
            }

            if (attributes.gender) {
                const otherTags = product.tags?.filter(t => !['male', 'female', 'unisex'].includes(t.toLowerCase())) || [];
                updatedData.tags = [...otherTags, attributes.gender];
            }

            if (Object.keys(updatedData).length === 0) return;

            const finalProduct = { ...product, ...updatedData };

            if (activeTab === 'active') {
                return api.Seller.UpdateProduct(seller.token!, finalProduct);
            } else {
                // Per API spec: PUT /seller/queue/{id} takes catalog product payload directly
                // Include enrichment to update both queue_item.enrichment and queue_item.product.enrichment
                const qItem = queueItems.find(item => item.id === id);
                const existingEnrichment = (qItem as any)?.enrichment || (qItem?.product as any)?.enrichment || {};
                const hasProductType = attributes.product_type || existingEnrichment.product_type || finalProduct.product_type;
                const hasGender = attributes.gender || existingEnrichment.gender || finalProduct.tags?.find((t: string) => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
                const enrichmentPayload = hasProductType && hasGender ? {
                    product_type: hasProductType,
                    gender: hasGender,
                    sizing_guide: finalProduct.sizing_guide || existingEnrichment.sizing_guide || {},
                } : null;

                const queueUpdatePayload = {
                    ...finalProduct,
                    ...(enrichmentPayload ? { enrichment: enrichmentPayload } : {}),
                };

                const updateRes = await api.Seller.Queue.Update(seller.token!, queueId!, queueUpdatePayload);
                // PUT /seller/queue/{id} leaves the queue FSM untouched. Explicit enrich
                // is the only path to status=ready, which Promote requires.
                if (updateRes.ok && enrichmentPayload) {
                    await api.Seller.Queue.Enrich(seller.token!, queueId!, enrichmentPayload);
                }
                return updateRes;
            }
        });

        await Promise.all(updates);

        setSelectedProductIds(new Set());
        if (activeTab === 'active') fetchAllProducts();
        else {
            fetchQueueItems();
            refreshQueueContext();
        }
        alert('Items updated successfully!');
    };

    const handlePromoteQueueItem = async (id: string) => {
        if (!seller?.token) return;

        const qItem = queueItems.find(item => item.id === id);
        if (qItem && getTotalStock(qItem.product) <= 0) {
            alert('This product has 0 stock. Update inventory levels for at least one variant before publishing.');
            setEditingProduct(qItem.product);
            setEditingQueueId(qItem.id);
            setIsEditorOpen(true);
            return;
        }

        if (!window.confirm("Are you sure you want to publish this product?")) return;

        // Promote requires queue status=ready. That only happens via PUT /seller/queue/{id}/enrich —
        // not via Queue.Update. Run enrich preflight if the item isn't ready yet.
        if (qItem && qItem.status !== 'ready' && qItem.status !== 'promoted') {
            const existingEnrichment = (qItem as any)?.enrichment || (qItem.product as any)?.enrichment || {};
            const product = qItem.product;
            const product_type = existingEnrichment.product_type || product.product_type;
            const gender = existingEnrichment.gender || product.tags?.find((t: string) => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
            const sizing_guide = product.sizing_guide || existingEnrichment.sizing_guide || {};

            if (!product_type || !gender) {
                alert('Missing product type or gender. Edit the draft and set both before publishing.');
                return;
            }

            const enrichRes = await api.Seller.Queue.Enrich(seller.token, id, { product_type, gender, sizing_guide });
            if (!enrichRes.ok) {
                alert(`Failed to prepare product for publish. ${JSON.stringify(enrichRes.body)}`);
                return;
            }
        }

        const response = await api.Seller.Queue.Promote(seller.token, id);
        if (response.ok) {
            alert("Product published successfully!");
            fetchQueueItems();
            refreshQueueContext();
        } else {
            alert(`Failed to publish product. Message = ${JSON.stringify(response.body)}`);
        }
    };

    const handleRejectQueueItemWithReason = async (id: string, reason?: string) => {
        if (!seller?.token) return;
        try {
            const response = await api.Seller.Queue.Reject(seller.token, id, reason || "Discarded by seller");
            if (response.ok) {
                await fetchQueueItems();
                refreshQueueContext();
            } else {
                const errorMsg = typeof response.body === 'object' && response.body?.message 
                    ? response.body.message 
                    : "Failed to discard item.";
                alert(`Rejection failed: ${errorMsg}`);
                console.error('Reject response:', response);
            }
        } catch (error) {
            console.error('Error rejecting item:', error);
            alert("An error occurred while rejecting the item.");
        }
    }

    const inventoryItems = activeTab === 'active' ? allProducts : filteredQueueItems.map(item => item.product);
    const sizeGuideCoverage = inventoryItems.length > 0
        ? Math.round((inventoryItems.filter(product => {
            const chart = product.sizing_guide?.size_chart;
            return chart && Object.keys(chart).length > 0;
        }).length / inventoryItems.length) * 100)
        : 0;
    const readyCoreFields = inventoryItems.filter(product => {
        const totalInventory = product.variants?.reduce((total, variant) => total + (variant.inventory?.quantity || 0), 0) ?? 0;
        const price = product.variants?.find(variant => variant.is_default)?.price || product.pricing?.price || 0;
        return Boolean(product.title?.trim()) && price > 0 && totalInventory > 0;
    }).length;

    if (isEditorOpen) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full">
                <ProductEditor
                    product={editingProduct}
                    queueId={editingQueueId}
                    onClose={handleCloseEditor}
                />
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4 text-neutral-100">
            <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary" />
                        <div>
                            <h2 className="text-base font-semibold">Inventory Management</h2>
                            <p className="text-xs text-neutral-500">Your catalog, drafts, and stock in one workspace. Publish only what is ready.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTab('create')} className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90">
                            <Plus size={13} /> Add product
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                    <button
                        onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeTab === 'active' ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}
                    >
                        Active products {allProducts.length}
                    </button>
                    <button
                        onClick={() => { setActiveTab('queue'); setCurrentPage(1); }}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeTab === 'queue' ? 'bg-white text-black' : queuePendingCount > 0 ? 'text-primary hover:bg-primary/10' : 'text-neutral-300 hover:bg-white/10'}`}
                    >
                        Drafts and queue {queuePendingCount}
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeTab === 'create' ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}
                    >
                        Create product
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${activeTab === 'import' ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}
                    >
                        Import products
                    </button>
                </div>

                {isDataTab ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                    <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                        {activeTab === 'active' ? 'Search catalog' : 'Search drafts'}
                        <div className="relative mt-1">
                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
                            {activeTab === 'active' ? (
                                <input
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    placeholder="Search by product title"
                                    className="w-full rounded border border-white/20 bg-[#080808] py-2 pl-7 pr-3 text-xs text-neutral-100 placeholder:text-neutral-500"
                                />
                            ) : (
                                <input
                                    value={queueSearchQuery}
                                    onChange={(e) => { setQueueSearchQuery(e.target.value); setCurrentPage(1); }}
                                    placeholder="Search drafts"
                                    className="w-full rounded border border-white/20 bg-[#080808] py-2 pl-7 pr-3 text-xs text-neutral-100 placeholder:text-neutral-500"
                                />
                            )}
                        </div>
                    </label>
                    <div className="flex items-end gap-2">
                        {activeTab === 'active' ? (
                            <button onClick={() => setIsFilterOpen((prev) => !prev)} className="inline-flex items-center gap-1 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100">
                                <Filter size={13} /> {isFilterOpen ? 'Hide filters' : 'Filters'}
                            </button>
                        ) : (
                            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                                Draft status
                                <select
                                    value={queueStatusFilter}
                                    onChange={(e) => { setQueueStatusFilter(e.target.value as typeof queueStatusFilter); setCurrentPage(1); }}
                                    className="mt-1 block w-44 rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]"
                                >
                                    <option value="all">All draft statuses</option>
                                    <option value="queued">Queued</option>
                                    <option value="synced">Synced</option>
                                    <option value="enrichment_pending">Enrichment pending</option>
                                    <option value="embedding_pending">Embedding pending</option>
                                    <option value="ready">Ready</option>
                                    <option value="promoted">Promoted</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </label>
                        )}
                    </div>
                </div>
                ) : null}

                {isDataTab ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                    <span>Core ready {readyCoreFields}/{inventoryItems.length || 0}</span>
                    <span>Size guides {sizeGuideCoverage}%</span>
                    <span>Draft queue {queuePendingCount}</span>
                    <span>Rows {diagnostics?.uniqueCount ?? 0}</span>
                    {diagnostics && diagnostics.duplicateIds.length > 0 ? <span className="text-red-300">Duplicates {diagnostics.duplicateIds.length}</span> : null}
                </div>
                ) : null}

                {activeTab === 'active' && isFilterOpen ? (
                    <div className="mt-4 grid gap-3 rounded-lg border border-white/10 bg-[#0e0e0e] p-4 md:grid-cols-3">
                        <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                            Status
                            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>
                        <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                            Stock
                            <select value={filters.stock} onChange={(e) => handleFilterChange('stock', e.target.value)} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                                <option value="all">All stock</option>
                                <option value="inStock">In stock</option>
                                <option value="outOfStock">Out of stock</option>
                            </select>
                        </label>
                        <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                            Product type
                            <select value={filters.productType} onChange={(e) => handleFilterChange('productType', e.target.value)} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                                <option value="all">All types</option>
                                {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </label>
                        <div className="flex items-center gap-2 md:col-span-3">
                            <button onClick={clearFilters} className="rounded border border-white/15 px-3 py-2 text-xs text-neutral-300">Reset</button>
                            <button onClick={() => setIsFilterOpen(false)} className="rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100">Done</button>
                        </div>
                    </div>
                ) : null}
            </section>

            {activeTab === 'create' ? (
                <ProductEditor product={null} onClose={() => { setActiveTab('active'); void fetchAllProducts(); void refreshQueueContext(); }} />
            ) : null}

            {activeTab === 'import' ? (
                <ImportProductsPanel onImported={() => { void refreshQueueContext(); setActiveTab('queue'); }} />
            ) : null}

            {isDataTab ? (
            <section className="rounded-lg border border-white/10 bg-[#121212] p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleSelectAll} className="rounded border border-white/15 bg-[#1a1a1a] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-neutral-100">
                            {selectedProductIds.size === (activeTab === 'active' ? filteredProducts.length : filteredQueueItems.length) && (activeTab === 'active' ? filteredProducts.length : filteredQueueItems.length) > 0 ? 'Clear page selection' : 'Select all'}
                        </button>
                        <button onClick={() => setSelectedProductIds(new Set())} className="rounded border border-white/15 bg-[#0b0b0b] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">Clear</button>
                        <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">{selectedProductIds.size} selected</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleBulkSizingGuide} disabled={selectedProductIds.size === 0} className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-100 disabled:opacity-40">
                            <Ruler size={13} /> Set sizing guide
                        </button>
                        <button onClick={handleBulkAttributes} disabled={selectedProductIds.size === 0} className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-100 disabled:opacity-40">
                            <Edit size={13} /> Bulk edit
                        </button>
                    </div>
                </div>
            </section>
            ) : null}

            {isDataTab ? (
            <section className="rounded-lg border border-white/10 bg-[#121212] p-2">
                {isLoading ? (
                    <div className="p-6 text-sm text-neutral-400">Loading products...</div>
                ) : activeTab === 'active' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead className="bg-[#0f0f0f] text-neutral-400">
                                <tr>
                                    <th className="w-9 px-3 py-2 font-medium" />
                                    <th className="px-3 py-2 font-medium">Product</th>
                                    <th className="px-3 py-2 font-medium">Type</th>
                                    <th className="px-3 py-2 font-medium">Price</th>
                                    <th className="px-3 py-2 font-medium">Stock</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.map(product => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        selected={selectedProductIds.has(product.id)}
                                        onSelect={handleSelectProduct}
                                        onEdit={handleOpenEditorForUpdate}
                                        onDelete={handleDeleteProduct}
                                        onDuplicate={handleDuplicateProduct}
                                    />
                                ))}
                            </tbody>
                        </table>
                        {filteredProducts.length === 0 ? (
                            <div className="p-4 text-xs text-neutral-500">
                                No products match your filters.
                                <button onClick={clearFilters} className="ml-2 rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-200">Reset filters</button>
                            </div>
                        ) : null}
                        {totalPages > 1 ? <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /> : null}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead className="bg-[#0f0f0f] text-neutral-400">
                                <tr>
                                    <th className="w-9 px-3 py-2 font-medium" />
                                    <th className="px-3 py-2 font-medium">Draft</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">Blocking issues</th>
                                    <th className="px-3 py-2 font-medium">Stock</th>
                                    <th className="px-3 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedQueueItems.map(item => (
                                    <QueueRow
                                        key={item.id}
                                        item={item}
                                        selected={selectedProductIds.has(item.id)}
                                        onSelect={handleSelectProduct}
                                        onEdit={handleOpenEditorForQueue}
                                        onPromote={handlePromoteQueueItem}
                                        onReject={(id, reason) => handleRejectQueueItemWithReason(id, reason)}
                                    />
                                ))}
                            </tbody>
                        </table>
                        {filteredQueueItems.length === 0 ? (
                            <div className="p-4 text-xs text-neutral-500">
                                No drafts match your query.
                                <button onClick={handleOpenEditorForCreate} className="ml-2 rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-200">Upload product</button>
                            </div>
                        ) : null}
                        {queueTotalPages > 1 ? <Pagination currentPage={currentPage} totalPages={queueTotalPages} onPageChange={setCurrentPage} /> : null}
                    </div>
                )}
            </section>
            ) : null}

            <AnimatePresence>
                {isBulkSizingModalOpen && (
                    <BulkSizingGuideModal 
                        isOpen={isBulkSizingModalOpen} 
                        onClose={() => setIsBulkSizingModalOpen(false)} 
                        selectedProductIds={Array.from(selectedProductIds)}
                        allProducts={activeTab === 'active' ? allProducts : queueItems.map(it => it.product)}
                        onSave={() => {
                            setSelectedProductIds(new Set());
                            if (activeTab === 'active') fetchAllProducts();
                            else fetchQueueItems();
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isBulkAttributesModalOpen && (
                    <BulkAttributesModal 
                        isOpen={isBulkAttributesModalOpen} 
                        onClose={() => setIsBulkAttributesModalOpen(false)} 
                        selectedProductIds={Array.from(selectedProductIds)}
                        onSave={handleBulkAttributesSave}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ManageInventory;
