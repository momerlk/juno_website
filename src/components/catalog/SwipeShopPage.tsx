import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, ChevronRight, Heart, Info, LayoutGrid, RotateCcw, ShoppingBag, Truck, Undo2, X } from 'lucide-react';
import type { CatalogProduct } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Recommendations } from '../../api/recommendationsApi';
import { getShopifySizedImage } from '../../utils/shopifyImage';

// Used by: /catalog/swipe.
// Purpose: full-screen, gesture-first shopping deck fed by the recommendation
// engine. Right = save, left = pass, up = add to bag, tap photo edges = cycle
// images, tap details = product page. Deck refills itself as it runs low.

type SwipeAction = 'left' | 'right' | 'up';
type DeckCard = { product: CatalogProduct; position: number; requestId?: string };

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 650;
const REFILL_AT = 3;
const HINT_KEY = 'juno_swipe_hint_seen';

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

const buzz = (ms = 12) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(ms);
};

const flyTarget = (action: SwipeAction, x: number, y: number) =>
    action === 'left' ? { x: -window.innerWidth * 1.3, y: y + 40 } : action === 'right' ? { x: window.innerWidth * 1.3, y: y + 40 } : { x, y: -window.innerHeight * 1.2 };

/* ---------------------------------------------------------------- card */

interface SwipeCardProps {
    card: DeckCard;
    depth: number; // 0 = top of deck
    pendingAction: SwipeAction | null; // set by buttons/keys on the top card
    onCommit: (action: SwipeAction) => void;
    onView: () => void;
    onInteract: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ card, depth, pendingAction, onCommit, onView, onInteract }) => {
    const { product } = card;
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-320, 320], [-14, 14]);
    const saveOpacity = useTransform(x, [16, SWIPE_DISTANCE], [0, 1]);
    const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -16], [1, 0]);
    const bagOpacity = useTransform(y, [-SWIPE_DISTANCE, -16], [1, 0]);
    const tint = useTransform(x, [-220, 0, 220], ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(255,24,24,0.22)']);
    const ref = useRef<HTMLDivElement>(null);
    const committed = useRef(false);
    const [imageIndex, setImageIndex] = useState(0);
    const images = product.images.length ? product.images : [];
    const image = images[imageIndex] ? getShopifySizedImage(images[imageIndex], 900) : undefined;
    const { price, compareAt, discount } = getPrice(product);
    const active = depth === 0;

    const fly = useCallback((action: SwipeAction) => {
        if (committed.current) return;
        committed.current = true;
        buzz();
        const target = flyTarget(action, x.get(), y.get());
        const options = { duration: 0.32, ease: [0.3, 0, 0.8, 0.4] as [number, number, number, number] };
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
                else if (!horizontal && (-offset.y > SWIPE_DISTANCE || -velocity.y > SWIPE_VELOCITY)) fly('up');
            }}
            onTap={(_, info) => {
                if (!active || images.length < 2 || !ref.current) return;
                const rect = ref.current.getBoundingClientRect();
                const left = info.point.x - rect.left < rect.width / 2;
                setImageIndex((index) => (index + (left ? -1 : 1) + images.length) % images.length);
                onInteract();
            }}
            style={{ x, y, rotate, zIndex: 10 - depth }}
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1 - depth * 0.045, y: depth * 16, opacity: depth > 2 ? 0 : 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`absolute inset-0 touch-none overflow-hidden rounded-[1.75rem] bg-[#151214] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 ${active ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        >
            {image ? (
                <img key={image} src={image} alt={product.title} draggable={false} fetchPriority={active ? 'high' : 'auto'} className="h-full w-full select-none object-cover" />
            ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 via-[#1c0f13] to-secondary/20" />
            )}

            {/* legibility scrim */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/20" />
            <motion.div style={{ background: tint }} className="pointer-events-none absolute inset-0" />

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
                {product.badges?.best_seller ? <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur">Best seller</span> : null}
            </div>

            {/* swipe stamps */}
            <motion.span style={{ opacity: saveOpacity }} className="pointer-events-none absolute left-5 top-14 -rotate-12 rounded-xl border-[3px] border-secondary px-3 py-1 text-3xl font-black uppercase tracking-[0.1em] text-secondary">Save</motion.span>
            <motion.span style={{ opacity: passOpacity }} className="pointer-events-none absolute right-5 top-14 rotate-12 rounded-xl border-[3px] border-white px-3 py-1 text-3xl font-black uppercase tracking-[0.1em] text-white">Pass</motion.span>
            <motion.span style={{ opacity: bagOpacity }} className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto w-max rounded-xl border-[3px] border-white bg-black/40 px-4 py-1.5 text-3xl font-black uppercase tracking-[0.1em] text-white backdrop-blur">Add to bag</motion.span>

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
                        {product.shipping_details?.free_shipping ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55"><Truck size={11} /> Free shipping</span> : null}
                    </div>
                    <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); onView(); }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className={`inline-flex h-10 items-center gap-1 rounded-full bg-white/[0.12] pl-4 pr-3 text-[11px] font-black uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/20 ${active ? '' : 'invisible'}`}
                    >
                        Details <ChevronRight size={15} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

/* ---------------------------------------------------------------- page */

const ActionButton: React.FC<{ label: string; onClick: () => void; size?: 'sm' | 'md' | 'lg'; variant?: 'ghost' | 'primary'; disabled?: boolean; children: React.ReactNode }> = ({ label, onClick, size = 'md', variant = 'ghost', disabled, children }) => (
    <motion.button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={onClick}
        whileTap={{ scale: 0.86 }}
        className={`flex shrink-0 items-center justify-center rounded-full transition disabled:opacity-30 ${size === 'lg' ? 'h-[68px] w-[68px]' : size === 'md' ? 'h-14 w-14' : 'h-11 w-11'} ${
            variant === 'primary'
                ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-[0_16px_40px_-8px_rgba(255,40,90,0.7)]'
                : 'border border-white/[0.12] bg-white/[0.06] text-white backdrop-blur hover:bg-white/[0.12]'
        }`}
    >
        {children}
    </motion.button>
);

const SwipeShopPage: React.FC = () => {
    const [deck, setDeck] = useState<DeckCard[]>([]);
    const [history, setHistory] = useState<DeckCard[]>([]);
    const [pendingAction, setPendingAction] = useState<SwipeAction | null>(null);
    const [loading, setLoading] = useState(true);
    const [exhausted, setExhausted] = useState(false);
    const [error, setError] = useState('');
    const [showHint, setShowHint] = useState(() => { try { return !localStorage.getItem(HINT_KEY); } catch { return false; } });
    const [identity] = useState(() => ({ userId: `guest-${getIdentity('juno_recsys_user_id')}`, sessionId: getIdentity('juno_recsys_session_id') }));
    const seen = useRef(new Set<string>());
    const navigate = useNavigate();
    const { addItem, itemCount, setCartOpen } = useGuestCart();
    const top = deck[0];

    const load = useCallback(async (refresh: boolean) => {
        setLoading(true);
        setError('');
        try {
            const shelf = await Recommendations.getShelf(identity.userId, identity.sessionId, refresh);
            const fresh = shelf.products.filter((product) => !seen.current.has(product.id));
            fresh.forEach((product) => seen.current.add(product.id));
            const cards = fresh.map((product, position) => ({ product, position, requestId: shelf.request_id }));
            cards.forEach((card) => Recommendations.sendEvent(identity.userId, identity.sessionId, 'impression', card.product.id, card.requestId, card.position));
            if (!cards.length) setExhausted(true);
            setDeck((current) => [...current, ...cards]);
        } catch {
            setError('The style feed is taking a moment.');
        } finally {
            setLoading(false);
        }
    }, [identity]);

    useEffect(() => { void load(false); }, [load]);

    // Refill before the deck runs dry so the next card is never a spinner.
    useEffect(() => {
        if (!loading && !error && !exhausted && deck.length <= REFILL_AT) void load(true);
    }, [deck.length, loading, error, exhausted, load]);

    // Warm the next few hero images.
    useEffect(() => {
        deck.slice(1, 4).forEach((card) => {
            const src = card.product.images[0];
            if (src) new Image().src = getShopifySizedImage(src, 900);
        });
    }, [deck]);

    const dismissHint = useCallback(() => {
        if (!showHint) return;
        setShowHint(false);
        try { localStorage.setItem(HINT_KEY, '1'); } catch { /* storage unavailable */ }
    }, [showHint]);

    const event = useCallback((kind: Parameters<typeof Recommendations.sendEvent>[2], card: DeckCard) =>
        Recommendations.sendEvent(identity.userId, identity.sessionId, kind, card.product.id, card.requestId, card.position), [identity]);

    const saveCard = (card: DeckCard) => {
        event('save', card);
        try {
            const saved = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');
            if (Array.isArray(saved) && !saved.includes(card.product.id)) localStorage.setItem('juno_wishlist', JSON.stringify([...saved, card.product.id]));
        } catch {
            // Saving to the recommendation service still succeeds if browser storage is unavailable.
        }
    };

    const addToBag = (card: DeckCard) => {
        const { product } = card;
        const variant = product.variants?.find((candidate) => candidate.available);
        if (!variant) return;
        addItem(product.id, variant.id, 1, product.pricing.brand_price ?? product.pricing.price, {
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: variant.title,
            variant_options: variant.options,
            image_url: variant.image_url || product.images?.[0],
            max_quantity: variant.inventory?.available_quantity ?? product.inventory?.available_quantity,
            is_available: true,
            free_shipping: !!product.shipping_details?.free_shipping,
            delivery_days: product.shipping_details?.estimated_delivery_days || 7,
            source: 'swipe',
        });
        event('add_to_cart', card);
        setCartOpen(true);
    };

    // Called by the card once it has flown off-screen.
    const commit = (action: SwipeAction) => {
        if (!top) return;
        if (action === 'left') event('dislike', top);
        if (action === 'right') saveCard(top);
        if (action === 'up') addToBag(top);
        setHistory((past) => [top, ...past].slice(0, 10));
        setDeck((current) => (current[0] === top ? current.slice(1) : current));
        setPendingAction(null);
        dismissHint();
    };

    const undo = () => {
        const [card, ...rest] = history;
        if (!card || pendingAction) return;
        buzz(8);
        setHistory(rest);
        setDeck((current) => [card, ...current]);
    };

    const view = () => {
        if (!top) return;
        event('view', top);
        navigate(`/catalog/${top.product.id}`);
    };

    const trigger = (action: SwipeAction) => {
        if (!top || pendingAction) return;
        setPendingAction(action);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'ArrowLeft') trigger('left');
            else if (e.key === 'ArrowRight') trigger('right');
            else if (e.key === 'ArrowUp') { e.preventDefault(); trigger('up'); }
            else if (e.key === 'Enter') view();
            else if (e.key === 'Backspace' || e.key === 'z') undo();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const ambient = top?.product.images[0] ? getShopifySizedImage(top.product.images[0], 48) : undefined;

    return (
        <div className="relative flex h-dvh select-none flex-col overflow-hidden overscroll-none bg-[#070607] text-white">
            {/* ambient backdrop: tiny blurred copy of the hero, cheap to composite */}
            <AnimatePresence>
                {ambient ? <motion.div key={ambient} initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ backgroundImage: `url(${ambient})` }} className="pointer-events-none absolute inset-0 scale-125 bg-cover bg-center blur-3xl" /> : null}
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070607]/70 via-transparent to-[#070607]" />

            {/* top bar */}
            <header className="relative z-20 flex h-14 items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
                <Link to="/catalog" aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur transition hover:bg-white/[0.12]"><ArrowLeft size={18} /></Link>
                <Link to="/" className="absolute left-1/2 -translate-x-1/2"><img src="/images/juno-logos/icon+text_white.png" alt="Juno" className="h-5 w-auto" /></Link>
                <div className="flex items-center gap-2">
                    <Link to="/catalog/legacy" aria-label="Browse catalog" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur transition hover:bg-white/[0.12]"><LayoutGrid size={17} /></Link>
                    <button type="button" onClick={() => setCartOpen(true)} aria-label="Bag" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur transition hover:bg-white/[0.12]">
                        <ShoppingBag size={17} />
                        {itemCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary px-1 text-[9px] font-black">{itemCount > 9 ? '9+' : itemCount}</span> : null}
                    </button>
                </div>
            </header>

            {/* deck */}
            <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pb-2 pt-1 sm:px-6">
                <div className="relative h-full w-full max-w-[430px] max-h-[780px]">
                    {error ? (
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
                                <Link to="/wishlist" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[0.16em]"><Heart size={14} /> Saves</Link>
                            </div>
                        </div>
                    ) : null}

                    <AnimatePresence initial={false}>
                        {deck.slice(0, 3).map((card, depth) => (
                            <SwipeCard key={card.product.id} card={card} depth={depth} pendingAction={depth === 0 ? pendingAction : null} onCommit={commit} onView={view} onInteract={dismissHint} />
                        ))}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showHint && top ? (
                            <motion.button type="button" onClick={dismissHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 rounded-[1.75rem] bg-black/70 backdrop-blur-sm">
                                <div className="grid grid-cols-3 gap-6 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/80">
                                    <span className="flex flex-col items-center gap-3"><motion.span animate={{ x: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30"><X size={22} /></motion.span>Swipe left<br />pass</span>
                                    <span className="flex flex-col items-center gap-3"><motion.span animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30"><ShoppingBag size={22} /></motion.span>Swipe up<br />add to bag</span>
                                    <span className="flex flex-col items-center gap-3"><motion.span animate={{ x: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 1.6, delay: 0.6 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary"><Heart size={22} /></motion.span>Swipe right<br />save</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Tap photo edges for more shots · tap to start</span>
                            </motion.button>
                        ) : null}
                    </AnimatePresence>
                </div>
            </main>

            {/* actions */}
            <footer className="relative z-20 flex items-center justify-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:gap-4">
                <ActionButton label="Undo" size="sm" onClick={undo} disabled={!history.length}><Undo2 size={18} /></ActionButton>
                <ActionButton label="Pass" size="lg" onClick={() => trigger('left')} disabled={!top}><X size={30} strokeWidth={2.5} /></ActionButton>
                <ActionButton label="Add to bag" size="md" onClick={() => trigger('up')} disabled={!top}><ShoppingBag size={22} /></ActionButton>
                <ActionButton label="Save" size="lg" variant="primary" onClick={() => trigger('right')} disabled={!top}><Heart size={30} strokeWidth={2.5} fill="currentColor" /></ActionButton>
                <ActionButton label="Details" size="sm" onClick={view} disabled={!top}><Info size={18} /></ActionButton>
            </footer>
        </div>
    );
};

export default SwipeShopPage;
