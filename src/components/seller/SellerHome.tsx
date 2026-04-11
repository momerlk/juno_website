import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  Link2,
  Link2Off,
  Loader,
  RefreshCw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';
import ShopifyScrape from './ShopifyScrape';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const SellerHome: React.FC = () => {
  const { seller } = useSellerAuth();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyShop, setShopifyShop] = useState<string | undefined>(undefined);
  const [shopifyConnectionType, setShopifyConnectionType] = useState<'active' | 'public' | undefined>(undefined);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyShopInput, setShopifyShopInput] = useState('');
  const [shopifyActionLoading, setShopifyActionLoading] = useState(false);
  const [shopifyMessage, setShopifyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [shopifyAuthUrl, setShopifyAuthUrl] = useState<string | null>(null);
  const [shopifyTab, setShopifyTab] = useState<'oauth' | 'scrape'>('scrape');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [liveTournaments, setLiveTournaments] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!seller?.token) return;
      setIsLoadingOrders(true);
      try {
        const response = await api.Seller.GetOrders(seller.token);
        if (response.ok && response.body) {
          const sortedOrders = [...response.body].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentOrders(sortedOrders.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to fetch recent orders', error);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchRecentOrders();
  }, [seller?.token]);

  useEffect(() => {
    const fetchTournaments = async () => {
      const response = await api.Tournaments.GetAllTournaments();
      if (!response.ok || !Array.isArray(response.body)) return;
      const relevant = response.body.filter((item: any) => item?.status === 'active' || item?.status === 'upcoming').slice(0, 3);
      setLiveTournaments(relevant);
    };

    fetchTournaments();
  }, []);

  useEffect(() => {
    const checkShopifyStatus = async () => {
      if (!seller?.token) {
        setShopifyLoading(false);
        return;
      }

      setShopifyLoading(true);
      try {
        const res = await api.Shopify.GetStatus(seller.token);
        if (res.ok) {
          setShopifyConnected(Boolean(res.body?.connected));
          setShopifyShop(res.body?.shop);
          setShopifyConnectionType(res.body?.connection_type);
        }
      } finally {
        setShopifyLoading(false);
      }
    };

    checkShopifyStatus();
  }, [seller?.token]);

  const metrics = useMemo(() => {
    const orderCount = recentOrders.length;
    const delivered = recentOrders.filter(order => order.status === 'delivered' || order.status === 'fulfilled').length;
    const openOrders = recentOrders.filter(order => !['delivered', 'fulfilled', 'cancelled'].includes(order.status)).length;
    const revenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const fulfillmentRate = orderCount > 0 ? Math.round((delivered / orderCount) * 100) : 0;

    return {
      delivered,
      openOrders,
      revenue,
      fulfillmentRate,
    };
  }, [recentOrders]);

  const handleShopifyConnect = () => {
    if (!shopifyShopInput.trim() || !seller?.token) return;
    const shop = shopifyShopInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    setShopifyAuthUrl(api.Shopify.GetAuthUrl(seller.token, shop));
  };

  const handleShopifySync = async () => {
    if (!seller?.token) return;
    setShopifyActionLoading(true);
    setShopifyMessage(null);
    const res = await api.Shopify.Sync(seller.token);
    setShopifyActionLoading(false);
    setShopifyMessage(
      res.ok
        ? { type: 'success', text: typeof res.body?.count === 'number' ? `Shopify sync completed. ${res.body.count} products queued.` : 'Sync started. New products will appear in drafts shortly.' }
        : { type: 'error', text: 'Sync failed. Reconnect or try again in a minute.' },
    );
  };

  const handleShopifyDisconnect = async () => {
    if (!seller?.token || !confirm('Disconnect your Shopify store?')) return;
    setShopifyActionLoading(true);
    setShopifyMessage(null);
    const res = await api.Shopify.Disconnect(seller.token);
    setShopifyActionLoading(false);

    if (res.ok) {
      setShopifyConnected(false);
      setShopifyShop(undefined);
      setShopifyShopInput('');
      setShopifyMessage({ type: 'success', text: 'Shopify store disconnected.' });
      return;
    }

    setShopifyMessage({ type: 'error', text: 'Disconnect failed. Please try again.' });
  };

  return (
    <>
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="mt-1 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.14),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/75">Seller Overview</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-white">Today&apos;s Operations</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Open', value: metrics.openOrders },
              { label: 'Delivered', value: metrics.delivered },
              { label: 'Revenue', value: `Rs ${metrics.revenue.toLocaleString()}` },
              { label: 'Fulfillment', value: `${metrics.fulfillmentRate}%` },
            ].map(card => (
              <div key={card.label} className="rounded-[1.1rem] border border-white/10 bg-black/25 p-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">{card.label}</p>
                <p className="mt-2 text-base font-black uppercase tracking-[-0.03em] text-white">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
              <Globe size={12} />
              Product Import
            </div>
            {shopifyConnected && (
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] ${
                  shopifyConnectionType === 'active'
                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-blue-400/20 bg-blue-500/10 text-blue-300'
                }`}>
                  {shopifyConnectionType === 'active' ? 'OAuth' : 'Public'}
                </span>
              </div>
            )}
          </div>

          {shopifyLoading ? (
            <div className="flex min-h-[16rem] items-center justify-center gap-3 text-white/35">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Checking store status...</span>
            </div>
          ) : shopifyConnected ? (
            <div className="mt-5">
              <div className="rounded-[1.3rem] border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-emerald-300">Connected</p>
                <p className="mt-3 text-lg font-black uppercase tracking-[0.03em] text-white">{shopifyShop ?? 'Store Connected'}</p>
                <p className="mt-2 text-sm text-white/60">
                  {shopifyConnectionType === 'active' 
                    ? 'OAuth-based connection. Use sync to refresh your draft queue.' 
                    : 'Public connection via scraping. Use scrape to import products.'}
                </p>
              </div>
              {shopifyMessage && (
                <p className={`mt-3 text-sm ${shopifyMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {shopifyMessage.text}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {shopifyConnectionType === 'active' && (
                  <button
                    onClick={handleShopifySync}
                    disabled={shopifyActionLoading}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.07em] text-white disabled:opacity-60"
                  >
                    {shopifyActionLoading ? <Loader size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    Sync Products
                  </button>
                )}
                {shopifyConnectionType === 'public' && (
                  <button
                    onClick={() => setShopifyTab('scrape')}
                    disabled={shopifyActionLoading}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.07em] text-white disabled:opacity-60"
                  >
                    <Zap size={15} />
                    Scrape Products
                  </button>
                )}
                <button
                  onClick={handleShopifyDisconnect}
                  disabled={shopifyActionLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/75"
                >
                  <Link2Off size={15} />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              {/* Tab selector */}
              <div className="mb-4 flex gap-2 rounded-full border border-white/10 bg-black/20 p-1">
                <button
                  onClick={() => setShopifyTab('scrape')}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    shopifyTab === 'scrape'
                      ? 'bg-primary text-white'
                      : 'text-white/50 hover:text-white/75'
                  }`}
                >
                  <Zap size={14} className="inline mr-1 -mt-0.5" />
                  Quick Scrape
                </button>
                <button
                  onClick={() => setShopifyTab('oauth')}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    shopifyTab === 'oauth'
                      ? 'bg-primary text-white'
                      : 'text-white/50 hover:text-white/75'
                  }`}
                >
                  <Link2 size={14} className="inline mr-1 -mt-0.5" />
                  OAuth Connect
                </button>
              </div>

              {shopifyMessage && (
                <p className={`mb-3 text-sm ${shopifyMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {shopifyMessage.text}
                </p>
              )}

              {shopifyTab === 'scrape' ? (
                <ShopifyScrape onScrapeComplete={(count) => {
                  setShopifyMessage({ 
                    type: 'success', 
                    text: `Successfully scraped ${count} product${count !== 1 ? 's' : ''}. Check your draft queue.` 
                  });
                }} />
              ) : (
                <div className="mt-4">
                  <p className="max-w-xl text-sm leading-relaxed text-white/60">
                    Connect Shopify via OAuth for automatic sync and inventory updates.
                  </p>
                  {shopifyAuthUrl ? (
                    <div className="mt-4 rounded-[1.3rem] border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm text-white/75">Your auth link is ready. Open it and approve the connection.</p>
                      <a
                        href={shopifyAuthUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.07em] text-white"
                      >
                        <ArrowRight size={15} />
                        Open Shopify Auth
                      </a>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/25">
                          https://
                        </span>
                        <input
                          type="text"
                          placeholder="your-store.myshopify.com"
                          value={shopifyShopInput}
                          onChange={(e) => setShopifyShopInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleShopifyConnect()}
                          className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-4 pl-[5.5rem] pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/18 focus:border-primary/35"
                        />
                      </div>
                      <button
                        onClick={handleShopifyConnect}
                        disabled={!shopifyShopInput.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 disabled:opacity-45"
                      >
                        <Link2 size={15} />
                        Generate Connect Link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {liveTournaments.length > 0 && (
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="mt-6 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Trophy size={12} />
            Juno Events
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {liveTournaments.map((event) => (
              <div key={event.id} className="rounded-[1.1rem] border border-white/10 bg-black/25 p-4">
                <p className="text-sm font-black uppercase tracking-[0.02em] text-white">{event.name}</p>
                <p className="mt-2 text-xs text-white/45 uppercase">
                  {event.status} · {event.participant_count ?? 0} joined
                </p>
                <p className="mt-2 text-xs text-white/50">
                  Ends {new Date(event.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">Recent Orders</p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-[-0.04em] text-white">Order Queue</h3>
          </div>
          <Link
            to={`${prefix}/dashboard/orders`}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-primary"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="px-5 py-4">
          {isLoadingOrders ? (
            <div className="flex items-center justify-center gap-3 py-16 text-white/35">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Loading recent orders...</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="rounded-full border border-white/10 bg-white/[0.03] p-4">
                <Sparkles size={18} className="text-primary" />
              </div>
              <h4 className="text-lg font-black uppercase tracking-[0.04em] text-white">No orders yet.</h4>
              <p className="max-w-md text-sm leading-relaxed text-white/50">New orders will appear here as soon as buyers checkout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index }}
                  className="grid gap-4 rounded-[1.4rem] border border-white/10 bg-black/25 p-4 md:grid-cols-[1.4fr_0.85fr_0.85fr_0.7fr]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.03em] text-white">#{order.order_number}</p>
                    <p className="mt-1 truncate text-sm text-white/50">{order.shipping_address?.name || 'Juno Buyer'}</p>
                    <p className="mt-1 text-xs text-white/35">{order.shipping_address?.city || 'Pakistan'}</p>
                  </div>
                  <div className="flex items-center">
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">Amount</p>
                    <p className="mt-2 text-sm font-semibold text-white">Rs. {order.total.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-white/35">
                      {order.order_items?.length || 0} item{(order.order_items?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">Date</p>
                    <p className="mt-2 text-sm text-white/60">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
};

export default SellerHome;
