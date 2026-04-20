import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Campaigns } from '../../api/campaignsApi';
import { Campaign } from '../../api/api.types';
import CreateCampaignModal from './CreateCampaignModal';

const ManageCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await Campaigns.listCampaigns();
      if (resp.ok && Array.isArray(resp.body)) {
        // Fetch metrics for each campaign to show in the table
        const campaignsWithMetrics = await Promise.all(
          resp.body.map(async (camp: Campaign) => {
            try {
              const metricsResp = await Campaigns.getCampaignMetrics(camp.id);
              return { ...camp, metrics: metricsResp.ok ? metricsResp.body : undefined };
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
      </AnimatePresence>
    </div>
  );
};

export default ManageCampaigns;
