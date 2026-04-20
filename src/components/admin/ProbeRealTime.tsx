import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, Users, Globe } from 'lucide-react';

const ProbeRealTime: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Real-Time Activity</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">Live from Probe Engine</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-500 text-[10px] font-mono uppercase tracking-widest">System Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Sessions', value: '1,284', icon: Users, color: 'text-blue-400' },
          { label: 'Events / Min', value: '842', icon: Activity, color: 'text-primary' },
          { label: 'Checkout Starts', value: '42', icon: Zap, color: 'text-yellow-400' },
          { label: 'Global Reach', value: '18', icon: Globe, color: 'text-green-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-5 border-white/5 bg-white/[0.02]">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border-white/5 bg-white/[0.02] min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-white/5 mb-4">
          <Activity size={48} className="text-primary/50" />
        </div>
        <h3 className="text-xl font-bold text-white">Connecting to Event Stream...</h3>
        <p className="text-white/40 mt-2 max-w-md">Initializing real-time connection to Probe analytics nodes for live platform monitoring.</p>
      </div>
    </div>
  );
};

export default ProbeRealTime;
