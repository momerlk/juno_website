import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Ruler, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Sizing, type ProductSizing, type SizeChartRow, type SizeChartSection, type SizeRecommendation, type SizingQuestion } from '../../api/api';
import { getShopifySizedImage } from '../../utils/shopifyImage';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    sizing: ProductSizing | null;
    sourceGuide?: { image_url?: string; html_table?: string } | null;
    selectedSize?: string;
    /** Which tab the caller meant: the "Size chart" link must not open the quiz. */
    initialView?: 'quiz' | 'chart';
    /** Picking a size here is a purchase decision, not a preference: the parent
     *  selects the variant, adds it to the bag, and reports the funnel event. */
    onUseSize: (size: string, source: 'quiz' | 'chart') => void;
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
        // The API sends labels lower-cased ("sometimes smaller"); title-case them
        // so one question's answers do not read differently from the next.
        : { value: option.value ?? option.label ?? '', label: titleCase(option.label ?? option.value ?? '') }
    ).filter((option) => option.value);

// Size tokens want a tight row of chips; sentences want full-width rows.
const optionColumns = (labels: string[]) => {
    const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
    if (longest <= 4) return `repeat(${Math.min(labels.length, 5)}, minmax(0, 1fr))`;
    if (longest <= 14) return `repeat(${Math.min(labels.length, 3)}, minmax(0, 1fr))`;
    return 'minmax(0, 1fr)';
};

const confidenceLabel = (confidence: SizeRecommendation['confidence']): string | null => {
    if (confidence === null || confidence === undefined) return null;
    if (typeof confidence === 'object') return confidence.level ? titleCase(confidence.level) : null;
    if (typeof confidence === 'number') return confidence >= 0.75 ? 'High' : confidence >= 0.45 ? 'Medium' : 'Low';
    return titleCase(confidence);
};

type QuizOption = { value: string; label: string };

/**
 * The body-type illustrations arrive as one wide sprite: N figures side by side,
 * in the same order as the question's options. Slicing it per option turns the
 * drawing itself into the tap target, so the answer is the picture rather than a
 * word underneath a picture nobody can map to it.
 */
