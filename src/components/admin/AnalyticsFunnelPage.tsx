import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminAnalytics, type AdminCheckoutJourneySummary, type AdminFunnelDiagnostic, type AdminFunnelEvent, type AdminFunnelStage, type FunnelStageEvent } from '../../api/adminApi';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DateRangeInput, type DateRange } from '@astryxdesign/core/DateRangeInput';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Selector } from '@astryxdesign/core/Selector';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Table, pixel, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import { VStack } from '@astryxdesign/core/VStack';

const EVENT_LABELS: Record<FunnelStageEvent, string> = {
  page_view: 'Page views',
  view_item: 'Product views',
  add_to_cart: 'Added to bag',
  begin_checkout: 'Checkout started',
  purchase: 'Purchases',
  download_page_view: 'Download page views',
  store_visit: 'Store visits',
  app_install: 'App installs',
  sign_up: 'Sign-ups',
};

const WEBSITE_EVENTS: FunnelStageEvent[] = ['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase'];
const APP_EVENTS: FunnelStageEvent[] = ['download_page_view', 'store_visit', 'app_install', 'sign_up', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase'];

// Sub-events that mean the customer hit a wall, as opposed to ones that only mean engagement.
const FRICTION_SUB_EVENTS = new Set(['unavailable_shown', 'blocked', 'field_invalid', 'preflight_failed', 'failed']);

// Plain-English readings of the sub-event/detail pairs the API documents. Anything unmapped
// falls back to prettified raw text so a new backend enum still renders.
const REASON_LABELS: Record<string, string> = {
  'view_item|unavailable_shown|out_of_stock': 'Product shown as out of stock',
  'view_item|unavailable_shown|variant_unavailable': 'Chosen size/variant unavailable',
  'view_item|variant_selected|': 'Picked a size or variant',
  'view_item|size_guide_opened|': 'Opened the size guide',
  'add_to_cart|clicked|': 'Pressed add to bag',
  'add_to_cart|blocked|variant_required': 'Add blocked — no size/variant chosen',
  'add_to_cart|blocked|out_of_stock': 'Add blocked — out of stock',
  'add_to_cart|blocked|quantity_limit': 'Add blocked — quantity limit reached',
  'begin_checkout|form_started|': 'Started the checkout form',
  'begin_checkout|form_ready|': 'Form passed validation',
  'begin_checkout|submit_clicked|': 'Pressed place order',
  'begin_checkout|payment_proof_opened|': 'Opened payment proof upload',
  'begin_checkout|payment_proof_added|': 'Attached payment proof',
  'begin_checkout|payment_method_selected|cod': 'Chose cash on delivery',
  'begin_checkout|payment_method_selected|bank_deposit': 'Chose bank deposit',
  'begin_checkout|shipping_estimate|requested': 'Shipping estimate requested',
  'begin_checkout|shipping_estimate|ready': 'Shipping estimate returned',
  'begin_checkout|shipping_estimate|failed': 'Shipping estimate failed',
  'begin_checkout|preflight_failed|shipping_estimate': 'Blocked at submit — no shipping estimate',
  'begin_checkout|preflight_failed|payment_proof': 'Blocked at submit — payment proof missing',
  'begin_checkout|request_received|': 'Order request reached the server',
  'begin_checkout|failed|empty_cart': 'Server rejected order — cart was empty',
  'begin_checkout|failed|item_unavailable': 'Server rejected order — item unavailable',
  'begin_checkout|failed|internal_error': 'Server error while placing the order',
  'begin_checkout|field_invalid|name': 'Name failed validation',
  'begin_checkout|field_invalid|phone': 'Phone failed validation',
  'begin_checkout|field_invalid|address': 'Address failed validation',
  'begin_checkout|field_invalid|city': 'City failed validation',
  'begin_checkout|field_completed|name': 'Name filled',
  'begin_checkout|field_completed|phone': 'Phone filled',
  'begin_checkout|field_completed|address': 'Address filled',
  'begin_checkout|field_completed|city': 'City filled',
};

const prettify = (value?: string) => value ? value.replace(/_/g, ' ') : '';
const reasonKey = (event: FunnelStageEvent, subEvent?: string, detail?: string) => `${event}|${subEvent || ''}|${detail || ''}`;
const reasonLabel = (event: FunnelStageEvent, subEvent?: string, detail?: string) => {
  if (!subEvent) return `Stopped at ${EVENT_LABELS[event].toLowerCase()}`;
  return REASON_LABELS[reasonKey(event, subEvent, detail)] || `${EVENT_LABELS[event]} · ${[prettify(subEvent), prettify(detail)].filter(Boolean).join(' · ')}`;
};
const isFriction = (subEvent?: string) => !!subEvent && FRICTION_SUB_EVENTS.has(subEvent);

const formatCount = (value: number) => new Intl.NumberFormat('en-PK').format(value);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const share = (value: number, total: number) => total > 0 ? value / total : 0;
const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const formatTime = (value: string) => new Date(value).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const asISOString = (value?: string) => value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
type FunnelType = 'website' | 'app';
type EventFilter = FunnelStageEvent | 'all';
type OutcomeFilter = 'all' | 'incomplete' | 'purchased';

const normalizeJourney = (journey: Partial<AdminCheckoutJourneySummary>): AdminCheckoutJourneySummary => ({
  journey_id: journey.journey_id || '',
  started_at: journey.started_at || '',
  last_at: journey.last_at || journey.started_at || '',
  last_event: journey.last_event || 'begin_checkout',
  last_sub_event: journey.last_sub_event,
  last_detail: journey.last_detail,
  outcome: journey.outcome === 'purchased' ? 'purchased' : 'incomplete',
  event_count: typeof journey.event_count === 'number' ? journey.event_count : 0,
  product_ids: Array.isArray(journey.product_ids) ? journey.product_ids : [],
});

const dayLabelFormatter = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric' });
const hourFormatter = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: true });
const hourKeyFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', hourCycle: 'h23' });
const dateKey = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
};
const hourKey = (value: string) => Number(hourKeyFormatter.format(new Date(value)));

