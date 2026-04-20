import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, ShoppingBag, CreditCard } from 'lucide-react';

const ProbeCommerce: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Commerce Analytics</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">Sales & Conversion Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: 'Rs 1.4M', icon: CreditCard, color: 'text-green-400' },
          { label: 'Conversion', value: '4.2%', icon: TrendingUp, color: 'text-primary' },
          { label: 'Orders', value: '342', icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'AOV', value: 'Rs 4,200', icon: BarChart2, color: 'text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-5 border-white/5 bg-white/[0.02]">
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border-white/5 bg-white/[0.02] min-h-[300px]">
          <h3 className="text-lg font-bold text-white mb-4">Acquisition Funnel</h3>
          <div className="space-y-4">
            {[
              { stage: 'Product Views', value: '42,000', pct: 100 },
              { stage: 'Add to Cart', value: '4,200', pct: 10 },
              { stage: 'Checkouts', value: '840', pct: 20 },
              { stage: 'Purchases', value: '342', pct: 40 },
            ].map((step) => (
              <div key={step.stage}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60 uppercase tracking-widest">{step.stage}</span>
                  <span className="text-white font-mono">{step.value}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 border-white/5 bg-white/[0.02] min-h-[300px]">
          <h3 className="text-lg font-bold text-white mb-4">Top Categories</h3>
          <div className="space-y-4">
            {[
              { category: 'Eastern Wear', share: 45 },
              { category: 'Western Wear', share: 30 },
              { category: 'Accessories', share: 15 },
              { category: 'Footwear', share: 10 },
            ].map((cat) => (
              <div key={cat.category} className="flex items-center gap-4">
                <div className="w-12 text-xs font-mono text-white/40">{cat.share}%</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/20" style={{ width: `${cat.share}%` }} />
                </div>
                <div className="w-32 text-xs text-white/60 uppercase tracking-widest text-right">{cat.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProbeCommerce;
