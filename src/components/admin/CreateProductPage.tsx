import React, { useEffect, useState } from 'react';
import { ArrowLeft, Globe, Loader, Package, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminPortal, scrapeSellerProducts } from '../../api/adminApi';
import {
  BADGE_LABELS,
  EMPTY_CREATE_DRAFT,
  asArray,
  buildAdminProductPayload,
  getSellerId,
  getSellerName,
  type BadgeKey,
  type CreateProductDraft,
  type SellerProfile,
} from './productManagement';

const normalizeShopUrl = (input: string): string => {
  let url = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  url = url.split('/')[0];
  return url;
};

const CreateProductPage: React.FC = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [createDraft, setCreateDraft] = useState<CreateProductDraft>(EMPTY_CREATE_DRAFT);
  const [createError, setCreateError] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [shopifySellerId, setShopifySellerId] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [scrapeMessage, setScrapeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const loadSellers = async () => {
      const response = await AdminPortal.listSellers({ limit: 500 });
      if (response.ok) setSellers(asArray(response.body));
    };
    void loadSellers();
  }, []);

  const createProduct = async () => {
    const seller = sellers.find((entry) => getSellerId(entry) === createDraft.seller_id);
    const price = Number(createDraft.price);
    const quantity = Number(createDraft.available_quantity);

    if (!createDraft.seller_id) {
      setCreateError('Seller is required.');
      return;
    }
    if (!createDraft.title.trim()) {
      setCreateError('Title is required.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setCreateError('Enter a valid price.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      setCreateError('Enter a valid stock quantity.');
      return;
    }

    setCreateError('');
    setCreateMessage('');
    setActionKey('create-product');
    try {
      const response = await AdminPortal.createProduct(buildAdminProductPayload(createDraft, seller));
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to create product');
      setCreateDraft(EMPTY_CREATE_DRAFT);
      setCreateMessage('Product created in catalog.');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setActionKey('');
    }
  };

  const handleScrape = async () => {
    const normalizedUrl = normalizeShopUrl(shopUrl);
    if (!shopifySellerId) {
      setScrapeMessage({ type: 'error', text: 'Select a seller first.' });
      return;
    }
    if (!normalizedUrl) {
      setScrapeMessage({ type: 'error', text: 'Enter a valid Shopify store URL.' });
      return;
    }

    setActionKey('shopify-scrape');
    setScrapeMessage(null);
    try {
      const response = await scrapeSellerProducts(shopifySellerId, normalizedUrl);
      if (response.status === 202) {
        setScrapeMessage({ type: 'info', text: 'Shopify scrape started. Products will sync into the seller queue in the background.' });
      } else if (!response.ok) {
        throw new Error((response.body as any)?.message || 'Shopify scrape failed');
      } else {
        const count = Number((response.body as any)?.scrape_count ?? (response.body as any)?.count ?? 0);
        setScrapeMessage({ type: 'success', text: `Imported ${count} product${count === 1 ? '' : 's'} into the seller queue.` });
        setShopUrl('');
      }
    } catch (err) {
      setScrapeMessage({ type: 'error', text: err instanceof Error ? err.message : 'Shopify scrape failed' });
    } finally {
      setActionKey('');
    }
  };

  return (
    <div className="mt-4 space-y-4 text-neutral-100">
      <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold">Create / Import Products</h2>
              <p className="text-xs text-neutral-500">Direct catalog creation for admins plus seller-linked Shopify scraping.</p>
            </div>
          </div>
          <Link to="/admin/products" className="inline-flex items-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-1.5 text-xs text-neutral-100">
            <ArrowLeft size={13} />
            Back to products
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <div className="mb-4 flex items-center gap-2">
          <Package size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Manual Product Creation</h3>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Seller
              <select value={createDraft.seller_id} onChange={(e) => setCreateDraft((prev) => ({ ...prev, seller_id: e.target.value }))} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                <option value="">Select seller</option>
                {sellers.map((seller) => (
                  <option key={getSellerId(seller)} value={getSellerId(seller)}>{getSellerName(seller)}</option>
                ))}
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Title
              <input value={createDraft.title} onChange={(e) => setCreateDraft((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Price
              <input value={createDraft.price} onChange={(e) => setCreateDraft((prev) => ({ ...prev, price: e.target.value }))} type="number" min="0" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Compare-at price
              <input value={createDraft.compare_at_price} onChange={(e) => setCreateDraft((prev) => ({ ...prev, compare_at_price: e.target.value }))} type="number" min="0" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Stock quantity
              <input value={createDraft.available_quantity} onChange={(e) => setCreateDraft((prev) => ({ ...prev, available_quantity: e.target.value }))} type="number" min="0" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Product type
              <input value={createDraft.product_type} onChange={(e) => setCreateDraft((prev) => ({ ...prev, product_type: e.target.value }))} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Status
              <select value={createDraft.status} onChange={(e) => setCreateDraft((prev) => ({ ...prev, status: e.target.value as any }))} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                <option value="active">active</option>
                <option value="embedding_pending">embedding_pending</option>
                <option value="needs_review">needs_review</option>
                <option value="queue">queue</option>
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Image URL
              <input value={createDraft.image_url} onChange={(e) => setCreateDraft((prev) => ({ ...prev, image_url: e.target.value }))} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Description
              <textarea value={createDraft.description} onChange={(e) => setCreateDraft((prev) => ({ ...prev, description: e.target.value }))} rows={4} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="block text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Tags
              <input value={createDraft.tagsInput} onChange={(e) => setCreateDraft((prev) => ({ ...prev, tagsInput: e.target.value }))} placeholder="summer, lawn, occasionwear" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100" />
            </label>
            <label className="flex items-center gap-2 rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100">
              <input type="checkbox" checked={createDraft.is_featured} onChange={(e) => setCreateDraft((prev) => ({ ...prev, is_featured: e.target.checked }))} className="accent-[#f43f5e]" />
              Featured
            </label>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-neutral-500">Badges</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(BADGE_LABELS) as BadgeKey[]).map((badge) => (
                  <label key={badge} className="flex items-center gap-2 rounded border border-white/15 bg-[#080808] px-3 py-2 text-xs text-neutral-100">
                    <input type="checkbox" checked={createDraft.badges[badge]} onChange={(e) => setCreateDraft((prev) => ({ ...prev, badges: { ...prev.badges, [badge]: e.target.checked } }))} className="accent-[#f43f5e]" />
                    {BADGE_LABELS[badge]}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={createProduct} disabled={actionKey === 'create-product'} className="rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40">
                {actionKey === 'create-product' ? 'Creating...' : 'Create product'}
              </button>
            </div>
            {createError ? <p className="text-xs text-red-300">{createError}</p> : null}
            {createMessage ? <p className="text-xs text-emerald-300">{createMessage}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <div className="mb-4 flex items-center gap-2">
          <Globe size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Shopify Scraping</h3>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#0e0e0e] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1.3fr_auto]">
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Seller
              <select value={shopifySellerId} onChange={(e) => setShopifySellerId(e.target.value)} className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 [color-scheme:dark]">
                <option value="">Select seller</option>
                {sellers.map((seller) => (
                  <option key={getSellerId(seller)} value={getSellerId(seller)}>{getSellerName(seller)}</option>
                ))}
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
              Shopify Store URL
              <input value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} placeholder="your-store.myshopify.com or yourbrand.com" className="mt-1 w-full rounded border border-white/20 bg-[#080808] px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500" />
            </label>
            <div className="flex items-end">
              <button onClick={handleScrape} disabled={actionKey === 'shopify-scrape'} className="inline-flex items-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40">
                {actionKey === 'shopify-scrape' ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {actionKey === 'shopify-scrape' ? 'Importing...' : 'Import products'}
              </button>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-neutral-400">
            Seller-linked import fields:
            <div className="mt-1 text-neutral-500">`seller_id` determines queue ownership. `shop_url` is normalized before sending to the admin Shopify scrape endpoint.</div>
          </div>
          {scrapeMessage ? (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
              scrapeMessage.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : scrapeMessage.type === 'info'
                  ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
                  : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}>
              {scrapeMessage.text}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default CreateProductPage;