const IllustratedOptions: React.FC<{
    options: QuizOption[];
    value: string;
    illustrationUrl: string;
    onSelect: (value: string) => void;
}> = ({ options, value, illustrationUrl, onSelect }) => {
    const [spriteRatio, setSpriteRatio] = useState<number | null>(null);
    const sprite = getShopifySizedImage(illustrationUrl, 900);

    useEffect(() => {
        setSpriteRatio(null);
        const probe = new Image();
        probe.onload = () => {
            if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
                setSpriteRatio(probe.naturalWidth / probe.naturalHeight);
            }
        };
        probe.src = sprite;
        return () => { probe.onload = null; };
    }, [sprite]);

    // Each panel is one Nth of the sprite; until it loads, assume square panels.
    const panelAspect = spriteRatio ? spriteRatio / options.length : 1;

    return (
        <div role="radiogroup" className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
            {options.map((option, index) => {
                const selected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSelect(option.value)}
                        className={`group overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                            selected
                                ? 'border-primary bg-primary/[0.12] shadow-[0_10px_30px_-12px_rgba(220,10,40,0.65)]'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`block w-full bg-black/40 bg-no-repeat transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-65 group-hover:opacity-90'}`}
                            style={{
                                aspectRatio: `${panelAspect}`,
                                backgroundImage: `url("${sprite}")`,
                                backgroundSize: `${options.length * 100}% 100%`,
                                backgroundPosition: options.length > 1 ? `${(index / (options.length - 1)) * 100}% 50%` : 'center',
                            }}
                        />
                        <span
                            className={`block px-2 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition-colors ${
                                selected ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                            }`}
                        >
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const HeightPicker: React.FC<{ value: number; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const progress = ((value - 48) / (72 - 48)) * 100;
    return (
        <div className="mt-6">
            <output className="block text-center text-[3.25rem] font-black leading-none tracking-[-0.055em] text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {formatHeight(value)}
            </output>
            <input
                aria-label="Height"
                type="range"
                min="48"
                max="72"
                step="1"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-7 h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
                style={{ background: `linear-gradient(to right, #FF1818 0%, #ff4d8d ${progress}%, rgba(255,255,255,0.12) ${progress}%, rgba(255,255,255,0.12) 100%)` }}
            />
            <div className="mt-3 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                <span>4′0″</span>
                <span>5′0″</span>
                <span>6′0″+</span>
            </div>
        </div>
    );
};

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
    isOpen, onClose, productId, sizing, sourceGuide, selectedSize, initialView = 'quiz', onUseSize,
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
    // The modal is dark whatever the OS is set to, so the dark plate always wins.
    const illustration = illustrationGender ? currentQuestion?.illustrations?.[illustrationGender] : undefined;
    const isLastStep = quizStep === quizQuestions.length - 1;
    const currentOptions = useMemo(() => currentQuestion ? questionOptions(currentQuestion) : [], [currentQuestion]);
    const advanceTimer = useRef(0);

    // Warm the next question's sprite so tapping through never lands on a blank tile.
    useEffect(() => {
        const next = quizQuestions[quizStep + 1];
        const url = next?.illustrations?.[illustrationGender ?? '']?.dark_url
            ?? Object.values(next?.illustrations ?? {})[0]?.dark_url;
        if (!url) return;
        new Image().src = getShopifySizedImage(url, 900);
    }, [illustrationGender, quizQuestions, quizStep]);

    useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

    useEffect(() => {
        if (!isOpen) return undefined;
        setAnswers({
            ...(selectedSize ? { usual_size: selectedSize } : {}),
            ...(quizQuestions.some((question) => question.id === 'height_inches') ? { height_inches: '60' } : {}),
        });
        setMeasurements({});
        setQuizStep(0);
        setView(initialView === 'quiz' && hasQuiz ? 'quiz' : 'chart');
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
    }, [hasQuiz, initialView, isOpen, onClose, productId, quizQuestions, selectedSize]);

    const updateCurrentAnswer = (value: string) => {
        if (!currentQuestion) return;
        setError(null);
        setRecommendation(null);
        if (questionIsMeasurement) setMeasurements((current) => ({ ...current, [currentQuestion.id]: value }));
        else setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));
    };

    const recommend = async (answersOverride?: Record<string, string>) => {
        const parsedMeasurements = Object.fromEntries(
            Object.entries(measurements)
                .map(([key, value]) => [key, Number(value)])
                .filter(([, value]) => Number.isFinite(value) && value > 0)
        );
        setIsRecommending(true);
        setError(null);
        try {
            const response = await Sizing.recommend(productId, {
                answers: answersOverride ?? answers,
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
        if (isLastStep) void recommend();
        else setQuizStep((step) => step + 1);
    };

    // A tap answers the question and moves on, so the whole quiz is one tap per
    // screen instead of tap-then-confirm. Only typed answers need Continue.
    const selectOption = (value: string) => {
        if (!currentQuestion) return;
        const nextAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(nextAnswers);
        setError(null);
        setRecommendation(null);
        if (isLastStep) {
            void recommend(nextAnswers);
            return;
        }
        window.clearTimeout(advanceTimer.current);
        // Long enough to see the choice land, short enough not to feel like a wait.
        advanceTimer.current = window.setTimeout(() => setQuizStep((step) => step + 1), 170);
    };

    const useSize = (size: string, source: 'quiz' | 'chart') => {
        window.clearTimeout(advanceTimer.current);
        onUseSize(size, source);
    };

    const retakeQuiz = () => {
        setRecommendation(null);
        setError(null);
        setQuizStep(0);
    };

    if (!isOpen || (!hasNormalizedChart && !hasOriginalSource)) return null;

    // The API can return an "alternative" identical to the recommendation; a
    // second line offering the same size reads as a bug.
    const alternativeSize = [recommendation?.alternative?.size, recommendation?.alternative_size]
        .find((size) => size && size !== recommendation?.recommended_size);
    const confidence = confidenceLabel(recommendation?.confidence);

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="size-fit-title">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }} className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-xl flex-col overscroll-contain rounded-none border border-white/10 bg-[#0A0A0A] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem] sm:p-5 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8">
                <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 text-primary"><Ruler size={16} /><span className="text-[10px] font-black uppercase tracking-[0.22em]">Size & fit</span></div>
                        <h2 id="size-fit-title" className="text-2xl font-black uppercase tracking-[-0.04em] text-white">{hasNormalizedChart ? 'Find your size' : 'Size guide'}</h2>
                        {hasNormalizedChart && !recommendation ? (
                            <p className="mt-1.5 max-w-[34ch] text-[13px] leading-5 text-white/45">
                                {view === 'quiz' && hasQuiz
                                    ? `${quizQuestions.length} questions, matched to this label\u2019s own chart.`
                                    : `This label\u2019s own measurements, in ${measurementUnit === 'cm' ? 'centimetres' : 'inches'}.`}
                            </p>
                        ) : null}
                    </div>
                    <button onClick={onClose} aria-label="Close size guide" className="rounded-full border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"><X size={20} /></button>
                </div>

                <div className="-mx-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 sm:mx-0 sm:px-0">
                {!hasNormalizedChart ? <div className="space-y-4">
                    {sourceGuide?.image_url ? <img src={sourceGuide.image_url} alt="Brand size guide" className="w-full rounded-2xl border border-white/10 bg-white" /> : null}
                    {sourceTable ? <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white p-4 text-black [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black/15 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-black/15 [&_th]:bg-black/[0.04] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left" dangerouslySetInnerHTML={{ __html: sourceTable }} /> : null}
                </div> : <>
                    <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                        <button onClick={() => setView('quiz')} disabled={!hasQuiz} className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-25 ${view === 'quiz' ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Size quiz</button>
                        <button onClick={() => setView('chart')} disabled={!rows.length} className={`rounded-lg px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-25 ${view === 'chart' ? 'bg-white text-black' : 'text-white/45 hover:text-white'}`}>Size chart</button>
                    </div>

                    {view === 'chart' ? (
                        <div>
                            <div className="overflow-x-auto rounded-2xl border border-white/10">
                                <table className="w-full min-w-[420px] text-left text-sm">
                                    {/* Size and the action stay pinned: on a phone the
                                        measurements scroll sideways, and an Add button you
                                        have to go looking for is not an Add button. */}
                                    <thead>
                                        <tr className="bg-[#141416]">
                                            <th scope="col" className="sticky left-0 z-20 bg-[#141416] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Size</th>
                                            {columns.map((column) => (
                                                <th key={column} scope="col" className="whitespace-nowrap px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{titleCase(column)}</th>
                                            ))}
                                            <th scope="col" className="sticky right-0 z-20 bg-[#141416] px-4 py-3"><span className="sr-only">Add to bag</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.06]">
                                        {rows.map((row, index) => {
                                            const size = rowSize(row);
                                            const values = rowMeasurements(row);
                                            const isSelected = size === selectedSize;
                                            // Pinned cells need an opaque fill, so the row tint is a
                                            // solid colour rather than a translucent overlay.
                                            const pinnedFill = isSelected ? 'bg-[#1b0c10]' : 'bg-[#0A0A0A]';
                                            return (
                                                <tr key={`${size}-${index}`} className={`group transition-colors ${isSelected ? 'bg-[#1b0c10]' : 'hover:bg-white/[0.03]'}`}>
                                                    <th scope="row" className={`sticky left-0 z-10 px-4 py-3 text-left text-base font-black text-white ${pinnedFill}`}>{size}</th>
                                                    {columns.map((column) => (
                                                        <td key={column} className="whitespace-nowrap px-4 py-3 text-white/70">{displayMeasurement(values[column] ?? values[column.toLowerCase()])}</td>
                                                    ))}
                                                    <td className={`sticky right-0 z-10 py-2 pl-2 pr-3 text-right shadow-[-14px_0_18px_-14px_rgba(0,0,0,0.95)] ${pinnedFill}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => useSize(size, 'chart')}
                                                            aria-label={`Add size ${size} to bag`}
                                                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-black transition-transform hover:scale-[1.03] active:scale-95"
                                                        >
                                                            <ShoppingBag size={13} />
                                                            Add
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-3 text-[12px] leading-5 text-white/40">Garment measurements, in {measurementUnit === 'cm' ? 'centimetres' : 'inches'}. Swipe for the rest; Add puts that size in your bag.</p>
                        </div>
                    ) : recommendation ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                            aria-live="polite"
                            className="flex flex-1 flex-col"
                        >
                            {/* The size is the payoff, so it sits in the optical centre of
                                the sheet rather than tucked under the tabs. */}
                            <div className="my-auto py-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">Your fit</p>
                            <div className="mt-3 flex items-end gap-4">
                                <p
                                    className="leading-[0.8] text-white"
                                    style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(5rem, 30vw, 8.5rem)', letterSpacing: '-0.06em' }}
                                >
                                    {recommendation.recommended_size}
                                </p>
                                {confidence ? (
                                    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                                        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
                                        {confidence} confidence
                                    </span>
                                ) : null}
                            </div>
                            {recommendation.reason ? <p className="mt-4 max-w-[46ch] text-[15px] leading-6 text-white/65">{recommendation.reason}.</p> : null}
                            {alternativeSize ? (
                                <p className="mt-2 text-[13px] text-white/45">
                                    Close second: <span className="font-bold text-white/70">{alternativeSize}</span>
                                    {recommendation.alternative?.reason ? ` — ${recommendation.alternative.reason.toLowerCase()}` : ''}
                                </p>
                            ) : null}
                            {recommendation.warnings?.map((warning) => (
                                <p key={warning} className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2.5 text-[13px] text-amber-100">{warning}</p>
                            ))}
                            </div>
                            <div className="sticky bottom-0 flex gap-3 bg-[#0A0A0A] pb-1 pt-6">
                                <button
                                    type="button"
                                    onClick={retakeQuiz}
                                    className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-white/65 transition hover:border-white/30 hover:text-white"
                                >
                                    <RotateCcw size={14} />
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={() => useSize(recommendation.recommended_size, 'quiz')}
                                    className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_16px_40px_-16px_rgba(220,10,40,0.9)] transition hover:brightness-110"
                                >
                                    <ShoppingBag size={16} />
                                    Add {recommendation.recommended_size} to bag
                                </button>
                            </div>
                        </motion.div>
                    ) : isRecommending ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center text-center" aria-live="polite">
                            <Loader2 size={26} className="animate-spin text-primary" />
                            <p className="mt-4 text-sm font-bold text-white">Matching you to this brand&rsquo;s chart</p>
                            <p className="mt-1 text-[13px] text-white/45">One second.</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col">
                            <div className="flex shrink-0 items-center gap-3">
                                <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={quizQuestions.length} aria-valuenow={quizStep + 1} aria-label="Quiz progress">
                                    {quizQuestions.map((question, index) => (
                                        <span
                                            key={question.id}
                                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${index <= quizStep ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/10'}`}
                                        />
                                    ))}
                                </div>
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                    {quizStep + 1}/{quizQuestions.length}
                                </span>
                            </div>

                            {currentQuestion ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentQuestion.id}
                                        initial={{ opacity: 0, x: 14 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -14 }}
                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <h3
                                            className="mt-6 text-white"
                                            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(1.35rem, 5vw, 1.75rem)', lineHeight: 1.05, letterSpacing: '-0.04em' }}
                                        >
                                            {currentQuestion.label}
                                        </h3>
                                        {currentQuestion.optional ? <p className="mt-2 text-[13px] text-white/45">Optional &mdash; skip if you&rsquo;re not sure.</p> : null}

                                        {questionIsHeight ? (
                                            <HeightPicker value={Number(currentValue) || 60} onChange={updateCurrentAnswer} />
                                        ) : questionIsMeasurement ? (
                                            <div className="relative mt-6">
                                                <input
                                                    autoFocus
                                                    inputMode="decimal"
                                                    type="number"
                                                    min="1"
                                                    step="0.1"
                                                    value={currentValue}
                                                    onChange={(event) => updateCurrentAnswer(event.target.value)}
                                                    onKeyDown={(event) => { if (event.key === 'Enter') continueQuiz(); }}
                                                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-5 pr-20 text-2xl font-black tracking-[-0.03em] text-white outline-none transition focus:border-primary/70"
                                                    placeholder="0"
                                                />
                                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-[0.16em] text-white/35">
                                                    {currentQuestion.unit ?? quiz?.measurement_unit ?? ''}
                                                </span>
                                            </div>
                                        ) : illustration && currentOptions.length > 1 ? (
                                            <IllustratedOptions
                                                options={currentOptions}
                                                value={currentValue}
                                                illustrationUrl={illustration.dark_url}
                                                onSelect={selectOption}
                                            />
                                        ) : (
                                            <div role="radiogroup" className="mt-6 grid gap-2" style={{ gridTemplateColumns: optionColumns(currentOptions.map((option) => option.label)) }}>
                                                {currentOptions.map((option) => {
                                                    const selected = currentValue === option.value;
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={selected}
                                                            onClick={() => selectOption(option.value)}
                                                            className={`min-h-14 rounded-2xl border px-3 py-3 text-[15px] font-black tracking-[-0.01em] transition-all duration-150 ${
                                                                selected
                                                                    ? 'border-white bg-white text-black'
                                                                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/30 hover:text-white'
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <p className="mt-6 text-sm text-white/50">This product has no quiz questions yet. Use the size chart instead.</p>
                            )}

                            <div aria-live="polite">{error ? <p className="mt-4 text-[13px] font-bold text-primary">{error}</p> : null}</div>

                            <div className="sticky bottom-0 mt-auto flex gap-3 bg-[#0A0A0A] pb-1 pt-6">
                                <button
                                    type="button"
                                    onClick={() => { window.clearTimeout(advanceTimer.current); setQuizStep((step) => Math.max(0, step - 1)); }}
                                    disabled={quizStep === 0}
                                    className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 text-[10px] font-black uppercase tracking-[0.15em] text-white/65 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                    <ArrowLeft size={14} />
                                    Back
                                </button>
                                {/* Selecting an option advances on its own, so this is the escape
                                    hatch for typed answers, optional questions, and keyboards. */}
                                <button
                                    type="button"
                                    onClick={continueQuiz}
                                    disabled={!currentQuestion}
                                    className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition hover:border-white/35 hover:bg-white/[0.08] disabled:opacity-40"
                                >
                                    {isLastStep ? <Sparkles size={15} /> : <ArrowRight size={15} />}
                                    {isLastStep ? 'Find my size' : currentQuestion?.optional && !currentValue ? 'Skip' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    )}
                </>}
                </div>
            </motion.div>
        </div>
    );
};

export default SizeGuideModal;
