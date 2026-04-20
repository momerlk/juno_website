import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock3,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Signal,
  Store,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Analytics,
  type CommerceAnalyticsResponse,
  type GraphDataPoint,
  type LogisticsAnalyticsResponse,
  type OperationalAnalyticsResponse,
  type PlatformOverviewResponse,
  type SearchAnalyticsResponse,
  type SellerOperationsResponse,
  type UserAnalyticsResponse,
} from '../../api/api';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type RangeKey = '7d' | '30d' | '90d';

const rangeConfig: Record<RangeKey, { label: string; days: number; granularity: 'daily' | 'weekly' }> = {
  '7d': { label: '7D', days: 7, granularity: 'daily' },
  '30d': { label: '30D', days: 30, granularity: 'daily' },
  '90d': { label: '90D', days: 90, granularity: 'weekly' },
};

const chartPalette = ['#FF1818', '#FF4585', '#FF8A5B', '#FACC15', '#FB7185', '#F97316'];

const formatCompact = (value: number | undefined, fractionDigits = 1) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: fractionDigits,
  }).format(value ?? 0);

const formatCurrency = (value: number | undefined) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const formatPercent = (value: number | undefined) => `${(value ?? 0).toFixed(1)}%`;

const formatDecimal = (value: number | undefined, digits = 1) => (value ?? 0).toFixed(digits);

