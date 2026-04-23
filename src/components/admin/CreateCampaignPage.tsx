import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Campaigns } from '../../api/campaignsApi';
import { Catalog } from '../../api/catalogApi';
import { CatalogProduct, CreateCampaignRequest, ProductStrategy } from '../../api/api.types';

const sectionTitleCls = 'text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400';
const labelCls = 'text-[10px] uppercase tracking-[0.15em] text-neutral-500';
const inputCls = 'w-full rounded border border-white/15 bg-[#0a0a0a] px-2.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-primary/60 focus:outline-none';
const selectCls = `${inputCls} [color-scheme:dark]`;

const QUERY_METHODS = ['persona_match', 'bestsellers', 'new_arrivals', 'category'];

const toIdList = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const unique = (items: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  items.forEach((item) => {
    if (seen.has(item)) return;
    seen.add(item);
    out.push(item);
  });
  return out;
};

const asProducts = (value: unknown): CatalogProduct[] => {
  if (Array.isArray(value)) return value as CatalogProduct[];
  if (value && typeof value === 'object') {
    const v = value as any;
    if (Array.isArray(v.products)) return v.products as CatalogProduct[];
    if (Array.isArray(v.data)) return v.data as CatalogProduct[];
  }
  return [];
};

const getImage = (product: CatalogProduct): string => {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  return '/juno_app_icon.png';
};

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manualIdsRaw, setManualIdsRaw] = useState('');
  const [categoryIdsRaw, setCategoryIdsRaw] = useState('');
  const [sellerIdsRaw, setSellerIdsRaw] = useState('');

  const [productQuery, setProductQuery] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productResults, setProductResults] = useState<CatalogProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, CatalogProduct>>({});

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: '',
    slug: '',
    channel: 'meta',
    type: 'acquisition',
    product_strategy: { method: 'manual' },
    landing_type: 'custom',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    start_date: today,
    budget: {
      daily_budget: 0,
      total_budget: 0,
      currency_code: 'PKR',
    },
  });

  const set = (patch: Partial<CreateCampaignRequest>) => setFormData((prev) => ({ ...prev, ...patch }));
  const setStrategy = (patch: Partial<ProductStrategy>) =>
    setFormData((prev) => ({ ...prev, product_strategy: { ...prev.product_strategy, ...patch } }));
  const setBudget = (patch: Partial<NonNullable<CreateCampaignRequest['budget']>>) =>
    setFormData((prev) => ({ ...prev, budget: { ...prev.budget, ...patch } }));

  const selectedProductIds = useMemo(() => Object.keys(selectedProducts), [selectedProducts]);
  const computedManualIds = useMemo(() => unique([...selectedProductIds, ...toIdList(manualIdsRaw)]), [selectedProductIds, manualIdsRaw]);

  const needsMaxProducts = QUERY_METHODS.includes(formData.product_strategy.method);
  const needsLandingId = formData.landing_type !== 'custom';
  const isManual = formData.product_strategy.method === 'manual';

  useEffect(() => {
    if (!isManual) return;

    let canceled = false;
    const t = setTimeout(async () => {
      setProductLoading(true);
      setProductError(null);
      try {
        const q = productQuery.trim();
        const response = q.length >= 2
          ? await Catalog.searchProducts({ keyword: q, limit: 40 })
          : await Catalog.getProducts({ limit: 40, page: 1 });

        if (!canceled) {
          if (response.ok) {
            setProductResults(asProducts(response.body));
          } else {
            setProductResults([]);
            setProductError('Could not load catalog results.');
          }
        }
      } catch {
        if (!canceled) {
          setProductResults([]);
          setProductError('Could not load catalog results.');
        }
      } finally {
        if (!canceled) setProductLoading(false);
      }
    }, 220);

    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [isManual, productQuery]);

  const toggleProduct = (product: CatalogProduct) => {
    setSelectedProducts((prev) => {
      if (prev[product.id]) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: product };
    });
  };

  const removeSelected = (id: string) => {
    setSelectedProducts((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const strategy: ProductStrategy = { method: formData.product_strategy.method };

      if (isManual) {
        strategy.manual_product_ids = computedManualIds;
        if (!strategy.manual_product_ids.length) {
          setError('Select at least one product or provide product IDs for manual strategy.');
          setIsSubmitting(false);
          return;
        }
      } else if (formData.product_strategy.method === 'category') {
        strategy.category_ids = toIdList(categoryIdsRaw);
        strategy.max_products = formData.product_strategy.max_products;
      } else if (QUERY_METHODS.includes(formData.product_strategy.method)) {
        strategy.max_products = formData.product_strategy.max_products;
      }

      const sellerIds = toIdList(sellerIdsRaw);
      if (sellerIds.length) strategy.seller_ids = sellerIds;

      const payload: CreateCampaignRequest = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        channel: formData.channel,
        type: formData.type,
        product_strategy: strategy,
        landing_type: formData.landing_type,
        drop_id: formData.drop_id,
        collection_id: formData.collection_id,
        brand_id: formData.brand_id,
        utm_source: formData.utm_source || formData.channel,
        utm_medium: formData.utm_medium || 'paid_social',
        utm_campaign: formData.utm_campaign || formData.slug,
        utm_content: formData.utm_content,
        utm_term: formData.utm_term,
        start_date: `${formData.start_date}T00:00:00Z`,
        end_date: formData.end_date ? `${formData.end_date}T23:59:59Z` : undefined,
        budget: formData.budget,
      };

      const resp = await Campaigns.createCampaign(payload);
      if (!resp.ok) {
        const body = resp.body as any;
        setError(body?.message || JSON.stringify(body) || 'Failed to create campaign.');
        return;
      }

      navigate('/admin/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/campaigns" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200">
            <ArrowLeft size={14} />
            Back to campaigns
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-100">Create Campaign</h1>
          <p className="mt-1 text-xs text-neutral-400">Route-based campaign builder with fast catalog product selection.</p>
        </div>
      </div>

      {error ? <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded border border-white/10 bg-[#0b0b0b] p-4">
          <h2 className={sectionTitleCls}>Identity</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input required value={formData.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder="Eid 2026 Acquisition" />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input
                required
                value={formData.slug}
                onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                className={`${inputCls} font-mono`}
                placeholder="eid-2026-acquisition"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Description</label>
              <input value={formData.description || ''} onChange={(e) => set({ description: e.target.value || undefined })} className={inputCls} placeholder="Optional campaign description" />
            </div>
          </div>
        </section>

        <section className="rounded border border-white/10 bg-[#0b0b0b] p-4">
          <h2 className={sectionTitleCls}>Strategy & Landing</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Channel *</label>
              <select value={formData.channel} onChange={(e) => set({ channel: e.target.value as any })} className={selectCls}>
                <option className="bg-[#0a0a0a]" value="meta">Meta</option>
                <option className="bg-[#0a0a0a]" value="google">Google</option>
                <option className="bg-[#0a0a0a]" value="tiktok">TikTok</option>
                <option className="bg-[#0a0a0a]" value="email">Email</option>
                <option className="bg-[#0a0a0a]" value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select value={formData.type} onChange={(e) => set({ type: e.target.value as any })} className={selectCls}>
                <option className="bg-[#0a0a0a]" value="acquisition">Acquisition</option>
                <option className="bg-[#0a0a0a]" value="retention">Retention</option>
                <option className="bg-[#0a0a0a]" value="reengagement">Re-engagement</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Product Strategy *</label>
              <select
                value={formData.product_strategy.method}
                onChange={(e) => setStrategy({ method: e.target.value as any, max_products: undefined })}
                className={selectCls}
              >
                <option className="bg-[#0a0a0a]" value="manual">Manual</option>
                <option className="bg-[#0a0a0a]" value="persona_match">Persona Match</option>
                <option className="bg-[#0a0a0a]" value="bestsellers">Bestsellers</option>
                <option className="bg-[#0a0a0a]" value="new_arrivals">New Arrivals</option>
                <option className="bg-[#0a0a0a]" value="category">By Category</option>
                <option className="bg-[#0a0a0a]" value="drop">Associated Drop</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Landing Type *</label>
              <select
                value={formData.landing_type}
                onChange={(e) => set({ landing_type: e.target.value as any, drop_id: undefined, collection_id: undefined, brand_id: undefined })}
                className={selectCls}
              >
                <option className="bg-[#0a0a0a]" value="custom">Custom</option>
                <option className="bg-[#0a0a0a]" value="drop">Drop</option>
                <option className="bg-[#0a0a0a]" value="collection">Collection</option>
                <option className="bg-[#0a0a0a]" value="brand_storefront">Brand Storefront</option>
              </select>
            </div>

            {needsLandingId && formData.landing_type === 'drop' ? (
              <div>
                <label className={labelCls}>Drop ID *</label>
                <input required value={formData.drop_id || ''} onChange={(e) => set({ drop_id: e.target.value })} className={`${inputCls} font-mono`} placeholder="drop-uuid" />
              </div>
            ) : null}
            {needsLandingId && formData.landing_type === 'collection' ? (
              <div>
                <label className={labelCls}>Collection ID *</label>
                <input required value={formData.collection_id || ''} onChange={(e) => set({ collection_id: e.target.value })} className={`${inputCls} font-mono`} placeholder="collection-uuid" />
              </div>
            ) : null}
            {needsLandingId && formData.landing_type === 'brand_storefront' ? (
              <div>
                <label className={labelCls}>Brand ID *</label>
                <input required value={formData.brand_id || ''} onChange={(e) => set({ brand_id: e.target.value })} className={`${inputCls} font-mono`} placeholder="brand-uuid" />
              </div>
            ) : null}

            {formData.product_strategy.method === 'category' ? (
              <div className="md:col-span-2">
                <label className={labelCls}>Category IDs *</label>
                <input required value={categoryIdsRaw} onChange={(e) => setCategoryIdsRaw(e.target.value)} className={`${inputCls} font-mono`} placeholder="cat-uuid-1, cat-uuid-2" />
              </div>
            ) : null}

            {needsMaxProducts ? (
              <div>
                <label className={labelCls}>Max Products *</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  value={formData.product_strategy.max_products || ''}
                  onChange={(e) => setStrategy({ max_products: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            ) : null}

            <div className="md:col-span-2">
              <label className={labelCls}>Filter by Seller IDs (optional)</label>
              <input value={sellerIdsRaw} onChange={(e) => setSellerIdsRaw(e.target.value)} className={`${inputCls} font-mono`} placeholder="seller-uuid-1, seller-uuid-2" />
            </div>
          </div>
        </section>

        {isManual ? (
          <section className="rounded border border-white/10 bg-[#0b0b0b] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={sectionTitleCls}>Manual Product Selection</h2>
              <div className="text-[10px] text-neutral-500">Selected {selectedProductIds.length} products</div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-white/10 bg-[#070707] p-2">
              <Search size={14} className="text-neutral-500" />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="min-w-[260px] flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                placeholder="Search active catalog by title or keyword (2+ chars)"
              />
              <button
                type="button"
                onClick={() => setProductQuery((q) => q)}
                className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-300"
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {selectedProductIds.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedProductIds.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded border border-green-500/35 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-200">
                    <span className="font-mono">{id}</span>
                    <button type="button" onClick={() => removeSelected(id)} className="text-green-300 hover:text-green-100">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-3 max-h-[380px] overflow-auto rounded border border-white/10 bg-[#080808]">
              {productLoading ? <div className="p-3 text-xs text-neutral-400">Loading catalog products...</div> : null}
              {!productLoading && productError ? <div className="p-3 text-xs text-red-300">{productError}</div> : null}
              {!productLoading && !productError && productResults.length === 0 ? (
                <div className="p-3 text-xs text-neutral-500">No products found.</div>
              ) : null}
              {!productLoading && !productError && productResults.map((product) => {
                const isSelected = !!selectedProducts[product.id];
                return (
                  <div key={product.id} className="flex items-center gap-2 border-b border-white/10 px-2 py-2 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`h-5 w-5 shrink-0 rounded border ${isSelected ? 'border-green-400/60 bg-green-500/20 text-green-200' : 'border-white/20 text-transparent'}`}
                    >
                      <Check size={12} />
                    </button>
                    <img src={getImage(product)} alt={product.title} className="h-10 w-8 rounded border border-white/10 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-neutral-100">{product.title}</div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-neutral-500">
                        <span>{product.seller_name || '-'}</span>
                        <span>PKR {Number(product.pricing?.price || 0).toLocaleString()}</span>
                        <span>Stock {product.inventory?.available_quantity ?? 0}</span>
                        <span className={product.status === 'active' ? 'text-green-300' : 'text-yellow-300'}>{product.status}</span>
                      </div>
                      <div className="font-mono text-[10px] text-neutral-500">{product.id}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyId(product.id)}
                      className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-[10px] text-neutral-300"
                    >
                      <Copy size={11} /> ID
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] ${isSelected ? 'border-green-500/40 text-green-200' : 'border-white/15 text-neutral-300'}`}
                    >
                      <Plus size={11} /> {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <label className={labelCls}>Additional Product IDs (optional, comma-separated)</label>
              <textarea
                rows={2}
                value={manualIdsRaw}
                onChange={(e) => setManualIdsRaw(e.target.value)}
                className={`${inputCls} mt-1 font-mono`}
                placeholder="prod-uuid-1, prod-uuid-2"
              />
              <div className="mt-1 text-[10px] text-neutral-500">Final manual IDs to submit: {computedManualIds.length}</div>
            </div>
          </section>
        ) : null}

        <section className="rounded border border-white/10 bg-[#0b0b0b] p-4">
          <h2 className={sectionTitleCls}>Budget, Schedule, UTM</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelCls}>Daily Budget</label>
              <input type="number" value={formData.budget?.daily_budget || 0} onChange={(e) => setBudget({ daily_budget: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Total Budget</label>
              <input type="number" value={formData.budget?.total_budget || 0} onChange={(e) => setBudget({ total_budget: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={formData.budget?.currency_code || 'PKR'} onChange={(e) => setBudget({ currency_code: e.target.value })} className={selectCls}>
                <option className="bg-[#0a0a0a]" value="PKR">PKR</option>
                <option className="bg-[#0a0a0a]" value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Start Date *</label>
              <input required type="date" value={formData.start_date} onChange={(e) => set({ start_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={formData.end_date || ''} min={formData.start_date} onChange={(e) => set({ end_date: e.target.value || undefined })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>UTM Source</label>
              <input value={formData.utm_source} onChange={(e) => set({ utm_source: e.target.value })} className={inputCls} placeholder={formData.channel} />
            </div>
            <div>
              <label className={labelCls}>UTM Medium</label>
              <input value={formData.utm_medium} onChange={(e) => set({ utm_medium: e.target.value })} className={inputCls} placeholder="paid_social" />
            </div>
            <div>
              <label className={labelCls}>UTM Campaign</label>
              <input value={formData.utm_campaign} onChange={(e) => set({ utm_campaign: e.target.value })} className={inputCls} placeholder={formData.slug || 'campaign-name'} />
            </div>
            <div>
              <label className={labelCls}>UTM Content</label>
              <input value={formData.utm_content || ''} onChange={(e) => set({ utm_content: e.target.value || undefined })} className={inputCls} placeholder="variant_a" />
            </div>
            <div>
              <label className={labelCls}>UTM Term</label>
              <input value={formData.utm_term || ''} onChange={(e) => set({ utm_term: e.target.value || undefined })} className={inputCls} placeholder="lawn collection" />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Link to="/admin/campaigns" className="rounded border border-white/20 px-4 py-2 text-xs text-neutral-300 hover:bg-white/5">Cancel</Link>
          <button
            disabled={isSubmitting}
            type="submit"
            className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/90 px-4 py-2 text-xs font-semibold text-white hover:bg-primary disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaignPage;
