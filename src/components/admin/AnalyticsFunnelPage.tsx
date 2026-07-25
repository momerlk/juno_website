import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { AdminAnalytics, type AdminFunnelStage, type FunnelStageEvent } from '../../api/adminApi';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { DateRangeInput, type DateRange } from '@astryxdesign/core/DateRangeInput';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

const EVENT_LABELS: Record<FunnelStageEvent, string> = {
  page_view: 'Page views',
  view_item: 'Product views',
  add_to_cart: 'Added to bag',
  begin_checkout: 'Checkout started',
  purchase: 'Purchases',
};

const FUNNEL_EVENTS = Object.keys(EVENT_LABELS) as FunnelStageEvent[];

const formatCount = (value: number) => new Intl.NumberFormat('en-PK').format(value);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const asISOString = (value?: string) => value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;

const AnalyticsFunnelPage: React.FC = () => {
  const [range, setRange] = useState<DateRange | null>(null);
  const [stages, setStages] = useState<AdminFunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await AdminAnalytics.getFunnel({ from: asISOString(range?.start), to: asISOString(range?.end) });
    if (!response.ok) {
      setError((response.body as { message?: string }).message || 'Could not load the customer funnel.');
    } else {
      setStages(Array.isArray(response.body.stages) ? response.body.stages : []);
    }
    setIsLoading(false);
  }, [range?.end, range?.start]);

  useEffect(() => { void load(); }, [load]);

  const funnel = useMemo(() => FUNNEL_EVENTS.map((event) => stages.find((stage) => stage.event === event) || { event, count: 0, conversion: 0 }), [stages]);
  const weakestStage = useMemo(() => funnel.slice(1).reduce<AdminFunnelStage | null>((lowest, stage) => !lowest || stage.conversion < lowest.conversion ? stage : lowest, null), [funnel]);

  return (
    <VStack gap={6}>
      <HStack gap={3} wrap="wrap" hAlign="between" vAlign="end">
        <VStack gap={1}>
          <Heading level={2}>Customer funnel</Heading>
          <Text type="supporting">Customer actions only. Purchases are recorded by Commerce after a successful order.</Text>
        </VStack>
        <HStack gap={2} wrap="wrap" vAlign="end">
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
    </VStack>
  );
};

export default AnalyticsFunnelPage;
