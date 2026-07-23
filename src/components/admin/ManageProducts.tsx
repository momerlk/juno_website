import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Package, RefreshCw, Ruler, Search, Sparkles, Trash2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminPortal } from '../../api/adminApi';
import {
  BADGE_LABELS,
  EMPTY_BADGES,
  asArray,
  badgeTone,
  formatCurrency,
  getImageUrl,
  getSellerId,
  getSellerName,
  normalizeBadges,
  parseTags,
  statusClass,
  type BadgeKey,
  type CatalogStatus,
  type ProductBadges,
  type SellerProfile,
} from './productManagement';
import { uploadFileAndGetUrl } from '../../api/shared';
import type { SizingGuide } from '../../constants/types';

interface CatalogEditDraft {
  title: string;
  description: string;
  status: string;
  is_featured: boolean;
  tagsInput: string;
  badges: ProductBadges;
}

interface ProductFilters {
  status: string;
  seller_id: string;
  seller_ids: string;
  brands: string;
  category: string;
  min_price: string;
  max_price: string;
  in_stock: string;
  sort: string;
  order: 'asc' | 'desc';
  departments: string;
  product_groups: string;
  genders: string;
  style_categories: string;
  aesthetics: string;
  occasions: string;
  materials: string;
  color_families: string;
  fits: string;
  patterns: string;
  collection_ids: string;
  validation_status: string;
}

const PAGE_SIZE = 50;
const PRODUCT_STATUS_OPTIONS = ['active', 'draft', 'queue', 'embedding_pending', 'needs_review', 'rejected', 'archived'];
const EMPTY_SIZE_CHART: SizingGuide = { size_chart: {}, size_fit: '', measurement_unit: 'inch' };

const EMPTY_FILTERS: ProductFilters = {
  status: 'all',
  seller_id: '',
  seller_ids: '',
  brands: '',
  category: '',
  min_price: '',
  max_price: '',
  in_stock: '',
  sort: 'created_at',
  order: 'desc',
  departments: '',
  product_groups: '',
  genders: '',
  style_categories: '',
  aesthetics: '',
  occasions: '',
  materials: '',
  color_families: '',
  fits: '',
  patterns: '',
  collection_ids: '',
  validation_status: '',
};

const csvToArray = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const selectedValues = (value: string, fallback?: string) => {
  const values = csvToArray(value);
  return values.length ? values : fallback ? [fallback] : [];
};

const buildListParams = (filters: ProductFilters, page: number) => {
  const params: Record<string, string | number | boolean | undefined> = {
    status: filters.status || 'all',
    seller_id: filters.seller_id || undefined,
    seller_ids: filters.seller_ids || undefined,
    brands: filters.brands || undefined,
    category: filters.category || undefined,
    min_price: filters.min_price ? Number(filters.min_price) : undefined,
    max_price: filters.max_price ? Number(filters.max_price) : undefined,
    in_stock: filters.in_stock === '' ? undefined : filters.in_stock === 'true',
    sort: filters.sort || 'created_at',
    order: filters.order,
    departments: filters.departments || undefined,
    product_groups: filters.product_groups || undefined,
    genders: filters.genders || undefined,
    style_categories: filters.style_categories || undefined,
    aesthetics: filters.aesthetics || undefined,
    occasions: filters.occasions || undefined,
    materials: filters.materials || undefined,
    color_families: filters.color_families || undefined,
    fits: filters.fits || undefined,
    patterns: filters.patterns || undefined,
    collection_ids: filters.collection_ids || undefined,
    validation_status: filters.validation_status || undefined,
    page,
    limit: PAGE_SIZE,
  };
  return params;
};

const ManageProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkFeatured, setBulkFeatured] = useState<string>('');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkSizeChart, setBulkSizeChart] = useState<SizingGuide>(EMPTY_SIZE_CHART);
  const [editId, setEditId] = useState('');
  const [editDraft, setEditDraft] = useState<CatalogEditDraft>({
    title: '',
    description: '',
    status: 'active',
    is_featured: false,
    tagsInput: '',
    badges: { ...EMPTY_BADGES },
  });
  const [editError, setEditError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [resultMeta, setResultMeta] = useState<{ total?: number; mode: 'list' | 'ai' }>({ mode: 'list' });

  const pageIds = useMemo(() => products.map((product) => String(product.id || '')).filter(Boolean), [products]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const selectedCount = selectedIds.length;

  const loadSellers = async () => {
    const sellersRes = await AdminPortal.listSellers({ limit: 500 });
    if (sellersRes.ok) setSellers(asArray(sellersRes.body));
  };

  const fetchProducts = async (nextPage = page) => {
    setIsLoading(true);
    setError('');
    try {
      const usingAI = aiQuery.trim().length > 0;
      const response = usingAI
        ? await AdminPortal.searchProducts({
            ...buildListParams(filters, nextPage),
            keyword: aiQuery.trim(),
          })
        : await AdminPortal.listProducts(buildListParams(filters, nextPage));
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to load products');
      const body = response.body as any;
      const rows = asArray(body);
      const meta = body?.meta?.pagination || body?.pagination || {};
      setProducts(rows);
      setTotalPages(Math.max(1, Number(meta.total_pages || meta.pages || (rows.length === PAGE_SIZE ? nextPage + 1 : nextPage)) || 1));
      setResultMeta({
        total: typeof meta.total === 'number' ? meta.total : undefined,
        mode: usingAI ? 'ai' : 'list',
      });
      setSelectedIds([]);
      setLastSelectedIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadSellers(), fetchProducts(1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters, aiQuery]);

  useEffect(() => {
    void fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const haystack = [
        product.id,
        product.title,
        product.seller_name,
        product.seller_id,
        product.status,
        Array.isArray(product.tags) ? product.tags.join(' ') : '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [products, searchTerm]);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAiQuery('');
    setPage(1);
    void fetchProducts(1);
  };

  const applySearch = () => {
    setPage(1);
    void fetchProducts(1);
  };

  const toggleSelection = (product: any, pageIndex: number, event?: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    const productId = String(product.id || '');
    if (!productId) return;
    const shiftKey = Boolean((event as React.MouseEvent | undefined)?.shiftKey || ((event as React.ChangeEvent<HTMLInputElement> | undefined)?.nativeEvent instanceof MouseEvent && (event as React.ChangeEvent<HTMLInputElement>).nativeEvent.shiftKey));
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, pageIndex);
      const end = Math.max(lastSelectedIndex, pageIndex);
      const ids = filteredProducts.slice(start, end + 1).map((row) => String(row.id || '')).filter(Boolean);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
    }
    setLastSelectedIndex(pageIndex);
  };

  const togglePageSelection = () => {
    setSelectedIds((prev) => {
      if (allPageSelected) return prev.filter((id) => !pageIds.includes(id));
      return Array.from(new Set([...prev, ...pageIds]));
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target?.isContentEditable);
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'a' || isTyping) return;
      event.preventDefault();
      setSelectedIds(event.shiftKey ? [] : pageIds);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pageIds]);

  const openEdit = (product: any) => {
    setEditId(String(product.id || ''));
    setEditError('');
    setEditDraft({
      title: String(product.title || ''),
      description: String(product.description || ''),
      status: String(product.status || 'active'),
      is_featured: Boolean(product.is_featured),
      tagsInput: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      badges: normalizeBadges(product.badges),
    });
  };

  const closeEdit = () => {
    setEditId('');
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editId || !editDraft.title.trim()) {
      setEditError('Title is required.');
      return;
    }
    setActionKey(`${editId}:save`);
    setEditError('');
    try {
      const response = await AdminPortal.updateProduct(editId, {
        title: editDraft.title.trim(),
        description: editDraft.description.trim(),
        status: editDraft.status,
        is_featured: editDraft.is_featured,
        tags: parseTags(editDraft.tagsInput),
        badges: editDraft.badges,
      });
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to update product');
      await fetchProducts(page);
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setActionKey('');
    }
  };

  const deleteProduct = async (product: any) => {
    if (!window.confirm(`Delete "${product.title || product.id}"?`)) return;
    setActionKey(`${product.id}:delete`);
    try {
      const response = await AdminPortal.deleteProduct(String(product.id || ''));
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to delete product');
      await fetchProducts(page);
      if (editId === String(product.id || '')) closeEdit();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setActionKey('');
    }
  };

  const bulkPatch = async () => {
    if (selectedIds.length === 0) return;
    const update: Record<string, any> = {};
    if (bulkStatus) update.status = bulkStatus;
    if (bulkFeatured !== '') update.is_featured = bulkFeatured === 'true';
    const tags = parseTags(bulkTags);
    if (tags.length > 0) update.tags = tags;
    if (Object.keys(update).length === 0) return;
    setActionKey('bulk-update');
    try {
      const response = await AdminPortal.bulkUpdateProducts({ product_ids: selectedIds, update });
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to update selected products');
      setBulkStatus('');
      setBulkFeatured('');
      setBulkTags('');
      setSelectedIds([]);
      await fetchProducts(page);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to update selected products');
    } finally {
      setActionKey('');
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;
    setActionKey('bulk-delete');
    try {
      const response = await AdminPortal.bulkDeleteProducts({ product_ids: selectedIds });
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to delete selected products');
      setSelectedIds([]);
      await fetchProducts(page);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to delete selected products');
    } finally {
      setActionKey('');
    }
  };

  const uploadBulkSizeChart = async (file: File) => {
    setActionKey('bulk-size-chart-upload');
    try {
      const image_url = await uploadFileAndGetUrl(file, 'high_quality');
      setBulkSizeChart((chart) => ({ ...chart, image_url }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to upload size chart');
    } finally {
      setActionKey('');
    }
  };

  const bulkAssignSizeChart = async () => {
    if (!selectedIds.length || (!bulkSizeChart.image_url?.trim() && !bulkSizeChart.html_table?.trim())) return;
    if (!window.confirm(`Replace the size chart on ${selectedIds.length} selected product(s)?`)) return;
    setActionKey('bulk-size-chart');
    try {
      const response = await AdminPortal.bulkAssignSizeChart({
        product_ids: selectedIds,
        sizing_guide: {
          ...(bulkSizeChart.image_url?.trim() ? { image_url: bulkSizeChart.image_url.trim() } : {}),
          ...(bulkSizeChart.html_table?.trim() ? { html_table: bulkSizeChart.html_table.trim() } : {}),
          measurement_unit: bulkSizeChart.measurement_unit,
        },
      });
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to assign size chart');
      setBulkSizeChart(EMPTY_SIZE_CHART);
      setSelectedIds([]);
      await fetchProducts(page);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to assign size chart');
    } finally {
      setActionKey('');
    }
  };

  const metadataInputs: Array<{ key: keyof ProductFilters; label: string; placeholder: string }> = [
    { key: 'seller_ids', label: 'Seller IDs', placeholder: 'seller-1, seller-2' },
    { key: 'brands', label: 'Brands', placeholder: 'Luna Atelier, Manto' },
    { key: 'category', label: 'Category', placeholder: 'Category id' },
    { key: 'departments', label: 'Departments', placeholder: 'women, men' },
    { key: 'product_groups', label: 'Product groups', placeholder: 'ready-to-wear, thrift' },
    { key: 'genders', label: 'Genders', placeholder: 'female, unisex' },
    { key: 'style_categories', label: 'Style categories', placeholder: 'minimal, festive' },
    { key: 'aesthetics', label: 'Aesthetics', placeholder: 'clean girl, vintage' },
    { key: 'occasions', label: 'Occasions', placeholder: 'eid, workwear' },
    { key: 'materials', label: 'Materials', placeholder: 'lawn, cotton' },
    { key: 'color_families', label: 'Color families', placeholder: 'black, beige' },
    { key: 'fits', label: 'Fits', placeholder: 'relaxed, tailored' },
    { key: 'patterns', label: 'Patterns', placeholder: 'solid, floral' },
    { key: 'collection_ids', label: 'Collection IDs', placeholder: 'collection-1, collection-2' },
    { key: 'validation_status', label: 'Validation status', placeholder: 'approved, pending' },
  ];

  return (
    <div className="mt-4 space-y-4 text-neutral-100">
      <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold">Product Management</h2>
              <p className="text-xs text-neutral-500">Database-wide catalog visibility with admin filters and Atlas AI search.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/products/create"
              className="rounded border border-white/15 bg-[#1a1a1a] px-3 py-1.5 text-xs text-neutral-100"
            >
              Create / Import
            </Link>
            <button
              onClick={() => void fetchProducts(page)}
              className="inline-flex items-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-1.5 text-xs"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            Search within loaded results
            <div className="relative mt-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="title, seller, tags, id"
                className="w-full rounded border border-white/20 bg-[#080808] py-2 pl-7 pr-3 text-xs text-neutral-100"
              />
            </div>
          </label>
          <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            AI Search
            <div className="relative mt-1">
              <Sparkles size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-primary" />
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="lawn co-ords for Karachi summer weddings"
                className="w-full rounded border border-primary/20 bg-[#080808] py-2 pl-7 pr-3 text-xs text-neutral-100"
              />
            </div>
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={applySearch}
              className="rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100"
            >
              Run
            </button>
            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className="rounded border border-white/15 px-3 py-2 text-xs text-neutral-300"
            >
              {showAdvancedFilters ? 'Hide filters' : 'Advanced filters'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
          <span>{resultMeta.mode === 'ai' ? 'Atlas AI search active' : 'Database listing active'}</span>
          {typeof resultMeta.total === 'number' ? <span>{resultMeta.total} total matches</span> : null}
          <span>Page {page} of {totalPages}</span>
        </div>

        {showAdvancedFilters ? (
          <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-[#0e0e0e] p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                Statuses
                <select
                  multiple
                  value={selectedValues(filters.status, 'all')}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map((option) => option.value);
                    setFilters((prev) => ({ ...prev, status: values.includes('all') || values.length === 0 ? 'all' : values.join(',') }));
                  }}
                  className="mt-1 min-h-24 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]"
                >
                  <option value="all">All statuses</option>
                  {PRODUCT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <span className="mt-1 block normal-case tracking-normal text-neutral-600">Cmd/Ctrl-click to select multiple.</span>
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                Sellers
                <select
                  multiple
                  value={selectedValues(filters.seller_ids || filters.seller_id)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions).map((option) => option.value);
                    setFilters((prev) => ({ ...prev, seller_id: '', seller_ids: values.join(',') }));
                  }}
                  className="mt-1 min-h-24 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]"
                >
                  {sellers.map((seller) => <option key={getSellerId(seller)} value={getSellerId(seller)}>{getSellerName(seller)}</option>)}
                </select>
                <span className="mt-1 block normal-case tracking-normal text-neutral-600">Leave empty to show every seller.</span>
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                In stock
                <select value={filters.in_stock} onChange={(e) => setFilters((prev) => ({ ...prev, in_stock: e.target.value }))} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                  <option value="">all</option>
                  <option value="true">in stock</option>
                  <option value="false">out of stock</option>
                </select>
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                Sort
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <select value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))} className="rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                    <option value="created_at">created_at</option>
                    <option value="updated_at">updated_at</option>
                    <option value="price">price</option>
                    <option value="popularity">popularity</option>
                    <option value="title">title</option>
                  </select>
                  <select value={filters.order} onChange={(e) => setFilters((prev) => ({ ...prev, order: e.target.value as 'asc' | 'desc' }))} className="rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                    <option value="desc">desc</option>
                    <option value="asc">asc</option>
                  </select>
                </div>
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                Min price
                <input value={filters.min_price} onChange={(e) => setFilters((prev) => ({ ...prev, min_price: e.target.value }))} type="number" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                Max price
                <input value={filters.max_price} onChange={(e) => setFilters((prev) => ({ ...prev, max_price: e.target.value }))} type="number" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {metadataInputs.map((field) => (
                <label key={field.key} className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                  {field.label}
                  <input
                    value={filters[field.key]}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={applySearch} className="rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100">Apply filters</button>
              <button onClick={resetFilters} className="rounded border border-white/15 px-3 py-2 text-xs text-neutral-300">Reset</button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-white/10 bg-[#121212] p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={togglePageSelection} className="rounded border border-white/15 bg-[#1a1a1a] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-neutral-100">
              {allPageSelected ? 'Deselect Page' : 'Select Page'}
            </button>
            <button onClick={() => setSelectedIds(filteredProducts.map((product) => String(product.id || '')).filter(Boolean))} className="rounded border border-white/15 bg-[#1a1a1a] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-neutral-100">
              Select Visible
            </button>
            <button onClick={() => setSelectedIds([])} className="rounded border border-white/15 bg-[#0b0b0b] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
              Clear
            </button>
            <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">{selectedCount} selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="rounded border border-white/20 bg-[#080808] px-2 py-1 text-[10px] text-neutral-100 [color-scheme:dark]">
              <option value="">Set status</option>
              <option value="active">active</option>
              <option value="embedding_pending">embedding_pending</option>
              <option value="needs_review">needs_review</option>
              <option value="queue">queue</option>
              <option value="draft">draft</option>
              <option value="rejected">rejected</option>
              <option value="archived">archived</option>
            </select>
            <select value={bulkFeatured} onChange={(e) => setBulkFeatured(e.target.value)} className="rounded border border-white/20 bg-[#080808] px-2 py-1 text-[10px] text-neutral-100 [color-scheme:dark]">
              <option value="">Featured</option>
              <option value="true">featured</option>
              <option value="false">not featured</option>
            </select>
            <input value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} placeholder="Replace tags" className="w-44 rounded border border-white/20 bg-[#080808] px-2 py-1 text-[10px] text-neutral-100 placeholder:text-neutral-500" />
            <button onClick={bulkPatch} disabled={selectedCount === 0 || !!actionKey} className="rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-100 disabled:opacity-40">Apply</button>
            <button onClick={bulkDelete} disabled={selectedCount === 0 || !!actionKey} className="rounded border border-red-400/35 bg-red-500/10 px-2 py-1 text-[10px] text-red-300 disabled:opacity-40">Delete</button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#121212] p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-200"><Ruler size={14} className="text-primary" /> Bulk size chart</div>
        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input value={bulkSizeChart.image_url || ''} onChange={(e) => setBulkSizeChart((chart) => ({ ...chart, image_url: e.target.value }))} placeholder="Size chart image URL" className="rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500" />
          <label className="cursor-pointer rounded border border-white/15 px-3 py-2 text-center text-xs text-neutral-100">
            <span className="inline-flex items-center gap-1"><Upload size={13} /> {actionKey === 'bulk-size-chart-upload' ? 'Uploading...' : 'Upload image'}</span>
            <input type="file" accept="image/*" className="hidden" disabled={!!actionKey} onChange={(e) => e.target.files?.[0] && void uploadBulkSizeChart(e.target.files[0])} />
          </label>
          <select value={bulkSizeChart.measurement_unit} onChange={(e) => setBulkSizeChart((chart) => ({ ...chart, measurement_unit: e.target.value }))} className="rounded border border-white/20 bg-[#080808] px-2 py-2 text-xs text-neutral-100 [color-scheme:dark]"><option value="inch">Inches</option><option value="cm">CM</option></select>
        </div>
        <textarea value={bulkSizeChart.html_table || ''} onChange={(e) => setBulkSizeChart((chart) => ({ ...chart, html_table: e.target.value }))} rows={3} placeholder="Optional safe table HTML: <table>...</table>" className="mt-2 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500" />
        <button onClick={bulkAssignSizeChart} disabled={!selectedCount || (!bulkSizeChart.image_url?.trim() && !bulkSizeChart.html_table?.trim()) || !!actionKey} className="mt-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40">Assign chart to selected</button>
      </section>

      {error ? <section className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</section> : null}

      <section className="rounded-lg border border-white/10 bg-[#121212] p-2">
        {isLoading ? (
          <div className="p-6 text-sm text-neutral-400">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#0f0f0f] text-neutral-400">
                <tr>
                  <th className="w-9 px-3 py-2 font-medium"><input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} className="accent-[#f43f5e]" /></th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Seller</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Badges</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, pageIndex) => {
                  const productId = String(product.id || '');
                  const isSelected = selectedIds.includes(productId);
                  const isEditing = editId === productId;
                  const stock = typeof product.inventory?.available_quantity === 'number'
                    ? product.inventory.available_quantity
                    : typeof product.inventory?.quantity === 'number'
                      ? product.inventory.quantity
                      : 0;
                  const price = typeof product.pricing?.brand_price === 'number' ? product.pricing.brand_price : product.pricing?.price;
                  const badges = normalizeBadges(product.badges);
                  const enabledBadges = (Object.keys(BADGE_LABELS) as BadgeKey[]).filter((badge) => badges[badge]);

                  return (
                    <React.Fragment key={productId}>
                      <tr className={`border-t border-white/10 ${isSelected ? 'bg-white/[0.04]' : ''}`}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelection(product, pageIndex, e)} onClick={(e) => e.stopPropagation()} className="accent-[#f43f5e]" />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2">
                            <img src={getImageUrl(product.images)} alt={product.title || 'Product'} className="h-10 w-10 rounded border border-white/10 object-cover" loading="lazy" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-neutral-100">{product.title || 'Untitled product'}</p>
                              <p className="truncate text-[10px] text-neutral-500">{productId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-neutral-300">{product.seller_name || product.seller_id || '-'}</td>
                        <td className="px-3 py-2 text-neutral-300">{formatCurrency(price, product.pricing?.currency)}</td>
                        <td className="px-3 py-2 text-neutral-300">{typeof stock === 'number' ? stock : '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${statusClass(product.status)}`}>{product.status || 'unknown'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {enabledBadges.length > 0 ? enabledBadges.map((badge) => (
                              <span key={badge} className={`rounded border px-2 py-0.5 text-[10px] ${badgeTone(badge)}`}>{BADGE_LABELS[badge]}</span>
                            )) : <span className="text-neutral-500">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => (isEditing ? closeEdit() : openEdit(product))} className="rounded border border-white/15 p-2 text-neutral-200 hover:bg-white/10" title={isEditing ? 'Close editor' : 'Edit product'}>
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => void deleteProduct(product)} disabled={actionKey === `${productId}:delete`} className="rounded border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-40" title="Delete product">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isEditing ? (
                        <tr className="border-t border-white/10 bg-[#0c0c0c]">
                          <td colSpan={8} className="px-3 py-4">
                            <div className="grid gap-3 lg:grid-cols-2">
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Title</label>
                                  <input value={editDraft.title} onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Description</label>
                                  <textarea value={editDraft.description} onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))} rows={5} className="w-full rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Status</label>
                                    <input value={editDraft.status} onChange={(e) => setEditDraft((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
                                  </div>
                                  <label className="flex items-end gap-2 rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100">
                                    <input type="checkbox" checked={editDraft.is_featured} onChange={(e) => setEditDraft((prev) => ({ ...prev, is_featured: e.target.checked }))} className="accent-[#f43f5e]" />
                                    Featured product
                                  </label>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Tags</label>
                                  <input value={editDraft.tagsInput} onChange={(e) => setEditDraft((prev) => ({ ...prev, tagsInput: e.target.value }))} className="w-full rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100" placeholder="festive, summer" />
                                </div>
                                <div>
                                  <label className="mb-2 block text-[10px] uppercase tracking-[0.12em] text-neutral-500">Badges</label>
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    {(Object.keys(BADGE_LABELS) as BadgeKey[]).map((badge) => (
                                      <label key={badge} className="flex items-center gap-2 rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100">
                                        <input type="checkbox" checked={editDraft.badges[badge]} onChange={(e) => setEditDraft((prev) => ({ ...prev, badges: { ...prev.badges, [badge]: e.target.checked } }))} className="accent-[#f43f5e]" />
                                        {BADGE_LABELS[badge]}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                  <button onClick={saveEdit} disabled={actionKey === `${productId}:save`} className="rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40">{actionKey === `${productId}:save` ? 'Saving...' : 'Save'}</button>
                                  <button onClick={closeEdit} className="rounded border border-white/15 px-3 py-2 text-xs text-neutral-300">Cancel</button>
                                </div>
                                {editError ? <p className="text-xs text-red-300">{editError}</p> : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 ? <div className="p-4 text-xs text-neutral-500">No products found.</div> : null}
            <div className="mt-3 flex items-center justify-between px-3 pb-3 text-xs text-neutral-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded border border-white/15 px-2 py-1 text-neutral-200 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="rounded border border-white/15 px-2 py-1 text-neutral-200 disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ManageProducts;
