import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, Ruler, Sparkles, X } from 'lucide-react';
import { Sizing, type ProductSizing, type SizeChartRow, type SizeChartSection, type SizeRecommendation, type SizingQuestion } from '../../api/api';

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

const titleCase = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const rowSize = (row: SizeChartRow) => String(row.size ?? row.label ?? row.Size ?? row.size_label ?? '—');
const formatHeight = (inches: number) => `${Math.floor(inches / 12)}′${inches % 12}″${inches === 72 ? '+' : ''}`;

const rowMeasurements = (row: SizeChartRow): Record<string, unknown> =>
    (row.measurements as Record<string, unknown> | undefined) ??
    (row.values as Record<string, unknown> | undefined) ??
    row;

const displayMeasurement = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value !== 'object') return String(value);
    const record = value as Record<string, unknown>;
    if (record.min !== undefined || record.max !== undefined) {
        const range = [record.min, record.max].filter((item) => item !== undefined && item !== null);
        return range.length === 2 && String(range[0]) === String(range[1]) ? String(range[0]) : range.join('–');
    }
    if (record.value !== undefined) return displayMeasurement(record.value);
    return Object.entries(record)
        .filter(([key]) => !['unit', 'min', 'max'].includes(key))
        .map(([key, item]) => `${titleCase(key)}: ${displayMeasurement(item)}`)
        .join(' · ') || '—';
};

