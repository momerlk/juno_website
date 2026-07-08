import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Database,
  Layers3,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Store,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react';
import { AdminFinancials, AdminLogistics, AdminPortal, type LogisticsCarrier } from '../../api/adminApi';

type DashboardPayload = {
  health: any;
  pendingSellers: any[];
  sellerDrafts: any[];
  productQueue: any[];
  orders: any[];
  pickupAging: any[];
  exports: any[];
  financialSummary: any;
  operationalConfig: any;
  waitlist: any[];
  failures: string[];
};

const carrier: LogisticsCarrier = 'dex';

const formatCurrency = (value?: number) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatRelativeDay = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const candidates = ['rows', 'items', 'orders', 'sellers', 'users', 'exports', 'entries', 'data'];
  for (const key of candidates) {
    if (Array.isArray(value[key])) return value[key];
  }

  if (value.data && typeof value.data === 'object') {
    return asArray(value.data);
  }

  return [];
};

const getQueueStatus = (item: any) =>
  String(item?.status || item?.queue_status || item?.state || 'unknown').toLowerCase();

const getPickupUrgency = (row: any) =>
  String(row?.pickup_urgency || row?.urgency || row?.threshold_state || 'normal').toLowerCase();

const statusPillClass = (tone: 'good' | 'warn' | 'danger' | 'neutral') => ({
  good: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  warn: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  danger: 'border-red-400/20 bg-red-400/10 text-red-200',
  neutral: 'border-white/10 bg-white/[0.06] text-white/75',
}[tone]);

const StatCard: React.FC<{
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  tone?: 'good' | 'warn' | 'danger' | 'neutral';
}> = ({ label, value, hint, icon: Icon, tone = 'neutral' }) => (
  <div className="rounded-[1.75rem] border border-white/10 bg-[#111111]/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
    <div className="flex items-center justify-between">
      <div className={`rounded-2xl border p-3 ${statusPillClass(tone)}`}>
        <Icon size={18} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/30">Live</span>
    </div>
    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">{label}</p>
    <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    <p className="mt-2 text-sm text-neutral-400">{hint}</p>
  </div>
);