interface ProductLeakRow extends Record<string, unknown> {
  product_id: string;
  views: number;
  adds: number;
  checkouts: number;
  lost: number;
  addRate: number;
}

interface JourneyRow extends Record<string, unknown> {
  journey_id: string;
  reason: string;
  outcome: 'purchased' | 'incomplete';
  friction: boolean;
  duration: string;
  events: number;
  products: number;
  last: string;
}

const AnalyticsFunnelPage: React.FC = () => {
  const [range, setRange] = useState<DateRange | null>(null);
  const [funnelType, setFunnelType] = useState<FunnelType>('website');
  const [stages, setStages] = useState<AdminFunnelStage[]>([]);
  const [events, setEvents] = useState<AdminFunnelEvent[]>([]);
  const [diagnostics, setDiagnostics] = useState<AdminFunnelDiagnostic[]>([]);
  const [journeys, setJourneys] = useState<AdminCheckoutJourneySummary[]>([]);
  const [nextJourneyAfter, setNextJourneyAfter] = useState<string | undefined>();
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [selectedJourneyEvents, setSelectedJourneyEvents] = useState<AdminFunnelEvent[]>([]);
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('incomplete');
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJourneyLoading, setIsJourneyLoading] = useState(false);
  const [isLoadingMoreJourneys, setIsLoadingMoreJourneys] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    const params = { from: asISOString(range?.start), to: asISOString(range?.end) };
    const diagnosticsRequest = funnelType === 'website' ? AdminAnalytics.getFunnelDiagnostics(params) : Promise.resolve(null);
    const journeysRequest = funnelType === 'website' ? AdminAnalytics.getCheckoutJourneys({ ...params, limit: 50 }) : Promise.resolve(null);
    const response = await (funnelType === 'app' ? AdminAnalytics.getAppFunnel(params) : AdminAnalytics.getFunnel(params));
    if (currentRequest !== requestId.current) return;
    if (!response.ok) {
      setError((response.body as { message?: string }).message || `Could not load the ${funnelType} funnel.`);
    } else {
      setStages(Array.isArray(response.body.stages) ? response.body.stages : []);
      setEvents(Array.isArray(response.body.events) ? response.body.events : []);
      setSelectedJourneyId(null);
      setSelectedJourneyEvents([]);
      setJourneyError(null);
    }
    setIsLoading(false);
    if (!response.ok || funnelType !== 'website') return;
    void Promise.all([diagnosticsRequest, journeysRequest]).then(([diagnosticsResponse, journeysResponse]) => {
      if (currentRequest !== requestId.current) return;
      setDiagnostics(diagnosticsResponse?.ok && Array.isArray(diagnosticsResponse.body.details) ? diagnosticsResponse.body.details : []);
      setJourneys(journeysResponse?.ok && Array.isArray(journeysResponse.body.journeys) ? journeysResponse.body.journeys.map(normalizeJourney) : []);
      setNextJourneyAfter(journeysResponse?.ok ? journeysResponse.body.next_after : undefined);
    }).catch(() => undefined);
  }, [funnelType, range?.end, range?.start]);

  useEffect(() => { void load(); }, [load]);

  const selectFunnel = (value: string) => {
    if ((value !== 'website' && value !== 'app') || value === funnelType) return;
    requestId.current += 1;
    setStages([]);
    setEvents([]);
    setDiagnostics([]);
    setJourneys([]);
    setNextJourneyAfter(undefined);
    setSelectedJourneyId(null);
    setSelectedJourneyEvents([]);
    setJourneyError(null);
    setEventFilter('all');
    setReasonFilter(null);
    setError(null);
    setIsLoading(true);
    setFunnelType(value);
  };

  const funnelEvents = funnelType === 'app' ? APP_EVENTS : WEBSITE_EVENTS;
  const funnel = useMemo(() => funnelEvents.map((event) => stages.find((stage) => stage.event === event) || { event, count: 0, conversion: 0 }), [funnelEvents, stages]);
  const stageCount = useCallback((event: FunnelStageEvent) => funnel.find((stage) => stage.event === event)?.count || 0, [funnel]);

  // Each step, with how many people it lost rather than only the survival rate.
  const funnelSteps = useMemo(() => funnel.map((stage, index) => {
    const previous = index > 0 ? funnel[index - 1] : null;
    const lost = previous ? Math.max(previous.count - stage.count, 0) : 0;
    return { ...stage, previous, lost, lossRate: previous ? share(lost, previous.count) : 0 };
  }), [funnel]);
  const biggestLeak = useMemo(() => funnelSteps.slice(1).reduce<typeof funnelSteps[number] | null>((worst, step) => !worst || step.lost > worst.lost ? step : worst, null), [funnelSteps]);

  const diagnosticCount = useCallback((subEvent: string, detail?: string) => diagnostics
    .filter((row) => row.event === 'begin_checkout' && row.sub_event === subEvent && (detail === undefined || row.detail === detail))
    .reduce((total, row) => total + row.count, 0), [diagnostics]);

  // Checkout is where money is lost, so it gets its own micro-funnel built from sub-events.
  const checkoutSteps = useMemo(() => {
    const opened = stageCount('begin_checkout');
    const steps = [
      { label: 'Checkout opened', count: opened },
      { label: 'Form started', count: diagnosticCount('form_started') },
      { label: 'Payment method chosen', count: diagnosticCount('payment_method_selected') },
      { label: 'Form valid', count: diagnosticCount('form_ready') },
      { label: 'Place order pressed', count: diagnosticCount('submit_clicked') },
      { label: 'Request reached server', count: diagnosticCount('request_received') },
      { label: 'Purchase recorded', count: stageCount('purchase') },
    ];
    return steps.map((step, index) => ({ ...step, share: share(step.count, opened), lost: index > 0 ? Math.max(steps[index - 1].count - step.count, 0) : 0 }));
  }, [diagnosticCount, stageCount]);

  const checkoutBlockers = useMemo(() => diagnostics
    .filter((row) => row.event === 'begin_checkout' && isFriction(row.sub_event))
    .map((row) => ({ ...row, label: reasonLabel(row.event, row.sub_event, row.detail) }))
    .sort((a, b) => b.count - a.count), [diagnostics]);

  const productBlockers = useMemo(() => diagnostics
    .filter((row) => row.event !== 'begin_checkout')
    .map((row) => ({ ...row, label: reasonLabel(row.event, row.sub_event, row.detail), friction: isFriction(row.sub_event), base: stageCount(row.event) }))
    .sort((a, b) => Number(b.friction) - Number(a.friction) || b.count - a.count), [diagnostics, stageCount]);

  // Where journeys that reached checkout actually died, ranked.
  const stallReasons = useMemo(() => {
    const incomplete = journeys.filter((journey) => journey.outcome === 'incomplete');
    const counts = incomplete.reduce<Record<string, { label: string; count: number; friction: boolean }>>((totals, journey) => {
      const key = reasonKey(journey.last_event, journey.last_sub_event, journey.last_detail);
      totals[key] = {
        label: reasonLabel(journey.last_event, journey.last_sub_event, journey.last_detail),
        count: (totals[key]?.count || 0) + 1,
        friction: isFriction(journey.last_sub_event),
      };
      return totals;
    }, {});
    return { total: incomplete.length, rows: Object.entries(counts).map(([key, value]) => ({ key, ...value })).sort((a, b) => b.count - a.count) };
  }, [journeys]);

  const visibleJourneys = useMemo(() => journeys.filter((journey) => {
    if (outcomeFilter !== 'all' && journey.outcome !== outcomeFilter) return false;
    if (reasonFilter && reasonKey(journey.last_event, journey.last_sub_event, journey.last_detail) !== reasonFilter) return false;
    return true;
  }), [journeys, outcomeFilter, reasonFilter]);

  const journeyRows = useMemo<JourneyRow[]>(() => visibleJourneys.map((journey) => ({
    journey_id: journey.journey_id,
    reason: journey.outcome === 'purchased' ? 'Completed the order' : reasonLabel(journey.last_event, journey.last_sub_event, journey.last_detail),
    outcome: journey.outcome,
    friction: isFriction(journey.last_sub_event),
    duration: formatDuration(Date.parse(journey.last_at) - Date.parse(journey.started_at)),
    events: journey.event_count,
    products: journey.product_ids.length,
    last: formatTime(journey.last_at),
  })), [visibleJourneys]);

  // Product-level leak: base events carry product_id, so views vs adds isolates bad listings.
  const productLeaks = useMemo<ProductLeakRow[]>(() => {
    const totals = events.reduce<Record<string, ProductLeakRow>>((rows, event) => {
      if (event.sub_event || !event.product_id) return rows;
      const row = rows[event.product_id] || { product_id: event.product_id, views: 0, adds: 0, checkouts: 0, lost: 0, addRate: 0 };
      if (event.type === 'view_item') row.views += 1;
      if (event.type === 'add_to_cart') row.adds += 1;
      if (event.type === 'begin_checkout' || event.type === 'purchase') row.checkouts += 1;
      rows[event.product_id] = row;
      return rows;
    }, {});
    return Object.values(totals)
      .map((row) => ({ ...row, lost: Math.max(row.views - row.adds, 0), addRate: share(row.adds, row.views) }))
      .filter((row) => row.views > 0)
      .sort((a, b) => b.lost - a.lost || b.views - a.views);
  }, [events]);

  const filteredEvents = useMemo(() => events.filter((event) => eventFilter === 'all' || event.type === eventFilter), [eventFilter, events]);
  const datedEvents = useMemo(() => filteredEvents.filter((event) => Number.isFinite(Date.parse(event.created_at))), [filteredEvents]);
  const dailyEvents = useMemo(() => Object.entries(datedEvents.reduce<Record<string, { count: number; label: string }>>((counts, event) => {
    const key = dateKey(event.created_at);
    counts[key] = { count: (counts[key]?.count || 0) + 1, label: dayLabelFormatter.format(new Date(event.created_at)) };
    return counts;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values })), [datedEvents]);
  const hourlyEvents = useMemo(() => {
    const counts = datedEvents.reduce<number[]>((totals, event) => {
      totals[hourKey(event.created_at)] += 1;
      return totals;
    }, Array(24).fill(0));
    return counts.map((count, hour) => ({ hour, label: hourFormatter.format(new Date(`2000-01-01T${String(hour).padStart(2, '0')}:00:00+05:00`)), count }));
  }, [datedEvents]);

  useEffect(() => {
    if (!selectedJourneyId) return;
    let cancelled = false;
    setIsJourneyLoading(true);
    setSelectedJourneyEvents([]);
    setJourneyError(null);
    void AdminAnalytics.getJourney(selectedJourneyId).then((response) => {
      if (!cancelled && response.ok) setSelectedJourneyEvents(Array.isArray(response.body.events) ? response.body.events : []);
      if (!cancelled && !response.ok) setJourneyError((response.body as { message?: string }).message || 'Could not load this journey.');
    }).finally(() => {
      if (!cancelled) setIsJourneyLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedJourneyId]);

  const loadMoreJourneys = async () => {
    if (!nextJourneyAfter || isLoadingMoreJourneys) return;
    setIsLoadingMoreJourneys(true);
    const response = await AdminAnalytics.getCheckoutJourneys({ from: asISOString(range?.start), to: asISOString(range?.end), after: nextJourneyAfter, limit: 50 });
    if (response.ok) {
      const additional = Array.isArray(response.body.journeys) ? response.body.journeys.map(normalizeJourney) : [];
      setJourneys((current) => {
        const known = new Set(current.map((journey) => journey.journey_id));
        const unique = additional.filter((journey) => !known.has(journey.journey_id));
        setNextJourneyAfter(unique.length ? response.body.next_after : undefined);
        return [...current, ...unique];
      });
    }
    setIsLoadingMoreJourneys(false);
  };

  const journeyColumns: TableColumn<JourneyRow>[] = [
    {
      key: 'reason',
      header: 'Where it ended',
      width: proportional(3),
      renderCell: (row) => (
        <HStack gap={2} vAlign="center">
          <StatusDot variant={row.outcome === 'purchased' ? 'success' : row.friction ? 'error' : 'warning'} label={row.outcome === 'purchased' ? 'Purchased' : row.friction ? 'Blocked' : 'Dropped'} />
          <Text>{row.reason}</Text>
        </HStack>
      ),
    },
    { key: 'duration', header: 'Duration', width: pixel(100) },
    { key: 'events', header: 'Events', width: pixel(80), align: 'end', renderCell: (row) => <Text hasTabularNumbers>{formatCount(row.events)}</Text> },
    { key: 'products', header: 'Products', width: pixel(90), align: 'end', renderCell: (row) => <Text hasTabularNumbers>{formatCount(row.products)}</Text> },
    { key: 'last', header: 'Last activity', width: pixel(150) },
    {
      key: 'journey_id',
      header: '',
      width: pixel(110),
      align: 'end',
      renderCell: (row) => (
        <Button
          label={selectedJourneyId === row.journey_id ? 'Viewing' : 'Timeline'}
          variant="secondary"
          size="sm"
          onClick={() => setSelectedJourneyId(row.journey_id)}
        />
      ),
    },
  ];

  const productColumns: TableColumn<ProductLeakRow>[] = [
    { key: 'product_id', header: 'Product', width: proportional(2), renderCell: (row) => <Text type="code" wordBreak="break-all">{row.product_id}</Text> },
    { key: 'views', header: 'Views', width: pixel(90), align: 'end', renderCell: (row) => <Text hasTabularNumbers>{formatCount(row.views)}</Text> },
    { key: 'adds', header: 'Added to bag', width: pixel(120), align: 'end', renderCell: (row) => <Text hasTabularNumbers>{formatCount(row.adds)}</Text> },
    {
      key: 'addRate',
      header: 'Add rate',
      width: pixel(110),
      align: 'end',
      renderCell: (row) => <Badge variant={row.addRate >= 0.1 ? 'success' : row.addRate > 0 ? 'warning' : 'error'} label={formatPercent(row.addRate)} />,
    },
    { key: 'lost', header: 'Views lost', width: pixel(110), align: 'end', renderCell: (row) => <Text hasTabularNumbers>{formatCount(row.lost)}</Text> },
  ];

  const selectedJourney = journeys.find((journey) => journey.journey_id === selectedJourneyId);
  const timelineStart = selectedJourneyEvents.length ? Date.parse(selectedJourneyEvents[0].created_at) : 0;

  return (
    <VStack gap={6}>
      <HStack gap={3} wrap="wrap" hAlign="between" vAlign="end">
        <VStack gap={1}>
          <Heading level={2}>{funnelType === 'app' ? 'App download funnel' : 'Website shopping funnel'}</Heading>
          <Text type="supporting">{funnelType === 'app' ? 'From the download page through app purchase.' : 'Where customers stop on the way to a website purchase.'}</Text>
        </VStack>
        <HStack gap={2} wrap="wrap" vAlign="end">
          <VStack gap={1}>
            <Text type="label">Funnel</Text>
            <ToggleButtonGroup label="Funnel" type="single" value={funnelType} onChange={(value) => typeof value === 'string' && selectFunnel(value)} size="sm">
              <ToggleButton value="website" label="Web" />
              <ToggleButton value="app" label="App" />
            </ToggleButtonGroup>
          </VStack>
          <DateRangeInput label="Reporting period" value={range} onChange={setRange} numberOfMonths={1} />
          <Button label="Refresh" variant="secondary" icon={<RefreshCw size={16} />} onClick={() => void load()} isLoading={isLoading} />
        </HStack>
      </HStack>

      {error && <Banner status="error" title="Funnel unavailable" description={error} endContent={<Button label="Retry" variant="secondary" onClick={() => void load()} />} />}

      {!error && !isLoading && stages.length === 0 && (
        <Card padding={6}>
          <EmptyState title="No funnel events yet" description="Customer activity for this reporting period will appear here." icon={<BarChart3 size={28} />} />
        </Card>
      )}

      {!error && !isLoading && biggestLeak && biggestLeak.lost > 0 && (
        <Banner
          status="warning"
          title={`Biggest leak: ${formatCount(biggestLeak.lost)} lost between ${EVENT_LABELS[biggestLeak.previous?.event || biggestLeak.event].toLowerCase()} and ${EVENT_LABELS[biggestLeak.event].toLowerCase()}`}
          description={
            funnelType === 'website' && stallReasons.rows.length
              ? `${formatPercent(biggestLeak.lossRate)} of that step drops off. Most common stall in checkout journeys: ${stallReasons.rows[0].label} (${formatCount(stallReasons.rows[0].count)} of ${formatCount(stallReasons.total)} incomplete).`
              : `${formatPercent(biggestLeak.lossRate)} of the people who reached the previous step never took this one.`
          }
        />
      )}

      {!error && (isLoading || stages.length > 0) && (
        <Grid columns={{ minWidth: 190, max: 5 }} gap={3}>
          {funnelSteps.map((step, index) => (
            <Card key={step.event} padding={4}>
              <VStack gap={3}>
                <HStack hAlign="between" vAlign="center" gap={2}>
                  <Text type="label" color="secondary">{EVENT_LABELS[step.event]}</Text>
                  {!isLoading && biggestLeak?.event === step.event && step.lost > 0 && <Badge variant="error" label="Worst leak" />}
                </HStack>
                <Heading level={3}>{isLoading ? '—' : formatCount(step.count)}</Heading>
                {index === 0 ? (
                  <Text type="supporting">Funnel entry</Text>
                ) : (
                  <VStack gap={1}>
                    <ProgressBar label={`${EVENT_LABELS[step.event]} conversion`} isLabelHidden value={isLoading ? 0 : step.conversion * 100} max={100} variant="accent" />
                    <Text type="supporting">{isLoading ? 'Loading…' : `${formatPercent(step.conversion)} continued · ${formatCount(step.lost)} lost here`}</Text>
                  </VStack>
                )}
              </VStack>
            </Card>
          ))}
        </Grid>
      )}

      {!error && !isLoading && funnelType === 'website' && (
        <Grid columns={{ minWidth: 340, max: 2 }} gap={3}>
          <Card padding={4}>
            <VStack gap={3}>
              <VStack gap={1}>
                <Heading level={3}>Inside checkout</Heading>
                <Text type="supporting">Every step between opening checkout and a recorded purchase, as a share of checkouts opened.</Text>
              </VStack>
              {checkoutSteps[0].count === 0 ? (
                <Text type="supporting">No checkout activity in this period yet.</Text>
              ) : checkoutSteps.map((step, index) => (
                <VStack key={step.label} gap={1}>
                  <HStack hAlign="between" gap={3} vAlign="center">
                    <Text>{step.label}</Text>
                    <Text type="label" hasTabularNumbers>{formatCount(step.count)} · {formatPercent(step.share)}</Text>
                  </HStack>
                  <ProgressBar label={step.label} isLabelHidden value={Math.min(step.share * 100, 100)} max={100} variant="accent" />
                  {index > 0 && step.lost > 0 && <Text type="supporting">−{formatCount(step.lost)} from previous step</Text>}
                </VStack>
              ))}
              {checkoutBlockers.length > 0 && (
                <VStack gap={2}>
                  <Text type="label">Recorded blockers</Text>
                  {checkoutBlockers.map((blocker) => (
                    <HStack key={reasonKey(blocker.event, blocker.sub_event, blocker.detail)} hAlign="between" gap={3} vAlign="center">
                      <HStack gap={2} vAlign="center">
                        <StatusDot variant="error" label="Blocker" />
                        <Text>{blocker.label}</Text>
                      </HStack>
                      <Text type="label" hasTabularNumbers>{formatCount(blocker.count)}</Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </VStack>
          </Card>

          <VStack gap={3}>
            <Card padding={4}>
              <VStack gap={3}>
                <VStack gap={1}>
                  <Heading level={3}>Why checkout journeys stall</Heading>
                  <Text type="supporting">Last recorded step of the {formatCount(stallReasons.total)} loaded journeys with no purchase. Select a reason to filter the list below.</Text>
                </VStack>
                {stallReasons.rows.length === 0 ? (
                  <Text type="supporting">No incomplete journeys loaded for this period.</Text>
                ) : stallReasons.rows.map((row) => (
                  <VStack key={row.key} gap={1}>
                    <HStack hAlign="between" gap={3} vAlign="center">
                      <HStack gap={2} vAlign="center">
                        <StatusDot variant={row.friction ? 'error' : 'warning'} label={row.friction ? 'Blocked' : 'Dropped'} />
                        <Button
                          label={row.label}
                          variant={reasonFilter === row.key ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => { setReasonFilter(reasonFilter === row.key ? null : row.key); setOutcomeFilter('incomplete'); }}
                        />
                      </HStack>
                      <Text type="label" hasTabularNumbers>{formatCount(row.count)} · {formatPercent(share(row.count, stallReasons.total))}</Text>
                    </HStack>
                    <ProgressBar label={row.label} isLabelHidden value={share(row.count, stallReasons.total) * 100} max={100} variant="accent" />
                  </VStack>
                ))}
              </VStack>
            </Card>

            <Card padding={4}>
              <VStack gap={3}>
                <VStack gap={1}>
                  <Heading level={3}>Product and bag friction</Heading>
                  <Text type="supporting">Interactions on product pages. Blockers first, engagement below.</Text>
                </VStack>
                {productBlockers.length === 0 ? (
                  <Text type="supporting">No product diagnostics in this period yet.</Text>
                ) : productBlockers.map((row) => (
                  <HStack key={reasonKey(row.event, row.sub_event, row.detail)} hAlign="between" gap={3} vAlign="center">
                    <HStack gap={2} vAlign="center">
                      <StatusDot variant={row.friction ? 'error' : 'neutral'} label={row.friction ? 'Blocker' : 'Engagement'} />
                      <Text>{row.label}</Text>
                    </HStack>
                    <Text type="label" hasTabularNumbers>{formatCount(row.count)}{row.base > 0 ? ` · ${formatPercent(share(row.count, row.base))} of ${EVENT_LABELS[row.event].toLowerCase()}` : ''}</Text>
                  </HStack>
                ))}
              </VStack>
            </Card>
          </VStack>
        </Grid>
      )}

      {!error && !isLoading && funnelType === 'website' && (
        <Card padding={4}>
          <VStack gap={3}>
            <HStack gap={3} wrap="wrap" hAlign="between" vAlign="end">
              <VStack gap={1}>
                <Heading level={3}>Checkout journeys</Heading>
                <Text type="supporting">Anonymous visits that reached checkout. Showing {formatCount(journeyRows.length)} of {formatCount(journeys.length)} loaded.</Text>
              </VStack>
              <HStack gap={2} wrap="wrap" vAlign="end">
                {reasonFilter && <Button label="Clear reason filter" variant="secondary" size="sm" onClick={() => setReasonFilter(null)} />}
                <ToggleButtonGroup label="Outcome" type="single" value={outcomeFilter} onChange={(value) => typeof value === 'string' && setOutcomeFilter(value as OutcomeFilter)} size="sm">
                  <ToggleButton value="incomplete" label="Incomplete" />
                  <ToggleButton value="purchased" label="Purchased" />
                  <ToggleButton value="all" label="All" />
                </ToggleButtonGroup>
              </HStack>
            </HStack>
            {journeyRows.length === 0 ? (
              <Text type="supporting">No journeys match these filters.</Text>
            ) : (
              <Table data={journeyRows} columns={journeyColumns} idKey="journey_id" density="compact" hasHover textOverflow="truncate" />
            )}
            {nextJourneyAfter && <Button label="Load more journeys" variant="secondary" size="sm" onClick={() => void loadMoreJourneys()} isLoading={isLoadingMoreJourneys} />}
          </VStack>
        </Card>
      )}

      {!error && !isLoading && funnelType === 'website' && selectedJourneyId && (
        <Card padding={4}>
          <VStack gap={3}>
            <HStack gap={3} wrap="wrap" hAlign="between" vAlign="end">
              <VStack gap={1}>
                <Heading level={3}>Journey timeline</Heading>
                <Text type="supporting">
                  {selectedJourney
                    ? `${selectedJourney.outcome === 'purchased' ? 'Purchased' : reasonLabel(selectedJourney.last_event, selectedJourney.last_sub_event, selectedJourney.last_detail)} · ${formatDuration(Date.parse(selectedJourney.last_at) - Date.parse(selectedJourney.started_at))} on site · ${selectedJourney.product_ids.length} products seen`
                    : 'Ordered events show the last known friction; no customer data is collected.'}
                </Text>
              </VStack>
              <Button label="Close" variant="secondary" size="sm" onClick={() => setSelectedJourneyId(null)} />
            </HStack>
            {isJourneyLoading ? (
              <Text type="supporting">Loading timeline…</Text>
            ) : journeyError ? (
              <Banner status="error" title="Journey unavailable" description={journeyError} />
            ) : selectedJourneyEvents.length === 0 ? (
              <Text type="supporting">No events recorded for this journey.</Text>
            ) : selectedJourneyEvents.map((event, index) => {
              const friction = isFriction(event.sub_event);
              const previous = index > 0 ? selectedJourneyEvents[index - 1] : null;
              const gap = previous ? Date.parse(event.created_at) - Date.parse(previous.created_at) : 0;
              return (
                <HStack key={`${event.created_at}-${event.type}-${event.sub_event || 'base'}-${index}`} hAlign="between" gap={3} vAlign="center">
                  <HStack gap={2} vAlign="center">
                    <StatusDot variant={friction ? 'error' : event.sub_event ? 'neutral' : 'accent'} label={friction ? 'Friction' : event.sub_event ? 'Detail' : 'Funnel step'} />
                    <Text weight={event.sub_event ? 'normal' : 'semibold'}>{reasonLabel(event.type, event.sub_event, event.detail)}</Text>
                    {event.product_id && <Text type="code" wordBreak="break-all">{event.product_id}</Text>}
                  </HStack>
                  <Text type="supporting" hasTabularNumbers>
                    {formatTime(event.created_at)}
                    {index > 0 ? ` · +${formatDuration(gap)}` : ''}
                    {index > 0 ? ` · ${formatDuration(Date.parse(event.created_at) - timelineStart)} in` : ''}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </Card>
      )}

      {!error && !isLoading && stages.length > 0 && events.length === 0 && (
        <Banner status="info" title="Timestamp detail unavailable" description="The funnel totals loaded, but this API response did not include event created_at values for charting." />
      )}

      {!error && !isLoading && productLeaks.length > 0 && (
        <Card padding={4}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={3}>Products losing the most views</Heading>
              <Text type="supporting">Product views that never became a bag add. A low add rate on high views usually means price, imagery, or stock.</Text>
            </VStack>
            <Table data={showAllProducts ? productLeaks : productLeaks.slice(0, 10)} columns={productColumns} idKey="product_id" density="compact" hasHover textOverflow="truncate" />
            {productLeaks.length > 10 && (
              <Button label={showAllProducts ? 'Show top 10' : `Show all ${formatCount(productLeaks.length)} products`} variant="secondary" size="sm" onClick={() => setShowAllProducts((current) => !current)} />
            )}
          </VStack>
        </Card>
      )}

      {!error && !isLoading && events.length > 0 && (
        <VStack gap={4}>
          <HStack gap={3} wrap="wrap" hAlign="between" vAlign="end">
            <VStack gap={1}>
              <Heading level={3}>Event activity</Heading>
              <Text type="supporting">All times are Pakistan Standard Time.</Text>
            </VStack>
            <Selector
              label="Event type"
              value={eventFilter}
              onChange={(value) => setEventFilter(value as EventFilter)}
              options={[{ value: 'all', label: 'All events' }, ...funnelEvents.map((event) => ({ value: event, label: EVENT_LABELS[event] }))]}
              size="sm"
            />
          </HStack>

          <Grid columns={{ minWidth: 320, max: 2 }} gap={3}>
            <Card padding={4}>
              <VStack gap={3}>
                <Heading level={4}>Events by day</Heading>
                <BarChart responsive data={dailyEvents} height={280} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [formatCount(Number(value)), 'Events']} />
                  <Bar dataKey="count" fill="var(--color-border-red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </VStack>
            </Card>
            <Card padding={4}>
              <VStack gap={3}>
                <Heading level={4}>Events by time of day</Heading>
                <BarChart responsive data={hourlyEvents} height={280} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" interval={2} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [formatCount(Number(value)), 'Events']} />
                  <Bar dataKey="count" fill="var(--color-border-orange)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </VStack>
            </Card>
          </Grid>
        </VStack>
      )}
    </VStack>
  );
};

export default AnalyticsFunnelPage;
