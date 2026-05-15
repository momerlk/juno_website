import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, RefreshCw } from 'lucide-react';
import { AdminFinancials } from '../../api/adminApi';

const formatCurrency = (v?: number) => `Rs ${(v ?? 0).toLocaleString()}`;

const AdminFinancialsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

  const [from, setFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [carrier, setCarrier] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, rowRes] = await Promise.all([
        AdminFinancials.getSummary({ from, to, carrier: carrier || undefined }),
        AdminFinancials.getOrders({ from, to, carrier: carrier || undefined, page: 1, limit: 100 }),
      ]);

      if (!sumRes.ok) throw new Error((sumRes.body as any)?.message || 'Failed to load summary');
      if (!rowRes.ok) throw new Error((rowRes.body as any)?.message || 'Failed to load rows');

      setSummary(sumRes.body);
      setRows(Array.isArray(rowRes.body) ? rowRes.body : ((rowRes.body as any)?.orders || []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 mt-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-5 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 size={22} className="text-primary" /> Financials</h2>
          <p className="text-xs text-neutral-400 mt-1">GMV, take rate, commission revenue, courier shipping cost, gross income, and seller payout.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
            <option value="">All carriers</option>
            <option value="dex">DEX</option>
            <option value="smartlane">Smartlane</option>
          </select>
          <button onClick={() => void load()} className="px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-xs">
            <RefreshCw size={13} className="inline mr-1" /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-600/40 bg-red-900/20 p-3 text-sm text-red-300">{error}</div>}

      {isLoading ? (
        <div className="py-16 text-center text-neutral-400">Loading financials...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">GMV</p><p className="text-white font-bold">{formatCurrency(summary?.gmv)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Take Rate</p><p className="text-white font-bold">{summary?.take_rate ? `${(summary.take_rate * 100).toFixed(2)}%` : '0%'}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Revenue</p><p className="text-white font-bold">{formatCurrency(summary?.revenue_generated)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Courier Cost</p><p className="text-white font-bold">{formatCurrency(summary?.courier_shipping_cost)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Gross Income</p><p className="text-emerald-300 font-bold">{formatCurrency(summary?.gross_income)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Seller Payout</p><p className="text-white font-bold">{formatCurrency(summary?.seller_payout)}</p></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Order</th><th className="p-3">Carrier</th><th className="p-3">Status</th><th className="p-3">GMV</th><th className="p-3">Commission</th><th className="p-3">Shipping Rev</th><th className="p-3">Courier Cost</th><th className="p-3">Gross Income</th><th className="p-3">Seller Payout</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, idx) => (
                  <tr key={row.order_id || row.order_number || idx} className="border-b border-white/5">
                    <td className="p-3 text-white font-mono">{row.order_number || row.order_id}</td>
                    <td className="p-3">{row.carrier || '-'}</td>
                    <td className="p-3">{row.booking_status || row.status || '-'}</td>
                    <td className="p-3">{formatCurrency(row.gmv || row.order_total)}</td>
                    <td className="p-3">{formatCurrency(row.commission_revenue)}</td>
                    <td className="p-3">{formatCurrency(row.shipping_revenue)}</td>
                    <td className="p-3">{formatCurrency(row.courier_shipping_cost)}</td>
                    <td className="p-3">{formatCurrency(row.gross_income)}</td>
                    <td className="p-3">{formatCurrency(row.seller_payout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AdminFinancialsPage;
