import React, { useState, useEffect } from 'react';
import { Globe, Plus, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { AdminCatalog } from '../../api/catalogApi';
import { Drop } from '../../api/api.types';

const ManageDrops: React.FC = () => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrops = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use AdminCatalog to get all drops (including drafts)
      const resp = await AdminCatalog.getDrops();
      if (resp.ok && Array.isArray(resp.body)) {
        setDrops(resp.body);
      } else {
        setError('Failed to fetch drops from backend.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono uppercase tracking-widest text-white/40">Loading Drops...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white">Drops Integration Error</h3>
        <p className="mt-2 text-sm text-red-200/80 max-w-md mx-auto">{error}</p>
        <button onClick={fetchDrops} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Platform Drops</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">Exclusive Release Lifecycle</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-primary-dark hover:scale-[1.02] shadow-glow-primary">
          <Plus size={18} />
          Schedule Drop
        </button>
      </div>

      {drops.length === 0 ? (
        <div className="glass-panel p-12 border-white/5 bg-white/[0.02] text-center">
          <Globe className="mx-auto h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/30 font-mono uppercase tracking-widest text-sm">No drops found in backend</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drops.map((drop) => (
            <div key={drop.id} className="glass-panel p-6 border-white/5 bg-white/[0.02] flex items-center gap-6 group hover:border-white/10 transition-colors">
              <div className={`h-12 w-12 rounded-[1.25rem] flex items-center justify-center ${drop.status === 'live' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
                <Clock className={drop.status === 'live' ? 'animate-pulse' : ''} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">{drop.title}</h3>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    drop.status === 'live' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    drop.status === 'announced' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                    'bg-white/5 text-white/30 border-white/10'
                  }`}>
                    {drop.status}
                  </span>
                </div>
                <p className="text-xs text-white/40 tracking-tight">
                  {drop.launch_at ? new Date(drop.launch_at).toLocaleDateString() : 'No date set'} • {drop.product_ids?.length || 0} Products
                </p>
              </div>
              <div className="text-right flex items-center gap-8">
                <div>
                  <p className="text-xl font-black text-white">{drop.reminder_count?.toLocaleString() || '0'}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Reminders</p>
                </div>
                <div>
                  <p className="text-xl font-black text-white">{drop.view_count?.toLocaleString() || '0'}</p>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Views</p>
                </div>
              </div>
              <button className="p-3 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100 ml-4">
                Manage
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageDrops;
