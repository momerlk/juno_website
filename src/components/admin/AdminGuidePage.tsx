import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Lightbulb, Maximize2, RotateCcw } from 'lucide-react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Item } from '@astryxdesign/core/Item';
import { Layout, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { Lightbox } from '@astryxdesign/core/Lightbox';
import { List } from '@astryxdesign/core/List';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';

type GuideKind = 'processing' | 'support';

type PhaseId = 'address' | 'booking' | 'fulfilment';

type Step = {
  title: string;
  instruction: string;
  phase: PhaseId;
  /** Where the work happens, so staff know which tab to be in. */
  where: string;
  image?: string;
  tip?: string;
  warning?: string;
};

const phases: Record<PhaseId, { label: string; summary: string; color: 'blue' | 'purple' | 'green' }> = {
  address: { label: 'Address confirmation', summary: 'Confirm where the parcel is actually going before anything is booked.', color: 'blue' },
  booking: { label: 'DEX booking', summary: 'Turn the confirmed order into a booked DEX shipment with a tracking number.', color: 'purple' },
  fulfilment: { label: 'Fulfilment & QC', summary: 'Hand the order to the brand, then check its packing evidence before release.', color: 'green' },
};

const processingSteps: Step[] = [
  { phase: 'address', where: 'Juno admin', title: 'Open the seller order', instruction: 'A customer places an order. Go to Admin → Orders and open that seller order.', tip: 'One checkout can split into several seller orders. Each one is booked and tracked separately.' },
  { phase: 'address', where: 'Juno admin', title: 'Copy the address-review prompt', instruction: 'In Order details → Address review, select Copy address review prompt.', image: '/images/admin_steps/step2.png' },
  { phase: 'address', where: 'ChatGPT', title: 'Generate the customer message', instruction: 'Paste the prompt into ChatGPT to write the confirmation message for the customer.' },
  { phase: 'address', where: 'WhatsApp', title: 'Ask for the corrected address', instruction: 'Send the generated message to the customer and wait for the full address details.' },
  { phase: 'address', where: 'Juno admin', title: 'Save the reviewed address', instruction: 'Enter the formatted address in Address review and select Save review.' },
  { phase: 'address', where: 'Juno admin', title: 'Record the customer confirmation', instruction: 'Only after the customer approves the final address, select Save customer confirmed address.', warning: 'Never save a confirmed address the customer has not agreed to in writing.' },
  { phase: 'booking', where: 'Juno admin', title: 'Copy the DEX booking row', instruction: 'In Manual DEX booking, select Copy booking row.', image: '/images/admin_steps/step7.png' },
  { phase: 'booking', where: 'Excel', title: 'Open the DEX bulk workbook', instruction: 'Open Microsoft Excel with the official DEX bulk-booking template loaded.' },
  { phase: 'booking', where: 'Excel', title: 'Paste the booking row', instruction: 'Paste the copied order row into the next empty row of the workbook.' },
  { phase: 'booking', where: 'Excel', title: 'Select the sender address', instruction: 'Choose the correct sender address from the workbook dropdown.' },
  { phase: 'booking', where: 'Excel', title: 'Select the province', instruction: 'Choose the recipient province from the workbook dropdown.' },
  { phase: 'booking', where: 'Excel', title: 'Review and download', instruction: 'Check every field, then download the completed spreadsheet.', image: '/images/admin_steps/step12.png', tip: 'A wrong province or sender address means a failed pickup, so read the row once more before downloading.' },
  { phase: 'booking', where: 'DEX portal', title: 'Create a DEX batch', instruction: 'In the Daraz Express portal, select Batch create orders.', image: '/images/admin_steps/step13.png' },
  { phase: 'booking', where: 'DEX portal', title: 'Upload the spreadsheet', instruction: 'Upload the completed DEX spreadsheet to create the shipment batch.' },
  { phase: 'booking', where: 'DEX portal', title: 'Copy the tracking number', instruction: 'Copy the DEX tracking number returned for this order.' },
  { phase: 'booking', where: 'DEX portal', title: 'Download the airway bill', instruction: 'Select Print in the DEX portal, download the airway bill, and save the file.', image: '/images/admin_steps/step16.png' },
  { phase: 'booking', where: 'Juno admin', title: 'Return to the Juno order', instruction: 'Open the same order again in Admin → Orders → Order details.' },
  { phase: 'booking', where: 'Juno admin', title: 'Save the DEX booking', instruction: 'Paste the tracking number, upload the saved airway bill, then select Save DEX booking.', image: '/images/admin_steps/step18.png' },
  { phase: 'fulfilment', where: 'Juno admin + WhatsApp', title: 'Confirm the order', instruction: 'Change the order status to Confirmed, then tell the brand in its WhatsApp group to process the order.', image: '/images/admin_steps/step19.png', tip: 'The seller only sees the order in Juno Studio once it is Confirmed.' },
  { phase: 'fulfilment', where: 'Email', title: 'Wait for the packing-ready email', instruction: 'Juno emails you when the seller marks the order packed and its evidence is ready.' },
  { phase: 'fulfilment', where: 'Juno admin', title: 'Review packing evidence', instruction: 'In Admin → Orders, open the order dropdown and inspect every product photo and the sealed-parcel photo.', image: '/images/admin_steps/step21.png', warning: 'Blurry, missing, or mismatched photos fail QC. Send it back to the brand instead of releasing it.' },
  { phase: 'fulfilment', where: 'DEX portal', title: 'Release the shipment', instruction: 'If the evidence passes QC, mark the order ready to ship in the DEX portal.', image: '/images/admin_steps/step22.png' },
];

const supportSteps: Step[] = [
  { phase: 'address', where: 'Juno admin', title: 'Use the seller order as source of truth', instruction: 'Admin → Orders is authoritative. One checkout can create separate seller orders, each with its own tracking number.' },
  { phase: 'address', where: 'Juno admin', title: 'Confirm addresses safely', instruction: 'Use Address review → Copy address review prompt. Only save Customer confirmed address after the customer agrees.' },
  { phase: 'fulfilment', where: 'Operations', title: 'Escalate exceptions', instruction: 'Escalate fraud, unsafe goods, lost parcels, delivery disputes, and bank issues to operations with the order number and the next action.' },
];

const storageKey = (guide: GuideKind) => `juno.adminGuide.${guide}.done`;

const readDone = (guide: GuideKind): number[] => {
  try {
    const raw = window.localStorage.getItem(storageKey(guide));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
};

const AdminGuidePage: React.FC<{ guide: GuideKind }> = ({ guide }) => {
  const steps = guide === 'processing' ? processingSteps : supportSteps;
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState<number[]>(() => readDone(guide));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const step = steps[stepIndex];
  const isDone = done.includes(stepIndex);
  const title = guide === 'processing' ? 'Order processing guide' : 'Customer support guide';

  useEffect(() => {
    setStepIndex(0);
    setDone(readDone(guide));
  }, [guide]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(guide), JSON.stringify(done));
    } catch {
      /* storage unavailable: progress is simply not remembered */
    }
  }, [done, guide]);

  const go = useCallback((next: number) => {
    setStepIndex(Math.min(steps.length - 1, Math.max(0, next)));
  }, [steps.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowRight') go(stepIndex + 1);
      if (event.key === 'ArrowLeft') go(stepIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, stepIndex]);

  // Lightbox shows every reference screenshot as one gallery, opened at the current step.
  const gallery = useMemo(
    () => steps
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.image)
      .map(({ item, index }) => ({ src: item.image as string, alt: `Step ${index + 1}: ${item.title}`, caption: `Step ${index + 1} · ${item.title}` })),
    [steps],
  );
  const galleryIndex = useMemo(
    () => gallery.findIndex((media) => media.src === step.image),
    [gallery, step.image],
  );

  const grouped = useMemo(() => {
    const order: PhaseId[] = ['address', 'booking', 'fulfilment'];
    return order
      .map((id) => ({ id, items: steps.map((item, index) => ({ item, index })).filter(({ item }) => item.phase === id) }))
      .filter((group) => group.items.length > 0);
  }, [steps]);

  const markDone = () => {
    setDone((current) => (current.includes(stepIndex) ? current.filter((index) => index !== stepIndex) : [...current, stepIndex]));
  };

  const rail = (
    <VStack gap={4}>
      {grouped.map((group) => {
        const phase = phases[group.id];
        const completed = group.items.filter(({ index }) => done.includes(index)).length;
        return (
          <VStack gap={1} key={group.id}>
            <HStack hAlign="between" vAlign="center" gap={2}>
              <Text size="sm" weight="bold">{phase.label}</Text>
              <Text size="xsm" color="secondary">{completed}/{group.items.length}</Text>
            </HStack>
            <List hasDividers density="compact">
              {group.items.map(({ item, index }) => (
                <Item
                  key={item.title}
                  as="li"
                  label={item.title}
                  labelLines={2}
                  density="compact"
                  isSelected={index === stepIndex}
                  onClick={() => go(index)}
                  marker={<Text size="xsm" color="secondary">{index + 1}</Text>}
                  endContent={done.includes(index) ? <Check size={14} /> : <StatusDot variant={index === stepIndex ? 'accent' : 'neutral'} label={index === stepIndex ? 'Current step' : 'Not started'} />}
                />
              ))}
            </List>
          </VStack>
        );
      })}
    </VStack>
  );

  const detail = (
    <VStack gap={4}>
      <HStack gap={2} vAlign="center" wrap="wrap">
        <Badge variant={phases[step.phase].color} label={phases[step.phase].label} />
        <Token size="sm" label={step.where} />
        <Text size="xsm" color="secondary">Step {stepIndex + 1} of {steps.length}</Text>
      </HStack>

      <VStack gap={2}>
        <Heading level={2}>{step.title}</Heading>
        <Text size="lg">{step.instruction}</Text>
      </VStack>

      {step.warning ? (
        <Card variant="red" padding={3}>
          <HStack gap={2} vAlign="start">
            <CircleAlert size={16} />
            <Text size="sm">{step.warning}</Text>
          </HStack>
        </Card>
      ) : null}

      {step.tip ? (
        <Card variant="muted" padding={3}>
          <HStack gap={2} vAlign="start">
            <Lightbulb size={16} />
            <Text size="sm">{step.tip}</Text>
          </HStack>
        </Card>
      ) : null}

      {step.image ? (
        <ClickableCard label={`Expand the screenshot for step ${stepIndex + 1}`} padding={0} variant="muted" onClick={() => setLightboxIndex(Math.max(0, galleryIndex))}>
          <VStack gap={0}>
            <img
              src={step.image}
              loading="lazy"
              alt={`Reference screenshot for step ${stepIndex + 1}: ${step.title}`}
              className="w-full max-h-[460px] object-contain rounded-t-lg bg-surface"
            />
            <HStack gap={1} vAlign="center" padding={2}>
              <Maximize2 size={14} />
              <Text size="xsm" color="secondary">Click to expand</Text>
            </HStack>
          </VStack>
        </ClickableCard>
      ) : (
        <Card variant="muted" padding={3}>
          <Text size="sm" color="secondary">No screenshot for this step. Complete the action in {step.where}, then continue.</Text>
        </Card>
      )}

      <HStack hAlign="between" gap={2} wrap="wrap">
        <Button label="Previous" variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => go(stepIndex - 1)} isDisabled={stepIndex === 0} />
        <HStack gap={2}>
          <Button label={isDone ? 'Done' : 'Mark done'} variant={isDone ? 'primary' : 'secondary'} icon={<Check size={16} />} onClick={markDone} />
          <Button
            label={stepIndex === steps.length - 1 ? 'Back to step 1' : 'Next step'}
            variant="primary"
            endContent={<ArrowRight size={16} />}
            onClick={() => (stepIndex === steps.length - 1 ? go(0) : go(stepIndex + 1))}
          />
        </HStack>
      </HStack>
    </VStack>
  );

  return (
    <VStack gap={5}>
      <VStack gap={2}>
        <Heading level={1}>{title}</Heading>
        <Text color="secondary">
          {guide === 'processing'
            ? `${steps.length} steps in three phases: confirm the address, book the DEX shipment, then QC the packing evidence. Use ← and → to move.`
            : 'A short operational reference for customer conversations.'}
        </Text>
      </VStack>

      <Card padding={3} variant="muted">
        <VStack gap={2}>
          <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
            <Text size="sm" weight="bold">{phases[step.phase].summary}</Text>
            <HStack gap={2} vAlign="center">
              <Text size="xsm" color="secondary">{done.length} of {steps.length} done</Text>
              <Button label="Reset" size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setDone([])} isDisabled={done.length === 0} />
            </HStack>
          </HStack>
          <ProgressBar label="Steps completed" value={done.length} max={steps.length} variant={done.length === steps.length ? 'success' : 'accent'} isLabelHidden />
        </VStack>
      </Card>

      <Layout
        height="auto"
        start={<LayoutPanel width={300} padding={0} isScrollable={false} hasDivider label="Steps">{rail}</LayoutPanel>}
        content={<LayoutContent padding={4}>{detail}</LayoutContent>}
      />

      {gallery.length > 0 ? (
        <Lightbox
          isOpen={lightboxIndex !== null}
          onOpenChange={(open) => setLightboxIndex(open ? (lightboxIndex ?? 0) : null)}
          media={gallery}
          index={lightboxIndex ?? 0}
          onIndexChange={setLightboxIndex}
          hasZoom
        />
      ) : null}
    </VStack>
  );
};

export default AdminGuidePage;
