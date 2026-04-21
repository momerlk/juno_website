import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Campaigns } from '../../api/campaignsApi';
import { Campaign, MetaInputsRequest } from '../../api/api.types';
import CreateCampaignModal from './CreateCampaignModal';

const ManageCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [metaInputCampaignId, setMetaInputCampaignId] = useState<string | null>(null);
  const [metaInputs, setMetaInputs] = useState<MetaInputsRequest>({ ad_spend_to_date: 0, impressions: 0, clicks: 0, impression_lower: 0, impression_upper: 0 });
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await Campaigns.listCampaigns();
      if (resp.ok && Array.isArray(resp.body)) {
        // Fetch metrics for each campaign to show in the table (if not already included)
        const campaignsWithMetrics = await Promise.all(
          resp.body.map(async (camp: Campaign) => {
            if (camp.metrics && camp.status !== 'active') return camp; // Optimization
            try {
              const metricsResp = await Campaigns.getCampaignMetrics(camp.id);
              return { ...camp, metrics: metricsResp.ok ? metricsResp.body : camp.metrics };
            } catch {
              return camp;
            }
          })
        );
        setCampaigns(campaignsWithMetrics);
      } else {
        setError('Failed to fetch campaigns. Backend may be unreachable.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Campaign['status']) => {
    try {
      const resp = await Campaigns.changeCampaignStatus(id, newStatus);
      if (resp.ok) {
        fetchCampaigns();
      } else {
        const err = resp.body as any;
        alert('Failed to change status: ' + (err?.message || JSON.stringify(err)));
      }
    } catch (err) {
      alert('Error changing status: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this campaign?')) return;
    try {
      const resp = await Campaigns.archiveCampaign(id);
      if (resp.ok) {
        fetchCampaigns();
      }
    } catch (err) {
      alert('Error archiving: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleMetaInputsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaInputCampaignId) return;
    setIsMetaLoading(true);
    try {
      await Campaigns.updateMetaInputs(metaInputCampaignId, metaInputs);
      setMetaInputCampaignId(null);
      fetchCampaigns();
    } finally {
      setIsMetaLoading(false);
    }
  };

  const totalMetrics = campaigns.reduce((acc, camp) => {
    if (camp.metrics) {
      acc.spend += camp.budget?.total_spent || 0;
      acc.clicks += camp.metrics.clicks || 0;
      acc.conversions += camp.metrics.orders || 0;
    }
    return acc;
  }, { spend: 0, clicks: 0, conversions: 0 });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono uppercase tracking-widest text-white/40">Loading Campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white">Campaign Integration Error</h3>
        <p className="mt-2 text-sm text-red-200/80 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchCampaigns}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw size={14} />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Campaign Management</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">Growth & Acquisition Engines</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-primary-dark hover:scale-[1.02] shadow-glow-primary"
        >
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget Spent', value: `Rs ${totalMetrics.spend.toLocaleString()}` },
          { label: 'Total Clicks', value: totalMetrics.clicks.toLocaleString() },
          { label: 'Total Conversions', value: totalMetrics.conversions.toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-5 border-white/5 bg-white/[0.02]">
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-white/5 font-mono text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-6 py-4 font-normal">Campaign Name</th>
                <th className="px-6 py-4 font-normal">Channel</th>
                <th className="px-6 py-4 font-normal">Type</th>
                <th className="px-6 py-4 font-normal">Clicks</th>
                <th className="px-6 py-4 font-normal">ROAS</th>
                <th className="px-6 py-4 font-normal">Status</th>
                <th className="px-6 py-4 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/30 font-mono uppercase tracking-widest text-xs">
                    No campaigns found in backend
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-black uppercase tracking-tight text-white">{camp.name}</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">{camp.utm_campaign}</div>
                    </td>
                    <td className="px-6 py-5 text-white/60 uppercase text-xs tracking-wider">{camp.channel}</td>
                    <td className="px-6 py-5 text-white/60 uppercase text-xs tracking-wider">{camp.type}</td>
                    <td className="px-6 py-5 font-mono">{camp.metrics?.clicks?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-5 font-mono text-green-400">
                      {camp.metrics?.roas ? `${camp.metrics.roas.toFixed(1)}x` : '0.0x'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        camp.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        camp.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-white/5 text-white/30 border-white/10'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/campaigns/${camp.id}`}
                          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <BarChart2 size={11} />
                          View
                        </Link>
                        {camp.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(camp.id, 'active')}
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            Launch
                          </button>
                        )}
                        {camp.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(camp.id, 'paused')}
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                          >
                            Pause
                          </button>
                        )}
                        {camp.status === 'paused' && (
                          <button
                            onClick={() => handleStatusChange(camp.id, 'active')}
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            Resume
                          </button>
                        )}
                        {(camp.status === 'active' || camp.status === 'paused') && (
                          <button
                            onClick={() => handleStatusChange(camp.id, 'completed')}
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            End
                          </button>
                        )}
                        {camp.status !== 'archived' && (
                          <button
                            onClick={() => handleArchive(camp.id)}
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            Archive
                          </button>
                        )}
                        {camp.channel === 'meta' && (
                          <button
                            onClick={() => {
                              setMetaInputs({ ad_spend_to_date: camp.budget?.ad_spend_to_date || 0, impressions: camp.metrics?.impressions || 0, clicks: camp.metrics?.clicks || 0, impression_lower: camp.budget?.impression_lower || 0, impression_upper: camp.budget?.impression_upper || 0 });
                              setMetaInputCampaignId(camp.id);
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <TrendingUp size={11} />
                            Meta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateCampaignModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={fetchCampaigns}
          />
        )}
        {metaInputCampaignId && (
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
                <button onClick={() => setMetaInputCampaignId(null)} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">✕</button>
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
                  <button type="button" onClick={() => setMetaInputCampaignId(null)} className="px-6 py-3 rounded-2xl bg-white/5 text-white/60 font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancel</button>
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

export default ManageCampaigns;
