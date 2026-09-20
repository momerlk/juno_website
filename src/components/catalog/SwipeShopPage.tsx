import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Heart, LayoutGrid, RotateCcw, ShoppingBag, Truck, Undo2, X } from 'lucide-react';
import type { CatalogProduct, ProductVariant } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Recommendations } from '../../api/recommendationsApi';
import { getShopifySizedImage } from '../../utils/shopifyImage';

// Used by: /catalog/swipe.
// Purpose: full-screen, gesture-first shopping deck fed by the recommendation
// engine. Right = save, left = pass, up = add to bag (size sheet when the
// product has several sizes), tap photo edges = cycle images, tap details =
// product page. Deck refills itself as it runs low and survives a round-trip
// to the product page via sessionStorage.

type SwipeAction = 'left' | 'right' | 'up';
type DeckCard = { product: CatalogProduct; position: number; requestId?: string };
type HistoryEntry = { card: DeckCard; action: SwipeAction; variantId?: string };

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 650;
const REFILL_AT = 3;
const HINT_KEY = 'juno_swipe_hint_seen';
const DECK_KEY = 'juno_swipe_deck';
const GENDER_KEY = 'juno_swipe_gender';

type Gender = 'women' | 'men' | 'all';
const GENDERS: { value: Gender; label: string; hint: string }[] = [
    { value: 'women', label: 'Women', hint: 'Womenswear only' },
    { value: 'men', label: 'Men', hint: 'Menswear only' },
    { value: 'all', label: 'Everything', hint: 'Show me it all' },
];
const readGender = (): Gender | null => {
    try {
        const value = localStorage.getItem(GENDER_KEY);
        return GENDERS.some((option) => option.value === value) ? (value as Gender) : null;
    } catch {
        return null;
    }
};
const DECK_TTL_MS = 30 * 60 * 1000;
const ICON_BTN = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition hover:bg-white/[0.14]';

