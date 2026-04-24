import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Minus,
    Package,
    Plus,
    Ruler,
    ShoppingBag,
    Sparkles,
    Star,
    Truck,
    Zap,
} from 'lucide-react';
import { type ProductVariant } from '../../api/api';
import { PublicCampaigns } from '../../api/campaignsApi';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { useTrackProductView } from '../../hooks/useProbe';
import CampaignLayout from './CampaignLayout';
import SizeGuideModal from '../catalog/SizeGuideModal';
import { setClarityTags, trackClarityEventWithTags, upgradeClaritySession } from '../../utils/clarity';

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const getBaseProductPrice = (product: any): number => {
    const listPrice = product?.pricing?.price ?? 0;
    const discounted = product?.pricing?.discounted;
    const discountedPrice = product?.pricing?.discounted_price;
    return discounted ? (discountedPrice ?? listPrice) : listPrice;
};
const getVariantAvailableQuantity = (variant: any, product: any): number | undefined => {
    const variantQty = variant?.inventory?.available_quantity ?? variant?.inventory?.quantity;
    if (typeof variantQty === 'number' && Number.isFinite(variantQty)) return Math.max(0, variantQty);
    const productQty = product?.inventory?.available_quantity ?? product?.inventory?.quantity;
    if (typeof productQty === 'number' && Number.isFinite(productQty)) return Math.max(0, productQty);
    return undefined;
};

type CampaignCartPayload = {
    productId: string;
    variantId: string;
    price: number;
    meta: {
        seller_name?: string;
        product_title?: string;
        variant_title?: string;
        variant_options?: Record<string, string>;
        image_url?: string;
        source: string;
    };
};

const isPurchasableVariant = (variant: any, product: any): boolean => {
    if (!variant) return false;
    if (variant.available === false) return false;
    const qty = getVariantAvailableQuantity(variant, product);
    return typeof qty === 'number' ? qty > 0 : true;
};

/* ── Helpers for delivery timeline ── */
const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtRange = (a: Date, b: Date) => `${fmtDay(a)} — ${fmtDay(b)}`;