const SectionCard: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; to: string };
  children: React.ReactNode;
}> = ({ eyebrow, title, description, action, children }) => (
  <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">{description}</p>
      </div>
      {action ? (
        <Link
          to={action.to}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/[0.1]"
        >
          {action.label}
          <ArrowRight size={14} />
        </Link>
      ) : null}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const AdminControlTower: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchSnapshot = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);

    const requests = await Promise.allSettled([
      AdminPortal.getHealth(),
      AdminPortal.listSellers({ status: 'pending', limit: 8 }),
      AdminPortal.listSellerDrafts({ page: 1, limit: 6 }),
      AdminPortal.listProductQueue(),
      AdminPortal.listOrders(),
      AdminLogistics.getPickupAging({ carrier }),
      AdminLogistics.getExports({ carrier, status: 'ready', page: 1, limit: 6 }),
      AdminFinancials.getSummary({ from, to, carrier }),
      AdminLogistics.getOperationalConfig(),
      AdminPortal.getWaitlist(),
    ]);

    const readBody = (index: number) => {
      const result = requests[index];
      if (result.status !== 'fulfilled') return null;
      return result.value.ok ? result.value.body : null;
    };

    const failures = requests
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok))
      .map(({ result, index }) => {
        if (result.status === 'rejected') return `Request ${index + 1} failed`;
        return (result.value.body as any)?.message || `Request ${index + 1} failed`;
      });

    const nextSnapshot: DashboardPayload = {
      health: readBody(0),
      pendingSellers: asArray(readBody(1)),
      sellerDrafts: asArray(readBody(2)),
      productQueue: asArray(readBody(3)),
      orders: asArray(readBody(4)),
      pickupAging: asArray(readBody(5)),
      exports: asArray(readBody(6)),
      financialSummary: readBody(7),
      operationalConfig: readBody(8),
      waitlist: asArray(readBody(9)),
      failures,
    };

    if (!nextSnapshot.health && failures.length === requests.length) {
      setError('Admin control tower could not load any overview endpoints.');
      setSnapshot(null);
    } else {
      setSnapshot(nextSnapshot);
      setLastUpdated(new Date().toISOString());
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    void fetchSnapshot();
  }, []);

  const derived = useMemo(() => {
    const pendingSellers = snapshot?.pendingSellers ?? [];
    const sellerDrafts = snapshot?.sellerDrafts ?? [];
    const productQueue = snapshot?.productQueue ?? [];
    const orders = snapshot?.orders ?? [];
    const pickupAging = snapshot?.pickupAging ?? [];
    const exports = snapshot?.exports ?? [];
    const waitlist = snapshot?.waitlist ?? [];
    const summary = snapshot?.financialSummary ?? {};
    const operationalConfig = snapshot?.operationalConfig ?? {};

    const queueReadyCount = productQueue.filter((item) => ['ready', 'enriched', 'approved'].includes(getQueueStatus(item))).length;
    const queueReviewCount = productQueue.filter((item) => ['failed', 'needs_review', 'draft', 'pending'].includes(getQueueStatus(item))).length;
    const urgentPickups = pickupAging.filter((row) => ['urgent', 'critical', 'overdue'].includes(getPickupUrgency(row)));
    const openOrders = orders.filter((order) => !['delivered', 'cancelled', 'returned'].includes(String(order?.status || '').toLowerCase()));
    const stuckOrders = orders.filter((order) => ['pending', 'confirmed', 'delivery_attempted'].includes(String(order?.status || '').toLowerCase()));
    const services = snapshot?.health?.services && typeof snapshot.health.services === 'object' ? Object.entries(snapshot.health.services) : [];

    return {
      pendingSellers,
      sellerDrafts,
      productQueue,
      orders,
      pickupAging,
      exports,
      waitlist,
      summary,
      operationalConfig,
      queueReadyCount,
      queueReviewCount,
      urgentPickups,
      openOrders,
      stuckOrders,
      services,
    };
  }, [snapshot]);

  if (isLoading) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center text-neutral-400">Loading control tower...</div>;
  }

  if (error || !snapshot) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-lg font-bold text-white">Control tower unavailable</p>
        <p className="mt-2 text-sm text-red-200/80">{error ?? 'No admin overview data returned.'}</p>
        <button
          onClick={() => void fetchSnapshot('refresh')}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    );
  }

  const healthOk = String(snapshot.health?.status || '').toLowerCase() === 'ok';
  const waitlistCount = snapshot.waitlist.length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#090909] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-secondary/20 blur-[140px]" />
        </div>
        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-white/45">Admin Command Center</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white md:text-6xl">
                Run approvals, catalog, logistics, and cash flow from one surface.
              </h2>
              <p className="mt-4 max-w-2xl text-base text-neutral-300 md:text-lg">
                The home view now reflects the updated admin API: pending sellers, queue readiness, pickup aging, exports, and financial performance instead of a generic stats wall.
              </p>
            </div>

            <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">Snapshot</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {healthOk ? 'Operational' : 'Needs attention'}
                  </p>
                  <p className="mt-2 text-sm text-neutral-400">
                    {lastUpdated ? `Last refreshed ${formatDateTime(lastUpdated)}` : 'Overview just loaded'}
                  </p>
                </div>
                <button
                  onClick={() => void fetchSnapshot('refresh')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/[0.1]"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Open Orders</p>
                  <p className="mt-2 text-2xl font-black text-white">{derived.openOrders.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Urgent Pickups</p>
                  <p className="mt-2 text-2xl font-black text-white">{derived.urgentPickups.length}</p>
                </div>
              </div>
            </div>
          </div>

          {snapshot.failures.length ? (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              Partial data loaded. Some endpoints failed: {snapshot.failures.slice(0, 3).join(' · ')}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending Sellers"
          value={String(derived.pendingSellers.length)}
          hint="Approval queue from `/admin/sellers?status=pending`."
          icon={Store}
          tone={derived.pendingSellers.length > 0 ? 'warn' : 'good'}
        />
        <StatCard
          label="Queue Ready"
          value={String(derived.queueReadyCount)}
          hint={`${derived.queueReviewCount} items still need review before promotion.`}
          icon={PackageCheck}
          tone={derived.queueReviewCount > 0 ? 'warn' : 'good'}
        />
        <StatCard
          label="Pickup Aging"
          value={String(derived.urgentPickups.length)}
          hint={`Policy: ${derived.operationalConfig?.sla_hours ?? 'n/a'}h SLA, ${derived.operationalConfig?.max_strikes_before_suspension ?? 'n/a'} strikes before suspension.`}
          icon={Truck}
          tone={derived.urgentPickups.length > 0 ? 'danger' : 'good'}
        />
        <StatCard
          label="MTD Gross Income"
          value={formatCurrency(derived.summary?.gross_income)}
          hint={`${formatCurrency(derived.summary?.gmv)} GMV with ${(derived.summary?.take_rate ?? 0) * 100}% take rate.`}
          icon={Wallet}
          tone="neutral"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <SectionCard
          eyebrow="Operations"
          title="Approval and queue pressure"
          description="Triage the work that blocks new supply entering the platform: seller onboarding, unfinished drafts, and product moderation."
          action={{ label: 'Open sellers', to: '/admin/sellers' }}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Pending sellers</h4>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusPillClass(derived.pendingSellers.length > 0 ? 'warn' : 'good')}`}>
                  {derived.pendingSellers.length} awaiting review
                </span>
              </div>
              <div className="space-y-3">
                {derived.pendingSellers.slice(0, 4).map((seller) => (
                  <div key={seller.id || seller.email} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{seller.business_name || seller.name || seller.legal_name || 'Unnamed seller'}</p>
                        <p className="mt-1 text-xs text-neutral-400">{seller.email || seller.contact_person || 'No contact available'}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
                        {seller.city || 'City missing'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                      <span>{seller.status || 'pending'}</span>
                      <span>{formatRelativeDay(seller.created_at || seller.updated_at)}</span>
                    </div>
                  </div>
                ))}
                {derived.pendingSellers.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                    No pending seller approvals right now.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Seller drafts</h4>
                <p className="mt-2 text-3xl font-black text-white">{derived.sellerDrafts.length}</p>
                <p className="mt-2 text-sm text-neutral-400">Incomplete onboarding flows still stuck in draft.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Product queue</h4>
                <p className="mt-2 text-3xl font-black text-white">{derived.productQueue.length}</p>
                <p className="mt-2 text-sm text-neutral-400">{derived.queueReadyCount} ready to promote, {derived.queueReviewCount} need edits.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Waitlist</h4>
                <p className="mt-2 text-3xl font-black text-white">{waitlistCount}</p>
                <p className="mt-2 text-sm text-neutral-400">Potential demand pool still outside the marketplace.</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Logistics"
          title="Shipping risk and export readiness"
          description="See where shipments are blocked, which sellers are aging past SLA, and whether carrier exports are ready to hand off."
          action={{ label: 'Open logistics', to: '/admin/logistics' }}
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">DEX threshold</p>
                <p className="mt-2 text-2xl font-black text-white">{derived.operationalConfig?.dex_pickup_threshold ?? 'n/a'}</p>
                <p className="mt-2 text-sm text-neutral-400">Current pickup threshold from operational config.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Ready exports</p>
                <p className="mt-2 text-2xl font-black text-white">{derived.exports.length}</p>
                <p className="mt-2 text-sm text-neutral-400">Carrier export files marked ready for {carrier.toUpperCase()}.</p>
              </div>
            </div>

            <div className="space-y-3">
              {derived.urgentPickups.slice(0, 4).map((row, index) => (
                <div key={row.order_id || row.seller_id || index} className="rounded-2xl border border-red-400/15 bg-red-500/[0.06] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{row.business_name || row.seller_name || row.seller_id || 'Seller'}</p>
                      <p className="mt-1 text-xs text-neutral-300">Order {row.order_number || row.order_id || 'unknown'} · due {formatDateTime(row.seller_dispatch_due_at)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusPillClass('danger')}`}>
                      {getPickupUrgency(row)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-red-100/90">{row.days_waiting_for_pickup ?? 0} days waiting for pickup.</p>
                </div>
              ))}
              {derived.urgentPickups.length === 0 ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  No urgent pickup aging rows for the selected carrier.
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <SectionCard
          eyebrow="Money"
          title="Financial posture"
          description="Use month-to-date economics as the default operating baseline, then jump into detailed reconciliation when something moves."
          action={{ label: 'Open financials', to: '/admin/financials' }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Generated revenue</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCurrency(derived.summary?.revenue_generated)}</p>
              <p className="mt-2 text-sm text-neutral-400">Commission plus shipping revenue from the selected month.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Seller payout</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCurrency(derived.summary?.seller_payout)}</p>
              <p className="mt-2 text-sm text-neutral-400">Current cash liability owed back to brands.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Courier cost</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCurrency(derived.summary?.courier_shipping_cost)}</p>
              <p className="mt-2 text-sm text-neutral-400">Logistics spend captured in the admin financial summary.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Booked state</p>
              <p className="mt-2 text-2xl font-black text-white">
                {(derived.summary?.booked_order_count ?? 0)} / {(derived.summary?.unbooked_order_count ?? 0)}
              </p>
              <p className="mt-2 text-sm text-neutral-400">Booked versus unbooked order counts for the month.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Routing"
          title="Move straight into the right workflow"
          description="The portal is now organized around operational jobs first, with Probe analytics moved into a separate intelligence track."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { to: '/admin/orders', icon: Layers3, title: 'Order desk', text: `${derived.openOrders.length} open child orders and ${derived.stuckOrders.length} needing close attention.` },
              { to: '/admin/sellers', icon: ShieldCheck, title: 'Seller moderation', text: `${derived.pendingSellers.length} pending approvals and ${derived.sellerDrafts.length} unfinished drafts.` },
              { to: '/admin/products', icon: PackageCheck, title: 'Catalog queue', text: `${derived.queueReadyCount} promotable items and ${derived.queueReviewCount} queue blockers.` },
              { to: '/admin/logistics', icon: Truck, title: 'Logistics ops', text: `${derived.urgentPickups.length} urgent pickup issues plus ${derived.exports.length} ready exports.` },
              { to: '/admin/financials', icon: TrendingUp, title: 'Finance review', text: `${formatCurrency(derived.summary?.gross_income)} gross income month to date.` },
              { to: '/admin/probe/overview', icon: Database, title: 'Probe analytics', text: 'Deep dive into platform, commerce, user, and real-time intelligence.' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white/80">
                    <item.icon size={18} />
                  </div>
                  <ArrowRight size={16} className="text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
                </div>
                <p className="mt-4 text-lg font-black uppercase tracking-[-0.03em] text-white">{item.title}</p>
                <p className="mt-2 text-sm text-neutral-400">{item.text}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        eyebrow="Infrastructure"
        title="System readiness"
        description="Keep an eye on backend health and service dependencies without leaving the operations workflow."
        action={{ label: 'Open system tools', to: '/admin/system' }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl border p-3 ${statusPillClass(healthOk ? 'good' : 'danger')}`}>
                <Database size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">API health</p>
                <p className="text-xs text-neutral-400">`GET /api/v2/admin/health`</p>
              </div>
            </div>
            <p className="mt-4 text-3xl font-black text-white">{String(snapshot.health?.status || 'unknown').toUpperCase()}</p>
            <p className="mt-2 text-sm text-neutral-400">Timestamp {formatDateTime(snapshot.health?.timestamp)}</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Service map</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {derived.services.map(([name, state]) => {
                const ok = String(state).toLowerCase() === 'ok';
                return (
                  <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold capitalize text-white">{name}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${statusPillClass(ok ? 'good' : 'danger')}`}>
                        {String(state)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {derived.services.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-400">
                  No service breakdown returned by health endpoint.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
};

export default AdminControlTower;
