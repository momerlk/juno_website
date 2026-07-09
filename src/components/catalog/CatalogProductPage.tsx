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
import { Catalog, type CatalogProduct, type ProductVariant } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { useTrackProductView } from '../../hooks/useProbe';
import CatalogNavbar from './CatalogNavbar';
import SizeGuideModal from './SizeGuideModal';
import { toTikTokProductContent, trackTikTokViewContent } from '../../utils/tiktokPixel';
import { getResponsiveShopifyImageSet } from '../../utils/shopifyImage';

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const DEFAULT_DELIVERY_DAYS = 8;

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const getBaseProductPrice = (product: Partial<CatalogProduct> | null): number => {
    if (!product) return 0;
    return product.pricing?.discounted
        ? product.pricing.discounted_price ?? product.pricing.price ?? 0
        : product.pricing?.price ?? 0;
};

const getVariantAvailableQuantity = (variant: any, product: CatalogProduct | null): number | undefined => {
    const variantQty = variant?.inventory?.available_quantity ?? variant?.inventory?.quantity;
    if (typeof variantQty === 'number' && Number.isFinite(variantQty)) return Math.max(0, variantQty);
    const productQty = product?.inventory?.available_quantity ?? product?.inventory?.quantity;
    if (typeof productQty === 'number' && Number.isFinite(productQty)) return Math.max(0, productQty);
    return undefined;
};

const isPurchasableVariant = (variant: any, product: CatalogProduct | null): boolean => {
    if (!variant) return false;
    if (variant.available === false) return false;
    const qty = getVariantAvailableQuantity(variant, product);
    return typeof qty === 'number' ? qty > 0 : true;
};

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const fmtDay = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const getCatalogBadges = (product: CatalogProduct | null) => ({
    thrifted: Boolean(product?.badges?.thrifted),
    bestSeller: Boolean(product?.badges?.best_seller),
});

