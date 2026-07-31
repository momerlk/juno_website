import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Lightbulb, Maximize2, RotateCcw } from 'lucide-react';

type Group = 'prepare' | 'pack';

type Step = {
  title: string;
  instruction: string;
  group: Group;
  /** Where the seller does this: portal screen or physical task. */
  where: string;
  image?: string;
  imageKind?: 'screenshot' | 'example';
  tip?: string;
  warning?: string;
};

const groups: Record<Group, { label: string; summary: string }> = {
  prepare: { label: '1 · Before you pack', summary: 'Find the confirmed order and print its airway bill.' },
  pack: { label: '2 · Pack & prove it', summary: 'Photograph every item and the sealed parcel, upload, mark packed.' },
};

const steps: Step[] = [
  {
    group: 'prepare',
    where: 'Juno Studio → Orders',
    title: 'Find confirmed orders',
    instruction: 'Open Orders in Juno Studio. Only orders marked Confirmed are ready for you to pack.',
    image: '/images/seller_steps/seller_step1.png',
    imageKind: 'screenshot',
    tip: 'Nothing to pack? The order is still being address-verified by Juno. It appears here once confirmed.',
  },
  {
    group: 'prepare',
    where: 'Juno Studio → Orders',
    title: 'Open the order dropdown',
    instruction: 'Select the dropdown on the confirmed order to see its items and the packing controls.',
    image: '/images/seller_steps/seller_step2.png',
    imageKind: 'screenshot',
  },
  {
    group: 'prepare',
    where: 'Juno Studio → Orders',
    title: 'Download the airway bill',
    instruction: 'Select Download airway bill and save the file before you prepare the parcel.',
    image: '/images/seller_steps/seller_step3.png',
    imageKind: 'screenshot',
    warning: 'One airway bill belongs to one parcel. Never reuse or swap labels between orders.',
  },
  {
    group: 'pack',
    where: 'At your packing table',
    title: 'Photograph every item',
    instruction: 'Take a clear photo of each item before it goes into the flyer or box, like the example.',
    image: '/images/seller_steps/packed_product_example_photo.jpg',
    imageKind: 'example',
    tip: 'Good light, plain surface, whole product in frame. This photo is your proof if a customer disputes what was sent.',
  },
  {
    group: 'pack',
    where: 'Juno Studio → Orders',
    title: 'Upload each item photo',
    instruction: 'Upload each photo under its matching order item. Every item needs its own photo.',
    image: '/images/seller_steps/seller_step4.png',
    imageKind: 'screenshot',
  },
  {
    group: 'pack',
    where: 'At your packing table',
    title: 'Photograph the sealed parcel',
    instruction: 'Paste the airway bill on the parcel, seal it, then take one clear photo of the full parcel.',
    image: '/images/seller_steps/packed_parcel_example_photo.jpg',
    imageKind: 'example',
    tip: 'The tracking number on the label must be readable in the photo.',
  },
  {
    group: 'pack',
    where: 'Juno Studio → Orders',
    title: 'Upload and mark packed',
    instruction: 'Upload the parcel photo, check every item photo is there, then select Mark packed.',
    image: '/images/seller_steps/seller_step7.png',
    imageKind: 'screenshot',
    warning: 'Juno reviews this evidence before release. Missing or blurry photos send the order back to you and delay pickup.',
  },
];

const STORAGE_KEY = 'juno.sellerGuide.done';

const readDone = (): number[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
};

const OrderProcessingGuide: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState<number[]>(readDone);

  const step = steps[stepIndex];
  const isDone = done.includes(stepIndex);
  const progress = Math.round((done.length / steps.length) * 100);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      /* storage unavailable: progress is simply not remembered */
    }
  }, [done]);

  const go = useCallback((next: number) => {
    setStepIndex(Math.min(steps.length - 1, Math.max(0, next)));
  }, []);

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

  const toggleDone = () => {
    setDone((current) => (current.includes(stepIndex) ? current.filter((index) => index !== stepIndex) : [...current, stepIndex]));
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Juno Studio playbook</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-white">Pack every order right</h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Seven steps from a confirmed order to packing-ready evidence. Use ← and → to move between steps.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="min-w-40 flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{done.length} of {steps.length} done</span>
        <button
          type="button"
          onClick={() => setDone([])}
          disabled={done.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:bg-white/10 disabled:opacity-35"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Packing steps" className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          {(Object.keys(groups) as Group[]).map((groupId) => {
            const items = steps.map((item, index) => ({ item, index })).filter(({ item }) => item.group === groupId);
            const completed = items.filter(({ index }) => done.includes(index)).length;
            return (
              <div key={groupId}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/80">{groups[groupId].label}</p>
                  <span className="text-[11px] font-semibold text-white/40">{completed}/{items.length}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{groups[groupId].summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {items.map(({ item, index }) => (
                    <li key={item.title}>
                      <button
                        type="button"
                        onClick={() => go(index)}
                        aria-current={index === stepIndex ? 'step' : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          index === stepIndex
                            ? 'border-primary/60 bg-primary/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                            done.includes(index) ? 'bg-primary text-white' : 'border border-white/20 text-white/60'
                          }`}
                        >
                          {done.includes(index) ? <Check size={13} /> : index + 1}
                        </span>
                        <span className="text-sm font-semibold leading-5">{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#171112] shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-3">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-primary">Step {stepIndex + 1} / {steps.length}</span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-white/60">{step.where}</span>
          </div>

          <div className="space-y-5 p-5 md:p-7">
            <div>
              <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{step.title}</h3>
              <p className="mt-3 text-base leading-7 text-neutral-300">{step.instruction}</p>
            </div>

            {step.warning && (
              <p className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6 text-white/85">
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-primary" /> {step.warning}
              </p>
            )}

            {step.tip && (
              <p className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-neutral-300">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-white/50" /> {step.tip}
              </p>
            )}

            {step.image && (
              <a
                href={step.image}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-black/30"
              >
                <img
                  src={step.image}
                  loading="lazy"
                  alt={`${step.imageKind === 'example' ? 'Example photo' : 'Screenshot'} for step ${stepIndex + 1}: ${step.title}`}
                  className="max-h-[420px] w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                />
                <span className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs font-semibold text-white/50">
                  {step.imageKind === 'example' ? 'Example of an acceptable photo' : 'What this looks like in Juno Studio'}
                  <Maximize2 size={13} />
                </span>
              </a>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => go(stepIndex - 1)}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft size={16} /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleDone}
                  aria-pressed={isDone}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                    isDone ? 'border-primary bg-primary/20 text-white' : 'border-white/15 text-white/75 hover:bg-white/10'
                  }`}
                >
                  <Check size={16} /> {isDone ? 'Done' : 'Mark done'}
                </button>
                <button
                  type="button"
                  onClick={() => go(stepIndex === steps.length - 1 ? 0 : stepIndex + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-sm font-black text-white transition hover:brightness-110"
                >
                  {stepIndex === steps.length - 1 ? 'Start again' : 'Next step'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default OrderProcessingGuide;
