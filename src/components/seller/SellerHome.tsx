import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Loader, Globe, CreditCard, Store, ShoppingCart, ArrowRight, Link2, Link2Off, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionModal from './SubscriptionModal';
import * as api from "../../api/sellerApi";
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';

const SellerHome: React.FC = () => {
  const { seller } = useSellerAuth();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Shopify integration state
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyShop, setShopifyShop] = useState<string | undefined>(undefined);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyShopInput, setShopifyShopInput] = useState('');
  const [shopifyActionLoading, setShopifyActionLoading] = useState(false);
  const [shopifyMessage, setShopifyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shopifyAuthUrl, setShopifyAuthUrl] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!seller?.token) return;
      setIsLoadingOrders(true);
      try {
        const response = await api.Seller.GetOrders(seller.token);
        if (response.ok && response.body) {
          const sortedOrders = (response.body as Order[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentOrders(sortedOrders.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch recent orders", error);
      }
      setIsLoadingOrders(false);
    };
    fetchRecentOrders();
  }, [seller?.token]);

  useEffect(() => {
    const checkShopifyStatus = async () => {
      if (!seller?.token) { setShopifyLoading(false); return; }
      setShopifyLoading(true);
      const res = await api.Shopify.GetStatus(seller.token);
      const data = res.body.data;
      console.log(`data = ${JSON.stringify(data)}`)
      if (res.ok) {
        setShopifyConnected(data.connected);
        setShopifyShop(data.shop);
      }
      setShopifyLoading(false);
    };
    checkShopifyStatus();
  }, [seller?.token]);

  const handleShopifyConnect = () => {
    if (!shopifyShopInput.trim() || !seller?.token) return;
    const shop = shopifyShopInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const url = api.Shopify.GetAuthUrl(seller.token, shop);
    setShopifyAuthUrl(url);
  };

  const handleShopifySync = async () => {
    if (!seller?.token) return;
    setShopifyActionLoading(true);
    setShopifyMessage(null);
    const res = await api.Shopify.Sync(seller.token);
    setShopifyActionLoading(false);
    if (res.ok) {
      setShopifyMessage({ type: 'success', text: 'Sync started! Products will appear in your queue shortly.' });
    } else {
      setShopifyMessage({ type: 'error', text: 'Sync failed. Please try again or reconnect your store.' });
    }
  };

  const handleShopifyDisconnect = async () => {
    if (!seller?.token || !confirm('Disconnect your Shopify store? You can reconnect at any time.')) return;
    setShopifyActionLoading(true);
    setShopifyMessage(null);
    const res = await api.Shopify.Disconnect(seller.token);
    setShopifyActionLoading(false);
    if (res.ok) {
      setShopifyConnected(false);
      setShopifyShop(undefined);
      setShopifyShopInput('');
      setShopifyMessage({ type: 'success', text: 'Shopify store disconnected.' });
    } else {
      setShopifyMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
    }
  };

  const handleSubscriptionUpdate = async (plan: any, paymentDetails: any) => {
    console.log('Processing subscription:', { plan, paymentDetails });
    setIsSubscriptionModalOpen(false);
  };

  return (
    <>
      {/* Info Strip — unified panel with internal columns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.07]">

          {/* — Brand Identity */}
          <div className="relative p-6 overflow-hidden">
            {/* Ghost monogram */}
            <span
              className="absolute -right-3 -bottom-4 text-[7rem] font-black leading-none select-none pointer-events-none text-white"
              style={{ opacity: 0.025 }}
            >
              {seller?.user?.business_name?.charAt(0)?.toUpperCase() ?? 'J'}
            </span>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Store size={13} className="text-white/30" />
                <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/30">Brand Profile</span>
              </div>

              <p className="text-xl font-bold text-white mb-0.5 truncate">{seller?.user?.business_name}</p>
              <p className="text-xs font-mono text-white/35 truncate mb-5">{seller?.user?.email}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">Status</span>
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                  seller?.user?.status === 'active'
                    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/25'
                    : 'text-amber-400 bg-amber-400/10 border-amber-500/25'
                }`}>
                  {seller?.user?.status === 'active' ? '● Active' : '○ Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* — Shopify Integration */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={13} className="text-white/30" />
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/30">Shopify</span>
            </div>

            {shopifyLoading ? (
              <div className="flex items-center gap-2 text-white/25 py-4">
                <Loader size={13} className="animate-spin" />
                <span className="text-xs font-mono">Checking connection…</span>
              </div>
            ) : shopifyConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-mono text-emerald-400 truncate">{shopifyShop ?? 'Connected'}</span>
                </div>
                {shopifyMessage && (
                  <p className={`text-[11px] font-mono ${shopifyMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {shopifyMessage.text}
                  </p>
                )}
                <button
                  onClick={handleShopifySync}
                  disabled={shopifyActionLoading}
                  className="w-full py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase border transition-all duration-200 flex items-center justify-center gap-2 bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-primary/15 hover:border-primary/30 hover:text-primary disabled:opacity-40"
                >
                  {shopifyActionLoading ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  {shopifyActionLoading ? 'Syncing…' : 'Sync Products'}
                </button>
                <button
                  onClick={handleShopifyDisconnect}
                  disabled={shopifyActionLoading}
                  className="w-full py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase border border-white/[0.05] text-white/20 hover:border-red-500/30 hover:text-red-400 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Link2Off size={11} /> Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-white/35 leading-relaxed">
                  Connect your Shopify store to import products automatically.
                </p>
                {shopifyMessage && (
                  <p className="text-[11px] font-mono text-red-400">{shopifyMessage.text}</p>
                )}
                {shopifyAuthUrl ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono text-emerald-400">Auth link ready — open it to install the Juno app on your store:</p>
                    <a
                      href={shopifyAuthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase border transition-all duration-200 flex items-center justify-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <ArrowRight size={13} /> Open Shopify Auth
                    </a>
                    <button
                      onClick={() => { setShopifyAuthUrl(null); setShopifyShopInput(''); }}
                      className="w-full py-1.5 text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors"
                    >
                      Use a different store
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[10px] font-mono text-white/20 pointer-events-none select-none">https://</span>
                      <input
                        type="text"
                        placeholder="your-store.myshopify.com"
                        value={shopifyShopInput}
                        onChange={(e) => setShopifyShopInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleShopifyConnect()}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-[4.5rem] pr-4 py-2.5 text-sm text-white font-mono placeholder-white/15 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
                      />
                    </div>
                    <button
                      onClick={handleShopifyConnect}
                      disabled={!shopifyShopInput.trim()}
                      className="w-full py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase border transition-all duration-200 flex items-center justify-center gap-2 bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-primary/15 hover:border-primary/30 hover:text-primary disabled:opacity-40"
                    >
                      <Link2 size={13} /> Get Connect Link
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* — Membership */}
          <div className="relative p-6 overflow-hidden">
            {seller?.user?.status === 'active' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,24,24,0.06) 0%, transparent 60%)' }}
              />
            )}
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={13} className="text-white/30" />
                <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/30">Membership</span>
              </div>

              <div className="mb-5">
                <span className={`inline-block text-[10px] font-mono px-2.5 py-1 rounded border mb-3 ${
                  seller?.user?.status === 'active'
                    ? 'text-primary border-primary/30 bg-primary/10'
                    : 'text-white/25 border-white/10 bg-white/[0.04]'
                }`}>
                  {seller?.user?.status === 'active' ? 'STANDARD PLAN' : 'NO ACTIVE PLAN'}
                </span>
                <p className="text-xs text-white/35 leading-relaxed">
                  {seller?.user?.status === 'active'
                    ? 'Your plan is active and renews automatically each cycle.'
                    : 'Subscribe to unlock full selling and analytics features.'}
                </p>
              </div>

              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className={`w-full py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase border transition-all duration-200 ${
                  seller?.user?.status === 'active'
                    ? 'border-primary/30 text-primary bg-primary/10 hover:bg-primary/20'
                    : 'border-white/15 text-white/60 bg-white/[0.04] hover:bg-primary/15 hover:border-primary/30 hover:text-primary'
                }`}
              >
                {seller?.user?.status === 'active' ? 'Manage Plan' : 'Subscribe Now →'}
              </button>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Recent Orders — ledger table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-5 rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={13} className="text-white/30" />
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/30">Recent Orders</span>
          </div>
          <Link
            to="/seller/dashboard/orders"
            className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.2em] uppercase text-white/25 hover:text-primary transition-colors"
          >
            View All <ArrowRight size={11} />
          </Link>
        </div>

        {/* Column labels */}
        {!isLoadingOrders && recentOrders.length > 0 && (
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {['Order / Customer', 'Status', 'Amount', 'Date'].map(col => (
              <span key={col} className="text-[9px] font-mono tracking-[0.25em] uppercase text-white/20">{col}</span>
            ))}
          </div>
        )}

        {/* Rows */}
        <div>
          {isLoadingOrders ? (
            <div className="flex items-center justify-center gap-3 py-14 text-white/20">
              <Loader className="animate-spin" size={15} />
              <span className="text-xs font-mono tracking-widest">Loading…</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-white/20">
              <ShoppingCart size={22} style={{ opacity: 0.3 }} />
              <p className="text-xs font-mono tracking-widest">No orders yet</p>
            </div>
          ) : (
            recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.06 }}
                className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 items-center px-6 py-4 border-b last:border-0 hover:bg-white/[0.025] transition-colors group cursor-default"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-mono text-white group-hover:text-primary transition-colors truncate">
                    #{order.order_number}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5 truncate">{order.shipping_address?.name}</p>
                </div>
                <div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div>
                  <p className="text-sm font-mono text-white">Rs. {order.total.toLocaleString()}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{order.order_items?.length} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-white/30">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscriptionUpdate}
        currentPlan={seller?.user?.status === 'active' ? { id: 'standard', name: 'Standard', price: 4999, billingPeriod: 'monthly', features: ['Unlimited products', 'Advanced analytics', 'Priority support'] } : undefined}
      />
    </>
  );
};

export default SellerHome;