const questionOptions = (question: SizingQuestion) =>
    (question.options ?? []).map((option) => typeof option === 'string'
        ? { value: option, label: titleCase(option) }
        : { value: option.value ?? option.label ?? '', label: option.label ?? titleCase(option.value ?? '') }
    ).filter((option) => option.value);

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
    isOpen, onClose, productId, sizing, sourceGuide, selectedSize, onSelectSize,
}) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [measurements, setMeasurements] = useState<Record<string, string>>({});
    const [quizStep, setQuizStep] = useState(0);
    const [view, setView] = useState<'quiz' | 'chart'>('quiz');
    const [isRecommending, setIsRecommending] = useState(false);
    const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const sourceTable = useMemo(() => sanitizeSizeTable(sourceGuide?.html_table), [sourceGuide?.html_table]);
    const hasNormalizedChart = sizing?.availability === 'normalized';
    const hasOriginalSource = Boolean(sourceGuide?.image_url || sourceTable);
    const quiz = sizing?.quiz ?? sizing?.questionnaire ?? null;

    const section = useMemo<SizeChartSection | null>(() => {
        const nestedSections = sizing?.chart?.chart?.sections;
        return sizing?.section ?? sizing?.selected_section ?? sizing?.chart?.sections?.[0] ?? nestedSections?.[0] ?? sizing?.size_chart?.sections?.[0] ?? null;
    }, [sizing]);
    const rows = useMemo(() => Array.isArray(section?.rows) ? section.rows : [], [section]);
    const columns = useMemo(() => {
        const declared = section?.columns ?? section?.measurements ?? [];
        if (declared.length) return declared.filter((column) => !['size', 'label', 'values', 'measurements'].includes(column.toLowerCase()));
        const keys = new Set<string>();
        rows.forEach((row) => Object.keys(rowMeasurements(row)).forEach((key) => {
            if (!['size', 'label', 'Size', 'size_label', 'measurements', 'values'].includes(key)) keys.add(key);
        }));
        return [...keys];
    }, [rows, section?.columns, section?.measurements]);
    const quizQuestions = useMemo(() => Array.isArray(quiz?.questions) ? quiz.questions : [], [quiz?.questions]);
    const currentQuestion = quizQuestions[quizStep];
    const hasQuiz = hasNormalizedChart && quizQuestions.length > 0;
    const rawMeasurementUnit = String(quiz?.measurement_unit ?? section?.unit ?? '').trim().toLowerCase();
    const measurementUnit = rawMeasurementUnit === 'cm' || rawMeasurementUnit === 'centimetres' || rawMeasurementUnit === 'centimeters'
        ? 'cm'
        : ['in', 'inch', 'inches'].includes(rawMeasurementUnit) ? 'inches' : undefined;
    const questionIsHeight = currentQuestion?.id === 'height_inches';
    const questionIsMeasurement = currentQuestion?.type === 'number' && !questionIsHeight;
    const currentValue = currentQuestion
        ? questionIsMeasurement ? measurements[currentQuestion.id] ?? '' : answers[currentQuestion.id] ?? ''
        : '';
    const illustrationGender = answers.gender || Object.keys(currentQuestion?.illustrations ?? {})[0];
    const illustration = illustrationGender ? currentQuestion?.illustrations?.[illustrationGender] : undefined;

    useEffect(() => {
        if (!isOpen) return undefined;
        setAnswers({
            ...(selectedSize ? { usual_size: selectedSize } : {}),
            ...(quizQuestions.some((question) => question.id === 'height_inches') ? { height_inches: '60' } : {}),
        });
        setMeasurements({});
        setQuizStep(0);
        setView(hasQuiz ? 'quiz' : 'chart');
        setRecommendation(null);
        setError(null);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [hasQuiz, isOpen, onClose, productId, quizQuestions, selectedSize]);

    const updateCurrentAnswer = (value: string) => {
        if (!currentQuestion) return;
        setError(null);
        setRecommendation(null);
        if (questionIsMeasurement) setMeasurements((current) => ({ ...current, [currentQuestion.id]: value }));
        else setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));
    };

    const recommend = async () => {
        const parsedMeasurements = Object.fromEntries(
            Object.entries(measurements)
                .map(([key, value]) => [key, Number(value)])
                .filter(([, value]) => Number.isFinite(value) && value > 0)
        );
        setIsRecommending(true);
        setError(null);
        try {
            const response = await Sizing.recommend(productId, {
                answers,
                measurements: parsedMeasurements,
                ...(measurementUnit ? { measurement_unit: measurementUnit } : {}),
            });
            if (!response.ok) {
                setError((response.body as { message?: string }).message ?? 'We could not find a fit just now.');
                return;
            }
            setRecommendation(response.body);
        } catch {
            setError('We could not find a fit just now.');
        } finally {
            setIsRecommending(false);
        }
    };

    const continueQuiz = () => {
        if (!currentQuestion) return;
        if (!currentQuestion.optional && !currentValue) {
            setError('Choose an option to continue.');
            return;
        }
        if (quizStep === quizQuestions.length - 1) void recommend();
        else setQuizStep((step) => step + 1);
    };

    if (!isOpen || (!hasNormalizedChart && !hasOriginalSource)) return null;

    const alternativeSize = recommendation?.alternative?.size ?? recommendation?.alternative_size;

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="size-fit-title">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }} className="relative z-10 h-[100dvh] max-h-[100dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-none border border-white/10 bg-[#0A0A0A] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem] sm:p-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 text-primary"><Ruler size={16} /><span className="text-[10px] font-black uppercase tracking-[0.22em]">Size & fit</span></div>
                        <h2 id="size-fit-title" className="text-2xl font-black uppercase tracking-[-0.04em] text-white">{hasNormalizedChart ? 'Find your size' : 'Size guide'}</h2>
                        {hasNormalizedChart && (section?.label || section?.name || section?.title) ? <p className="mt-1 text-sm text-white/50">{section.label ?? section.name ?? section.title}{quiz?.profile ? ` · ${titleCase(quiz.profile)}` : ''}</p> : null}
                    </div>
                    <button onClick={onClose} aria-label="Close size guide" className="rounded-full border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"><X size={20} /></button>
                </div>

                {!hasNormalizedChart ? <div className="space-y-4">
                    {sourceGuide?.image_url ? <img src={sourceGuide.image_url} alt="Brand size guide" className="w-full rounded-2xl border border-white/10 bg-white" /> : null}
                    {sourceTable ? <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white p-4 text-black [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black/15 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-black/15 [&_th]:bg-black/[0.04] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left" dangerouslySetInnerHTML={{ __html: sourceTable }} /> : null}
                </div> : <>
                    <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                        <button onClick={() => setView('quiz')} disabled={!hasQuiz} className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-25 ${view === 'quiz' ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Size quiz</button>
                        <button onClick={() => setView('chart')} disabled={!rows.length} className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-25 ${view === 'chart' ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Size chart</button>
                    </div>

                    {view === 'chart' ? <div className="overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full min-w-[420px] text-left text-sm"><thead className="bg-white/[0.05]"><tr><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Size</th>{columns.map((column) => <th key={column} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{titleCase(column)}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{rows.map((row, index) => { const size = rowSize(row); const values = rowMeasurements(row); return <tr key={`${size}-${index}`} className={size === selectedSize ? 'bg-primary/10' : ''}><td className="px-4 py-3"><button onClick={() => { onSelectSize(size); onClose(); }} className="font-black text-white hover:text-primary">{size}</button></td>{columns.map((column) => <td key={column} className="px-4 py-3 text-white/70">{displayMeasurement(values[column] ?? values[column.toLowerCase()])}</td>)}</tr>; })}</tbody></table>
                    </div> : <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 to-secondary/10 p-4 sm:p-5 md:p-6">
                        <div className="mb-5 flex items-center justify-between gap-4"><div className="flex items-center gap-2"><Sparkles size={17} className="text-primary" /><h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">Size quiz</h3></div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Step {quizStep + 1} of {quizQuestions.length}</span></div>
                        <div className="mb-7 flex gap-1.5">{quizQuestions.map((question, index) => <span key={question.id} className={`h-1 flex-1 rounded-full ${index <= quizStep ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/10'}`} />)}</div>
                        {currentQuestion ? <AnimatePresence mode="wait"><motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }}>
                            <p className="text-xl font-black tracking-[-0.04em] text-white">{currentQuestion.label}</p>
                            {currentQuestion.optional ? <p className="mt-2 text-sm text-white/45">Optional — skip if you’re not sure.</p> : null}
                            {illustration ? <picture className="-mx-4 mt-5 block overflow-hidden border-y border-white/10 bg-white sm:mx-0 sm:rounded-2xl sm:border"><source media="(prefers-color-scheme: light)" srcSet={illustration.light_url} /><img src={illustration.dark_url} alt="Body type options" className="block h-auto max-h-[38dvh] w-full object-contain sm:max-h-[420px]" /></picture> : null}
                            {questionIsHeight ? <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-5"><output className="block text-center text-3xl font-black tracking-[-0.05em] text-white">{formatHeight(Number(currentValue) || 60)}</output><input aria-label="Height" type="range" min="48" max="72" step="1" value={Number(currentValue) || 60} onChange={(event) => updateCurrentAnswer(event.target.value)} className="mt-6 w-full accent-primary" /><div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/45"><span>4′0″</span><span>5′0″</span><span>6′0″+</span></div></div> : questionIsMeasurement ? <input autoFocus inputMode="decimal" type="number" min="1" step="0.1" value={currentValue} onChange={(event) => updateCurrentAnswer(event.target.value)} className="mt-5 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-4 text-lg font-black text-white outline-none transition focus:border-primary/70" placeholder={`Enter ${currentQuestion.unit ?? quiz?.measurement_unit ?? 'measurement'}`} /> : <div className={`mt-5 grid gap-2 ${illustration ? 'grid-cols-3' : 'grid-cols-2'}`}>{questionOptions(currentQuestion).map((option) => <button key={option.value} onClick={() => updateCurrentAnswer(option.value)} className={`min-h-12 rounded-xl px-3 py-3 text-sm font-bold transition ${currentValue === option.value ? 'bg-white text-black' : 'border border-white/10 bg-black/25 text-white/65 hover:border-white/30 hover:text-white'}`}>{option.label}</button>)}</div>}
                        </motion.div></AnimatePresence> : <p className="text-sm text-white/50">This product has no quiz questions yet. Use the size chart instead.</p>}
                        <div className="mt-7 flex gap-3"><button onClick={() => setQuizStep((step) => Math.max(0, step - 1))} disabled={quizStep === 0 || isRecommending} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-white/65 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"><ArrowLeft size={14} /> Back</button><button onClick={continueQuiz} disabled={isRecommending || !currentQuestion} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:brightness-110 disabled:opacity-60">{isRecommending ? <Loader2 size={15} className="animate-spin" /> : quizStep === quizQuestions.length - 1 ? <Sparkles size={15} /> : <ArrowRight size={15} />}{isRecommending ? 'Finding your fit...' : quizStep === quizQuestions.length - 1 ? 'Find my size' : 'Continue'}</button></div>
                        <div aria-live="polite">{error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}<AnimatePresence>{recommendation ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-black"><Check size={17} strokeWidth={3} /></span><div><p className="text-sm text-white/85">We recommend <strong className="text-lg text-white">{recommendation.recommended_size}</strong></p></div></div>{recommendation.reason ? <p className="mt-3 text-xs text-white/60">{recommendation.reason}</p> : null}{alternativeSize ? <p className="mt-2 text-xs text-white/50">Alternative: {alternativeSize}{recommendation.alternative?.reason ? ` · ${recommendation.alternative.reason}` : ''}</p> : null}{recommendation.warnings?.map((warning) => <p key={warning} className="mt-2 text-xs text-amber-200">{warning}</p>)}<button onClick={() => { onSelectSize(recommendation.recommended_size); onClose(); }} className="mt-3 w-full rounded-lg bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-black">Use size {recommendation.recommended_size}</button></motion.div> : null}</AnimatePresence></div>
                    </div>}
                </>}
            </motion.div>
        </div>
    );
};

export default SizeGuideModal;
