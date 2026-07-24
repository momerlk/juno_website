import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, Ruler, Sparkles, X } from 'lucide-react';
import { Sizing, type ProductSizing, type SizeChartRow, type SizeChartSection, type SizeRecommendation } from '../../api/api';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    sizing: ProductSizing | null;
    sourceGuide?: { image_url?: string; html_table?: string } | null;
    selectedSize?: string;
    onSelectSize: (size: string) => void;
}

const ALLOWED_TABLE_TAGS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col', 'br', 'span']);
const ALLOWED_TABLE_ATTRIBUTES = new Set(['class', 'id', 'colspan', 'rowspan', 'scope']);

const sanitizeSizeTable = (html?: string): string => {
    if (!html || typeof DOMParser === 'undefined') return '';
    const document = new DOMParser().parseFromString(html, 'text/html');
    document.body.querySelectorAll('*').forEach((element) => {
        if (!ALLOWED_TABLE_TAGS.has(element.tagName.toLowerCase())) {
            element.replaceWith(...Array.from(element.childNodes));
            return;
        }
        Array.from(element.attributes).forEach((attribute) => {
            if (!ALLOWED_TABLE_ATTRIBUTES.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name);
        });
    });
    return document.body.innerHTML;
};

const titleCase = (value: string) => value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const rowSize = (row: SizeChartRow) => String(row.size ?? row.label ?? row['Size'] ?? row['size_label'] ?? '—');

const rowMeasurements = (row: SizeChartRow): Record<string, unknown> => {
    const measurements = row.measurements as Record<string, unknown> | undefined;
    const values = row.values as Record<string, unknown> | undefined;
    // The normalized API may wrap a row's actual dimensions in either
    // `measurements` or `values`; neither wrapper is a customer-facing column.
    return measurements ?? values ?? row;
};

const displayMeasurement = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value !== 'object') return String(value);

    const record = value as Record<string, unknown>;
    if (record.min !== undefined || record.max !== undefined) {
        const range = [record.min, record.max].filter((item) => item !== undefined && item !== null);
        return range.length === 2 && String(range[0]) === String(range[1]) ? String(range[0]) : range.join('–');
    }
    if (record.value !== undefined) return displayMeasurement(record.value);
    if (record.label !== undefined) return displayMeasurement(record.label);

    return Object.entries(record)
        .filter(([key]) => !['unit', 'min', 'max'].includes(key))
        .map(([key, item]) => `${titleCase(key)}: ${displayMeasurement(item)}`)
        .join(' · ') || '—';
};

const getQuestionKey = (question: Record<string, unknown>) =>
    String(question.key ?? question.id ?? question.name ?? '');

