import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Camera,
  CreditCard,
  Globe,
  Loader,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Users,
  Link2,
  Link2Off,
  Radio,
  Play,
} from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import SubscriptionModal from './SubscriptionModal';
import * as api from '../../api/sellerApi';
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const SellerHome: React.FC = () => {
  const { seller } = useSellerAuth();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
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
    const revenue = recentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const cityMap = recentOrders.reduce<Record<string, number>>((acc, order) => {
      const city = order.shipping_address?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    const topCityEntry = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0];
    const topCity = topCityEntry?.[0] || seller?.user?.location?.city || 'Pakistan';
    const fulfillmentRate = orderCount > 0 ? Math.round((delivered / orderCount) * 100) : 0;

    return {
      orderCount,
      delivered,
      revenue,
      topCity,
      fulfillmentRate,
      projectedProfileVisits: Math.max(orderCount * 14, 36),
      projectedSaves: Math.max(orderCount * 6, 18),
      projectedStoryTaps: Math.max(orderCount * 4, 11),
    };
  }, [recentOrders, seller?.user?.location?.city]);

  const educationClips = [
    'How to take a clean product photo on your phone in 5 minutes',
    'How to write product copy that feels like your brand, not catalogue filler',
    'How to use drops and scarcity to sell out faster on Juno',
  ];

  const studioTeam = [
    { name: 'Omer', role: 'Product & Engineering', image: '/team/omer.png' },
    { name: 'Ali', role: 'Operations & Legal', image: '/team/ali.png' },
    { name: 'Hooria', role: 'Growth & Brand', image: '/team/hooria.jpg' },
  ];

  const priorityModules = useMemo(() => {
    const modules = [
      {
        key: 'orders',
        title: 'Orders',
        eyebrow: 'Highest Priority',
        description: 'Recent order flow should stay visible because fulfillment speed is trust.',
        content: (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Open', value: recentOrders.filter(order => !['delivered', 'fulfilled', 'cancelled'].includes(order.status)).length },
                { label: 'Delivered', value: metrics.delivered },
                { label: 'Revenue', value: `Rs ${metrics.revenue.toLocaleString()}` },
              ].map(item => (
                <div key={item.label} className="rounded-[1rem] border border-white/10 bg-black/25 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">{item.label}</p>
                  <p className="mt-2 text-base font-black uppercase tracking-[-0.03em] text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <Link
              to={`${prefix}/dashboard/orders`}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-primary"
            >
              View Orders
              <ArrowRight size={14} />
            </Link>
          </div>
        ),
        priority: 1,
      },
      {
        key: 'shopify',
        title: 'Shopify',
        eyebrow: shopifyConnected ? 'Connected' : 'Action Needed',
        description: shopifyConnected
          ? 'Your catalog sync is live. Use this to keep the draft queue fresh.'
          : 'If Shopify is not connected, this should jump to the top because catalog ingestion is blocked.',
        content: (
          <div className="mt-4 space-y-3">
            <div className={`rounded-[1.1rem] border p-4 ${shopifyConnected ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-primary/20 bg-primary/10'}`}>
              <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${shopifyConnected ? 'text-emerald-300' : 'text-primary'}`}>
                {shopifyConnected ? 'Connected Store' : 'Needs Connection'}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">{shopifyConnected ? (shopifyShop ?? 'Store connected') : 'Connect Shopify to unlock easier catalog flow.'}</p>
            </div>
            <Link
              to={`${prefix}/dashboard`}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] text-white/75"
            >
              Manage Sync
              <ArrowRight size={14} />
            </Link>
          </div>
        ),
        priority: shopifyConnected ? 3 : 0,
      },
      {
        key: 'inventory',
        title: 'Inventory',
        eyebrow: 'Catalog Health',
        description: 'The portal should keep listings light to create and easy to trust.',
        content: (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Saves', value: metrics.projectedSaves },
              { label: 'City', value: metrics.topCity },
              { label: 'Trust', value: `${metrics.fulfillmentRate}%` },
            ].map(item => (
              <div key={item.label} className="rounded-[1rem] border border-white/10 bg-black/25 p-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">{item.label}</p>
                <p className="mt-2 text-base font-black uppercase tracking-[-0.03em] text-white">{item.value}</p>
              </div>
            ))}
          </div>
        ),
        priority: 2,
      },
    ];

    return modules.sort((a, b) => a.priority - b.priority);
  }, [metrics.delivered, metrics.fulfillmentRate, metrics.projectedSaves, metrics.revenue, metrics.topCity, prefix, recentOrders, shopifyConnected, shopifyShop]);

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
        ? { type: 'success', text: 'Sync started. New products will land in your draft queue shortly.' }
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

  const handleSubscriptionUpdate = async (plan: any, paymentDetails: any) => {
    console.log('Processing subscription:', { plan, paymentDetails });
    setIsSubscriptionModalOpen(false);
  };

  return (
    <>
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45 }}
        className="grid gap-4 xl:grid-cols-3"
      >
        <div className="group overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03]">
          <div className="relative h-48 overflow-hidden">
            <img src="/brand_banners/qariney_new.png" alt="Brand story analytics" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/75 backdrop-blur-md">
              <Radio size={12} />
              Story Analytics
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">Read the signals behind the story.</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/58">
              Profile visits, saves, city-level demand, and momentum cues should tell founders what is resonating before the spreadsheet ever does.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: 'Visits', value: metrics.projectedProfileVisits },
                { label: 'Saves', value: metrics.projectedSaves },
                { label: 'City', value: metrics.topCity },
              ].map(item => (
                <div key={item.label} className="rounded-[1rem] border border-white/10 bg-black/25 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">{item.label}</p>
                  <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03]">
          <div className="relative h-48 overflow-hidden">
            <img src="/brand_banners/rakh3.jpg" alt="Seller education" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/75 backdrop-blur-md">
              <BookOpen size={12} />
              Seller Education
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">Teach better inputs inside the flow.</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/58">
              Better photos, cleaner copy, and sharper drop strategy directly improve trust. This should live inside the portal, not outside it.
            </p>
            <div className="mt-5 space-y-2">
              {educationClips.slice(0, 2).map(clip => (
                <div key={clip} className="flex items-start gap-3 rounded-[1rem] border border-white/10 bg-black/25 px-4 py-3">
                  <div className="mt-0.5 rounded-full border border-primary/25 bg-primary/10 p-1.5 text-primary">
                    <Play size={10} />
                  </div>
                  <p className="text-sm leading-relaxed text-white/68">{clip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03]">
          <div className="relative h-48 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.18),transparent_40%),linear-gradient(135deg,#111,#070707)] p-5">
            <div className="flex -space-x-4">
              {studioTeam.map(member => (
                <img
                  key={member.name}
                  src={member.image}
                  alt={member.name}
                  className="h-20 w-20 rounded-full border-2 border-black object-cover shadow-lg"
                />
              ))}
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/75 backdrop-blur-md">
              <Users size={12} />
              Seller Community
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Real people behind the system. Real support behind the growth.
            </p>
          </div>
          <div className="p-5">
            <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">Make the circle visible.</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/58">
              Sellers stay when they feel plugged into other brands and the Juno team. Community is part of the product, not a side channel.
            </p>
            <a
              href="https://wa.me/923158972405"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#25D366]/25 bg-[#25D366]/12 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#7DFFB1]"
            >
              <MessageCircle size={15} />
              Join the WhatsApp Circle
            </a>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.04 }}
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.16),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 md:p-8"
        style={{ marginTop: '1.5rem' }}
      >
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-primary/75">
              <Sparkles size={12} />
              Juno Seller Brief
            </p>
            <h2 className="max-w-3xl text-3xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
              You are not filing paperwork. You are joining the movement behind Pakistan&apos;s next indie brands.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
              Your dashboard should help you tell a sharper story, understand what buyers respond to, and get better inventory live with less friction than Instagram DMs.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Orders in Motion', value: recentOrders.filter(order => !['delivered', 'fulfilled', 'cancelled'].includes(order.status)).length, note: 'Needs attention' },
                { label: 'Shopify', value: shopifyConnected ? 'Live' : 'Pending', note: shopifyConnected ? (shopifyShop ?? 'Connected') : 'Connect soon' },
                { label: 'Top City', value: metrics.topCity, note: 'Where buyers are showing up' },
                { label: 'Fulfillment', value: `${metrics.fulfillmentRate}%`, note: 'Trust signal' },
              ].map(item => (
                <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">{item.label}</p>
                  <p className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-2 text-xs text-white/45">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`${prefix}/dashboard/inventory`}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition-transform hover:scale-[1.02]"
              >
                Add New Drop
                <ArrowRight size={16} />
              </Link>
              <Link
                to={`${prefix}/dashboard/analytics`}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/80 transition-colors hover:border-white/20 hover:text-white"
              >
                Open Story Analytics
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Projected Profile Visits', value: metrics.projectedProfileVisits, note: 'Story-signal preview' },
                { label: 'Projected Saves', value: metrics.projectedSaves, note: 'Demand memory' },
                { label: 'Top Browsing City', value: metrics.topCity, note: 'Live from recent demand' },
              ].map(card => (
                <div key={card.label} className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">{card.label}</p>
                  <p className="mt-3 text-2xl font-black uppercase tracking-[-0.04em] text-white">{card.value}</p>
                  <p className="mt-2 text-xs text-white/45">{card.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/35">
              <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                <div className="relative min-h-[17rem]">
                  <img src="/brand_banners/noire7.jpg" alt="Juno studio support" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">People Behind Juno</p>
                  <h3 className="mt-3 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                    Real founders should see real support.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/58">
                    The system feels more trustworthy when the people behind it are visible. Sellers should know who they can talk to, not just which button to click.
                  </p>
                  <div className="mt-5 space-y-3">
                    {studioTeam.map(member => (
                      <div key={member.name} className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.03] px-3 py-3">
                        <img src={member.image} alt={member.name} className="h-11 w-11 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-white">{member.name}</p>
                          <p className="text-xs text-white/45">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href="https://wa.me/923158972405"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/78 transition-colors hover:text-[#7DFFB1]"
                  >
                    <MessageCircle size={15} />
                    Talk to the Juno team
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/10 bg-black/35 p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
                <CreditCard size={12} />
                Membership
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black uppercase tracking-[0.04em] text-white">
                    {seller?.user?.status === 'active' ? 'Standard Plan Active' : 'Plan Not Active'}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {seller?.user?.status === 'active'
                      ? 'You have access to catalog publishing, analytics, and founder support.'
                      : 'Subscribe to unlock the full brand operating layer.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsSubscriptionModalOpen(true)}
                  className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary/18"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mt-6 grid gap-4 xl:grid-cols-3"
      >
        {priorityModules.map(module => (
          <div key={module.key} className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">{module.eyebrow}</p>
            <h3 className="mt-3 text-2xl font-black uppercase tracking-[-0.04em] text-white">{module.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/58">{module.description}</p>
            {module.content}
          </div>
        ))}
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.07 }}
        className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]"
      >
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Radio size={12} />
            Momentum Snapshot
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Recent Revenue', value: `Rs ${metrics.revenue.toLocaleString()}`, note: 'From live recent orders' },
              { title: 'Fulfillment Rate', value: `${metrics.fulfillmentRate}%`, note: 'Trust compounds from this' },
              { title: 'Delivered Orders', value: metrics.delivered, note: 'Strongest proof of momentum' },
              { title: 'Story Taps Preview', value: metrics.projectedStoryTaps, note: 'Preview signal layer' },
            ].map(item => (
              <div key={item.title} className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">{item.title}</p>
                <p className="mt-3 text-2xl font-black uppercase tracking-[-0.04em] text-white">{item.value}</p>
                <p className="mt-2 text-xs text-white/45">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03]">
          <div className="relative h-48">
            <img src="/brand_banners/rakh5.jpg" alt="Juno brand support" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="absolute left-5 bottom-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/45">Why this should feel alive</p>
              <h3 className="mt-2 max-w-md text-2xl font-black uppercase tracking-[-0.04em] text-white">Sellers should feel the culture, not just the controls.</h3>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm leading-relaxed text-white/58">
              The portal gets stronger when it shows community, founder support, and real brand imagery. It should feel like part of a living ecosystem, not a detached dashboard.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]"
      >
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Camera size={12} />
            Listing Standards
          </div>
          <h3 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em] text-white">Inventory should feel brutally simple.</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Required', text: 'Product name' },
              { title: 'Required', text: 'Price' },
              { title: 'Required', text: 'Quantity' },
            ].map(item => (
              <div key={item.text} className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary/75">{item.title}</p>
                <p className="mt-3 text-lg font-black uppercase tracking-[0.02em] text-white">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[1.3rem] border border-primary/20 bg-primary/10 p-4">
            <p className="text-sm leading-relaxed text-white/75">
              Size guide should stay optional, but Juno should reward it with a visible badge and higher buyer confidence.
            </p>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <Globe size={12} />
            Shopify Sync
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
                <p className="mt-2 text-sm text-white/60">Use sync when you want your catalog draft queue refreshed inside Juno Studio.</p>
              </div>
              {shopifyMessage && (
                <p className={`mt-3 text-sm ${shopifyMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {shopifyMessage.text}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleShopifySync}
                  disabled={shopifyActionLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.07em] text-white disabled:opacity-60"
                >
                  {shopifyActionLoading ? <Loader size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Sync Products
                </button>
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
              <p className="max-w-xl text-sm leading-relaxed text-white/60">
                Connect Shopify if you want Juno to do the heavy lifting on imports and send products into a cleaner draft queue instead of manual copy-paste.
              </p>
              {shopifyMessage && <p className="mt-3 text-sm text-red-300">{shopifyMessage.text}</p>}
              {shopifyAuthUrl ? (
                <div className="mt-4 rounded-[1.3rem] border border-primary/20 bg-primary/10 p-4">
                  <p className="text-sm text-white/75">Your auth link is ready. Open it and approve the connection from Shopify.</p>
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
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.14 }}
        className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">Recent Orders</p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-[-0.04em] text-white">Live Commerce Feed</h3>
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
              <p className="max-w-md text-sm leading-relaxed text-white/50">
                Once buyers start responding to the story, this feed becomes the clearest picture of momentum inside Juno.
              </p>
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
