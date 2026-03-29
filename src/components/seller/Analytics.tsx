import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Eye,
  Heart,
  Loader,
  MapPinned,
  Package,
  RadioTower,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Order } from '../../constants/orders';

const frame = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const AnalyticsCard: React.FC<{ title: string; value: string | number; note: string; icon: React.ReactNode }> = ({ title, value, note, icon }) => (
  <div className="rounded-[1.45rem] border border-white/10 bg-black/25 p-5">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">{title}</p>
      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2 text-primary">{icon}</div>
    </div>
    <p className="mt-4 text-3xl font-black uppercase tracking-[-0.05em] text-white">{value}</p>
    <p className="mt-2 text-sm text-white/45">{note}</p>
  </div>
);

const Analytics: React.FC = () => {
  const { seller } = useSellerAuth();
  const token = seller?.token;

  const [salesData, setSalesData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  const getRangeStart = (range: string) => {
    const date = new Date();
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      setIsLoading(true);
      setError(null);
      const startTime = getRangeStart(timeRange);

      try {
        const [sales, orderAnalytics, inventory, liveOrders] = await Promise.all([
          api.SellerAnalytics.GetSalesAnalytics(token, startTime),
          api.SellerAnalytics.GetOrderAnalytics(token, startTime),
          api.SellerAnalytics.GetInventoryAnalytics(token, startTime),
          api.Seller.GetOrders(token),
        ]);

        if (!sales.ok) throw new Error('Failed to fetch sales analytics.');
        if (!orderAnalytics.ok) throw new Error('Failed to fetch order analytics.');
        if (!inventory.ok) throw new Error('Failed to fetch inventory analytics.');
        if (!liveOrders.ok) throw new Error('Failed to fetch live orders.');

        setSalesData(sales.body);
        setOrderData(orderAnalytics.body);
        setInventoryData(inventory.body);
        setOrders(liveOrders.body);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching analytics.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, timeRange]);

  const derived = useMemo(() => {
    const cityBreakdown = orders.reduce<Record<string, number>>((acc, order) => {
      const city = order.shipping_address?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const topCities = Object.entries(cityBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const delivered = orders.filter(order => order.status === 'delivered' || order.status === 'fulfilled').length;
    const cancelled = orders.filter(order => order.status === 'cancelled').length;
    const totalOrders = orders.length;
    const fulfillmentRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelled / totalOrders) * 100) : 0;
    const projectedVisits = Math.max(totalOrders * 16, 42);
    const projectedSaves = Math.max(totalOrders * 7, 20);
    const projectedStoryOpens = Math.max(totalOrders * 5, 14);

    return {
      topCities,
      fulfillmentRate,
      cancellationRate,
      projectedVisits,
      projectedSaves,
      projectedStoryOpens,
      strongestCity: topCities[0]?.[0] || seller?.user?.location?.city || 'Pakistan',
    };
  }, [orders, seller?.user?.location?.city]);

  if (isLoading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center gap-3 text-white/60">
        <Loader className="animate-spin" size={18} />
        Loading brand analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-[1.7rem] border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  return (
    <motion.div {...frame} transition={{ duration: 0.45 }}>
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.15),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-primary/75">
              <BarChart3 size={12} />
              Story Analytics
            </p>
            <h2 className="text-3xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
              Think like Instagram insights, not a spreadsheet export.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60 md:text-base">
              This view is shifting seller analytics from static ops metrics to a mix of live commerce signals and upcoming story-level signals: saves, profile visits, browsing cities, and founder momentum.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setTimeRange(option.key)}
                className={`rounded-full border px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors ${
                  timeRange === option.key
                    ? 'border-primary/30 bg-primary text-white'
                    : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title="Revenue"
          value={`Rs ${Number(salesData?.total_revenue || 0).toLocaleString()}`}
          note="Live commerce data from current seller analytics."
          icon={<TrendingUp size={16} />}
        />
        <AnalyticsCard
          title="Orders"
          value={salesData?.total_orders || orderData?.total || orders.length || 0}
          note="Commerce volume gives the cleanest baseline signal."
          icon={<ShoppingCart size={16} />}
        />
        <AnalyticsCard
          title="Average Order"
          value={`Rs ${Number(salesData?.average_order_value || 0).toLocaleString()}`}
          note="Use this to shape pricing and bundles."
          icon={<Sparkles size={16} />}
        />
        <AnalyticsCard
          title="Inventory Ready"
          value={`${inventoryData?.in_stock || 0}`}
          note="Products currently in stock and ready to convert."
          icon={<Package size={16} />}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.div {...frame} transition={{ duration: 0.45, delay: 0.05 }} className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <MapPinned size={12} />
            Audience Pulse
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Strongest City</p>
              <p className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] text-white">{derived.strongestCity}</p>
              <p className="mt-2 text-sm text-white/45">Where recent order intent is concentrated right now.</p>
            </div>
            <div className="space-y-3">
              {derived.topCities.length > 0 ? (
                derived.topCities.map(([city, count], index) => (
                  <div key={city} className="flex items-center justify-between rounded-[1.2rem] border border-white/10 bg-black/25 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{city}</p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Live buyer demand</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black uppercase tracking-[-0.04em] text-white">{count}</p>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">#{index + 1}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4 text-sm text-white/50">
                  Buyer geography will start filling in once orders land consistently.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div {...frame} transition={{ duration: 0.45, delay: 0.08 }} className="rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <RadioTower size={12} />
            Brand Momentum
          </div>
          <div className="mt-4 grid gap-3">
            {[
              { title: 'Fulfillment Rate', value: `${derived.fulfillmentRate}%`, note: 'Live operational trust score' },
              { title: 'Cancellation Rate', value: `${derived.cancellationRate}%`, note: 'The fastest leak in buyer trust' },
              { title: 'Projected Profile Visits', value: derived.projectedVisits, note: 'Preview until event layer ships' },
              { title: 'Projected Saves', value: derived.projectedSaves, note: 'Save intent preview from recent activity' },
            ].map(item => (
              <div key={item.title} className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-white/40">{item.note}</p>
                  </div>
                  <p className="text-2xl font-black uppercase tracking-[-0.04em] text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <motion.div {...frame} transition={{ duration: 0.45, delay: 0.1 }} className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Eye size={12} />
            Story Signals Preview
          </div>
          <p className="mt-4 text-2xl font-black uppercase tracking-[-0.04em] text-white">{derived.projectedStoryOpens}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            This is preview scaffolding for the richer event layer Juno should expose next: story taps, profile visits, and save behavior.
          </p>
        </motion.div>

        <motion.div {...frame} transition={{ duration: 0.45, delay: 0.12 }} className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Users size={12} />
            Buyer Demographic Layer
          </div>
          <p className="mt-4 text-lg font-black uppercase tracking-[0.02em] text-white">Coming into focus</p>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            The next version should break down browsing and buying by city, demand pockets, and repeat-buyer behavior so small brands can make smarter drops.
          </p>
        </motion.div>

        <motion.div {...frame} transition={{ duration: 0.45, delay: 0.14 }} className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Heart size={12} />
            Action Board
          </div>
          <div className="mt-4 space-y-3 text-sm text-white/60">
            <div className="rounded-[1.15rem] border border-white/10 bg-black/25 p-4">
              Double down on the silhouette, price point, or city that is already showing response.
            </div>
            <div className="rounded-[1.15rem] border border-white/10 bg-black/25 p-4">
              Add stronger images and a size guide to raise buyer confidence on your next drop.
            </div>
            <div className="rounded-[1.15rem] border border-white/10 bg-black/25 p-4">
              Treat every analytics change as a story edit, not just a stock edit.
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mt-6 rounded-[1.9rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
          <BookOpen size={12} />
          Why This Matters
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-white/60">
          Seller education is not overhead. Better photos, clearer descriptions, and sharper merchandising improve trust. That trust improves conversion. This analytics layer should help founders see those loops before they become obvious in sales alone.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-primary">
          <ArrowUpRight size={13} />
          Live commerce + preview story signals
        </div>
      </section>
    </motion.div>
  );
};

export default Analytics;