const ProductSkeleton: React.FC = () => (
    <div className="relative min-h-screen bg-[#050505] text-white">
        <CatalogNavbar />
        <div className="mx-auto max-w-7xl px-4 pb-32 pt-6 md:px-6">
            <div className="mb-5 h-5 w-36 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:gap-16">
                <div className="space-y-3">
                    <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-white/[0.06]" />
                    <div className="flex gap-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] w-[82px] animate-pulse rounded-xl bg-white/[0.06]" />
                        ))}
                    </div>
                </div>
                <div className="space-y-5">
                    {[40, 64, 28, 150, 140, 220].map((height, i) => (
                        <div key={i} className="animate-pulse rounded-2xl bg-white/[0.06]" style={{ height }} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const CatalogProductPage: React.FC = () => {
    const { productId, genderOrId } = useParams<{ productId?: string; genderOrId?: string }>();
    const actualProductId = productId || genderOrId || '';
    const [product, setProduct] = useState<CatalogProduct | null>(null);
    const [selectedImageIdx, setSelectedImageIdx] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
    const imageTouchStartXRef = useRef<number | null>(null);
    const { addItem, setCartOpen } = useGuestCart();
    const navigate = useNavigate();

    useTrackProductView(actualProductId, product?.categories?.[0]?.id);

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            if (!actualProductId) {
                setError('Product not found.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const productResponse = await Catalog.getProduct(actualProductId);
                if (cancelled) return;

                if (!productResponse.ok) {
                    setError(
                        (productResponse.body as { message?: string }).message ??
                            'Could not load this product.'
                    );
                    setProduct(null);
                    setIsLoading(false);
                    return;
                }

                const nextProduct = productResponse.body;
                const variants = asArray(nextProduct.variants);
                const defaultVariant =
                    variants.find((variant) => isPurchasableVariant(variant, nextProduct)) ||
                    variants[0];

                setProduct(nextProduct);
                setSelectedImageIdx(0);
                setSelectedOptions(
                    defaultVariant?.options
                        ? { ...defaultVariant.options }
                        : Object.fromEntries(
                              asArray(nextProduct.options).map((option) => [
                                  option.name,
                                  asArray(option.values)[0] ?? '',
                              ])
                          )
                );
                setQuantity(1);
                setShowAddedFeedback(false);
                setIsLoading(false);
            } catch {
                if (!cancelled) {
                    setError('Could not load this product.');
                    setIsLoading(false);
                }
            }
        };

        loadProduct();
        return () => {
            cancelled = true;
        };
    }, [actualProductId]);

    useEffect(() => {
        if (!product) return;
        trackTikTokViewContent(
            toTikTokProductContent({
                productId: product.id,
                name: product.title,
                price: getBaseProductPrice(product),
                brand: product.seller_name || 'Juno',
            })
        );
    }, [product]);

    const selectedVariant = useMemo<ProductVariant | undefined>(() => {
        if (!product) return undefined;
        const variants = asArray(product.variants);
        return (
            variants.find((variant) =>
                Object.entries(selectedOptions).every(
                    ([name, value]) => variant.options?.[name] === value
                )
            ) ??
            variants.find((variant) => isPurchasableVariant(variant, product)) ??
            variants[0]
        );
    }, [product, selectedOptions]);

    const imageGallery = useMemo(() => asArray(product?.images), [product?.images]);
    const currentImage = imageGallery[selectedImageIdx] || '/images/misc/juno_app_icon.png';
    const currentImageAspectRatio = imageAspectRatios[currentImage];
    const useContainedMainImage = typeof currentImageAspectRatio === 'number' && currentImageAspectRatio > 0.95;
    const variants = asArray(product?.variants);
    const maxAvailableQuantity = getVariantAvailableQuantity(selectedVariant, product);
    const isVariantAvailable = selectedVariant?.available ?? true;
    const canPurchase = !!product?.inventory?.in_stock && isVariantAvailable;
    const currentPrice = getBaseProductPrice(product);
    const compareAt = product?.pricing.compare_at_price;
    const discountPercentage =
        compareAt && currentPrice ? Math.round(((compareAt - currentPrice) / compareAt) * 100) : 0;
    const description = product?.short_description || product?.description;
    const inStock = canPurchase;
    const stockCount = product?.inventory?.available_quantity ?? product?.inventory?.quantity ?? null;
    const lowStock = typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5;
    const catalogBadges = getCatalogBadges(product);

    useEffect(() => {
        if (typeof maxAvailableQuantity === 'number' && maxAvailableQuantity > 0 && quantity > maxAvailableQuantity) {
            setQuantity(maxAvailableQuantity);
        }
    }, [quantity, maxAvailableQuantity]);

    useEffect(() => {
        if (!showAddedFeedback) return;
        const timer = window.setTimeout(() => setShowAddedFeedback(false), 2400);
        return () => window.clearTimeout(timer);
    }, [showAddedFeedback]);

    useEffect(() => {
        if (imageGallery.length === 0) {
            if (selectedImageIdx !== 0) setSelectedImageIdx(0);
            return;
        }
        if (selectedImageIdx >= imageGallery.length) {
            setSelectedImageIdx(0);
        }
    }, [imageGallery.length, selectedImageIdx]);

    const captureImageAspectRatio = useCallback((src: string, width: number, height: number) => {
        if (!src || width <= 0 || height <= 0) return;
        const ratio = width / height;
        setImageAspectRatios((prev) => {
            if (prev[src] === ratio) return prev;
            return { ...prev, [src]: ratio };
        });
    }, []);

    const handleAddToCart = useCallback(() => {
        if (!product || !selectedVariant) return;
        if (!canPurchase) return;
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            setQuantity(Math.max(1, maxAvailableQuantity));
            return;
        }

        setIsAdding(true);
        addItem(product.id, selectedVariant.id, quantity, currentPrice, {
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: selectedVariant.title,
            variant_options: selectedVariant.options,
            image_url: imageGallery[0] || '/images/misc/juno_app_icon.png',
            max_quantity: maxAvailableQuantity,
            is_available: canPurchase,
            source: 'catalog',
        });
        setShowAddedFeedback(true);
        setIsAdding(false);
        window.setTimeout(() => setCartOpen(true), 350);
    }, [
        addItem,
        canPurchase,
        currentPrice,
        imageGallery,
        maxAvailableQuantity,
        product,
        quantity,
        selectedVariant,
        setCartOpen,
    ]);

    const handleBuyNow = useCallback(() => {
        if (!product || !selectedVariant) return;
        if (!canPurchase) return;
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            setQuantity(Math.max(1, maxAvailableQuantity));
            return;
        }

        setIsBuyingNow(true);
        addItem(product.id, selectedVariant.id, quantity, currentPrice, {
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: selectedVariant.title,
            variant_options: selectedVariant.options,
            image_url: imageGallery[0] || '/images/misc/juno_app_icon.png',
            max_quantity: maxAvailableQuantity,
            is_available: canPurchase,
            source: 'catalog',
        });
        window.setTimeout(() => navigate('/checkout'), 200);
    }, [
        addItem,
        canPurchase,
        currentPrice,
        imageGallery,
        maxAvailableQuantity,
        navigate,
        product,
        quantity,
        selectedVariant,
    ]);

    const cycleImage = (dir: 1 | -1) => {
        if (imageGallery.length < 2) return;
        setSelectedImageIdx((current) => (current + dir + imageGallery.length) % imageGallery.length);
    };

    if (isLoading) {
        return <ProductSkeleton />;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#050505] px-4 pt-24 text-white">
                <CatalogNavbar />
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="max-w-md space-y-6 text-center">
                        <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                            <span className="text-4xl">!</span>
                        </div>
                        <h1
                            className="text-2xl font-black uppercase tracking-tight text-white"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            {error || 'Product unavailable'}
                        </h1>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="w-full rounded-full bg-white py-4 font-black uppercase tracking-[0.22em] text-black transition-all hover:bg-neutral-200"
                        >
                            Back to catalog
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const today = new Date();
    const purchasedDate = today;
    const customMakingDate = addDays(today, 3);
    const readyToShipDate = addDays(today, 6);
    const deliveryDate = addDays(today, product.shipping_details?.estimated_delivery_days || DEFAULT_DELIVERY_DAYS);

    return (
        <div className="relative min-h-screen bg-[#050505] pb-36 text-white lg:pb-12">
            <CatalogNavbar />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[140px]" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[160px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 md:px-6">
                <button
                    onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/catalog'))}
                    className="group mb-5 inline-flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40 transition-all hover:text-white"
                >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all group-hover:border-white/25 group-hover:bg-white/[0.08]">
                        <ArrowLeft size={12} />
                    </span>
                    The catalog
                </button>

                <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-start xl:gap-16">
                    <div className="min-w-0 space-y-3 xl:sticky xl:top-24">
                        <div className="group relative w-full overflow-hidden rounded-2xl bg-[#0d0d0e]">
                            {(discountPercentage > 0 || lowStock || catalogBadges.bestSeller || catalogBadges.thrifted) ? (
                                <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
                                    {discountPercentage > 0 ? (
                                        <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(220,10,40,0.35)]">
                                            -{discountPercentage}%
                                        </span>
                                    ) : null}
                                    {catalogBadges.bestSeller ? (
                                        <span className="rounded-md border border-amber-100/60 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_8px_20px_rgba(255,184,0,0.4)]">
                                            Best Seller
                                        </span>
                                    ) : null}
                                    {catalogBadges.thrifted ? (
                                        <>
                                            <span className="rounded-md bg-emerald-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[0_8px_20px_rgba(40,190,120,0.28)]">
                                                Pre-Loved
                                            </span>
                                            <span className="rounded-md border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm">
                                                One of One
                                            </span>
                                        </>
                                    ) : null}
                                    {lowStock ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                            Only {stockCount} left
                                        </span>
                                    ) : null}
                                </div>
                            ) : null}

                            {imageGallery.length > 1 ? (
                                <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-black/45 px-2 py-1 text-[10px] font-mono font-bold tracking-wider text-white/90 backdrop-blur-sm">
                                    {selectedImageIdx + 1} / {imageGallery.length}
                                </div>
                            ) : null}

                            {imageGallery.length > 1 ? (
                                <>
                                    <button
                                        onClick={() => cycleImage(-1)}
                                        className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all hover:bg-white group-hover:opacity-100 md:flex"
                                        aria-label="Previous"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => cycleImage(1)}
                                        className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all hover:bg-white group-hover:opacity-100 md:flex"
                                        aria-label="Next"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </>
                            ) : null}

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
                                className="relative aspect-[4/5] w-full touch-pan-y sm:aspect-[3/4]"
                            >
                                <img
                                    key={currentImage}
                                    src={currentImage}
                                    alt={`${product.title} ${selectedImageIdx + 1}`}
                                    loading={selectedImageIdx === 0 ? 'eager' : 'lazy'}
                                    fetchpriority={selectedImageIdx === 0 ? 'high' : 'auto'}
                                    decoding="async"
                                    draggable={false}
                                    onLoad={(event) => {
                                        const target = event.currentTarget;
                                        captureImageAspectRatio(currentImage, target.naturalWidth, target.naturalHeight);
                                    }}
                                    className={`block h-full w-full select-none ${
                                        useContainedMainImage ? 'object-contain bg-[#0a0a0b]' : 'object-cover'
                                    }`}
                                />
                            </div>
                        </div>

                        {imageGallery.length > 1 ? (
                            <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1 scrollbar-none">
                                {imageGallery.map((image, index) => {
                                    const active = selectedImageIdx === index;
                                    const thumbnailImage = getResponsiveShopifyImageSet(image, [120, 180, 240, 320]);
                                    return (
                                        <button
                                            key={`thumb-${index}`}
                                            onClick={() => setSelectedImageIdx(index)}
                                            className={`relative w-[82px] shrink-0 overflow-hidden rounded-xl transition-all md:w-[96px] ${
                                                active ? 'ring-2 ring-inset ring-white' : 'opacity-55 hover:opacity-95'
                                            }`}
                                            >
                                                <img
                                                src={thumbnailImage.src}
                                                srcSet={thumbnailImage.srcSet}
                                                sizes="(max-width: 768px) 82px, 96px"
                                                alt={`View ${index + 1}`}
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

                    <div className="min-w-0 space-y-6">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-white/30">
                                    Juno Catalog · Drop
                                </span>
                                {product.is_featured ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                                        <Sparkles size={9} />
                                        Featured
                                    </span>
                                ) : null}
                                {catalogBadges.bestSeller ? (
                                    <span className="inline-flex items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200">
                                        Best Seller
                                    </span>
                                ) : null}
                                {catalogBadges.thrifted ? (
                                    <>
                                        <span className="inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                                            Pre-Loved
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/75">
                                            One of One
                                        </span>
                                    </>
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

                            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span
                                    className="text-white"
                                    style={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 900,
                                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                                        letterSpacing: '-0.05em',
                                    }}
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

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
                                {product.rating ? (
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={12}
                                                    className={
                                                        star <= Math.round(product.rating)
                                                            ? 'fill-amber-300 text-amber-300'
                                                            : 'text-white/15'
                                                    }
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

                        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                            <div className="border-b border-white/[0.06] px-4 py-3">
                                <p className="text-[11px] leading-snug text-white/70">
                                    Expected delivery by <span className="font-bold text-white">{fmtDay(deliveryDate)}</span>
                                </p>
                            </div>

                            <div className="px-4 py-5">
                                <div className="relative flex items-start justify-between">
                                    <div className="absolute left-5 right-5 top-5 h-px -translate-y-1/2 bg-white/10" />
                                    <div className="absolute left-5 top-5 h-px w-[10%] -translate-y-1/2 bg-white/60" />

                                    {[
                                        { icon: CreditCard, label: 'Purchased', date: fmtDay(purchasedDate), active: true },
                                        { icon: Package, label: 'Custom making', date: fmtDay(customMakingDate), active: false },
                                        { icon: Package, label: 'Ready to ship', date: fmtDay(readyToShipDate), active: false },
                                        { icon: Truck, label: 'Delivered', date: fmtDay(deliveryDate), active: false },
                                    ].map(({ icon: Icon, label, date, active }) => (
                                        <div key={label} className="relative z-10 flex w-1/4 flex-col items-center gap-2 text-center">
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

                        {asArray(product.options).length > 0 ? (
                            <div className="space-y-4">
                                {asArray(product.options).map((option) => (
                                    <div key={option.name}>
                                        <div className="mb-2.5 flex items-center justify-between">
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                                                    {option.name}
                                                </p>
                                                <p
                                                    className="text-sm text-white/60"
                                                    style={{ fontFamily: 'Instrument Serif, serif' }}
                                                >
                                                    {selectedOptions[option.name]}
                                                </p>
                                            </div>
                                            {option.name.toLowerCase().includes('size') ? (
                                                <button
                                                    onClick={() => setShowSizeGuide(true)}
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
                                                const isValueAvailable = variants.some((variant) => {
                                                    if (variant?.options?.[option.name] !== value) return false;
                                                    const matchesOtherSelectedOptions = asArray(product.options).every((otherOption) => {
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
                                                            setSelectedOptions((current) => ({ ...current, [option.name]: value }));
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
                                                        ) : (
                                                            value
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Quantity</p>
                                <div className="inline-flex items-center overflow-hidden rounded-xl border border-white/12 bg-black/30">
                                    <button
                                        onClick={() => setQuantity((current) => Math.max(1, current - 1))}
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
                                            setQuantity((current) => Math.min(current + 1, cap));
                                        }}
                                        disabled={typeof maxAvailableQuantity === 'number' && quantity >= maxAvailableQuantity}
                                        className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.985 }}
                                onClick={handleBuyNow}
                                disabled={!inStock || isBuyingNow}
                                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary py-5 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_48px_rgba(220,10,40,0.38)] transition-all hover:shadow-[0_22px_56px_rgba(220,10,40,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                                    <Zap size={18} className="fill-white" />
                                    {isBuyingNow ? 'Going to checkout...' : `Buy now · ${formatCurrency(currentPrice * quantity)}`}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2.8s_ease-in-out_infinite]" />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.985 }}
                                onClick={handleAddToCart}
                                disabled={!inStock || isAdding}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ShoppingBag size={14} />
                                {isAdding ? 'Adding...' : 'Add to bag'}
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
                                        Added to bag
                                    </motion.p>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        {description ? (
                            <div className="relative border-t border-white/[0.08] pt-5">
                                <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
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

            <AnimatePresence>
                {inStock ? (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050505]/96 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl lg:hidden"
                    >
                        <div className="mb-2.5 text-center text-[10px] text-white/55">
                            Arrives <span className="font-bold text-white">{fmtDay(deliveryDate)}</span>
                        </div>

                        <div className="mx-auto flex max-w-lg items-stretch gap-2">
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={handleAddToCart}
                                disabled={isAdding}
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white transition-all hover:bg-white/[0.1]"
                                aria-label="Add to bag"
                            >
                                <ShoppingBag size={18} />
                            </motion.button>

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
                                        <p
                                            className="text-base font-black leading-tight"
                                            style={{
                                                fontFamily: 'Montserrat, sans-serif',
                                                letterSpacing: '-0.04em',
                                            }}
                                        >
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

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(0%); }
                    60%, 100% { transform: translateX(400%); }
                }
            `}</style>
        </div>
    );
};

export default CatalogProductPage;
