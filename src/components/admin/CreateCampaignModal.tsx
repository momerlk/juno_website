import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Layers, Zap, Rocket, Plus, Globe } from 'lucide-react';
import { Campaigns } from '../../api/campaignsApi';
import { CreateCampaignRequest, ProductStrategy } from '../../api/api.types';

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: '',
    slug: '',
    description: '',
    channel: 'meta',
    type: 'acquisition',
    product_strategy: {
      method: 'manual',
      max_products: 10
    },
    landing_type: 'custom',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation for UTMs based on channel
      const finalData = {
        ...formData,
        utm_source: formData.utm_source || formData.channel,
        utm_medium: formData.utm_medium || 'social',
        utm_campaign: formData.utm_campaign || formData.slug,
      };

      const resp = await Campaigns.createCampaign(finalData);
      if (resp.ok) {
        onSuccess();
        onClose();
      } else {
        const err = resp.body as any;
        setError(err.message || 'Failed to create campaign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStrategy = (updates: Partial<ProductStrategy>) => {
    setFormData(prev => ({
      ...prev,
      product_strategy: { ...prev.product_strategy, ...updates }
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex justify-center items-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-3xl my-auto border-white/10"
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

            {/* Campaign Identity */}
            <section className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <Target size={14} /> Campaign Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Campaign Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Eid 2026 Acquisition"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Unique Slug</label>
                  <input
                    required
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="eid-2026-acquisition"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm font-mono focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Strategy & Logic */}
            <section className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <Layers size={14} /> Logic & Routing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={e => setFormData({ ...formData, channel: e.target.value as any })}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 transition-colors"
                  >
                    <option value="meta">Meta (FB/IG)</option>
                    <option value="google">Google Search/Display</option>
                    <option value="tiktok">TikTok Ads</option>
                    <option value="email">Direct Email</option>
                    <option value="sms">SMS Marketing</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Product Strategy</label>
                  <select
                    value={formData.product_strategy.method}
                    onChange={e => updateStrategy({ method: e.target.value as any })}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 transition-colors"
                  >
                    <option value="manual">Manual Selection</option>
                    <option value="persona_match">AI Persona Match</option>
                    <option value="bestsellers">Bestsellers</option>
                    <option value="new_arrivals">New Arrivals</option>
                    <option value="drop">Associated Drop</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Landing Type</label>
                  <select
                    value={formData.landing_type}
                    onChange={e => setFormData({ ...formData, landing_type: e.target.value as any })}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 transition-colors"
                  >
                    <option value="drop">Drop Countdown</option>
                    <option value="collection">Collection Grid</option>
                    <option value="brand_storefront">Brand Storefront</option>
                    <option value="custom">Custom Landing</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Attribution */}
            <section className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                <Globe size={14} /> Tracking & Attribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="UTM Source"
                  value={formData.utm_source}
                  onChange={e => setFormData({ ...formData, utm_source: e.target.value })}
                  className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="UTM Medium"
                  value={formData.utm_medium}
                  onChange={e => setFormData({ ...formData, utm_medium: e.target.value })}
                  className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50"
                />
                <input
                  type="text"
                  placeholder="UTM Campaign"
                  value={formData.utm_campaign}
                  onChange={e => setFormData({ ...formData, utm_campaign: e.target.value })}
                  className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50"
                />
              </div>
            </section>

            <footer className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isLoading}
                type="submit"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Zap size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {isLoading ? 'Activating...' : 'Deploy Campaign'}
              </button>
            </footer>
          </form>
        </motion.div>
      </motion.div>
  );
};

export default CreateCampaignModal;
