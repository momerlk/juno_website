import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  UserRound,
  Waves,
} from 'lucide-react';
import {
  Analytics,
  type ProbeEvent,
  type RealTimeResponse,
  type RetentionMetrics,
  type SearchAnalyticsResponse,
  type UserAnalyticsResponse,
} from '../../api/api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const palette = ['#FF1818', '#FF4585', '#FB7185', '#F97316', '#FACC15'];

const formatPercent = (value: number | undefined) => `${(value ?? 0).toFixed(1)}%`;

const formatTime = (seconds: number | undefined) => {
  const total = Math.round(seconds ?? 0);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}m ${remainder}s`;
};

const BlockHeader: React.FC<{ eyebrow: string; title: string; description: string }> = ({ eyebrow, title, description }) => (
  <div className="mb-5">
    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">{eyebrow}</p>
    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">{title}</h2>
    <p className="mt-2 text-sm text-neutral-400">{description}</p>
  </div>
);

const MetricChip: React.FC<{ label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = ({ label, value, icon: Icon }) => (
  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">{label}</span>
      <Icon size={16} className="text-primary" />
    </div>
    <p className="mt-3 text-2xl font-black text-white">{value}</p>
  </div>
);

const InteractionAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtime, setRealtime] = useState<RealTimeResponse | null>(null);
  const [events, setEvents] = useState<ProbeEvent[]>([]);
  const [users, setUsers] = useState<UserAnalyticsResponse | null>(null);
  const [retention, setRetention] = useState<RetentionMetrics | null>(null);
  const [search, setSearch] = useState<SearchAnalyticsResponse | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [realtimeResp, eventsResp, usersResp, retentionResp, searchResp] = await Promise.all([
        Analytics.getRealTime(15),
        Analytics.getRealTimeEvents(20),
        Analytics.getUsers(),
        Analytics.getUserRetention(),
        Analytics.getSearch(),
      ]);

      const failures = [realtimeResp, eventsResp, usersResp, retentionResp, searchResp].filter((resp) => !resp.ok);
      if (failures.length) {
        throw new Error('Probe explorer could not load all analytics feeds.');
      }

      setRealtime(realtimeResp.body);
      setEvents(eventsResp.body);
      setUsers(usersResp.body);
      setRetention(retentionResp.body);
      setSearch(searchResp.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interaction analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const screenData = useMemo(
    () =>
      Object.entries(realtime?.active_screens ?? {}).map(([name, value]) => ({
        name,
        value,
      })),
    [realtime]
  );

  const featureUsageData = useMemo(
    () =>
      Object.entries(users?.engagement.feature_usage ?? {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [users]
  );

  const topQueries = search?.top_queries?.slice(0, 6) ?? [];

  if (isLoading) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-neutral-400">Loading Probe explorer...</div>;
  }

  if (error || !realtime || !users || !retention || !search) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8">
        <p className="text-lg font-bold text-white">Probe explorer unavailable</p>
        <p className="mt-2 text-sm text-red-200/80">{error ?? 'No interaction analytics returned.'}</p>
        <button
          onClick={fetchData}
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
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/35">Probe Explorer</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white">Behavior, events, and live traffic.</h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-400">
              Dedicated admin view for realtime activity, screen attention, feature usage, search behavior, and retention signals.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricChip label="Active Users Now" value={String(realtime.active_users_now)} icon={UserRound} />
          <MetricChip label="Events / Minute" value={String(realtime.events_per_minute)} icon={Waves} />
          <MetricChip label="Orders Last Hour" value={String(realtime.orders_last_hour)} icon={Activity} />
          <MetricChip label="Revenue Last Hour" value={`Rs ${Math.round(realtime.revenue_last_hour).toLocaleString()}`} icon={Clock3} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <BlockHeader eyebrow="Live Screens" title="Current screen attention" description="Which screens are currently active across ongoing sessions." />
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={screenData}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" tick={{ fontSize: 12 }} />
                <YAxis stroke="#a3a3a3" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {screenData.map((_, index) => (
                    <Cell key={index} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <BlockHeader eyebrow="Feature Usage" title="What users actually touch" description="Top feature interactions pulled from Probe engagement analytics." />
          <div className="space-y-3">
            {featureUsageData.map((feature) => (
              <div key={feature.name} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-white">{feature.name}</span>
                  <span className="text-sm font-semibold text-neutral-300">{feature.value}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <MetricChip label="Avg Session Duration" value={formatTime(users.engagement.avg_session_duration)} icon={Clock3} />
            <MetricChip label="Avg Sessions / User" value={users.engagement.avg_sessions_per_user.toFixed(1)} icon={Eye} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <BlockHeader eyebrow="Search" title="Search behavior" description="High-intent queries and places where search is failing." />
          <div className="space-y-3">
            {topQueries.map((query) => (
              <div key={query.query} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Search size={16} className="text-primary" />
                  <span className="text-sm text-white">{query.query}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-200">{query.count}</div>
                  <div className="text-xs text-neutral-500">CTR {formatPercent(query.click_through_rate)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <MetricChip label="Search to Purchase" value={formatPercent(search.search_to_purchase_rate)} icon={Search} />
            <MetricChip label="No Result Queries" value={String(search.no_result_queries.length)} icon={Activity} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <BlockHeader eyebrow="Retention" title="Cohorts and segments" description="Who sticks, who churns, and which user groups matter most." />
          <div className="grid grid-cols-2 gap-4">
            <MetricChip label="Stickiness" value={formatPercent(retention.stickiness)} icon={UserRound} />
            <MetricChip label="Churn Rate" value={formatPercent(retention.churn_rate)} icon={Activity} />
            <MetricChip label="Resurrection" value={formatPercent(retention.resurrection_rate)} icon={RefreshCw} />
            <MetricChip label="Segments" value={String(users.segments.length)} icon={Waves} />
          </div>
          <div className="mt-5 space-y-3">
            {users.segments.slice(0, 5).map((segment) => (
              <div key={segment.name} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{segment.name}</span>
                  <span className="text-sm font-semibold text-neutral-300">
                    {segment.count} • {formatPercent(segment.pct)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <BlockHeader eyebrow="Event Stream" title="Recent Probe events" description="Raw live events to validate instrumentation and spot current behavior patterns." />
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                      {event.type}
                    </span>
                    <span className="text-xs text-neutral-500">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-300">
                    Screen: {event.context?.screen_name ?? 'unknown'} • Session: {event.session_id}
                  </p>
                </div>
                <div className="text-sm text-neutral-400">
                  {event.device?.platform ?? 'web'} • {event.context?.source ?? 'direct'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default InteractionAnalytics;
