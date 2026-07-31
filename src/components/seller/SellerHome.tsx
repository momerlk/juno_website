import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Globe,
  Inbox,
  Link2,
  Link2Off,
  Loader,
  RefreshCw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { useSellerQueue } from '../../contexts/SellerQueueContext';
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
  const { items: queueItems, pendingCount: queuePendingCount } = useSellerQueue();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const queueBreakdown = useMemo(() => {
    const needsReview = queueItems.filter(item => item.status === 'synced' || item.status === 'queued' || item.status === 'validation_pending' || item.status === 'enrichment_pending').length;
    const readyToPublish = queueItems.filter(item => item.status === 'ready').length;
    const failed = queueItems.filter(item => item.status === 'failed').length;
    const outOfStock = queueItems.filter(item => {
      if (item.status === 'promoted') return false;
      const product = item.product;
      const variantTotal = product?.variants?.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0) ?? 0;
      const total = variantTotal > 0 ? variantTotal : (product?.inventory?.quantity || 0);
      return total <= 0;
    }).length;
    return { needsReview, readyToPublish, failed, outOfStock };
  }, [queueItems]);

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
  const [pendingPriorityOrders, setPendingPriorityOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [liveTournaments, setLiveTournaments] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!seller?.token) return;
      setIsLoadingOrders(true);
      try {
        const [allOrdersRes, pendingRes] = await Promise.all([
          api.Seller.GetOrders(seller.token, { limit: 100, offset: 0 }),
          api.Seller.GetOrders(seller.token, { status: 'pending', limit: 20, offset: 0 }),
        ]);
        if (allOrdersRes.ok && allOrdersRes.body) {
          const sortedOrders = [...allOrdersRes.body].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentOrders(sortedOrders.slice(0, 6));
        }
        if (pendingRes.ok && pendingRes.body) {
          const pendingSorted = [...pendingRes.body].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setPendingPriorityOrders(pendingSorted);
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
    <div className="mt-4 space-y-4 text-neutral-100">
      {pendingPriorityOrders.length > 0 && (
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.35 }}
          className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded border border-amber-400/30 bg-amber-400/15 p-2">
                <AlertTriangle size={16} className="text-amber-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-amber-200/80">Top Priority</p>
                <h3 className="mt-1 text-base font-semibold text-neutral-100">
                  {pendingPriorityOrders.length} pending order{pendingPriorityOrders.length > 1 ? 's' : ''} need immediate action
                </h3>
                <p className="mt-1 text-xs text-amber-100/80">
                  Newest pending order: #{pendingPriorityOrders[0]?.order_number || pendingPriorityOrders[0]?.id}
                </p>
              </div>
            </div>
            <Link
              to={`${prefix}/dashboard/orders`}
              className="inline-flex items-center justify-center gap-2 rounded border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-300/20"
            >
              Open Orders Queue
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.section>
      )}

      {queuePendingCount > 0 && (
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-primary/25 bg-primary/10 p-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded border border-primary/30 bg-primary/15 p-2">
                <Inbox size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-primary/80">Draft Queue</p>
                <h3 className="mt-1 text-base font-semibold text-neutral-100">
                  {queuePendingCount} product{queuePendingCount !== 1 ? 's' : ''} awaiting your review
                </h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-400">
                  {queueBreakdown.readyToPublish > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {queueBreakdown.readyToPublish} ready to publish
                    </span>
                  )}
                  {queueBreakdown.needsReview > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {queueBreakdown.needsReview} need details
                    </span>
                  )}
                  {queueBreakdown.outOfStock > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded border border-orange-400/25 bg-orange-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-orange-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                      {queueBreakdown.outOfStock} out of stock
                    </span>
                  )}
                  {queueBreakdown.failed > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded border border-red-400/25 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-red-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {queueBreakdown.failed} failed
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to={`${prefix}/dashboard/inventory`}
              className="inline-flex shrink-0 items-center gap-2 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
            >
              Review Drafts
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.section>
      )}

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="rounded-lg border border-white/10 bg-[#121212] p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-primary/75">Seller Overview</p>
          <h2 className="mt-1 text-base font-semibold text-neutral-100">Today&apos;s Operations</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: 'Open', value: metrics.openOrders },
              { label: 'Delivered', value: metrics.delivered },
              { label: 'Revenue', value: `Rs ${metrics.revenue.toLocaleString()}` },
              { label: 'Fulfillment', value: `${metrics.fulfillmentRate}%` },
            ].map(card => (
              <div key={card.label} className="rounded-lg border border-white/10 bg-[#0e0e0e] p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">{card.label}</p>
                <p className="mt-2 text-base font-semibold text-neutral-100">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#121212] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-200">
              <Globe size={12} />
              Product Import
            </div>
            {shopifyConnected && (
              <div className="flex items-center gap-2">
                <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
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
            <div className="flex min-h-[10rem] items-center justify-center gap-2 text-sm text-neutral-500">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Checking store status...</span>
            </div>
          ) : shopifyConnected ? (
            <div className="mt-5">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-300">Connected</p>
                <p className="mt-2 text-base font-semibold text-neutral-100">{shopifyShop ?? 'Store Connected'}</p>
                <p className="mt-2 text-xs text-neutral-400">
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
                    className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {shopifyActionLoading ? <Loader size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    Sync Products
                  </button>
                )}
                {shopifyConnectionType === 'public' && (
                  <button
                    onClick={() => setShopifyTab('scrape')}
                    disabled={shopifyActionLoading}
                    className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                  >
                    <Zap size={15} />
                    Scrape Products
                  </button>
                )}
                <button
                  onClick={handleShopifyDisconnect}
                  disabled={shopifyActionLoading}
                  className="inline-flex items-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100"
                >
                  <Link2Off size={15} />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              {/* Tab selector */}
              <div className="mb-3 flex gap-2 rounded border border-white/10 bg-[#0e0e0e] p-1">
                <button
                  onClick={() => setShopifyTab('scrape')}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    shopifyTab === 'scrape'
                      ? 'bg-primary text-white'
                      : 'text-neutral-400 hover:text-neutral-100'
                  }`}
                >
                  <Zap size={14} className="inline mr-1 -mt-0.5" />
                  Quick Scrape
                </button>
                <button
                  onClick={() => setShopifyTab('oauth')}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    shopifyTab === 'oauth'
                      ? 'bg-primary text-white'
                      : 'text-neutral-400 hover:text-neutral-100'
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
                  <p className="max-w-xl text-xs leading-relaxed text-neutral-400">
                    Connect Shopify via OAuth for automatic sync and inventory updates.
                  </p>
                  {shopifyAuthUrl ? (
                    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                      <p className="text-xs text-neutral-300">Your auth link is ready. Open it and approve the connection.</p>
                      <a
                        href={shopifyAuthUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded border border-primary/40 bg-primary px-3 py-2 text-xs font-medium text-white"
                      >
                        <ArrowRight size={15} />
                        Open Shopify Auth
                      </a>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                          https://
                        </span>
                        <input
                          type="text"
                          placeholder="your-store.myshopify.com"
                          value={shopifyShopInput}
                          onChange={(e) => setShopifyShopInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleShopifyConnect()}
                          className="w-full rounded border border-white/20 bg-[#080808] py-2 pl-[4.5rem] pr-3 text-xs text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-primary/40"
                        />
                      </div>
                      <button
                        onClick={handleShopifyConnect}
                        disabled={!shopifyShopInput.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40"
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
          className="rounded-lg border border-white/10 bg-[#121212] p-4"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-200">
            <Trophy size={12} />
            Juno Events
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {liveTournaments.map((event) => (
              <div key={event.id} className="rounded-lg border border-white/10 bg-[#0e0e0e] p-4">
                <p className="text-sm font-medium text-neutral-100">{event.name}</p>
                <p className="mt-2 text-xs uppercase text-neutral-500">
                  {event.status} · {event.participant_count ?? 0} joined
                </p>
                <p className="mt-2 text-xs text-neutral-500">
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
        className="overflow-hidden rounded-lg border border-white/10 bg-[#121212]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">Recent Orders</p>
            <h3 className="mt-1 text-base font-semibold text-neutral-100">Order Queue</h3>
          </div>
          <Link
            to={`${prefix}/dashboard/orders`}
            className="inline-flex items-center gap-2 text-xs text-neutral-400 transition-colors hover:text-primary"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-4">
          {isLoadingOrders ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-500">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Loading recent orders...</span>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="rounded-full border border-white/10 bg-[#0e0e0e] p-3">
                <Sparkles size={18} className="text-primary" />
              </div>
              <h4 className="text-sm font-medium text-neutral-100">No orders yet.</h4>
              <p className="max-w-md text-xs leading-relaxed text-neutral-500">New orders will appear here as soon as buyers checkout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index }}
                  className="grid gap-4 rounded-lg border border-white/10 bg-[#0e0e0e] p-3 md:grid-cols-[1.4fr_0.85fr_0.85fr_0.7fr]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-100">#{order.order_number}</p>
                    <p className="mt-1 truncate text-xs text-neutral-400">{order.shipping_address?.name || 'Juno Buyer'}</p>
                    <p className="mt-1 text-xs text-neutral-500">{order.shipping_address?.city || 'Pakistan'}</p>
                  </div>
                  <div className="flex items-center">
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">Amount</p>
                    <p className="mt-2 text-sm font-medium text-neutral-100">Rs. {order.total.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {order.order_items?.length || 0} item{(order.order_items?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">Date</p>
                    <p className="mt-2 text-xs text-neutral-400">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default SellerHome;