const formatMinutes = (seconds: number | undefined) => {
  const totalSeconds = Math.round(seconds ?? 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${minutes}m ${remainder}s`;
};

const toTimeRange = (range: RangeKey) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - rangeConfig[range].days);

  return {
    start_time: start.toISOString(),
    end_time: now.toISOString(),
    granularity: rangeConfig[range].granularity,
  } as const;
};

const graphToChart = (points: GraphDataPoint[] | undefined, label: string) =>
  (points ?? []).map((point) => ({
    label: point.x_value,
    value: point.y_value,
    series: label,
  }));

const objectToChart = (source: Record<string, number> | undefined) =>
  Object.entries(source ?? {}).map(([name, value]) => ({ name, value }));

const InsightCard: React.FC<{
  title: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}> = ({ title, value, subtext, icon: Icon }) => (
  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
    <div className="flex items-center justify-between">
      <div className="rounded-2xl bg-white/5 p-3">
        <Icon size={20} className="text-primary" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/30">Probe</span>
    </div>
    <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-white/35">{title}</p>
    <p className="mt-2 text-3xl font-black text-white">{value}</p>
    <p className="mt-2 text-sm text-neutral-400">{subtext}</p>
  </div>
);

const BlockHeader: React.FC<{ eyebrow: string; title: string; description: string }> = ({ eyebrow, title, description }) => (
  <div className="mb-5">
    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">{eyebrow}</p>
    <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">{title}</h3>
    <p className="mt-2 max-w-2xl text-sm text-neutral-400">{description}</p>
  </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0b0b]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/50">{label}</p>
      {payload.map((item: any) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4 text-sm">
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const PlatformStats: React.FC = () => {
  const [range, setRange] = useState<RangeKey>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PlatformOverviewResponse | null>(null);
  const [users, setUsers] = useState<UserAnalyticsResponse | null>(null);
  const [commerce, setCommerce] = useState<CommerceAnalyticsResponse | null>(null);
  const [search, setSearch] = useState<SearchAnalyticsResponse | null>(null);
  const [operations, setOperations] = useState<OperationalAnalyticsResponse | null>(null);
  const [sellerOperations, setSellerOperations] = useState<SellerOperationsResponse | null>(null);
  const [logistics, setLogistics] = useState<LogisticsAnalyticsResponse | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = toTimeRange(range);
      const [
        overviewResp,
        usersResp,
        commerceResp,
        searchResp,
        operationsResp,
        sellerOpsResp,
        logisticsResp,
      ] = await Promise.all([
        Analytics.getOverview({ ...params, compare: 'previous_period' }),
        Analytics.getUsers({ ...params, compare: 'previous_period' }),
        Analytics.getCommerce({ ...params, compare: 'previous_period' }),
        Analytics.getSearch(params),
        Analytics.getOperations(params),
        Analytics.getSellerOperations(params),
        Analytics.getLogistics(params),
      ]);

      const failures = [
        overviewResp,
        usersResp,
        commerceResp,
        searchResp,
        operationsResp,
        sellerOpsResp,
        logisticsResp,
      ].filter((resp) => !resp.ok);

      if (failures.length) {
        throw new Error('One or more analytics endpoints failed. Confirm admin auth and backend readiness.');
      }
      
      setOverview(overviewResp.body);
      setUsers(usersResp.body);
      setCommerce(commerceResp.body);
      setSearch(searchResp.body);
      setOperations(operationsResp.body);
      setSellerOperations(sellerOpsResp.body);
      setLogistics(logisticsResp.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const trendData = useMemo(() => {
    const revenue = graphToChart(overview?.trends.revenue, 'Revenue');
    const orders = graphToChart(overview?.trends.orders, 'Orders');
    const signups = graphToChart(users?.acquisition.new_users_time_series, 'Signups');

    return revenue.map((point, index) => ({
      label: point.label,
      revenue: point.value,
      orders: orders[index]?.value ?? 0,
      signups: signups[index]?.value ?? 0,
    }));
  }, [overview, users]);

  const topScreens = users?.engagement.top_screens ?? [];
  const categoryBreakdown = commerce?.category_breakdown ?? [];
  const orderStatusData = objectToChart(commerce?.orders_by_status);
  const logisticsPartnerData = objectToChart(logistics?.partner_breakdown);
  const sellerStatusData = objectToChart(sellerOperations?.status_breakdown);

  if (isLoading) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-neutral-400">Loading Probe analytics...</div>;
  }

  if (error || !overview || !users || !commerce || !search || !operations || !sellerOperations || !logistics) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-lg font-bold text-white">Analytics unavailable</p>
        <p className="mt-2 text-sm text-red-200/80">{error ?? 'No data returned from analytics endpoints.'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white"
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-0 h-72 w-72 rounded-full bg-primary/15 blur-[110px]" />
          <div className="absolute right-0 top-12 h-80 w-80 rounded-full bg-secondary/15 blur-[130px]" />
        </div>
        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-white/45">Admin Intelligence</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white md:text-6xl">
                Probe analytics across platform, users, and commerce.
              </h2>
              <p className="mt-4 text-base text-neutral-300 md:text-lg">
                This dashboard is now powered by the modular Probe analytics engine, not legacy admin aggregates.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(rangeConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setRange(key as RangeKey)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                    range === key
                      ? 'bg-gradient-to-r from-primary to-secondary text-white'
                      : 'border border-white/10 bg-white/5 text-neutral-300'
                  }`}
                >
                  {config.label}
                </button>
              ))}
              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightCard title="Revenue" value={formatCurrency(overview.revenue)} subtext={`${overview.orders} orders in selected range`} icon={TrendingUp} />
            <InsightCard title="Active Users" value={formatCompact(overview.concurrent_users, 0)} subtext={`${formatCompact(overview.dau, 0)} DAU / ${formatCompact(overview.mau, 0)} MAU`} icon={Signal} />
            <InsightCard title="New Signups" value={formatCompact(overview.new_signups, 0)} subtext={`${formatPercent(users.retention.stickiness)} stickiness`} icon={UserPlus} />
            <InsightCard title="Session Quality" value={formatMinutes(overview.avg_session_duration)} subtext={`${formatPercent(overview.bounce_rate)} bounce rate`} icon={Clock3} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <BlockHeader eyebrow="Overview" title="Platform momentum" description="Revenue, orders, and signups from Probe trends over the selected period." />
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF1818" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#FF1818" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4585" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF4585" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="label" stroke="#a3a3a3" tick={{ fontSize: 12 }} />
              <YAxis stroke="#a3a3a3" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#FF1818" fill="url(#revenueFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="signups" name="Signups" stroke="#FF4585" fill="url(#signupFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <BlockHeader eyebrow="User Analytics" title="Acquisition and engagement" description="How users arrive, where they go, and what they do next." />
          <div className="grid grid-cols-2 gap-4">
            <InsightCard title="Avg Sessions / User" value={formatDecimal(users.engagement.avg_sessions_per_user, 1)} subtext="session depth" icon={Users} />
            <InsightCard title="Viral Coefficient" value={formatDecimal(users.acquisition.viral_coefficient, 2)} subtext={`${users.acquisition.invites_sent ?? 0} invites sent`} icon={Activity} />
          </div>
          <div className="mt-6 space-y-3">
            {topScreens.slice(0, 5).map((screen, index) => (
              <div key={screen.screen_name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{screen.screen_name}</p>
                    <p className="text-xs text-neutral-400">{screen.views} views • {formatMinutes(screen.avg_time_seconds)}</p>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">#{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <BlockHeader eyebrow="Commerce" title="Category demand and order health" description="What buyers are converting on, and where the funnel is leaking." />
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown.slice(0, 6)}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="category" stroke="#a3a3a3" tick={{ fontSize: 12 }} />
                <YAxis stroke="#a3a3a3" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[10, 10, 0, 0]}>
                  {categoryBreakdown.slice(0, 6).map((_, index) => (
                    <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <InsightCard title="AOV" value={formatCurrency(commerce.aov)} subtext={`${formatPercent(commerce.funnel.overall_conversion)} overall conversion`} icon={ShoppingBag} />
            <InsightCard title="Cart Abandonment" value={formatPercent(overview.cart_abandonment_rate)} subtext={`${formatPercent(commerce.return_rate)} return rate`} icon={Package} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 xl:col-span-1">
          <BlockHeader eyebrow="Search" title="Search intelligence" description="Query quality and buyer intent from search behavior." />
          <div className="space-y-3">
            {(search.top_queries ?? []).slice(0, 5).map((query) => (
              <div key={query.query} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Search size={16} className="text-primary" />
                  <span className="text-sm text-white">{query.query}</span>
                </div>
                <span className="text-sm font-semibold text-neutral-300">{query.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <InsightCard title="Search to Purchase" value={formatPercent(search.search_to_purchase_rate)} subtext="conversion from search sessions" icon={TrendingUp} />
            <InsightCard title="Avg Results" value={formatDecimal(search.avg_results_per_query, 1)} subtext="results returned per query" icon={Search} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 xl:col-span-1">
          <BlockHeader eyebrow="Orders" title="Status mix" description="Current order distribution from commerce analytics." />
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={4}>
                  {orderStatusData.map((_, index) => (
                    <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 xl:col-span-1">
          <BlockHeader eyebrow="Operations" title="Seller and logistics signals" description="Operational health from delivery and seller funnel analytics." />
          <div className="space-y-4">
            <InsightCard title="Bookings" value={formatCompact(operations.total_bookings, 0)} subtext={`${formatDecimal(operations.avg_fulfillment_time_hours, 1)}h avg fulfillment`} icon={Store} />
            <InsightCard title="Seller Approval" value={formatPercent(sellerOperations.approval_rate)} subtext={`${sellerOperations.total_applications ?? 0} applications`} icon={UserPlus} />
          </div>
          <div className="mt-5 space-y-3">
            {logisticsPartnerData.slice(0, 4).map((partner) => (
              <div key={partner.name} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{partner.name}</span>
                  <span className="font-semibold text-neutral-300">{partner.value}</span>
                </div>
              </div>
            ))}
            {sellerStatusData.slice(0, 3).map((status) => (
              <div key={status.name} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{status.name}</span>
                  <span className="font-semibold text-neutral-300">{status.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default PlatformStats;