const getQuestionLabel = (question: Record<string, unknown>) =>
    String(question.label ?? question.question ?? question.name ?? titleCase(getQuestionKey(question)));

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
    isOpen,
    onClose,
    productId,
    sizing,
    sourceGuide,
    selectedSize,
    onSelectSize,
}) => {
    const [usualSize, setUsualSize] = useState(selectedSize ?? '');
    const [fit, setFit] = useState<'fitted' | 'regular' | 'relaxed'>('regular');
    const [measurements, setMeasurements] = useState<Record<string, string>>({});
    const [isRecommending, setIsRecommending] = useState(false);
    const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
    const [recommendationError, setRecommendationError] = useState<string | null>(null);
    const [view, setView] = useState<'quiz' | 'chart'>('quiz');
    const sourceTable = useMemo(() => sanitizeSizeTable(sourceGuide?.html_table), [sourceGuide?.html_table]);
    const hasOriginalSource = Boolean(sourceGuide?.image_url || sourceTable);
    const hasNormalizedChart = sizing?.availability === 'normalized';

    const section = useMemo<SizeChartSection | null>(() => {
        if (!sizing) return null;
        return sizing.section ?? sizing.selected_section ?? sizing.chart?.sections?.[0] ?? sizing.size_chart?.sections?.[0] ?? null;
    }, [sizing]);

    const rows = useMemo(() => Array.isArray(section?.rows) ? section.rows : [], [section]);
    const columns = useMemo(() => {
        const declaredColumns = Array.isArray(section?.columns)
            ? section.columns.filter((column) => !['size', 'label', 'values', 'measurements'].includes(column.toLowerCase()))
            : [];
        if (declaredColumns.length) return declaredColumns;
        const keys = new Set<string>();
        rows.forEach((row) => Object.keys(rowMeasurements(row)).forEach((key) => {
            if (!['size', 'label', 'Size', 'size_label', 'measurements', 'values'].includes(key)) keys.add(key);
        }));
        return [...keys];
    }, [rows, section?.columns]);
    const sizes = useMemo(() => {
        const fromVariants = (sizing?.variants ?? []).map((variant) =>
            Object.entries(variant.options ?? {}).find(([key]) => key.toLowerCase().includes('size'))?.[1] ?? variant.title
        );
        return [...new Set(fromVariants.filter(Boolean).concat(rows.map(rowSize).filter((size) => size !== '—')))];
    }, [rows, sizing?.variants]);
    const measurementQuestions = useMemo(() =>
        (sizing?.questionnaire?.questions ?? []).filter((question) => {
            const key = getQuestionKey(question).toLowerCase();
            return key && !['usual_size', 'fit'].includes(key);
        }), [sizing?.questionnaire?.questions]);

    const resetRecommendation = () => {
        setRecommendation(null);
        setRecommendationError(null);
    };

    useEffect(() => {
        if (!isOpen) return undefined;
        setUsualSize(selectedSize ?? '');
        setFit('regular');
        setMeasurements({});
        setRecommendation(null);
        setRecommendationError(null);
        setView('quiz');
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose, productId, selectedSize]);

    const handleRecommend = async () => {
        resetRecommendation();
        const parsedMeasurements = Object.fromEntries(
            Object.entries(measurements)
                .map(([key, value]) => [key, Number(value)])
                .filter(([, value]) => Number.isFinite(value) && value > 0)
        );
        if (!usualSize && Object.keys(parsedMeasurements).length === 0) {
            setRecommendationError('Choose your usual size or add a measurement.');
            return;
        }
        setIsRecommending(true);

        try {
            const response = await Sizing.recommend(productId, {
                usual_size: usualSize || undefined,
                fit,
                measurements: parsedMeasurements,
            });
            if (!response.ok) {
                setRecommendationError((response.body as { message?: string }).message ?? 'We could not find a fit just now.');
                return;
            }
            setRecommendation(response.body);
        } catch {
            setRecommendationError('We could not find a fit just now.');
        } finally {
            setIsRecommending(false);
        }
    };

    if (!isOpen || (!hasNormalizedChart && !hasOriginalSource)) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="size-fit-title">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }}
                className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0A0A0A] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:rounded-[2rem] md:p-8"
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 text-primary"><Ruler size={16} /><span className="text-[10px] font-black uppercase tracking-[0.22em]">Size & fit</span></div>
                        <h2 id="size-fit-title" className="text-2xl font-black uppercase tracking-[-0.04em] text-white">{hasNormalizedChart ? 'Find your size' : 'Size guide'}</h2>
                        {hasNormalizedChart && (section?.name || section?.title) ? <p className="mt-1 text-sm text-white/50">{section.name ?? section.title}{section?.unit ? ` · ${section.unit}` : ''}</p> : null}
                    </div>
                    <button onClick={onClose} aria-label="Close size guide" className="rounded-full border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"><X size={20} /></button>
                </div>

                {!hasNormalizedChart ? (
                    <div className="space-y-4">
                        {sourceGuide?.image_url ? <img src={sourceGuide.image_url} alt="Brand size guide" className="w-full rounded-2xl border border-white/10 bg-white" /> : null}
                        {sourceTable ? <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white p-4 text-black [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black/15 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-black/15 [&_th]:bg-black/[0.04] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left" dangerouslySetInnerHTML={{ __html: sourceTable }} /> : null}
                        <p className="text-center text-[11px] leading-5 text-white/40">This brand’s original size guide is shown here.</p>
                    </div>
                ) : <>
                <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button onClick={() => setView('quiz')} className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition ${view === 'quiz' ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Size quiz</button>
                    <button onClick={() => setView('chart')} disabled={!rows.length} className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-25 ${view === 'chart' ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Size chart</button>
                </div>

                {view === 'quiz' ? <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 to-secondary/10 p-5 md:p-6">
                    <div className="mb-5 flex items-center gap-2"><Sparkles size={17} className="text-primary" /><h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">Find my fit</h3></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Your usual size
                            <select value={usualSize} onChange={(event) => { setUsualSize(event.target.value); resetRecommendation(); }} className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition focus:border-primary/70">
                                <option value="">Select size</option>{sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </label>
                        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">How do you like it?</p><div className="mt-2 grid grid-cols-3 gap-1.5">{(['fitted', 'regular', 'relaxed'] as const).map((option) => <button key={option} onClick={() => { setFit(option); resetRecommendation(); }} className={`rounded-xl px-2 py-3 text-[10px] font-black uppercase tracking-wide transition ${fit === option ? 'bg-white text-black' : 'border border-white/10 bg-black/25 text-white/60 hover:text-white'}`}>{option}</button>)}</div></div>
                        {measurementQuestions.map((question) => { const key = getQuestionKey(question); return <label key={key} className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/55">{getQuestionLabel(question)} <span className="text-white/35">({section?.unit ?? 'in'})</span><input inputMode="decimal" type="number" min="1" step="0.1" value={measurements[key] ?? ''} onChange={(event) => { setMeasurements((current) => ({ ...current, [key]: event.target.value })); resetRecommendation(); }} className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm font-bold normal-case tracking-normal text-white outline-none transition focus:border-primary/70" /></label>; })}
                    </div>
                    <button onClick={handleRecommend} disabled={isRecommending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:brightness-110 disabled:opacity-60">{isRecommending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{isRecommending ? 'Finding your fit...' : 'Recommend my size'}</button>
                    <div aria-live="polite"><AnimatePresence>{recommendation ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-black"><Check size={17} strokeWidth={3} /></span><p className="text-sm text-white/85">We recommend <strong className="text-lg text-white">{recommendation.recommended_size}</strong>{recommendation.alternative_size ? <span className="block text-xs text-white/50">Alternative: {recommendation.alternative_size}</span> : null}</p></div><button onClick={() => { onSelectSize(recommendation.recommended_size); onClose(); }} className="mt-3 w-full rounded-lg bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-black">Use size {recommendation.recommended_size}</button></motion.div> : null}</AnimatePresence>
                    {recommendationError ? <p className="mt-3 text-sm text-red-300">{recommendationError}</p> : null}</div>
                    <p className="mt-4 text-center text-[11px] leading-5 text-white/40">Based on this brand’s approved chart and available sizes.</p>
                </div> : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full min-w-[420px] text-left text-sm">
                            <thead className="bg-white/[0.05]"><tr><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Size</th>{columns.map((column) => <th key={column} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{titleCase(column)}</th>)}</tr></thead>
                            <tbody className="divide-y divide-white/[0.06]">{rows.map((row, index) => {
                                const size = rowSize(row); const values = rowMeasurements(row); const isSelected = size === selectedSize;
                                return <tr key={`${size}-${index}`} className={isSelected ? 'bg-primary/10' : ''}><td className="px-4 py-3"><button onClick={() => { onSelectSize(size); onClose(); }} className="font-black text-white hover:text-primary">{size}</button></td>{columns.map((column) => <td key={column} className="px-4 py-3 text-white/70">{displayMeasurement(values[column] ?? values[column.toLowerCase()])}</td>)}</tr>;
                            })}</tbody>
                        </table>
                    </div>
                )}</>}
            </motion.div>
        </div>
    );
};

export default SizeGuideModal;
