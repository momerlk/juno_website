import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, TrendingUp, Users, ShoppingCart, 
  Target, Globe, BarChart2, MousePointer2, UserPlus, 
  ShoppingBag, CreditCard, CheckCircle2, AlertCircle,
  ExternalLink, Calendar, DollarSign, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Campaigns } from '../../api/campaignsApi';
import { Campaign, CampaignMetrics, MetaInputsRequest } from '../../api/api.types';

const formatCurrency = (value?: number) => 
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [metaInputs, setMetaInputs] = useState<MetaInputsRequest>({ 
    ad_spend_to_date: 0, 
    impressions: 0, 
    clicks: 0, 
    impression_lower: 0, 
    impression_upper: 0 
  });
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  const fetchCampaign = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await Campaigns.getCampaign(id);
      if (resp.ok) {
        setCampaign(resp.body);
        // Initialize meta inputs
        setMetaInputs({
          ad_spend_to_date: resp.body.budget?.ad_spend_to_date || 0,
          impressions: resp.body.metrics?.impressions || 0,
          clicks: resp.body.metrics?.clicks || 0,
          impression_lower: resp.body.budget?.impression_lower || 0,
          impression_upper: resp.body.budget?.impression_upper || 0
        });
      } else {
        setError('Failed to fetch campaign details.');
      }
    } catch (err) {
      setError('An error occurred while fetching the campaign.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleMetaInputsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsMetaLoading(true);
    try {
      const resp = await Campaigns.updateMetaInputs(id, metaInputs);
      if (resp.ok) {
        setIsMetaModalOpen(false);
        fetchCampaign();
      }
    } catch (err) {
      alert('Failed to update meta inputs');
    } finally {
      setIsMetaLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Campaign['status']) => {
    if (!id) return;
    try {
      const resp = await Campaigns.changeCampaignStatus(id, newStatus);
      if (resp.ok) {
        fetchCampaign();
      }
    } catch (err) {
      alert('Failed to change status');
    }
  };

  const metrics = campaign?.metrics;

  const funnelData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Clicks', count: metrics.clicks, icon: MousePointer2, color: 'text-blue-400' },
      { name: 'Product Views', count: metrics.product_views, icon: ShoppingBag, color: 'text-purple-400' },
      { name: 'Add to Carts', count: metrics.add_to_carts, icon: ShoppingCart, color: 'text-yellow-400' },
      { name: 'Reminders', count: metrics.reminder_signups, icon: UserPlus, color: 'text-pink-400' },
      { name: 'Checkouts', count: metrics.checkouts, icon: CreditCard, color: 'text-orange-400' },
      { name: 'Orders', count: metrics.orders, icon: CheckCircle2, color: 'text-green-400' },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white">{error || 'Campaign not found'}</h3>
        <button onClick={() => navigate('/admin/campaigns')} className="mt-4 text-primary hover:underline">Back to Campaigns</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/campaigns')}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white">{campaign.name}</h1>
              <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${
                campaign.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-white/5 text-white/30 border-white/10'
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">{campaign.channel} · {campaign.type}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {campaign.channel === 'meta' && (
            <button 
              onClick={() => setIsMetaModalOpen(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 px-5 py-3 text-xs font-black uppercase tracking-widest text-blue-400 transition-all hover:bg-blue-500/20"
            >
              <TrendingUp size={16} />
              Update Meta
            </button>
          )}
          
          <div className="flex-1 md:flex-initial flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-1">
            {campaign.status === 'draft' && (
              <button onClick={() => handleStatusChange('active')} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-green-400 hover:bg-green-500/10 rounded-xl transition-all">Launch</button>
            )}
            {campaign.status === 'active' && (
              <button onClick={() => handleStatusChange('paused')} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all">Pause</button>
            )}
            {campaign.status === 'paused' && (
              <button onClick={() => handleStatusChange('active')} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-green-400 hover:bg-green-500/10 rounded-xl transition-all">Resume</button>
            )}
            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <button onClick={() => handleStatusChange('completed')} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all">Complete</button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(metrics?.revenue), icon: DollarSign, color: 'text-green-400' },
          { label: 'ROAS', value: `${metrics?.roas?.toFixed(2)}x`, icon: TrendingUp, color: 'text-primary' },
          { label: 'Total Spend', value: formatCurrency(campaign.budget?.total_spent), icon: DollarSign, color: 'text-white/60' },
          { label: 'Conv. Rate', value: `${((metrics?.conversion_rate || 0) * 100).toFixed(2)}%`, icon: Percent, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 border-white/5 bg-white/[0.02]"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Funnel */}
        <div className="lg:col-span-2 glass-panel p-8 border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-3">
              <BarChart2 className="text-primary" size={20} />
              Acquisition Funnel
            </h3>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/30">Conversion Path</div>
          </div>
          
          <div className="space-y-6">
            {funnelData.map((stage, i) => {
              const maxCount = funnelData[0].count || 1;
              const percentage = Math.round((stage.count / maxCount) * 100);
              const dropOff = i > 0 ? Math.round((1 - stage.count / (funnelData[i-1].count || 1)) * 100) : 0;
              
              return (
                <div key={stage.name} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white/5 ${stage.color}`}>
                        <stage.icon size={16} />
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{stage.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">{stage.count?.toLocaleString()}</span>
                      <span className="text-[10px] font-mono text-white/30 ml-2">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className={`h-full bg-gradient-to-r from-primary to-secondary opacity-80`}
                    />
                  </div>
                  {i > 0 && (
                    <div className="absolute -top-4 right-0 text-[9px] font-mono text-red-400/60 bg-red-400/5 px-2 py-0.5 rounded-full border border-red-400/10">
                      ↓ {dropOff}% Drop-off
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-6 pt-8 border-t border-white/5">
            {[
              { label: 'Impressions', value: metrics?.impressions?.toLocaleString(), icon: Globe },
              { label: 'CTR', value: `${((metrics?.clicks || 0) / (metrics?.impressions || 1) * 100).toFixed(2)}%`, icon: MousePointer2 },
              { label: 'Unique Visitors', value: metrics?.unique_visitors?.toLocaleString(), icon: Users },
              { label: 'Reminders', value: metrics?.reminder_signups?.toLocaleString(), icon: UserPlus },
              { label: 'AOV', value: formatCurrency(metrics?.aov), icon: DollarSign },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xl font-black text-white">{item.value}</p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 flex items-center gap-1.5 mt-1">
                  <item.icon size={10} />
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Info */}
        <div className="space-y-6">
          <div className="glass-panel p-8 border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <Target className="text-primary" size={20} />
              Targeting
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Persona</p>
                <div className="flex flex-wrap gap-2">
                  {campaign.target_persona?.gender?.map(g => (
                    <span key={g} className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">{g}</span>
                  ))}
                  {campaign.target_persona?.cities?.map(c => (
                    <span key={c} className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Strategy</p>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-sm font-bold text-white uppercase tracking-tight">{campaign.product_strategy.method.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-white/40 mt-1">Max products: {campaign.product_strategy.max_products || 'Unlimited'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Budget</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-black text-white">{formatCurrency(campaign.budget?.daily_budget)}</p>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">Daily Allocation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white/60">{formatCurrency(campaign.budget?.total_budget)}</p>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">Total Cap</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <Globe className="text-primary" size={20} />
              Landing Page
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">{campaign.landing_type}</p>
                  <p className="text-xs text-white/40 mt-1">Layout: {campaign.landing?.layout || 'Default'}</p>
                </div>
                <a 
                  href={`/${campaign.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-white/30">UTM SOURCE</span>
                  <span className="text-white/70 uppercase">{campaign.utm_source}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-white/30">UTM MEDIUM</span>
                  <span className="text-white/70 uppercase">{campaign.utm_medium}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-white/30">UTM CAMPAIGN</span>
                  <span className="text-white/70">{campaign.utm_campaign}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Modal */}
      <AnimatePresence>
        {isMetaModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-md border-white/10"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400"><TrendingUp size={20} /></div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">Meta Inputs</h2>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">Update Real-Time Performance</p>
                  </div>
                </div>
                <button onClick={() => setIsMetaModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">✕</button>
              </div>
              <form onSubmit={handleMetaInputsSubmit} className="p-6 space-y-4">
                {(['ad_spend_to_date', 'impressions', 'clicks', 'impression_lower', 'impression_upper'] as const).map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">{field.replace(/_/g, ' ')}</label>
                    <input
                      type="number"
                      value={metaInputs[field]}
                      onChange={e => setMetaInputs(prev => ({ ...prev, [field]: Number(e.target.value) }))}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm font-mono focus:border-primary/50 transition-colors"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsMetaModalOpen(false)} className="px-6 py-3 rounded-2xl bg-white/5 text-white/60 font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancel</button>
                  <button type="submit" disabled={isMetaLoading} className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all disabled:opacity-50">
                    {isMetaLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignDetail;