const currency = (value?: number) => `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const getIdentity = (key: string) => {
    let value = localStorage.getItem(key);
    if (!value) {
        value = crypto.randomUUID();
        localStorage.setItem(key, value);
    }
    return value;
};

const getPrice = (product: CatalogProduct) => {
    const { pricing } = product;
    const price = pricing.brand_price ?? (pricing.discounted ? pricing.discounted_price ?? pricing.price : pricing.price);
    const compareAt = pricing.compare_at_price && pricing.compare_at_price > price ? pricing.compare_at_price : undefined;
    const discount = compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
    return { price, compareAt, discount };
};

const availableVariants = (product: CatalogProduct) => (product.variants ?? []).filter((variant) => variant.available !== false);

const buzz = (ms = 12) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(ms);
};

const flyTarget = (action: SwipeAction, x: number, y: number) =>
    action === 'left' ? { x: -window.innerWidth * 1.3, y: y + 40 } : action === 'right' ? { x: window.innerWidth * 1.3, y: y + 40 } : { x, y: -window.innerHeight * 1.2 };

const readSavedDeck = (): { deck: DeckCard[]; history: HistoryEntry[] } | null => {
    try {
        const raw = sessionStorage.getItem(DECK_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw) as { at: number; deck: DeckCard[]; history: HistoryEntry[] };
        if (Date.now() - saved.at > DECK_TTL_MS || !Array.isArray(saved.deck)) return null;
        return { deck: saved.deck, history: Array.isArray(saved.history) ? saved.history : [] };
    } catch {
        return null;
    }
};

/* ---------------------------------------------------------------- card */

interface SwipeCardProps {
    card: DeckCard;
    depth: number; // 0 = top of deck
    pendingAction: SwipeAction | null; // set by buttons/keys on the top card
    onCommit: (action: SwipeAction) => void;
    onRequestUp: () => boolean; // false = needs a size first, card snaps back
    onView: () => void;
    onInteract: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ card, depth, pendingAction, onCommit, onRequestUp, onView, onInteract }) => {
    const { product } = card;
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-320, 320], [-14, 14]);
    const saveOpacity = useTransform(x, [16, SWIPE_DISTANCE], [0, 1]);
    const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -16], [1, 0]);
    const bagOpacity = useTransform(y, [-SWIPE_DISTANCE, -16], [1, 0]);
    // Neutral darkening on any drag direction; the stamp icon carries the meaning.
    const tint = useTransform([x, y], ([dx, dy]) => Math.min(0.55, Math.hypot(dx as number, dy as number) / 400));
    const ref = useRef<HTMLDivElement>(null);
    const committed = useRef(false);
    const [imageIndex, setImageIndex] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const images = product.images ?? [];
    const image = images[imageIndex] ? getShopifySizedImage(images[imageIndex], 900) : undefined;
    const { price, compareAt, discount } = getPrice(product);
    const active = depth === 0;
    const sizes = availableVariants(product);

    // Warm every shot of the top card so edge-taps never show a blank frame.
    useEffect(() => {
        if (!active) return;
        (product.images ?? []).slice(1).forEach((src) => { new Image().src = getShopifySizedImage(src, 900); });
    }, [active, product.images]);

    const fly = useCallback((action: SwipeAction) => {
        if (committed.current) return;
        committed.current = true;
        buzz();
        const target = flyTarget(action, x.get(), y.get());
        const options = { duration: 0.24, ease: [0.3, 0, 0.8, 0.4] as [number, number, number, number] };
        animate(x, target.x, options);
        animate(y, target.y, options).then(() => onCommit(action));
    }, [x, y, onCommit]);

    useEffect(() => {
        if (active && pendingAction) fly(pendingAction);
    }, [active, pendingAction, fly]);

    return (
        <motion.div
            ref={ref}
            drag={active}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={1}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 32 }}
            onDragStart={onInteract}
            onDragEnd={(_, info) => {
                const { offset, velocity } = info;
                const horizontal = Math.abs(offset.x) > Math.abs(offset.y);
                if (horizontal && (Math.abs(offset.x) > SWIPE_DISTANCE || Math.abs(velocity.x) > SWIPE_VELOCITY)) fly(offset.x > 0 ? 'right' : 'left');
                else if (!horizontal && (-offset.y > SWIPE_DISTANCE || -velocity.y > SWIPE_VELOCITY) && onRequestUp()) fly('up');
            }}
            onTap={(_, info) => {
                if (!active || images.length < 2 || !ref.current) return;
                const rect = ref.current.getBoundingClientRect();
                const left = info.point.x - rect.left < rect.width / 2;
                setLoaded(false);
                setImageIndex((index) => (index + (left ? -1 : 1) + images.length) % images.length);
                onInteract();
            }}
            style={{ x, y, rotate, zIndex: 10 - depth, willChange: 'transform' }}
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1 - depth * 0.045, y: depth * 16, opacity: depth > 2 ? 0 : 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`absolute inset-0 touch-none overflow-hidden rounded-[1.75rem] bg-[#151214] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10 ${active ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-[#1c0f13] to-secondary/20" />
            {image ? (
                <img
                    key={image}
                    src={image}
                    alt={product.title}
                    draggable={false}
                    fetchPriority={active ? 'high' : 'auto'}
                    onLoad={() => setLoaded(true)}
                    className={`relative h-full w-full select-none object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            ) : null}

            {/* legibility scrim */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/20" />
            <motion.div style={{ opacity: tint }} className="pointer-events-none absolute inset-0 bg-black" />

            {/* image progress */}
            {images.length > 1 ? (
                <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
                    {images.map((_, index) => (
                        <span key={index} className={`h-[3px] flex-1 rounded-full transition-colors ${index === imageIndex ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                </div>
            ) : null}

            {/* badges */}
            <div className="pointer-events-none absolute left-4 top-7 flex gap-2">
                {discount > 0 ? <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black">-{discount}%</span> : null}
                {product.badges?.best_seller ? <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">Best seller</span> : null}
                {!sizes.length ? <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Sold out</span> : null}
            </div>

            {/* swipe stamps: one big bare icon centred on the card, over the neutral tint */}
            <motion.img src="/images/icons/heart.png" alt="Save" style={{ opacity: saveOpacity }} className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2" />
            <motion.img src="/images/icons/cross.png" alt="Pass" style={{ opacity: passOpacity }} className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2" />
            <motion.img src="/images/icons/cart.png" alt="Add to bag" style={{ opacity: bagOpacity }} className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2" />

            {/* details */}
            <div className="absolute inset-x-0 bottom-0 p-5 pb-6">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">{product.seller_name}</p>
                <h2 className="mt-1.5 line-clamp-2 text-[26px] font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-3xl">{product.title}</h2>
                <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black tracking-tight">{currency(price)}</span>
                            {compareAt ? <span className="text-sm font-semibold text-white/40 line-through">{currency(compareAt)}</span> : null}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                            {product.shipping_details?.free_shipping ? <span className="inline-flex items-center gap-1"><Truck size={11} /> Free shipping</span> : null}
                            {sizes.length > 1 ? <span>{sizes.length} sizes</span> : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); onView(); }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className={`inline-flex h-10 items-center gap-1 rounded-full bg-white/[0.12] pl-4 pr-3 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/20 ${active ? '' : 'invisible'}`}
                    >
                        Details <ChevronRight size={15} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

/* ---------------------------------------------------------------- size sheet */

const SizeSheet: React.FC<{ product: CatalogProduct; onPick: (variant: ProductVariant) => void; onClose: () => void }> = ({ product, onPick, onClose }) => {
    const sizes = availableVariants(product);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex flex-col justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                onClick={(event) => event.stopPropagation()}
                className="relative rounded-t-[1.75rem] bg-[#151214] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ring-1 ring-white/10"
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">Pick a size</p>
                        <h3 className="mt-1 line-clamp-1 text-lg font-black tracking-[-0.03em]">{product.title}</h3>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><X size={16} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sizes.map((variant) => (
                        <button
                            key={variant.id}
                            type="button"
                            onClick={() => onPick(variant)}
                            className="min-w-[3.25rem] rounded-full border border-white/20 px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] transition hover:border-white hover:bg-white hover:text-black"
                        >
                            {variant.title}
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ---------------------------------------------------------------- gender quiz */

const GenderQuiz: React.FC<{ current: Gender | null; onPick: (gender: Gender) => void }> = ({ current, onPick }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-[1.75rem] bg-[#151214] p-6 text-center ring-1 ring-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Juno AI</p>
        <h2 className="mt-3 text-3xl font-black leading-[0.95] tracking-[-0.05em]">Who are we<br />shopping for?</h2>
        <p className="mt-2 max-w-xs text-sm text-white/55">One tap. The deck tunes itself from here.</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            {GENDERS.map((option) => (
                <motion.button
                    key={option.value}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onPick(option.value)}
                    className={`flex items-center justify-between rounded-full px-6 py-4 text-left transition ${current === option.value ? 'bg-gradient-to-r from-primary to-secondary' : 'border border-white/15 bg-white/[0.05] hover:border-white/40'}`}
                >
                    <span className="text-sm font-black uppercase tracking-[0.14em]">{option.label}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{option.hint}</span>
                </motion.button>
            ))}
        </div>
    </motion.div>
);

/* ---------------------------------------------------------------- page */

const SwipeShopPage: React.FC = () => {
    const [restored] = useState(readSavedDeck);
    const [gender, setGender] = useState<Gender | null>(readGender);
    const [askGender, setAskGender] = useState(() => !readGender());
    const [deck, setDeck] = useState<DeckCard[]>(restored?.deck ?? []);
    const [history, setHistory] = useState<HistoryEntry[]>(restored?.history ?? []);
    const [pendingAction, setPendingAction] = useState<SwipeAction | null>(null);
    const [chosenVariant, setChosenVariant] = useState<ProductVariant | null>(null);
    const [sizing, setSizing] = useState<DeckCard | null>(null);
    const [toast, setToast] = useState<{ id: number; text: string; to?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [exhausted, setExhausted] = useState(false);
    const [error, setError] = useState('');
    const [showHint, setShowHint] = useState(() => { try { return !localStorage.getItem(HINT_KEY); } catch { return false; } });
    const [identity] = useState(() => ({ userId: `guest-${getIdentity('juno_recsys_user_id')}`, sessionId: getIdentity('juno_recsys_session_id') }));
    const seen = useRef(new Set<string>([...(restored?.deck ?? []), ...(restored?.history ?? []).map((entry) => entry.card)].map((card) => card.product.id)));
    const impressed = useRef(new Set<string>());
    const navigate = useNavigate();
    const { addItem, removeItem, itemCount, setCartOpen } = useGuestCart();
    const top = deck[0];

    const load = useCallback(async (refresh: boolean) => {
        if (!gender) return;
        setLoading(true);
        setError('');
        try {
            const shelf = await Recommendations.getShelf(identity.userId, identity.sessionId, refresh, gender === 'all' ? undefined : { gender });
            const fresh = shelf.products.filter((product) => !seen.current.has(product.id));
            fresh.forEach((product) => seen.current.add(product.id));
            const cards = fresh.map((product, position) => ({ product, position, requestId: shelf.request_id }));
            if (!cards.length) setExhausted(true);
            setDeck((current) => [...current, ...cards]);
        } catch {
            setError('The style feed is taking a moment.');
        } finally {
            setLoading(false);
        }
    }, [identity, gender]);

    // Refill before the deck runs dry so the next card is never a spinner.
    // Also the initial load: an empty deck is just a deck that needs refilling.
    useEffect(() => {
        if (askGender || !gender || loading || error || exhausted) return;
        if (deck.length <= REFILL_AT) void load(deck.length > 0);
    }, [askGender, gender, deck.length, loading, error, exhausted, load]);

    // Survive a round-trip to the product page.
    useEffect(() => {
        try { sessionStorage.setItem(DECK_KEY, JSON.stringify({ at: Date.now(), deck, history })); } catch { /* storage unavailable */ }
    }, [deck, history]);

    const event = useCallback((kind: Parameters<typeof Recommendations.sendEvent>[2], card: DeckCard) =>
        Recommendations.sendEvent(identity.userId, identity.sessionId, kind, card.product.id, card.requestId, card.position), [identity]);

    // Impression = card actually reached the top, not merely fetched.
    useEffect(() => {
        if (!top || impressed.current.has(top.product.id)) return;
        impressed.current.add(top.product.id);
        event('impression', top);
    }, [top, event]);

    // Warm the next few hero images.
    useEffect(() => {
        deck.slice(1, 4).forEach((card) => {
            const src = card.product.images?.[0];
            if (src) new Image().src = getShopifySizedImage(src, 900);
        });
    }, [deck]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 1800);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const notify = (text: string, to?: string) => setToast({ id: Date.now(), text, to });

    const dismissHint = useCallback(() => {
        if (!showHint) return;
        setShowHint(false);
        try { localStorage.setItem(HINT_KEY, '1'); } catch { /* storage unavailable */ }
    }, [showHint]);

    const pickGender = (next: Gender) => {
        try { localStorage.setItem(GENDER_KEY, next); } catch { /* storage unavailable */ }
        setAskGender(false);
        if (next === gender) return;
        // New audience, new deck.
        seen.current.clear();
        impressed.current.clear();
        setDeck([]);
        setHistory([]);
        setExhausted(false);
        setError('');
        setGender(next);
    };

    const setWishlisted = (id: string, on: boolean) => {
        try {
            const saved = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');
            if (!Array.isArray(saved)) return;
            const next = on ? (saved.includes(id) ? saved : [...saved, id]) : saved.filter((entry: string) => entry !== id);
            localStorage.setItem('juno_wishlist', JSON.stringify(next));
        } catch {
            // Saving to the recommendation service still succeeds if browser storage is unavailable.
        }
    };

    const addToBag = (card: DeckCard, variant: ProductVariant) => {
        const { product } = card;
        addItem(product.id, variant.id, 1, variant.brand_price ?? product.pricing.brand_price ?? variant.price ?? product.pricing.price, {
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: variant.title,
            variant_options: variant.options,
            image_url: variant.image_url || product.images?.[0],
            max_quantity: variant.inventory?.available_quantity ?? product.inventory?.available_quantity,
            is_available: true,
            free_shipping: !!product.shipping_details?.free_shipping,
            delivery_days: product.shipping_details?.estimated_delivery_days || 7,
        });
        event('add_to_cart', card);
        notify(`Added ${variant.title ? `· ${variant.title}` : 'to bag'}`);
    };

    // Called by the card once it has flown off-screen.
    const commit = (action: SwipeAction) => {
        if (!top) return;
        if (action === 'left') event('dislike', top);
        if (action === 'right') { event('save', top); setWishlisted(top.product.id, true); notify('Saved', '/wishlist'); }
        if (action === 'up' && chosenVariant) addToBag(top, chosenVariant);
        setHistory((past) => [{ card: top, action, variantId: chosenVariant?.id }, ...past].slice(0, 10));
        setDeck((current) => (current[0] === top ? current.slice(1) : current));
        setPendingAction(null);
        setChosenVariant(null);
        dismissHint();
    };

    const undo = () => {
        const [entry, ...rest] = history;
        if (!entry || pendingAction || askGender) return;
        buzz(8);
        if (entry.action === 'right') setWishlisted(entry.card.product.id, false);
        if (entry.action === 'up' && entry.variantId) removeItem(entry.card.product.id, entry.variantId);
        setHistory(rest);
        setDeck((current) => [entry.card, ...current]);
    };

    const view = () => {
        if (!top) return;
        event('view', top);
        navigate(`/catalog/${top.product.id}`);
    };

    // Returns true when the card may fly up now; opens the size sheet otherwise.
    const requestUp = (): boolean => {
        if (!top || pendingAction) return false;
        const sizes = availableVariants(top.product);
        if (!sizes.length) { notify('Sold out'); return false; }
        if (sizes.length === 1) { setChosenVariant(sizes[0]); return true; }
        setSizing(top);
        return false;
    };

    const trigger = (action: SwipeAction) => {
        if (!top || pendingAction || sizing || askGender) return;
        if (action === 'up' && !requestUp()) return;
        setPendingAction(action);
    };

    const pickSize = (variant: ProductVariant) => {
        setSizing(null);
        setChosenVariant(variant);
        setPendingAction('up');
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'Escape') { setSizing(null); if (gender) setAskGender(false); }
            else if (e.key === 'ArrowLeft') trigger('left');
            else if (e.key === 'ArrowRight') trigger('right');
            else if (e.key === 'ArrowUp') { e.preventDefault(); trigger('up'); }
            else if (e.key === 'Enter') view();
            else if (e.key === 'Backspace' || e.key === 'z') undo();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <div className="relative flex h-dvh select-none flex-col overflow-hidden overscroll-none bg-[#070607] text-white">

            {/* top bar */}
            <header className="relative z-20 flex h-14 items-center gap-2 px-3 pt-[env(safe-area-inset-top)]">
                <Link to="/catalog" aria-label="Back" className={ICON_BTN}><ArrowLeft size={17} /></Link>
                <Link to="/" className="mr-auto flex items-center pl-1"><img src="/images/juno-logos/icon+text_white.png" alt="Juno" className="h-[18px] w-auto" /></Link>
                <button type="button" onClick={() => setAskGender(true)} aria-label="Change who you shop for" className="hidden h-9 items-center rounded-full border border-white/10 bg-white/[0.08] px-3 text-[10px] font-black uppercase tracking-[0.14em] transition hover:bg-white/[0.14] sm:flex">{GENDERS.find((option) => option.value === gender)?.label ?? 'Who?'}</button>
                <motion.button type="button" whileTap={{ scale: 0.86 }} onClick={undo} disabled={!history.length} aria-label="Go back one card" title="Go back one card" className={`${ICON_BTN} disabled:opacity-30`}><Undo2 size={16} /></motion.button>
                <Link to="/wishlist" state={{ from: 'swipe' }} aria-label="Saves" className={ICON_BTN}><Heart size={16} /></Link>
                <Link to="/catalog/legacy" aria-label="Browse catalog" className={ICON_BTN}><LayoutGrid size={16} /></Link>
                <button type="button" onClick={() => setCartOpen(true)} aria-label="Bag" className={`${ICON_BTN} relative`}>
                    <ShoppingBag size={16} />
                    {itemCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary px-1 text-[9px] font-black">{itemCount > 9 ? '9+' : itemCount}</span> : null}
                </button>
            </header>

            {/* deck */}
            <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pb-2 pt-1 sm:px-6">
                <div className="relative h-full w-full max-w-[430px] max-h-[780px]">
                    {error && !deck.length ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 text-center">
                            <p className="text-lg font-bold">{error}</p>
                            <button type="button" onClick={() => void load(false)} className="mt-6 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-xs font-black uppercase tracking-[0.16em]">Try again</button>
                        </div>
                    ) : !deck.length && loading ? (
                        <div className="h-full w-full animate-pulse rounded-[1.75rem] bg-gradient-to-br from-white/[0.08] to-white/[0.02] ring-1 ring-white/10" />
                    ) : !deck.length ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Juno AI</p>
                            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">That’s your edit for now.</h2>
                            <p className="mt-2 max-w-xs text-sm text-white/55">Your saves shape the next round.</p>
                            <div className="mt-7 flex gap-3">
                                <button type="button" onClick={() => { setExhausted(false); void load(true); }} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-3 text-xs font-black uppercase tracking-[0.16em]"><RotateCcw size={14} /> New round</button>
                                <Link to="/wishlist" state={{ from: 'swipe' }} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[0.16em]"><Heart size={14} /> Saves</Link>
                            </div>
                        </div>
                    ) : null}

                    <AnimatePresence initial={false}>
                        {deck.slice(0, 3).map((card, depth) => (
                            <SwipeCard key={card.product.id} card={card} depth={depth} pendingAction={depth === 0 ? pendingAction : null} onCommit={commit} onRequestUp={requestUp} onView={view} onInteract={dismissHint} />
                        ))}
                    </AnimatePresence>

                    <AnimatePresence>
                        {askGender ? <GenderQuiz key="quiz" current={gender} onPick={pickGender} /> : null}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showHint && top && !askGender ? (
                            <motion.button type="button" onClick={dismissHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 rounded-[1.75rem] bg-black/70">
                                <div className="grid grid-cols-3 gap-6 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/80">
                                    <span className="flex flex-col items-center gap-3"><motion.span animate={{ x: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30"><X size={22} /></motion.span>Swipe left<br />pass</span>
                                    <span className="flex flex-col items-center gap-3"><motion.span animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30"><ShoppingBag size={22} /></motion.span>Swipe up<br />add to bag</span>
                                    <span className="flex flex-col items-center gap-3"><motion.span animate={{ x: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.6 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary"><Heart size={22} /></motion.span>Swipe right<br />save</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Tap photo edges for more shots · tap to start</span>
                            </motion.button>
                        ) : null}
                    </AnimatePresence>

                    <AnimatePresence>
                        {sizing ? <SizeSheet key={sizing.product.id} product={sizing.product} onPick={pickSize} onClose={() => setSizing(null)} /> : null}
                    </AnimatePresence>

                    <AnimatePresence>
                        {toast ? (
                            <motion.div key={toast.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="pointer-events-none absolute inset-x-0 top-4 z-30 flex justify-center">
                                {toast.to ? (
                                    <Link to={toast.to} state={{ from: 'swipe' }} className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black shadow-lg"><Check size={14} /> {toast.text} <ChevronRight size={14} /></Link>
                                ) : (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black shadow-lg"><Check size={14} /> {toast.text}</span>
                                )}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </main>

        </div>
    );
};

export default SwipeShopPage;
