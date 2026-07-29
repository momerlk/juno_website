import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminAnalytics, type AdminFunnelEvent, type AdminFunnelStage, type FunnelStageEvent } from '../../api/adminApi';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
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

const AnalyticsFunnelPage: React.FC = () => {
  const [range, setRange] = useState<DateRange | null>(null);
  const [funnelType, setFunnelType] = useState<FunnelType>('website');
  const [stages, setStages] = useState<AdminFunnelStage[]>([]);
  const [events, setEvents] = useState<AdminFunnelEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    const params = { from: asISOString(range?.start), to: asISOString(range?.end) };
    const response = funnelType === 'app'
      ? await AdminAnalytics.getAppFunnel(params)
      : await AdminAnalytics.getFunnel(params);
    if (currentRequest !== requestId.current) return;
    if (!response.ok) {
      setError((response.body as { message?: string }).message || `Could not load the ${funnelType} funnel.`);
    } else {
      setStages(Array.isArray(response.body.stages) ? response.body.stages : []);
      setEvents(Array.isArray(response.body.events) ? response.body.events : []);
    }
    setIsLoading(false);
  }, [funnelType, range?.end, range?.start]);

  useEffect(() => { void load(); }, [load]);

  const selectFunnel = (value: string) => {
    if ((value !== 'website' && value !== 'app') || value === funnelType) return;
    requestId.current += 1;
    setStages([]);
    setEvents([]);
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
