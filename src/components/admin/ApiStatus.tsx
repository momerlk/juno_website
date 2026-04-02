import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lock,
  Package2,
  Radar,
  RefreshCw,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Wifi,
  XCircle,
} from 'lucide-react';
import {
  AdminAPI,
  AdminCatalog,
  Analytics,
  Campaigns,
  Catalog,
  Commerce,
  Events,
  GuestCommerce,
  SellerAPI,
  Shopify,
} from '../../api/api';

type DiagnosticResult = {
  label: string;
  ok: boolean;
  status: number | string;
  latency: number;
  detail: string;
};

type ModuleDefinition = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  namespace: string;
  file: string;
  auth: 'Public' | 'User' | 'Seller' | 'Admin' | 'Mixed';
  endpointCount: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  tone: string;
  sampleCalls: string[];
  capabilities: string[];
  diagnostic?: {
    label: string;
    run: () => Promise<{ ok: boolean; status: number | string; detail: string }>;
  };
};

const moduleDefinitions: ModuleDefinition[] = [
  {
    id: 'analytics',
    title: 'Analytics + Probe',
    tagline: 'Live platform signals and behavior intelligence',
    description: 'Platform analytics, funnel visibility, realtime monitoring, and client event ingestion for Juno growth loops.',
    namespace: 'Analytics / Probe',
    file: 'src/api/analyticsApi.ts',
    auth: 'Admin',
    endpointCount: 17,
    icon: Radar,
    tone: 'from-primary/25 via-primary/10 to-transparent',
    sampleCalls: [
      'await Analytics.getOverview({ compare: "previous_period" })',
      'await Analytics.getCommerce({ start_time, end_time })',
      'await Probe.ingestEvents({ session_id, events })',
    ],
    capabilities: ['overview metrics', 'user analytics', 'funnel diagnostics', 'realtime events'],
    diagnostic: {
      label: 'Overview snapshot',
      run: async () => {
        const resp = await Analytics.getOverview();
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Admin analytics reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'catalog',
    title: 'Catalog + Admin Catalog',
    tagline: 'Discovery surfaces, curation, drops, and storefront structure',
    description: 'Public product browsing plus admin control for collections, drops, reminders, and Shopify collection sync.',
    namespace: 'Catalog / AdminCatalog',
    file: 'src/api/catalogApi.ts',
    auth: 'Mixed',
    endpointCount: 31,
    icon: Package2,
    tone: 'from-secondary/25 via-secondary/10 to-transparent',
    sampleCalls: [
      'await Catalog.getProducts({ category, limit: 20 })',
      'await Catalog.getTrendingSearches(10)',
      'await AdminCatalog.getDrops({ status: "live" })',
    ],
    capabilities: ['search + filters', 'brand storefronts', 'collections', 'drop management'],
    diagnostic: {
      label: 'Public catalog check',
      run: async () => {
        const resp = await Catalog.getProducts({ limit: 1 });
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Guest catalog reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    tagline: 'Performance marketing control room',
    description: 'Campaign lifecycle management with landing resolution, status transitions, and metrics for paid growth.',
    namespace: 'Campaigns',
    file: 'src/api/campaignsApi.ts',
    auth: 'Admin',
    endpointCount: 8,
    icon: Sparkles,
    tone: 'from-primary/20 via-secondary/15 to-transparent',
    sampleCalls: [
      'await Campaigns.listCampaigns({ status: "active" })',
      'await Campaigns.getCampaignMetrics(id)',
      'await Campaigns.resolveLandingTarget(id)',
    ],
    capabilities: ['campaign CRUD', 'status changes', 'metrics', 'landing validation'],
    diagnostic: {
      label: 'Campaign index',
      run: async () => {
        const resp = await Campaigns.listCampaigns({ limit: 5, offset: 0 });
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Campaign module reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'commerce',
    title: 'Commerce + Guest Commerce',
    tagline: 'Cart, checkout, and frictionless guest conversion',
    description: 'Authenticated cart flows alongside guest checkout primitives for high-intent traffic and lightweight conversion journeys.',
    namespace: 'Commerce / GuestCommerce',
    file: 'src/api/commerceApi.ts',
    auth: 'Mixed',
    endpointCount: 11,
    icon: ShoppingBag,
    tone: 'from-white/10 via-primary/10 to-transparent',
    sampleCalls: [
      'await Commerce.getCart()',
      'await GuestCommerce.getCart()',
      'await GuestCommerce.lookupOrders({ phone_number })',
    ],
    capabilities: ['user cart', 'checkout', 'orders', 'guest cart identity'],
    diagnostic: {
      label: 'Guest cart session',
      run: async () => {
        const resp = await GuestCommerce.getCart();
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Guest commerce reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'events',
    title: 'Events',
    tagline: 'Tournaments, registration, and leaderboard mechanics',
    description: 'Competition endpoints for public discovery, leaderboard rendering, authenticated registration, and admin event creation.',
    namespace: 'Events',
    file: 'src/api/eventsApi.ts',
    auth: 'Mixed',
    endpointCount: 5,
    icon: Activity,
    tone: 'from-secondary/20 via-white/5 to-transparent',
    sampleCalls: [
      'await Events.listTournaments()',
      'await Events.getLeaderboard(tournamentId)',
      'await Events.register(tournamentId)',
    ],
    capabilities: ['public listing', 'leaderboards', 'user registration', 'admin creation'],
    diagnostic: {
      label: 'Tournament index',
      run: async () => {
        const resp = await Events.listTournaments();
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Events module reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'shopify',
    title: 'Shopify',
    tagline: 'Seller sync layer for off-platform inventory',
    description: 'OAuth connection, product and collection sync, and admin-assisted syncing for seller onboarding and recovery.',
    namespace: 'Shopify',
    file: 'src/api/shopifyApi.ts',
    auth: 'Mixed',
    endpointCount: 7,
    icon: Store,
    tone: 'from-primary/15 via-white/5 to-transparent',
    sampleCalls: [
      'const url = Shopify.getAuthUrl(token, "store.myshopify.com")',
      'await Shopify.getStatus()',
      'await Shopify.adminSyncProducts(sellerId)',
    ],
    capabilities: ['oauth url', 'seller sync', 'collection sync', 'admin re-sync'],
    diagnostic: {
      label: 'Connection status',
      run: async () => {
        const resp = await Shopify.getStatus();
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Shopify status endpoint reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'seller',
    title: 'Seller API Extended',
    tagline: 'Drop planning, inventory controls, and fulfillment actions',
    description: 'Seller-facing operational endpoints for low-stock visibility, drops, queue checks, and last-mile order handling.',
    namespace: 'SellerAPI',
    file: 'src/api/sellerApi.types.ts',
    auth: 'Seller',
    endpointCount: 10,
    icon: BarChart3,
    tone: 'from-secondary/20 via-primary/8 to-transparent',
    sampleCalls: [
      'await SellerAPI.getDrops({ status: "draft" })',
      'await SellerAPI.getLowStock(10)',
      'await SellerAPI.bookDelivery(orderId)',
    ],
    capabilities: ['seller drops', 'inventory triage', 'queue review', 'fulfillment'],
    diagnostic: {
      label: 'Seller drops',
      run: async () => {
        const resp = await SellerAPI.getDrops({ status: 'draft' });
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Seller module reachable' : formatBody(resp.body),
        };
      },
    },
  },
  {
    id: 'admin',
    title: 'Admin API Extended',
    tagline: 'Platform governance, moderation, and systems control',
    description: 'Admin operations for sellers, users, orders, carts, notifications, moderation queues, waitlist, and health.',
    namespace: 'AdminAPI',
    file: 'src/api/adminApi.types.ts',
    auth: 'Admin',
    endpointCount: 20,
    icon: Users,
    tone: 'from-primary/20 via-secondary/10 to-transparent',
    sampleCalls: [
      'await AdminAPI.getSellers()',
      'await AdminAPI.getOrders()',
      'await AdminAPI.getSystemHealth()',
    ],
    capabilities: ['seller ops', 'user ops', 'order ops', 'notifications + system'],
    diagnostic: {
      label: 'System health',
      run: async () => {
        const resp = await AdminAPI.getSystemHealth();
        return {
          ok: resp.ok,
          status: resp.status,
          detail: resp.ok ? 'Admin health endpoint reachable' : formatBody(resp.body),
        };
      },
    },
  },
];

const authPalette: Record<ModuleDefinition['auth'], string> = {
  Public: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20',
  User: 'bg-sky-500/15 text-sky-200 border-sky-400/20',
  Seller: 'bg-secondary/15 text-secondary border-secondary/30',
  Admin: 'bg-primary/15 text-primary border-primary/30',
  Mixed: 'bg-white/10 text-neutral-100 border-white/15',
};

const tokenRegistry = [
  { label: 'User token', key: 'token' },
  { label: 'Seller token', key: 'seller_token' },
  { label: 'Admin token', key: 'admin_token' },
];

function formatBody(body: unknown): string {
  if (!body) return 'No response body';
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    const message =
      (body as { message?: string }).message ||
      (body as { error?: { message?: string } }).error?.message ||
      (body as { code?: string }).code;
    if (message) return message;
    return JSON.stringify(body).slice(0, 120);
  }
  return String(body);
}

const ApiStatus: React.FC = () => {
  const [results, setResults] = useState<Record<string, DiagnosticResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeModule, setActiveModule] = useState(moduleDefinitions[0].id);

  const tokenState = useMemo(
    () =>
      tokenRegistry.map((token) => ({
        ...token,
        available: Boolean(localStorage.getItem(token.key)),
      })),
    []
  );

  const coverage = useMemo(
    () => moduleDefinitions.reduce((sum, module) => sum + module.endpointCount, 0),
    []
  );

  const activeModuleData = moduleDefinitions.find((module) => module.id === activeModule) ?? moduleDefinitions[0];

  const runDiagnostics = async () => {
    setIsLoading(true);
    const nextResults: Record<string, DiagnosticResult> = {};

    for (const module of moduleDefinitions) {
      if (!module.diagnostic) continue;

      const start = performance.now();
      try {
        const result = await module.diagnostic.run();
        nextResults[module.id] = {
          label: module.diagnostic.label,
          ok: result.ok,
          status: result.status,
          latency: Math.round(performance.now() - start),
          detail: result.detail,
        };
      } catch (error) {
        nextResults[module.id] = {
          label: module.diagnostic.label,
          ok: false,
          status: 'Error',
          latency: Math.round(performance.now() - start),
          detail: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    setResults(nextResults);
    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const healthyCount = Object.values(results).filter((result) => result.ok).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/15 blur-[110px]" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-secondary/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
      </div>

      <div className="relative space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.34em] text-white/70">
                <ShieldCheck size={14} className="text-primary" />
                API Portal
              </div>
              <h2 className="max-w-2xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white md:text-6xl">
                Modular API surface, mapped for operations.
              </h2>
              <p className="mt-4 max-w-2xl text-base text-neutral-300 md:text-lg">
                The portal now reflects the new `src/api/` modules from `new_endpoints.md`, with module coverage, auth readiness, and read-safe diagnostics.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Modules</p>
                <p className="mt-3 text-3xl font-black text-white">{moduleDefinitions.length}</p>
                <p className="mt-2 text-sm text-neutral-400">focused namespaces</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Endpoints</p>
                <p className="mt-3 text-3xl font-black text-white">{coverage}</p>
                <p className="mt-2 text-sm text-neutral-400">documented in the portal</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Diagnostics</p>
                <p className="mt-3 text-3xl font-black text-white">
                  {healthyCount}/{moduleDefinitions.length}
                </p>
                <p className="mt-2 text-sm text-neutral-400">read-safe checks passing</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              {tokenState.map((token) => (
                <div
                  key={token.key}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${token.available ? 'bg-primary/15' : 'bg-white/5'}`}>
                      {token.available ? (
                        <CheckCircle2 size={16} className="text-primary" />
                      ) : (
                        <Lock size={16} className="text-white/45" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{token.label}</p>
                      <p className="text-xs text-neutral-400">
                        {token.available ? 'Available in localStorage' : 'Missing from localStorage'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:shadow-[0_20px_50px_rgba(255,24,24,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh Diagnostics
            </button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Module Map</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">New endpoint families</h3>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 md:flex">
                <Wifi size={14} className="text-primary" />
                non-destructive probes only
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {moduleDefinitions.map((module, index) => {
                const Icon = module.icon;
                const result = results[module.id];
                const isActive = activeModule === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`group relative overflow-hidden rounded-[1.75rem] border p-5 text-left transition-all ${
                      isActive
                        ? 'border-white/20 bg-white/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.3)]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.tone} opacity-80`} />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <Icon size={20} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Module {index + 1}</p>
                            <h4 className="mt-1 text-lg font-black uppercase tracking-[-0.02em] text-white">{module.title}</h4>
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${authPalette[module.auth]}`}>
                          {module.auth}
                        </span>
                      </div>

                      <p className="mt-4 text-sm text-neutral-300">{module.tagline}</p>

                      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Coverage</p>
                          <p className="mt-1 text-2xl font-black text-white">{module.endpointCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Probe</p>
                          {result ? (
                            <div className={`mt-1 inline-flex items-center gap-2 text-sm font-semibold ${result.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                              {result.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                              {result.status}
                            </div>
                          ) : (
                            <div className="mt-1 inline-flex items-center gap-2 text-sm text-neutral-500">
                              <Clock3 size={15} />
                              pending
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        Explore module
                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Selected Module</p>
                  <h3 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] text-white">
                    {activeModuleData.title}
                  </h3>
                  <p className="mt-3 text-sm text-neutral-300">{activeModuleData.description}</p>
                </div>
                <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${activeModuleData.tone} p-4`}>
                  <activeModuleData.icon size={24} className="text-white" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Namespace</p>
                  <p className="mt-2 text-base font-semibold text-white">{activeModuleData.namespace}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Source File</p>
                  <p className="mt-2 break-all font-mono text-xs text-neutral-300">{activeModuleData.file}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Live Diagnostic</p>
                    <p className="mt-1 text-sm text-neutral-400">{results[activeModuleData.id]?.label ?? 'Waiting for probe result'}</p>
                  </div>
                  {results[activeModuleData.id] ? (
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                      results[activeModuleData.id].ok
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'bg-amber-500/15 text-amber-200'
                    }`}>
                      {results[activeModuleData.id].ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {results[activeModuleData.id].status}
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Latency</p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {results[activeModuleData.id]?.latency ?? 0}
                      <span className="ml-1 text-sm font-semibold text-neutral-400">ms</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Detail</p>
                    <p className="mt-2 text-sm text-neutral-300">
                      {results[activeModuleData.id]?.detail ?? 'Running check...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">Core capabilities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeModuleData.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-200"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/15 p-3">
                  <Server size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Example Calls</p>
                  <h4 className="mt-1 text-xl font-black uppercase text-white">Drop-in usage patterns</h4>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {activeModuleData.sampleCalls.map((sample) => (
                  <div key={sample} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <code className="block overflow-x-auto whitespace-pre-wrap font-mono text-xs text-neutral-200">
                      {sample}
                    </code>
                  </div>
                ))}
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                Mirrored from `new_endpoints.md`
                <ArrowRight size={14} className="text-primary" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default ApiStatus;
