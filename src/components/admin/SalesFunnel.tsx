import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, PieChart, TrendingUp, Users, ShoppingCart, Eye, ArrowRight, Wallet } from 'lucide-react';
import { getSalesFunnel } from '../../api/adminApi';

const SalesFunnel: React.FC = () => {
  const [funnel, setFunnel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getSalesFunnel();
        if (res.ok) {
          setFunnel(res.body);
        }
      } catch (err) {
        console.error("Failed to fetch funnel:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fallback dummy data if API returns empty
  const data = funnel || {
    product_views: 12450,
    added_to_cart: 1840,
    checkout_started: 920,
    purchases: 412
  };

  const steps = [
    { name: 'Product Discovery', value: data.product_views, icon: Eye, color: 'bg-blue-500' },
    { name: 'Interest (Add to Cart)', value: data.added_to_cart, icon: ShoppingCart, color: 'bg-purple-500' },
    { name: 'Intent (Checkout)', value: data.checkout_started, icon: ArrowRight, color: 'bg-pink-500' },
    { name: 'Conversion (Purchase)', value: data.purchases, icon: Wallet, color: 'bg-green-500' },
  ];

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp size={24} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Sales Conversion Funnel</h2>
        </div>
        <div className="text-xs text-neutral-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            Last 30 Days Analytics
        </div>
      </div>

      {isLoading ? (
          <div className="text-center py-20 text-neutral-400 animate-pulse">Calculating conversions...</div>
      ) : (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const prevStep = index > 0 ? steps[index - 1] : null;
                const dropoff = prevStep ? (100 - parseFloat(getPercentage(step.value, prevStep.value))) : 0;
                
                return (
                    <div key={step.name} className="relative">
                        <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${step.color} bg-opacity-20`}>
                                    <step.icon size={24} className={step.color.replace('bg-', 'text-')} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{step.name}</h3>
                                    <p className="text-sm text-neutral-400">Step {index + 1} of the customer journey</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-white">{step.value.toLocaleString()}</p>
                                <p className="text-xs text-neutral-500 font-mono mt-1">
                                    {index === 0 ? 'Total Reach' : `${getPercentage(step.value, steps[0].value)}% of discovered products`}
                                </p>
                            </div>
                        </div>
                        
                        {index < steps.length - 1 && (
                            <div className="flex justify-center my-2">
                                <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-8 bg-gradient-to-b from-white/20 to-transparent"></div>
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        -{dropoff.toFixed(1)}% Dropoff
                                    </div>
                                    <div className="w-0.5 h-8 bg-gradient-to-t from-white/20 to-transparent"></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-primary/20 bg-primary/5">
                    <h4 className="text-sm font-semibold text-neutral-400 mb-4 flex items-center gap-2">
                        <PieChart size={16} /> Overall Conversion Rate
                    </h4>
                    <p className="text-5xl font-black text-white">{getPercentage(data.purchases, data.product_views)}%</p>
                    <p className="text-sm text-neutral-400 mt-2">Discoveries to Final Purchase</p>
                </div>
                <div className="glass-card p-6 border-green-500/20 bg-green-500/5">
                    <h4 className="text-sm font-semibold text-neutral-400 mb-4 flex items-center gap-2">
                        <ShoppingCart size={16} /> Checkout Conversion
                    </h4>
                    <p className="text-5xl font-black text-white">{getPercentage(data.purchases, data.checkout_started)}%</p>
                    <p className="text-sm text-neutral-400 mt-2">Started checkouts that resulted in a sale</p>
                </div>
            </div>
        </div>
      )}
    </motion.div>
  );
};

export default SalesFunnel;