/* ── Skeleton ── */
const ProductSkeleton: React.FC = () => (
    <div className="relative min-h-screen bg-[#050505] text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-8 pb-32">
            <div className="mb-6 h-5 w-36 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:gap-16">
                <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-white/[0.06]" />
                <div className="space-y-5">
                    {[48, 80, 48, 32, 120, 160].map((h, i) => (
                        <div key={i} className="animate-pulse rounded-lg bg-white/[0.06]" style={{ height: h }} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const CampaignProductPage: React.FC = () => {
    const { campaignSlug, productId } = useParams<{ campaignSlug: string; productId: string }>();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageIdx, setSelectedImageIdx] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const trackedProductViewRef = useRef<string>('');
    const imageTouchStartXRef = useRef<number | null>(null);
    const { addItem, setCartOpen } = useGuestCart();
    const navigate = useNavigate();

    useTrackProductView(productId || '', data?.product?.categories?.[0]?.id);

    /* ── Load product ── */
    useEffect(() => {
        let cancelled = false;
        if (!campaignSlug || !campaignSlug.endsWith('-campaign') || !productId) {
            navigate('/404', { replace: true });
            return;
        }
        const slug = campaignSlug.replace(/-campaign$/, '');
        const loadProduct = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const resp = await PublicCampaigns.getPublicCampaignProduct(slug, productId);
                if (cancelled) return;
                if (resp.ok) {
                    setData(resp.body);
                    const product = resp.body.product;
                    setSelectedImageIdx(0);
                    const variants = asArray(product?.variants);
                    const defaultVariant =
                        variants.find((variant: any) => isPurchasableVariant(variant, product)) ||
                        variants[0];
                    setSelectedOptions(
                        defaultVariant?.options
                            ? { ...defaultVariant.options }
                            : Object.fromEntries(
                                (product.options || []).map((option: any) => [
                                    option.name,
                                    option.values?.[0] ?? '',
                                ])
                            )
                    );
                } else {
                    setError('Product not found in this campaign.');
                }
            } catch {
                if (!cancelled) setError('Failed to load product.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        loadProduct();
        return () => { cancelled = true; };
    }, [campaignSlug, productId, navigate]);

    const selectedVariant = useMemo<ProductVariant | undefined>(() => {
        if (!data?.product) return undefined;
        const variants = data.product.variants || [];
        return (
            variants.find((variant: any) =>
                Object.entries(selectedOptions).every(
                    ([name, value]) => variant.options?.[name] === value
                )
            ) ??
            variants.find((variant: any) => isPurchasableVariant(variant, data.product)) ??
            variants[0]
        );
    }, [data, selectedOptions]);

    const product = data?.product;
    const campaign = data?.campaign;
    const variants = asArray(product?.variants);
    const maxAvailableQuantity = getVariantAvailableQuantity(selectedVariant, product);
    const isVariantAvailable = selectedVariant?.available ?? true;
    const canPurchase = !!product?.inventory?.in_stock && isVariantAvailable;

    const cartPayload = useCallback((): CampaignCartPayload | null => {
        if (!product || !selectedVariant || !campaignSlug) return null;
        const slug = campaignSlug.replace(/-campaign$/, '');
        const basePrice = getBaseProductPrice(product);
        return {
            productId: product.id,
            variantId: selectedVariant.id,
            price: basePrice,
            meta: {
                seller_name: product.seller_name,
                product_title: product.title,
                variant_title: selectedVariant.title,
                variant_options: selectedVariant.options,
                image_url: product.images?.[0] || '/juno_app_icon.png',
                source: `campaign:${slug}`,
            },
        };
    }, [product, selectedVariant, campaignSlug]);

    const trackCartAction = useCallback(
        (
            action: 'add_to_bag' | 'buy_now',
            status: 'click' | 'blocked',
            payload: CampaignCartPayload | null,
            extra?: Record<string, string>
        ) => {
            const eventName = `campaign_${action}_${status}`;
            const payloadTags = payload
                ? {
                    product_id: payload.productId,
                    variant_id: payload.variantId,
                    unit_price: String(payload.price),
                }
                : {};

            trackClarityEventWithTags(eventName, {
                campaign_slug: campaign?.slug ?? 'unknown',
                product_id: product?.id ?? 'unknown',
                variant_id: selectedVariant?.id ?? 'none',
                ...payloadTags,
                ...(extra ?? {}),
            });
        },
        [campaign?.slug, product?.id, selectedVariant?.id]
    );

    const handleAddToCart = useCallback(() => {
        const p = cartPayload();
        if (!p) {
            trackCartAction('add_to_bag', 'blocked', null, {
                reason: 'missing_payload',
            });
            return;
        }
        if (!canPurchase) {
            trackCartAction('add_to_bag', 'blocked', p, {
                reason: 'out_of_stock',
            });
            return;
        }
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            setQuantity(Math.max(1, maxAvailableQuantity));
            trackCartAction('add_to_bag', 'blocked', p, {
                requested_quantity: String(quantity),
                max_quantity: String(maxAvailableQuantity),
                reason: 'quantity_exceeded',
            });
            return;
        }
        trackCartAction('add_to_bag', 'click', p, {
            quantity: String(quantity),
            total_price: String(p.price * quantity),
        });
        upgradeClaritySession('campaign_add_to_cart');
        setIsAdding(true);
        addItem(p.productId, p.variantId, quantity, p.price, {
            ...p.meta,
            max_quantity: maxAvailableQuantity,
            is_available: canPurchase,
        });
        setShowAddedFeedback(true);
        setIsAdding(false);
        window.setTimeout(() => setCartOpen(true), 350);
    }, [cartPayload, quantity, addItem, setCartOpen, canPurchase, maxAvailableQuantity, trackCartAction]);

    const handleBuyNow = useCallback(() => {
        const p = cartPayload();
        if (!p) {
            trackCartAction('buy_now', 'blocked', null, {
                reason: 'missing_payload',
            });
            return;
        }
        if (!canPurchase) {
            trackCartAction('buy_now', 'blocked', p, {
                reason: 'out_of_stock',
            });
            return;
        }
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            setQuantity(Math.max(1, maxAvailableQuantity));
            trackCartAction('buy_now', 'blocked', p, {
                requested_quantity: String(quantity),
                max_quantity: String(maxAvailableQuantity),
                reason: 'quantity_exceeded',
            });
            return;
        }
        trackCartAction('buy_now', 'click', p, {
            quantity: String(quantity),
            total_price: String(p.price * quantity),
        });
        upgradeClaritySession('campaign_buy_now');
        setIsBuyingNow(true);
        addItem(p.productId, p.variantId, quantity, p.price, {
            ...p.meta,
            max_quantity: maxAvailableQuantity,
            is_available: canPurchase,
        });
        window.setTimeout(() => navigate('/checkout'), 200);
    }, [cartPayload, quantity, addItem, navigate, canPurchase, maxAvailableQuantity, trackCartAction]);

    useEffect(() => {
        if (!showAddedFeedback) return;
        const timer = window.setTimeout(() => setShowAddedFeedback(false), 2400);
        return () => window.clearTimeout(timer);
    }, [showAddedFeedback]);

    useEffect(() => {
        if (typeof maxAvailableQuantity === 'number' && maxAvailableQuantity > 0 && quantity > maxAvailableQuantity) {
            setQuantity(maxAvailableQuantity);
        }
    }, [quantity, maxAvailableQuantity]);

    useEffect(() => {
        if (!campaign || !product) return;
        const viewKey = `${campaign.slug}:${product.id}`;
        if (trackedProductViewRef.current === viewKey) return;
        trackedProductViewRef.current = viewKey;

        setClarityTags({
            campaign_slug: campaign.slug,
            campaign_name: campaign.name,
            campaign_stage: 'product',
            campaign_product_id: product.id,
            campaign_product_title: product.title,
            campaign_seller: product.seller_name || 'unknown',
        });
        trackClarityEventWithTags('campaign_product_view', {
            campaign_slug: campaign.slug,
            product_id: product.id,
            variant_id: selectedVariant?.id || 'none',
            in_stock: String(canPurchase),
        });
    }, [campaign?.slug, campaign?.name, product?.id, product?.title, product?.seller_name, selectedVariant?.id, canPurchase]);

    const currentPrice = getBaseProductPrice(product);
    const compareAt = product?.pricing?.compare_at_price;
    const discountPercentage = compareAt && currentPrice ? Math.round(((compareAt - currentPrice) / compareAt) * 100) : 0;
    const imageGallery = useMemo(() => asArray(product?.images), [product?.images]);
    const description = product?.short_description || product?.description;
    const eta = product?.shipping_details?.estimated_delivery_days || 3;
    const currentImage = imageGallery[selectedImageIdx] || '/juno_app_icon.png';
    const inStock = canPurchase;
    const stockCount = product?.inventory?.quantity ?? null;
    const lowStock = typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5;

    const thumbnailIndices = useMemo(() => {
        const len = imageGallery.length;
        if (len <= 6) return imageGallery.map((_, index) => index);

        const indices = new Set<number>([0, len - 1, selectedImageIdx]);
        for (let offset = -1; offset <= 1; offset += 1) {
            indices.add((selectedImageIdx + offset + len) % len);
        }

        return Array.from(indices).sort((a, b) => a - b);
    }, [imageGallery, selectedImageIdx]);

    if (isLoading || !data) {
        return (
            <CampaignLayout campaign={{ name: 'Loading', slug: campaignSlug || '' }} hideBanner>
                <ProductSkeleton />
            </CampaignLayout>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                        <span className="text-4xl">!</span>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {error}
                    </h1>
                    <button
                        onClick={() => navigate(`/${campaignSlug}`)}
                        className="w-full py-4 rounded-full bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200 transition-all"
                    >
                        Back to Campaign
                    </button>
                </div>
            </div>
        );
    }

    /* ── Delivery dates ── */
    const today = new Date();
    const processingStart = today;
    const processingEnd = addDays(today, 1);
    const deliveryStart = addDays(today, Math.max(eta - 1, 1));
    const deliveryEnd = addDays(today, eta);

    const cycleImage = (dir: 1 | -1) => {
        if (imageGallery.length < 2) return;
        const next = (selectedImageIdx + dir + imageGallery.length) % imageGallery.length;
        trackClarityEventWithTags('campaign_product_image_change', {
            campaign_slug: campaign?.slug ?? 'unknown',
            product_id: product?.id ?? 'unknown',
            direction: dir === 1 ? 'next' : 'prev',
            from_index: String(selectedImageIdx),
            to_index: String(next),
        });
        setSelectedImageIdx(next);
    };

    const handleSearch = (query: string) => {
        trackClarityEventWithTags('campaign_product_search_submit', {
            campaign_slug: campaign?.slug ?? 'unknown',
            product_id: product?.id ?? 'unknown',
            search_query: query.trim() || 'empty',
        });
        navigate(`/${campaignSlug}?q=${encodeURIComponent(query)}`);
    };

    return (
        <CampaignLayout campaign={campaign} onSearch={handleSearch} hideBanner>
            <div className="relative bg-[#050505] text-white pb-36 lg:pb-12">

                {/* ── Ambient atmosphere ── */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[140px]" />
                    <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[160px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 pt-6">

                    {/* ── Back nav ── */}
                    <button
                        onClick={() => {
                            trackClarityEventWithTags('campaign_product_back_click', {
                                campaign_slug: campaign?.slug ?? 'unknown',
                                product_id: product?.id ?? 'unknown',
                            });
                            if (window.history.length > 2) navigate(-1);
                            else navigate(`/${campaignSlug}`);
                        }}
                        className="mb-5 inline-flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 transition-all hover:text-white group"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all group-hover:border-white/25 group-hover:bg-white/[0.08]">
                            <ArrowLeft size={12} />
                        </span>
                        {campaign.name}
                    </button>

                    {/* ── Main grid ── */}
                    <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:gap-16 xl:items-start">

                        {/* ══ LEFT: Image ══ */}
                        <div className="min-w-0 space-y-3 xl:sticky xl:top-24">
                            <div className="group relative w-full overflow-hidden rounded-2xl bg-[#0d0d0e]">

                                {/* Floating badges — top-left, no backdrop dimming image */}
                                {(discountPercentage > 0 || lowStock) ? (
                                    <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
                                        {discountPercentage > 0 ? (
                                            <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(220,10,40,0.35)]">
                                                −{discountPercentage}%
                                            </span>
                                        ) : null}
                                        {lowStock ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                Only {stockCount} left
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}

                                {/* Image counter — top-right */}
                                {imageGallery.length > 1 ? (
                                    <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-black/45 px-2 py-1 text-[10px] font-mono font-bold tracking-wider text-white/90 backdrop-blur-sm">
                                        {selectedImageIdx + 1} / {imageGallery.length}
                                    </div>
                                ) : null}

                                {/* Desktop arrow nav — hidden on mobile (swipe instead) */}
                                {imageGallery.length > 1 ? (
                                    <>
                                        <button
                                            onClick={() => cycleImage(-1)}
                                            className="hidden md:flex absolute left-3 top-1/2 z-20 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-white"
                                            aria-label="Previous"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            onClick={() => cycleImage(1)}
                                            className="hidden md:flex absolute right-3 top-1/2 z-20 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-white"
                                            aria-label="Next"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </>
                                ) : null}

                                {/* Swipeable image - one layer keeps mobile compositing cheap */}
                                <div
                                    onTouchStart={(event) => {
                                        imageTouchStartXRef.current = event.touches[0]?.clientX ?? null;
                                    }}
                                    onTouchEnd={(event) => {
                                        const startX = imageTouchStartXRef.current;
                                        imageTouchStartXRef.current = null;
                                        if (startX === null || imageGallery.length < 2) return;

                                        const endX = event.changedTouches[0]?.clientX ?? startX;
                                        const delta = endX - startX;
                                        if (delta < -50) cycleImage(1);
                                        else if (delta > 50) cycleImage(-1);
                                    }}
                                    className="relative w-full aspect-[4/5] sm:aspect-[3/4] touch-pan-y"
                                >
                                    <img
                                        key={currentImage}
                                        src={currentImage}
                                        alt={`${product.title} ${selectedImageIdx + 1}`}
                                        loading={selectedImageIdx === 0 ? 'eager' : 'lazy'}
                                        fetchPriority={selectedImageIdx === 0 ? 'high' : 'auto'}
                                        decoding="async"
                                        draggable={false}
                                        className="block h-full w-full select-none object-cover"
                                    />
                                </div>
                            </div>

                            {/* Thumbnail strip — windowed so large galleries stay cheap */}
                            {imageGallery.length > 1 ? (
                                <div className="flex gap-2.5 overflow-x-auto pt-1 pb-2 -mx-1 px-1 scrollbar-none">
                                    {thumbnailIndices.map((i) => {
                                        const image = imageGallery[i];
                                        const active = selectedImageIdx === i;
                                        return (
                                            <button
                                                key={`${image}-${i}`}
                                                onClick={() => {
                                                    trackClarityEventWithTags('campaign_product_thumbnail_click', {
                                                        campaign_slug: campaign?.slug ?? 'unknown',
                                                        product_id: product?.id ?? 'unknown',
                                                        from_index: String(selectedImageIdx),
                                                        to_index: String(i),
                                                    });
                                                    setSelectedImageIdx(i);
                                                }}
                                                className={`relative shrink-0 overflow-hidden rounded-xl transition-all w-[82px] md:w-[96px] ${
                                                    active
                                                        ? 'ring-2 ring-inset ring-white'
                                                        : 'opacity-55 hover:opacity-95'
                                                }`}
                                            >
                                                <img
                                                    src={image}
                                                    alt={`View ${i + 1}`}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="aspect-[3/4] w-full object-cover"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>

                        {/* ══ RIGHT: Details ══ */}
                        <div className="min-w-0 space-y-6">

                            {/* ── Title block ── */}
                            <div>
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-white/30">
                                        {campaign.name} · Drop
                                    </span>
                                    {product.is_featured ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                                            <Sparkles size={9} />
                                            Featured
                                        </span>
                                    ) : null}
                                </div>

                                <h1
                                    className="text-white"
                                    style={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 900,
                                        fontSize: 'clamp(2.4rem, 5vw, 4.8rem)',
                                        lineHeight: 0.88,
                                        letterSpacing: '-0.055em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {product.title}
                                </h1>

                                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                                    by <span className="text-white/80">{product.seller_name || 'Juno Label'}</span>
                                </p>

                                {/* Price */}
                                <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <span
                                        className="text-white"
                                        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 2.75rem)', letterSpacing: '-0.05em' }}
                                    >
                                        {formatCurrency(currentPrice)}
                                    </span>
                                    {compareAt ? (
                                        <>
                                            <span className="text-xl text-white/25 line-through">
                                                {formatCurrency(compareAt)}
                                            </span>
                                            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                                Save {formatCurrency(compareAt - currentPrice)}
                                            </span>
                                        </>
                                    ) : null}
                                </div>

                                {/* Review + shipping inline */}
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
                                    {product.rating ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        size={12}
                                                        className={s <= Math.round(product.rating) ? 'fill-amber-300 text-amber-300' : 'text-white/15'}
                                                    />
                                                ))}
                                            </div>
                                            <span className="font-semibold text-white/70">
                                                {product.rating.toFixed(1)}
                                            </span>
                                            {product.review_count ? (
                                                <span className="text-white/40">({product.review_count})</span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    {product.shipping_details?.free_shipping ? (
                                        <div className="flex items-center gap-1.5 text-emerald-400">
                                            <Truck size={12} />
                                            <span className="font-semibold">Free delivery</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* ── SHIPPING TIMELINE ── */}
                            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                                {/* Delivery promise */}
                                <div className="border-b border-white/[0.06] px-4 py-3">
                                    <p className="text-[11px] leading-snug text-white/70">
                                        Order will arrive on{' '}
                                        <span className="font-bold text-white">{fmtRange(deliveryStart, deliveryEnd)}</span>
                                    </p>
                                </div>

                                {/* Timeline */}
                                <div className="px-4 py-5">
                                    <div className="relative flex items-start justify-between">
                                        {/* Progress rail */}
                                        <div className="absolute left-5 right-5 top-5 h-px -translate-y-1/2 bg-white/10" />
                                        <div className="absolute left-5 top-5 h-px w-[15%] -translate-y-1/2 bg-white/60" />

                                        {[
                                            { icon: CreditCard, label: 'Purchased', date: fmtDay(today), active: true },
                                            { icon: Package, label: 'Processing', date: fmtRange(processingStart, processingEnd), active: false },
                                            { icon: Truck, label: 'Delivered', date: fmtRange(deliveryStart, deliveryEnd), active: false },
                                        ].map(({ icon: Icon, label, date, active }) => (
                                            <div key={label} className="relative z-10 flex flex-col items-center gap-2 text-center" style={{ width: '33%' }}>
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                                                        active
                                                            ? 'bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.2)]'
                                                            : 'border border-white/15 bg-[#0d0d0e] text-white/35'
                                                    }`}
                                                >
                                                    <Icon size={15} strokeWidth={active ? 2.4 : 2} />
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${active ? 'text-white' : 'text-white/45'}`}>
                                                        {label}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-white/40">{date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Size / Variants ── */}
                            {asArray(product.options).length > 0 ? (
                                <div className="space-y-4">
                                    {asArray(product.options).map((option) => (
                                        <div key={option.name}>
                                            <div className="mb-2.5 flex items-center justify-between">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                                                        {option.name}
                                                    </p>
                                                    <p className="text-sm text-white/60" style={{ fontFamily: 'Instrument Serif, serif' }}>
                                                        {selectedOptions[option.name]}
                                                    </p>
                                                </div>
                                                {option.name.toLowerCase().includes('size') ? (
                                                    <button
                                                        onClick={() => {
                                                            trackClarityEventWithTags('campaign_size_guide_open', {
                                                                campaign_slug: campaign?.slug ?? 'unknown',
                                                                product_id: product?.id ?? 'unknown',
                                                                variant_id: selectedVariant?.id ?? 'none',
                                                            });
                                                            setShowSizeGuide(true);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-white"
                                                    >
                                                        <Ruler size={11} />
                                                        Size guide
                                                    </button>
                                                ) : null}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {asArray(option.values).map((value) => {
                                                    const isActive = selectedOptions[option.name] === value;
                                                    const isValueAvailable = variants.some((variant: any) => {
                                                        if (variant?.options?.[option.name] !== value) return false;
                                                        const matchesOtherSelectedOptions = asArray(product.options).every((otherOption: any) => {
                                                            if (otherOption?.name === option.name) return true;
                                                            const selectedValue = selectedOptions[otherOption?.name];
                                                            if (!selectedValue) return true;
                                                            return variant?.options?.[otherOption.name] === selectedValue;
                                                        });
                                                        if (!matchesOtherSelectedOptions) return false;
                                                        if (variant?.available === false) return false;
                                                        const qty = getVariantAvailableQuantity(variant, product);
                                                        return typeof qty === 'number' ? qty > 0 : true;
                                                    });
                                                    return (
                                                        <motion.button
                                                            key={value}
                                                            whileTap={{ scale: 0.93 }}
                                                            onClick={() => {
                                                                if (!isValueAvailable) return;
                                                                trackClarityEventWithTags('campaign_variant_option_select', {
                                                                    campaign_slug: campaign?.slug ?? 'unknown',
                                                                    product_id: product?.id ?? 'unknown',
                                                                    option_name: option.name,
                                                                    option_value: value,
                                                                });
                                                                setSelectedOptions((cur) => ({ ...cur, [option.name]: value }));
                                                            }}
                                                            disabled={!isValueAvailable}
                                                            className={`relative min-w-[3rem] rounded-lg px-3.5 py-2.5 text-sm font-bold transition-all ${
                                                                isActive
                                                                    ? 'bg-white text-black shadow-[0_6px_18px_rgba(255,255,255,0.18)]'
                                                                    : isValueAvailable
                                                                        ? 'border border-white/12 bg-white/[0.03] text-white/70 hover:border-white/30 hover:bg-white/[0.06] hover:text-white'
                                                                        : 'cursor-not-allowed border border-white/10 bg-white/[0.02] text-white/35 line-through decoration-white/30'
                                                            }`}
                                                        >
                                                            {isActive ? (
                                                                <span className="flex items-center justify-center gap-1.5">
                                                                    <Check size={12} strokeWidth={3} />
                                                                    {value}
                                                                </span>
                                                            ) : value}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {/* ── Quantity + CTAs ── */}
                            <div className="space-y-3">
                                {/* Quantity */}
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Quantity</p>
                                    <div className="inline-flex items-center rounded-xl border border-white/12 bg-black/30 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                const next = Math.max(1, quantity - 1);
                                                if (next !== quantity) {
                                                    trackClarityEventWithTags('campaign_quantity_change', {
                                                        campaign_slug: campaign?.slug ?? 'unknown',
                                                        product_id: product?.id ?? 'unknown',
                                                        variant_id: selectedVariant?.id ?? 'none',
                                                        action: 'decrement',
                                                        quantity: String(next),
                                                    });
                                                    setQuantity(next);
                                                }
                                            }}
                                            className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center text-sm font-black text-white">{quantity}</span>
                                        <button
                                            onClick={() => {
                                                const cap =
                                                    typeof maxAvailableQuantity === 'number'
                                                        ? maxAvailableQuantity
                                                        : Number.POSITIVE_INFINITY;
                                                const next = Math.min(quantity + 1, cap);
                                                if (next !== quantity) {
                                                    trackClarityEventWithTags('campaign_quantity_change', {
                                                        campaign_slug: campaign?.slug ?? 'unknown',
                                                        product_id: product?.id ?? 'unknown',
                                                        variant_id: selectedVariant?.id ?? 'none',
                                                        action: 'increment',
                                                        quantity: String(next),
                                                    });
                                                    setQuantity(next);
                                                } else {
                                                    trackClarityEventWithTags('campaign_quantity_cap_reached', {
                                                        campaign_slug: campaign?.slug ?? 'unknown',
                                                        product_id: product?.id ?? 'unknown',
                                                        variant_id: selectedVariant?.id ?? 'none',
                                                        max_quantity: String(maxAvailableQuantity ?? 'unknown'),
                                                    });
                                                }
                                            }}
                                            disabled={typeof maxAvailableQuantity === 'number' && quantity >= maxAvailableQuantity}
                                            className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* PRIMARY: Buy Now */}
                                <motion.button
                                    whileTap={{ scale: 0.985 }}
                                    onClick={handleBuyNow}
                                    disabled={!inStock || isBuyingNow}
                                    className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary py-5 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_48px_rgba(220,10,40,0.38)] transition-all hover:shadow-[0_22px_56px_rgba(220,10,40,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                                        <Zap size={18} className="fill-white" />
                                        {isBuyingNow ? 'Going to checkout…' : `Buy now · ${formatCurrency(currentPrice * quantity)}`}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2.8s_ease-in-out_infinite]" />
                                </motion.button>

                                {/* SECONDARY: Add to Bag */}
                                <motion.button
                                    whileTap={{ scale: 0.985 }}
                                    onClick={handleAddToCart}
                                    disabled={!inStock || isAdding}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ShoppingBag size={14} />
                                    {isAdding ? 'Adding…' : 'Add to bag'}
                                </motion.button>

                                {!inStock ? (
                                    <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-red-400">
                                        Currently sold out
                                    </p>
                                ) : null}

                                <AnimatePresence>
                                    {showAddedFeedback ? (
                                        <motion.p
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400"
                                        >
                                            ✓ Added to bag
                                        </motion.p>
                                    ) : null}
                                </AnimatePresence>
                            </div>

                            {/* ── Description ── */}
                            {description ? (
                                <div className="relative border-t border-white/[0.08] pt-5">
                                    <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35 mb-2.5">
                                        The piece
                                    </p>
                                    <p
                                        className="text-base leading-7 text-white/70"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        {description}
                                    </p>
                                </div>
                            ) : null}

                            {/* ── Tags ── */}
                            {asArray(product.tags).length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {asArray(product.tags).slice(0, 6).map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/40"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* ── STICKY MOBILE BUY BAR (HIGH PROMINENCE) ── */}
                <AnimatePresence>
                    {inStock ? (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                            className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050505]/96 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.8)] lg:hidden"
                        >
                            {/* Delivery strip */}
                            <div className="mb-2.5 text-center text-[10px] text-white/55">
                                Arrives <span className="font-bold text-white">{fmtRange(deliveryStart, deliveryEnd)}</span>
                            </div>

                            <div className="mx-auto flex max-w-lg items-stretch gap-2">
                                {/* Bag button (secondary) */}
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={handleAddToCart}
                                    disabled={isAdding}
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white transition-all hover:bg-white/[0.1]"
                                    aria-label="Add to bag"
                                >
                                    <ShoppingBag size={18} />
                                </motion.button>

                                {/* Buy now primary */}
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleBuyNow}
                                    disabled={isBuyingNow}
                                    className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-white shadow-[0_10px_28px_rgba(220,10,40,0.4)]"
                                >
                                    <div className="flex items-center justify-between gap-3 py-2.5">
                                        <div className="text-left">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/80">
                                                Buy now
                                            </p>
                                            <p className="text-base font-black leading-tight" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.04em' }}>
                                                {formatCurrency(currentPrice * quantity)}
                                            </p>
                                        </div>
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                                            <Zap size={16} className="fill-white" />
                                        </div>
                                    </div>
                                    <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2.8s_ease-in-out_infinite]" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(0%); }
                    60%, 100% { transform: translateX(400%); }
                }
            `}</style>
        </CampaignLayout>
    );
};

export default CampaignProductPage;
