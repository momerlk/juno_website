import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Layers, Zap, Rocket, Plus, Globe, Calendar } from 'lucide-react';
import { Campaigns } from '../../api/campaignsApi';
import { CreateCampaignRequest, ProductStrategy } from '../../api/api.types';

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls = "w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 transition-colors outline-none";
const labelCls = "text-[10px] uppercase tracking-widest text-white/40 ml-1";

const QUERY_METHODS = ['persona_match', 'bestsellers', 'new_arrivals', 'category'];

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualIdsRaw, setManualIdsRaw] = useState('');
  const [categoryIdsRaw, setCategoryIdsRaw] = useState('');
  const [sellerIdsRaw, setSellerIdsRaw] = useState('');

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
      currency_code: 'PKR'
    }
  });

  const set = (patch: Partial<CreateCampaignRequest>) => setFormData(prev => ({ ...prev, ...patch }));
  const setStrategy = (patch: Partial<ProductStrategy>) =>
    setFormData(prev => ({ ...prev, product_strategy: { ...prev.product_strategy, ...patch } }));
  const setBudget = (patch: Partial<NonNullable<CreateCampaignRequest['budget']>>) =>
    setFormData(prev => ({ ...prev, budget: { ...prev.budget, ...patch } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const strategy: ProductStrategy = { method: formData.product_strategy.method };
      
      if (formData.product_strategy.method === 'manual') {
        strategy.manual_product_ids = manualIdsRaw.split(',').map(s => s.trim()).filter(Boolean);
      } else if (formData.product_strategy.method === 'category') {
        strategy.category_ids = categoryIdsRaw.split(',').map(s => s.trim()).filter(Boolean);
        strategy.max_products = formData.product_strategy.max_products;
      } else if (QUERY_METHODS.includes(formData.product_strategy.method)) {
        strategy.max_products = formData.product_strategy.max_products;
      }

      const sellerIds = sellerIdsRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (sellerIds.length) {
        strategy.seller_ids = sellerIds;
      }

      const payload: CreateCampaignRequest = {
        name: formData.name,
        slug: formData.slug,
        channel: formData.channel,
        type: formData.type,
        product_strategy: strategy,
        landing_type: formData.landing_type,
        utm_source: formData.utm_source || formData.channel,
        utm_medium: formData.utm_medium || 'paid_social',
        utm_campaign: formData.utm_campaign || formData.slug,
        start_date: `${formData.start_date}T00:00:00Z`,
        budget: formData.budget
      };

      if (formData.description) payload.description = formData.description;
      if (formData.utm_content) payload.utm_content = formData.utm_content;
      if (formData.utm_term) payload.utm_term = formData.utm_term;
      if (formData.end_date) payload.end_date = `${formData.end_date}T23:59:59Z`;
      if (formData.landing_type === 'drop' && formData.drop_id) payload.drop_id = formData.drop_id;
      if (formData.landing_type === 'collection' && formData.collection_id) payload.collection_id = formData.collection_id;
      if (formData.landing_type === 'brand_storefront' && formData.brand_id) payload.brand_id = formData.brand_id;

      const resp = await Campaigns.createCampaign(payload);
      if (resp.ok) {
        onSuccess();
        onClose();
      } else {
        const err = resp.body as any;
        setError(err?.message || JSON.stringify(err) || 'Failed to create campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const needsMaxProducts = QUERY_METHODS.includes(formData.product_strategy.method);
  const needsLandingId = formData.landing_type !== 'custom';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex justify-center items-start p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-3xl my-8 border-white/10"
      >
        <header className="flex justify-between items-center p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-2xl text-primary">
              <Rocket size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">Create Campaign</h2>
              <p className="text-xs font-mono uppercase tracking-widest text-white/40">Growth Engine Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Identity */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <Target size={14} /> Campaign Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Campaign Name *</label>
                <input required type="text" value={formData.name}
                  onChange={e => set({ name: e.target.value })}
                  placeholder="e.g. Eid 2026 Acquisition"
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Unique Slug *</label>
                <input required type="text" value={formData.slug}
                  onChange={e => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  placeholder="eid-2026-acquisition"
                  className={`${inputCls} font-mono`} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className={labelCls}>Description</label>
                <input type="text" value={formData.description || ''}
                  onChange={e => set({ description: e.target.value })}
                  placeholder="Optional campaign description"
                  className={inputCls} />
              </div>
            </div>
          </section>

          {/* Logic & Routing */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <Layers size={14} /> Logic & Routing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Channel *</label>
                <select value={formData.channel} onChange={e => set({ channel: e.target.value as any })} className={inputCls}>
                  <option value="meta">Meta (FB/IG)</option>
                  <option value="google">Google Search/Display</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="email">Direct Email</option>
                  <option value="sms">SMS Marketing</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Campaign Type *</label>
                <select value={formData.type} onChange={e => set({ type: e.target.value as any })} className={inputCls}>
                  <option value="acquisition">Acquisition</option>
                  <option value="retention">Retention</option>
                  <option value="reengagement">Re-engagement</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Product Strategy *</label>
                <select value={formData.product_strategy.method}
                  onChange={e => setStrategy({ method: e.target.value as any, max_products: undefined })}
                  className={inputCls}>
                  <option value="manual">Manual Selection</option>
                  <option value="persona_match">AI Persona Match</option>
                  <option value="bestsellers">Bestsellers</option>
                  <option value="new_arrivals">New Arrivals</option>
                  <option value="category">By Category</option>
                  <option value="drop">Associated Drop</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Landing Type *</label>
                <select value={formData.landing_type}
                  onChange={e => set({ landing_type: e.target.value as any, drop_id: undefined, collection_id: undefined, brand_id: undefined })}
                  className={inputCls}>
                  <option value="custom">Custom Landing</option>
                  <option value="drop">Drop Countdown</option>
                  <option value="collection">Collection Grid</option>
                  <option value="brand_storefront">Brand Storefront</option>
                </select>
              </div>

              {formData.product_strategy.method === 'manual' && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelCls}>Product IDs * <span className="normal-case text-white/20">(comma-separated)</span></label>
                  <input required type="text"
                    value={manualIdsRaw}
                    onChange={e => setManualIdsRaw(e.target.value)}
                    placeholder="prod-uuid-1, prod-uuid-2, prod-uuid-3"
                    className={`${inputCls} font-mono`} />
                </div>
              )}

              {formData.product_strategy.method === 'category' && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className={labelCls}>Category IDs * <span className="normal-case text-white/20">(comma-separated)</span></label>
                  <input required type="text"
                    value={categoryIdsRaw}
                    onChange={e => setCategoryIdsRaw(e.target.value)}
                    placeholder="cat-uuid-1, cat-uuid-2"
                    className={`${inputCls} font-mono`} />
                </div>
              )}

              <div className="space-y-1.5 md:col-span-2">
                <label className={labelCls}>Filter by Seller IDs <span className="normal-case text-white/20">(optional, comma-separated)</span></label>
                <input type="text"
                  value={sellerIdsRaw}
                  onChange={e => setSellerIdsRaw(e.target.value)}
                  placeholder="seller-uuid-1, seller-uuid-2"
                  className={`${inputCls} font-mono`} />
              </div>

              {needsMaxProducts && (
                <div className="space-y-1.5">
                  <label className={labelCls}>Max Products *</label>
                  <input required type="number" min={1} max={100}
                    value={formData.product_strategy.max_products || ''}
                    onChange={e => setStrategy({ max_products: Number(e.target.value) })}
                    placeholder="e.g. 20"
                    className={inputCls} />
                </div>
              )}

              {needsLandingId && formData.landing_type === 'drop' && (
                <div className="space-y-1.5">
                  <label className={labelCls}>Drop ID *</label>
                  <input required type="text" value={formData.drop_id || ''}
                    onChange={e => set({ drop_id: e.target.value })}
                    placeholder="drop-uuid"
                    className={`${inputCls} font-mono`} />
                </div>
              )}
              {needsLandingId && formData.landing_type === 'collection' && (
                <div className="space-y-1.5">
                  <label className={labelCls}>Collection ID *</label>
                  <input required type="text" value={formData.collection_id || ''}
                    onChange={e => set({ collection_id: e.target.value })}
                    placeholder="collection-uuid"
                    className={`${inputCls} font-mono`} />
                </div>
              )}
              {needsLandingId && formData.landing_type === 'brand_storefront' && (
                <div className="space-y-1.5">
                  <label className={labelCls}>Brand ID *</label>
                  <input required type="text" value={formData.brand_id || ''}
                    onChange={e => set({ brand_id: e.target.value })}
                    placeholder="brand-uuid"
                    className={`${inputCls} font-mono`} />
                </div>
              )}
            </div>
          </section>

          {/* Budget & Economics */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <Globe size={14} /> Budget & Economics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Daily Budget</label>
                <input type="number" value={formData.budget?.daily_budget || 0}
                  onChange={e => setBudget({ daily_budget: Number(e.target.value) })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Total Budget</label>
                <input type="number" value={formData.budget?.total_budget || 0}
                  onChange={e => setBudget({ total_budget: Number(e.target.value) })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Currency</label>
                <select value={formData.budget?.currency_code || 'PKR'}
                  onChange={e => setBudget({ currency_code: e.target.value })}
                  className={inputCls}>
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <Calendar size={14} /> Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Start Date *</label>
                <input required type="date" value={formData.start_date}
                  onChange={e => set({ start_date: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>End Date</label>
                <input type="date" value={formData.end_date || ''}
                  min={formData.start_date}
                  onChange={e => set({ end_date: e.target.value || undefined })}
                  className={inputCls} />
              </div>
            </div>
          </section>

          {/* Attribution */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
              <Globe size={14} /> Tracking & Attribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>UTM Source</label>
                <input type="text" value={formData.utm_source}
                  onChange={e => set({ utm_source: e.target.value })}
                  placeholder={formData.channel}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>UTM Medium</label>
                <input type="text" value={formData.utm_medium}
                  onChange={e => set({ utm_medium: e.target.value })}
                  placeholder="paid_social"
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>UTM Campaign</label>
                <input type="text" value={formData.utm_campaign}
                  onChange={e => set({ utm_campaign: e.target.value })}
                  placeholder={formData.slug || 'campaign-name'}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>UTM Content</label>
                <input type="text" value={formData.utm_content || ''}
                  onChange={e => set({ utm_content: e.target.value || undefined })}
                  placeholder="variant_a"
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>UTM Term</label>
                <input type="text" value={formData.utm_term || ''}
                  onChange={e => set({ utm_term: e.target.value || undefined })}
                  placeholder="lawn collection"
                  className={inputCls} />
              </div>
            </div>
          </section>

          <footer className="flex justify-end gap-4 pt-4 border-t border-white/5">
            <button type="button" onClick={onClose}
              className="px-8 py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button disabled={isLoading} type="submit"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <Zap size={18} className="animate-spin" /> : <Plus size={18} />}
              {isLoading ? 'Deploying...' : 'Deploy Campaign'}
            </button>
          </footer>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateCampaignModal;
