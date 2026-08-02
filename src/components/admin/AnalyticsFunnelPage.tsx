import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminAnalytics, type AdminCheckoutJourneySummary, type AdminFunnelDiagnostic, type AdminFunnelEvent, type AdminFunnelStage, type FunnelStageEvent } from '../../api/adminApi';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { DateRangeInput, type DateRange } from '@astryxdesign/core/DateRangeInput';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Selector } from '@astryxdesign/core/Selector';
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

const formatCount = (value: number) => new Intl.NumberFormat('en-PK').format(value);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const asISOString = (value?: string) => value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
type FunnelType = 'website' | 'app';
type EventFilter = FunnelStageEvent | 'all';

const dayLabelFormatter = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric' });
const hourFormatter = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', hour: 'numeric', hour12: true });
const hourKeyFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', hourCycle: 'h23' });
const dateKey = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
};
const hourKey = (value: string) => Number(hourKeyFormatter.format(new Date(value)));
const chartColors = ['var(--color-border-red)', 'var(--color-border-orange)', 'var(--color-border-pink)', 'var(--color-border-purple)', 'var(--color-border-cyan)', 'var(--color-border-green)', 'var(--color-border-yellow)', 'var(--color-border-gray)'];
const subEventLabel = (event: AdminFunnelEvent | AdminFunnelDiagnostic) => [event.sub_event.replace(/_/g, ' '), event.detail?.replace(/_/g, ' ')].filter(Boolean).join(' · ');
const timelineLabel = (event: AdminFunnelEvent) => event.sub_event ? `${EVENT_LABELS[event.type]} · ${subEventLabel(event)}` : EVENT_LABELS[event.type];

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
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
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
      setJourneys(journeysResponse?.ok && Array.isArray(journeysResponse.body.journeys) ? journeysResponse.body.journeys : []);
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
    setError(null);
    setIsLoading(true);
    setFunnelType(value);
  };

  const funnelEvents = funnelType === 'app' ? APP_EVENTS : WEBSITE_EVENTS;
  const funnel = useMemo(() => funnelEvents.map((event) => stages.find((stage) => stage.event === event) || { event, count: 0, conversion: 0 }), [funnelEvents, stages]);
  const weakestStage = useMemo(() => funnel.slice(1).reduce<AdminFunnelStage | null>((lowest, stage) => !lowest || stage.conversion < lowest.conversion ? stage : lowest, null), [funnel]);
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
  const eventsByType = useMemo(() => funnelEvents.map((type) => ({ type, label: EVENT_LABELS[type], count: events.filter((event) => event.type === type).length })), [events, funnelEvents]);

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
      const additional = Array.isArray(response.body.journeys) ? response.body.journeys : [];
      setJourneys((current) => {
        const known = new Set(current.map((journey) => journey.journey_id));
        const unique = additional.filter((journey) => !known.has(journey.journey_id));
        setNextJourneyAfter(unique.length ? response.body.next_after : undefined);
        return [...current, ...unique];
      });
    }
    setIsLoadingMoreJourneys(false);
  };

  return (
    <VStack gap={6}>
      <HStack gap={3} wrap="wrap" hAlign="between" vAlign="end">
        <VStack gap={1}>
          <Heading level={2}>{funnelType === 'app' ? 'App download funnel' : 'Website shopping funnel'}</Heading>
          <Text type="supporting">{funnelType === 'app' ? 'From the download page through app purchase.' : 'Customer actions through a website purchase.'}</Text>
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

      {!error && (isLoading || stages.length > 0) && (
        <Grid columns={{ minWidth: 190, max: 5 }} gap={3}>
          {funnel.map((stage, index) => (
            <Card key={stage.event} padding={4}>
              <VStack gap={3}>
                <Text type="label" color="secondary">{EVENT_LABELS[stage.event]}</Text>
                <Heading level={3}>{isLoading ? '—' : formatCount(stage.count)}</Heading>
                {index === 0 ? (
                  <Text type="supporting">Funnel entry</Text>
                ) : (
                  <VStack gap={1}>
                    <ProgressBar label={`${EVENT_LABELS[stage.event]} conversion`} isLabelHidden value={isLoading ? 0 : stage.conversion * 100} max={100} variant="accent" />
                    <Text type="supporting">{isLoading ? 'Loading…' : `${formatPercent(stage.conversion)} from previous step`}</Text>
                  </VStack>
                )}
              </VStack>
            </Card>
          ))}
        </Grid>
      )}

      {!error && !isLoading && weakestStage && (
        <Banner status="warning" title={`Largest drop-off: ${EVENT_LABELS[weakestStage.event]}`} description={`${formatPercent(weakestStage.conversion)} of customers reached this step from the preceding one.`} />
      )}

      {!error && !isLoading && funnelType === 'website' && (
        <Grid columns={{ minWidth: 320, max: 2 }} gap={3}>
          <Card padding={4}>
            <VStack gap={3}>
              <VStack gap={1}>
                <Heading level={3}>Funnel diagnostics</Heading>
                <Text type="supporting">Product, bag, and checkout interaction milestones.</Text>
              </VStack>
              {diagnostics.length === 0 ? (
                <Text type="supporting">No diagnostic events in this period yet.</Text>
              ) : diagnostics.map((detail) => (
                <HStack key={`${detail.event}-${detail.sub_event}-${detail.detail || ''}`} hAlign="between" gap={3}>
                  <Text>{EVENT_LABELS[detail.event]} · {subEventLabel(detail)}</Text>
                  <Text type="label">{formatCount(detail.count)}</Text>
                </HStack>
              ))}
            </VStack>
          </Card>

          <Card padding={4}>
            <VStack gap={3}>
              <VStack gap={1}>
                <Heading level={3}>Checkout journeys</Heading>
                <Text type="supporting">Anonymous visits that reached checkout.</Text>
              </VStack>
              {journeys.length === 0 ? (
                <Text type="supporting">No checkout journeys in this period yet.</Text>
              ) : journeys.map((journey) => (
                <ClickableCard
                  key={journey.journey_id}
                  label={`Open checkout journey ${journey.journey_id}`}
                  padding={2}
                  variant={selectedJourneyId === journey.journey_id ? 'muted' : 'transparent'}
                  onClick={() => setSelectedJourneyId(journey.journey_id)}
                >
                  <HStack hAlign="between" gap={3}>
                    <Text type="code" wordBreak="break-all">{journey.journey_id}</Text>
                    <Text type="supporting">{new Date(journey.started_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</Text>
                  </HStack>
                </ClickableCard>
              ))}
              {nextJourneyAfter && <Button label="Load more journeys" variant="secondary" size="sm" onClick={() => void loadMoreJourneys()} isLoading={isLoadingMoreJourneys} />}
            </VStack>
          </Card>
        </Grid>
      )}

      {!error && !isLoading && funnelType === 'website' && selectedJourneyId && (
        <Card padding={4}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={3}>Journey timeline</Heading>
              <Text type="supporting">{selectedJourneyId}</Text>
            </VStack>
            {isJourneyLoading ? (
              <Text type="supporting">Loading timeline…</Text>
            ) : journeyError ? (
              <Banner status="error" title="Journey unavailable" description={journeyError} />
            ) : selectedJourneyEvents.length === 0 ? (
              <Text type="supporting">No events recorded for this journey.</Text>
            ) : selectedJourneyEvents.map((event, index) => (
              <HStack key={`${event.created_at}-${event.type}-${event.sub_event || 'base'}-${index}`} hAlign="between" gap={3}>
                <Text>{timelineLabel(event)}</Text>
                <Text type="supporting">{new Date(event.created_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</Text>
              </HStack>
            ))}
          </VStack>
        </Card>
      )}

      {!error && !isLoading && stages.length > 0 && events.length === 0 && (
        <Banner status="info" title="Timestamp detail unavailable" description="The funnel totals loaded, but this API response did not include event created_at values for charting." />
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

          <Card padding={4}>
            <VStack gap={3}>
              <Heading level={4}>Events by type</Heading>
              <BarChart responsive data={eventsByType} height={300} layout="vertical" margin={{ left: 28 }} accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={120} />
                <Tooltip formatter={(value) => [formatCount(Number(value)), 'Events']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {eventsByType.map((entry, index) => <Cell key={entry.type} fill={chartColors[index]} />)}
                </Bar>
              </BarChart>
            </VStack>
          </Card>
        </VStack>
      )}
    </VStack>
  );
};

export default AnalyticsFunnelPage;
