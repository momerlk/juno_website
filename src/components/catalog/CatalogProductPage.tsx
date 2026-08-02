import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Ruler,
    ShoppingBag,
    Sparkles,
    Star,
    Truck,
    RotateCcw,
    Share2,
    ShieldCheck,
    ZoomIn,
    Zap,
} from 'lucide-react';
import { Catalog, Sizing, type CatalogProduct, type ProductSizing, type ProductVariant } from '../../api/api';
import { Funnel } from '../../api/analyticsApi';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { useTrackProductView } from '../../hooks/useFunnelAnalytics';
import CatalogNavbar from './CatalogNavbar';
import SizeGuideModal from './SizeGuideModal';
import EditorialProductCard from '../shared/editorial/EditorialProductCard';
import { toTikTokProductContent, trackTikTokViewContent } from '../../utils/tiktokPixel';
import { getResponsiveShopifyImageSet } from '../../utils/shopifyImage';

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const DEFAULT_DELIVERY_DAYS = 8;
// Platform policy copy. Update these two in one place when the policy changes.
const RETURN_WINDOW_DAYS = 7;
const SALE_LABEL = 'Juno Sale';

const humanize = (value?: string) =>
    value ? value.replace(/[_-]/g, ' ').replace(/^\w/, (character) => character.toUpperCase()) : '';

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const getSourceSizingGuide = (guide?: Record<string, unknown>) => {
    const image_url = typeof guide?.image_url === 'string' ? guide.image_url : undefined;
    const html_table = typeof guide?.html_table === 'string' ? guide.html_table : undefined;
    return image_url || html_table ? { image_url, html_table } : null;
};

const getBaseProductPrice = (product: Partial<CatalogProduct> | null): number => {
    if (!product) return 0;
    return product.pricing?.discounted
        ? product.pricing.discounted_price ?? product.pricing.price ?? 0
        : product.pricing?.price ?? 0;
};

const getVariantAvailableQuantity = (variant: Partial<ProductVariant> | null | undefined, product: CatalogProduct | null): number | undefined => {
    const variantQty = variant?.inventory?.available_quantity ?? variant?.inventory?.quantity;
    if (typeof variantQty === 'number' && Number.isFinite(variantQty)) return Math.max(0, variantQty);
    const productQty = product?.inventory?.available_quantity ?? product?.inventory?.quantity;
    if (typeof productQty === 'number' && Number.isFinite(productQty)) return Math.max(0, productQty);
    return undefined;
};

const isPurchasableVariant = (variant: Partial<ProductVariant> | null | undefined, product: CatalogProduct | null): boolean => {
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
    const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
    const [selectedImageIdx, setSelectedImageIdx] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [showImageLightbox, setShowImageLightbox] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const sizeSectionRef = useRef<HTMLDivElement>(null);
    const [sizing, setSizing] = useState<ProductSizing | null>(null);
    const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
    const imageTouchStartXRef = useRef<number | null>(null);
    const unavailableShownRef = useRef<string | null>(null);
    const buyNowDialogRef = useRef<HTMLDivElement>(null);
    const { addItem, setCartOpen } = useGuestCart();
    const navigate = useNavigate();

    useTrackProductView(actualProductId);

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
            setSizing(null);

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
                setSelectedOptions(Object.fromEntries(
                    Object.entries(defaultVariant?.options ?? {}).filter(([name]) => !name.toLowerCase().includes('size'))
                ));
                setQuantity(1);
                setShowAddedFeedback(false);
                setIsLoading(false);

                void Sizing.getProductSizing(actualProductId)
                    .then((sizingResponse) => {
                        if (!cancelled && sizingResponse.ok) setSizing(sizingResponse.body);
                    })
                    .catch(() => {
                        // Sizing is optional. The product remains fully purchasable if it is unavailable.
                    });
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
        let cancelled = false;
        setRelatedProducts([]);

        if (!actualProductId) return undefined;
        void Catalog.getRelatedProducts(actualProductId, 4).then((response) => {
            if (!cancelled && response.ok) setRelatedProducts(asArray(response.body).slice(0, 4));
        });

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

    useEffect(() => {
        if (!product?.title) return;
        const previousTitle = document.title;
        document.title = `${product.title} | Juno`;
        return () => { document.title = previousTitle; };
    }, [product?.title]);

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

    const imageGallery = useMemo(() => {
        const productImages = asArray(product?.images);
        const variantImage = selectedVariant?.image_url;
        return variantImage ? [variantImage, ...productImages.filter((image) => image !== variantImage)] : productImages;
    }, [product?.images, selectedVariant?.image_url]);
    const currentImage = imageGallery[selectedImageIdx] || '/images/misc/juno_app_icon.png';
    const currentImageAspectRatio = imageAspectRatios[currentImage];
    const useContainedMainImage = typeof currentImageAspectRatio === 'number' && currentImageAspectRatio > 0.95;
    const variants = asArray(product?.variants);
    const maxAvailableQuantity = getVariantAvailableQuantity(selectedVariant, product);
    const requiresSizeSelection = asArray(product?.options).some((option) => option.name.toLowerCase().includes('size'));
    const hasSelectedSize = !requiresSizeSelection || asArray(product?.options).some((option) => option.name.toLowerCase().includes('size') && Boolean(selectedOptions[option.name]));
    const isAvailable = !!product?.inventory?.in_stock && isPurchasableVariant(selectedVariant, product);
    const canPurchase = isAvailable && hasSelectedSize;
    const currentPrice = getBaseProductPrice(product);
    const compareAt = product?.pricing.compare_at_price;
    const discountPercentage =
        compareAt && currentPrice ? Math.round(((compareAt - currentPrice) / compareAt) * 100) : 0;
    const description = product?.short_description || product?.description;
    const inStock = isAvailable;
    const stockCount = product?.inventory?.available_quantity ?? product?.inventory?.quantity ?? null;
    const lowStock = typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5;
    const catalogBadges = getCatalogBadges(product);
    const hasApprovedSizing = sizing?.availability === 'normalized';
    const sourceSizingGuide = getSourceSizingGuide(product?.sizing_guide ?? product?.enrichment?.sizing_guide);
    const hasOriginalSizingGuide = Boolean(sourceSizingGuide?.image_url || sourceSizingGuide?.html_table);
    const hasSizingGuide = hasApprovedSizing || hasOriginalSizingGuide;
    const mainImage = getResponsiveShopifyImageSet(currentImage, [480, 720, 960, 1280, 1600]);

    // Laam-style spec table. Everything here comes from enrichment metadata, so a
    // product with no metadata simply renders no rows instead of empty labels.
    const productSpecs = useMemo(() => {
        const meta = product?.metadata ?? {};
        return ([
            ['Product type', humanize(meta.product_type || product?.product_type)],
            ['Fabric', asArray(meta.materials).map(humanize).join(', ')],
            ['Fit', humanize(meta.fit)],
            ['Silhouette', humanize(meta.silhouette)],
            ['Sleeve length', humanize(meta.sleeve_length)],
            ['Neckline', humanize(meta.neckline)],
            ['Pattern', asArray(meta.pattern).map(humanize).join(', ')],
            ['Colour', humanize(meta.primary_color) || asArray(meta.color_families).map(humanize).join(', ')],
            ['Occasion', asArray(meta.occasions).map(humanize).join(', ')],
            ['Season', asArray(meta.seasonality).map(humanize).join(', ')],
            ['Gender', humanize(meta.gender || product?.gender)],
            ['Product ID', product?.handle || product?.raw_id || ''],
        ] as [string, string][]).filter(([, value]) => Boolean(value));
    }, [product?.gender, product?.handle, product?.metadata, product?.product_type, product?.raw_id]);

    const scrollToSize = useCallback(() => {
        sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const handleShare = useCallback(async () => {
        const url = window.location.href;
        if (navigator.share) {
            // A cancelled share sheet rejects; that is not an error worth surfacing.
            await navigator.share({ title: product?.title, url }).catch(() => undefined);
            return;
        }
        await navigator.clipboard?.writeText(url).catch(() => undefined);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
    }, [product?.title]);

    useEffect(() => {
        // Keyed on availability only: an unselected size is not an unavailable product.
        if (!product || isAvailable) {
            unavailableShownRef.current = null;
            return;
        }
        const detail = selectedVariant?.available === false ? 'variant_unavailable' : 'out_of_stock';
        const key = `${product.id}:${selectedVariant?.id || 'none'}:${detail}`;
        if (unavailableShownRef.current === key) return;
        unavailableShownRef.current = key;
        Funnel.trackSubEvent('view_item', 'unavailable_shown', detail, { product_id: product.id });
    }, [isAvailable, product, selectedVariant?.available, selectedVariant?.id]);

    useEffect(() => {
        if (!showBuyNowConfirm) return;
        const dialog = buyNowDialogRef.current;
        dialog?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setShowBuyNowConfirm(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showBuyNowConfirm]);

    const selectRecommendedSize = useCallback((size: string) => {
        const sizeOption = asArray(product?.options).find((option) => option.name.toLowerCase().includes('size'));
        if (sizeOption && asArray(sizeOption.values).includes(size)) {
            Funnel.trackSubEvent('view_item', 'variant_selected', undefined, { product_id: product?.id });
            setSelectedOptions((current) => ({ ...current, [sizeOption.name]: size }));
        }
    }, [product?.id, product?.options]);

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
        setSelectedImageIdx(0);
    }, [selectedVariant?.image_url]);

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
        if (product) Funnel.trackSubEvent('add_to_cart', 'clicked', undefined, { product_id: product.id });
        if (!product || !selectedVariant || !hasSelectedSize) {
            if (product) Funnel.trackSubEvent('add_to_cart', 'blocked', 'variant_required', { product_id: product.id });
            return;
        }
        if (!canPurchase) {
            Funnel.trackSubEvent('add_to_cart', 'blocked', 'out_of_stock', { product_id: product.id });
            return;
        }
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            Funnel.trackSubEvent('add_to_cart', 'blocked', 'quantity_limit', { product_id: product.id });
            setQuantity(Math.max(1, maxAvailableQuantity));
            return;
        }

        setIsAdding(true);
        addItem(product.id, selectedVariant.id, quantity, currentPrice, {
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: selectedVariant.title,
            variant_options: selectedVariant.options,
            image_url: selectedVariant.image_url || selectedVariant.images?.[0] || currentImage,
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
        currentImage,
        maxAvailableQuantity,
        product,
        quantity,
        hasSelectedSize,
        selectedVariant,
        setCartOpen,
    ]);

    // Opens the confirm-selection popup after validating stock/quantity.
    const handleBuyNow = useCallback(() => {
        if (!product || !selectedVariant || !hasSelectedSize) return;
        if (!canPurchase) return;
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            setQuantity(Math.max(1, maxAvailableQuantity));
            return;
        }
        setShowBuyNowConfirm(true);
    }, [canPurchase, hasSelectedSize, maxAvailableQuantity, product, quantity, selectedVariant]);

    const confirmBuyNow = useCallback(() => {
        if (!product || !selectedVariant || !hasSelectedSize) return;
        if (!canPurchase) return;
        if (typeof maxAvailableQuantity === 'number' && quantity > maxAvailableQuantity) {
            setQuantity(Math.max(1, maxAvailableQuantity));
            return;
        }

        setIsBuyingNow(true);
        setShowBuyNowConfirm(false);
        // Buy Now isolates this single item: instead of mutating the shared
        // guest cart, hand the item to checkout via router state so any items
        // already in the cart are left untouched.
        const buyNowItem = {
            product_id: product.id,
            variant_id: selectedVariant.id,
            quantity,
            price: currentPrice,
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: selectedVariant.title,
            variant_options: selectedVariant.options,
            image_url: selectedVariant.image_url || selectedVariant.images?.[0] || currentImage,
            max_quantity: maxAvailableQuantity,
            is_available: canPurchase,
        };
        Funnel.track('add_to_cart', { product_id: product.id, quantity });
        navigate('/checkout', { state: { buyNowItem } });
    }, [
        canPurchase,
        currentPrice,
        currentImage,
        maxAvailableQuantity,
        navigate,
        product,
        quantity,
        selectedVariant,
        hasSelectedSize,
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
    const rating = product.rating;
    const estimatedDeliveryDays = product.shipping_details?.estimated_delivery_days || DEFAULT_DELIVERY_DAYS;
    const deliveryDate = addDays(today, estimatedDeliveryDays);

    const badgeOverlay = (discountPercentage > 0 || lowStock || catalogBadges.bestSeller || catalogBadges.thrifted) ? (
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
            {discountPercentage > 0 ? (
                <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(220,10,40,0.35)]">
                    -{discountPercentage}%
                </span>
            ) : null}
            {catalogBadges.bestSeller ? (
                <span className="inline-flex items-center gap-1.5 border border-white/20 bg-black/65 py-1 pl-1 pr-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-md">
                    <span className="flex h-4 w-4 items-center justify-center bg-primary text-white">
                        <Star size={10} className="fill-current" />
                    </span>
                    Juno Best Seller
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
    ) : null;

    const deliveryAndReturns = (
        <div className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025]">
            <div className="flex items-center gap-3 px-4 py-3.5">
                <Truck size={17} className="shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-white">Est. delivery by {fmtDay(deliveryDate)}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">
                        {product.shipping_details?.free_shipping ? 'Free delivery' : 'Standard delivery'} · {estimatedDeliveryDays} days · Pakistan
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
                <RotateCcw size={17} className="shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-white">Easy {RETURN_WINDOW_DAYS} day returns</p>
                    <p className="mt-0.5 text-[11px] text-white/45">Return for a different size within {RETURN_WINDOW_DAYS} days.</p>
                </div>
            </div>
        </div>
    );

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
                        {/* Mobile: every image in one horizontal snap strip, no thumbnail row
                            eating vertical space. Desktop keeps the main image + thumbnails. */}
                        <div className="relative -mx-4 lg:hidden">
                            {badgeOverlay}
                            <div
                                onScroll={(event) => {
                                    const strip = event.currentTarget;
                                    const index = Math.round(strip.scrollLeft / (strip.scrollWidth / Math.max(imageGallery.length, 1)));
                                    setSelectedImageIdx(Math.min(Math.max(index, 0), Math.max(imageGallery.length - 1, 0)));
                                }}
                                className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 scrollbar-none"
                                style={{ scrollPaddingLeft: '1rem' }}
                            >
                                {(imageGallery.length ? imageGallery : [currentImage]).map((image, index) => {
                                    const slide = getResponsiveShopifyImageSet(image, [480, 720, 960]);
                                    return (
                                        <button
                                            key={`slide-${index}`}
                                            type="button"
                                            onClick={() => { setSelectedImageIdx(index); setShowImageLightbox(true); }}
                                            aria-label={`Zoom image ${index + 1}`}
                                            className="relative aspect-[4/5] w-[86%] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#0d0d0e]"
                                        >
                                            <img
                                                src={slide.src}
                                                srcSet={slide.srcSet}
                                                sizes="86vw"
                                                alt={`${product.title} ${index + 1}`}
                                                loading={index === 0 ? 'eager' : 'lazy'}
                                                fetchpriority={index === 0 ? 'high' : 'auto'}
                                                decoding="async"
                                                draggable={false}
                                                className="h-full w-full select-none object-cover"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                            {imageGallery.length > 1 ? (
                                <div className="pointer-events-none absolute right-6 top-3 z-20 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-white/90 backdrop-blur-sm">
                                    {selectedImageIdx + 1} / {imageGallery.length}
                                </div>
                            ) : null}
                        </div>

                        <div className="group relative hidden w-full overflow-hidden rounded-2xl bg-[#0d0d0e] lg:block">
                            {badgeOverlay}

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
                                    // Ignore multi-finger gestures (pinch-zoom) so they
                                    // don't get misread as a horizontal swipe.
                                    imageTouchStartXRef.current =
                                        event.touches.length === 1 ? event.touches[0]?.clientX ?? null : null;
                                }}
                                onTouchEnd={(event) => {
                                    const startX = imageTouchStartXRef.current;
                                    imageTouchStartXRef.current = null;
                                    // Bail if the gesture ever became multi-touch (zoom).
                                    if (startX === null || imageGallery.length < 2 || event.touches.length > 0) return;
                                    const endX = event.changedTouches[0]?.clientX ?? startX;
                                    const delta = endX - startX;
                                    if (delta < -50) cycleImage(1);
                                    else if (delta > 50) cycleImage(-1);
                                }}
                                style={{ touchAction: 'pan-y pinch-zoom' }}
                                className="relative aspect-[4/5] w-full sm:aspect-[3/4]"
                            >
                                <img
                                    key={currentImage}
                                    src={mainImage.src}
                                    srcSet={mainImage.srcSet}
                                    sizes="(max-width: 1279px) 100vw, 55vw"
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
                                <button type="button" onClick={() => setShowImageLightbox(true)} className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80" aria-label="Zoom product image">
                                    <ZoomIn size={18} />
                                </button>
                            </div>
                        </div>

                        {imageGallery.length > 1 ? (
                            <div className="-mx-1 hidden gap-2.5 overflow-x-auto px-1 pb-2 pt-1 scrollbar-none lg:flex">
                                {imageGallery.map((image, index) => {
                                    const active = selectedImageIdx === index;
                                    const thumbnailImage = getResponsiveShopifyImageSet(image, [120, 180, 240, 320]);
                                    return (
                                        <button
                                            key={`thumb-${index}`}
                                            onClick={() => setSelectedImageIdx(index)}
                                            aria-label={`Show image ${index + 1}`}
                                            aria-current={active ? 'true' : undefined}
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

                    <div className="flex min-w-0 flex-col gap-6">
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
                                    <span className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] py-1 pl-1 pr-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/90">
                                        <span className="flex h-4 w-4 items-center justify-center bg-primary text-white">
                                            <Star size={10} className="fill-current" />
                                        </span>
                                        Juno Best Seller
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

                            <div className="flex items-start gap-3">
                                <h1
                                    className="min-w-0 flex-1 text-white"
                                    style={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 900,
                                        fontSize: 'clamp(1.75rem, 5vw, 4.4rem)',
                                        lineHeight: 0.92,
                                        letterSpacing: '-0.045em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {product.title}
                                </h1>
                                <button
                                    type="button"
                                    onClick={() => void handleShare()}
                                    aria-label="Share this product"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition-colors hover:border-white/30 hover:text-white"
                                >
                                    <Share2 size={16} />
                                </button>
                            </div>
                            {shareCopied ? <p className="mt-1 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Link copied</p> : null}

                            {product.rating ? (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={13}
                                                className={star <= Math.round(rating ?? 0) ? 'fill-amber-300 text-amber-300' : 'text-white/15'}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-white">{product.rating.toFixed(1)}</span>
                                    {product.review_count ? (
                                        <>
                                            <span className="text-white/20">|</span>
                                            <a href="#ratings" className="text-sm font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline">
                                                {product.review_count} reviews
                                            </a>
                                        </>
                                    ) : null}
                                </div>
                            ) : null}

                            <a
                                href={product.seller_id ? `/catalog?seller_id=${encodeURIComponent(product.seller_id)}` : '/catalog'}
                                className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45 transition-colors hover:text-white"
                            >
                                {product.seller_logo ? <img src={product.seller_logo} alt="" className="h-5 w-5 rounded-full object-cover" /> : null}
                                by <span className="text-white/80">{product.seller_name || 'Juno Label'}</span><span aria-hidden="true">→</span>
                            </a>

                            {discountPercentage > 0 ? (
                                <div className="mt-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                                        <Sparkles size={11} />
                                        {SALE_LABEL}
                                    </span>
                                </div>
                            ) : null}

                            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span
                                    className="text-white"
                                    style={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 900,
                                        fontSize: 'clamp(1.9rem, 4vw, 2.75rem)',
                                        letterSpacing: '-0.05em',
                                    }}
                                >
                                    {formatCurrency(currentPrice)}
                                </span>
                                {compareAt ? (
                                    <>
                                        <span className="text-lg font-semibold text-white/35 line-through decoration-primary/70 decoration-2 md:text-xl">
                                            {formatCurrency(compareAt)}
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-3.5 py-1.5 text-[13px] font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_rgba(220,10,40,0.4)] md:text-[15px]">
                                            {discountPercentage > 0 ? (
                                                <>
                                                    <span>-{discountPercentage}%</span>
                                                    <span className="h-3 w-px bg-white/40" />
                                                </>
                                            ) : null}
                                            <span>Save {formatCurrency(compareAt - currentPrice)}</span>
                                        </span>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {deliveryAndReturns}

                        <a
                            href={product.seller_id ? `/catalog?seller_id=${encodeURIComponent(product.seller_id)}` : '/catalog'}
                            className="group flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4 transition-colors hover:border-primary/50"
                        >
                            {product.seller_logo ? <img src={product.seller_logo} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">{product.seller_name?.slice(0, 1)}</span>}
                            <span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/40">From the label</span><span className="mt-1 block truncate text-sm font-black uppercase tracking-[-0.02em] text-white">{product.seller_name || 'Juno Label'}</span></span>
                            <span className="text-xs font-black text-primary transition-transform group-hover:translate-x-0.5">Explore →</span>
                        </a>

                        {asArray(product.options).length > 0 ? (
                            <div ref={sizeSectionRef} className="scroll-mt-24 space-y-4">
                                {asArray(product.options).map((option) => (
                                    <div key={option.name}>
                                        <div className="mb-2.5 flex items-center justify-between gap-3">
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">
                                                    {option.name}
                                                </p>
                                                <p
                                                    className="text-sm text-white/60"
                                                    style={{ fontFamily: 'Instrument Serif, serif' }}
                                                >
                                                    {selectedOptions[option.name] || 'Not selected'}
                                                </p>
                                            </div>
                                            {option.name.toLowerCase().includes('size') && hasSizingGuide ? (
                                                <button
                                                    type="button"
                                                    onClick={() => { Funnel.trackSubEvent('view_item', 'size_guide_opened', undefined, { product_id: product.id }); setShowSizeGuide(true); }}
                                                    className="shrink-0 text-[11px] font-bold text-white/70 underline underline-offset-4 transition-colors hover:text-white"
                                                >
                                                    Size chart
                                                </button>
                                            ) : null}
                                        </div>
                                        {/* The quiz is Juno's edge over a static chart, so it sits
                                            above the size buttons, before the guess happens. */}
                                        {option.name.toLowerCase().includes('size') && hasApprovedSizing ? (
                                            <button
                                                onClick={() => { Funnel.trackSubEvent('view_item', 'size_guide_opened', undefined, { product_id: product.id }); setShowSizeGuide(true); }}
                                                className="group mb-3 flex w-full items-center gap-3 rounded-2xl border border-primary/45 bg-gradient-to-r from-primary/20 to-secondary/12 p-4 text-left transition-all hover:border-primary/70 hover:from-primary/25 hover:to-secondary/18"
                                            >
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-[0_8px_22px_rgba(220,10,40,0.3)]">
                                                    <Ruler size={18} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-1.5 text-[13px] font-black uppercase tracking-[0.12em] text-white">
                                                        Take the size quiz
                                                        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] tracking-[0.1em]">AI</span>
                                                    </span>
                                                    <span className="mt-0.5 block text-[11px] text-white/60">Two questions and we pick your size in this brand</span>
                                                </span>
                                                <ChevronRight size={17} className="text-white/45 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                                            </button>
                                        ) : null}

                                        <div className="flex flex-wrap gap-2">
                                            {asArray(option.values).map((value) => {
                                                const isActive = selectedOptions[option.name] === value;
                                                const isColorOption = /colou?r/i.test(option.name);
                                                const matchingVariant = variants.find((variant) =>
                                                    variant.options?.[option.name] === value &&
                                                    asArray(product.options).every((otherOption) =>
                                                        otherOption.name === option.name ||
                                                        !selectedOptions[otherOption.name] ||
                                                        variant.options?.[otherOption.name] === selectedOptions[otherOption.name]
                                                    )
                                                );
                                                const colorHex = matchingVariant?.color_hex?.match(/^#[0-9a-f]{3,8}$/i)?.[0];
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
                                                            if (!isActive) Funnel.trackSubEvent('view_item', 'variant_selected', undefined, { product_id: product.id });
                                                            setSelectedOptions((current) => ({ ...current, [option.name]: value }));
                                                        }}
                                                        disabled={!isValueAvailable}
                                                        aria-pressed={isActive}
                                                        aria-label={`${option.name}: ${value}${isValueAvailable ? '' : ', unavailable'}`}
                                                        className={`relative inline-flex min-w-[3rem] items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-bold transition-all ${
                                                            isActive
                                                                ? 'bg-white text-black shadow-[0_6px_18px_rgba(255,255,255,0.18)]'
                                                                : isValueAvailable
                                                                  ? 'border border-white/12 bg-white/[0.03] text-white/70 hover:border-white/30 hover:bg-white/[0.06] hover:text-white'
                                                                  : 'cursor-not-allowed border border-white/10 bg-white/[0.02] text-white/35 line-through decoration-white/30'
                                                        }`}
                                                    >
                                                        {isColorOption && colorHex ? (
                                                            <span
                                                                aria-hidden="true"
                                                                className="h-4 w-4 rounded-full border border-black/15 shadow-sm"
                                                                style={{ backgroundColor: colorHex }}
                                                            />
                                                        ) : null}
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
                                        {/* Chart-only products keep a card too, just a quieter one. */}
                                        {option.name.toLowerCase().includes('size') && hasSizingGuide && !hasApprovedSizing ? (
                                            <button
                                                onClick={() => { Funnel.trackSubEvent('view_item', 'size_guide_opened', undefined, { product_id: product.id }); setShowSizeGuide(true); }}
                                                className="group mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-3.5 text-left transition-all hover:border-white/30 hover:bg-white/[0.06]"
                                            >
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white">
                                                    <Ruler size={17} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-black uppercase tracking-[0.14em] text-white">View size guide</span>
                                                    <span className="mt-0.5 block text-[11px] text-white/45">This brand’s own size chart</span>
                                                </span>
                                                <ChevronRight size={16} className="text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                                            </button>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Quantity</p>{lowStock ? <span className="rounded-full border border-primary/40 bg-primary/15 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-primary">Only {stockCount} left</span> : null}</div>
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
                                disabled={!canPurchase || isBuyingNow}
                                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary py-5 text-base font-black uppercase tracking-[0.2em] text-white shadow-[0_18px_48px_rgba(220,10,40,0.38)] transition-all hover:shadow-[0_22px_56px_rgba(220,10,40,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                                    <Zap size={18} className="fill-white" />
                                    {isBuyingNow ? 'Going to checkout...' : !hasSelectedSize ? 'Select size to buy' : `Buy now · ${formatCurrency(currentPrice * quantity)}`}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2.8s_ease-in-out_infinite]" />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.985 }}
                                onClick={handleAddToCart}
                                disabled={!canPurchase || isAdding}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ShoppingBag size={14} />
                                {isAdding ? 'Adding...' : !hasSelectedSize ? 'Select size first' : 'Add to bag'}
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

                        {productSpecs.length || description ? (
                            <div className="border-t border-white/[0.08] pt-6">
                                <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-white md:text-xl">Product details</h2>

                                {productSpecs.length ? (
                                    <dl className="mt-4 overflow-hidden rounded-2xl border border-white/[0.09]">
                                        {productSpecs.map(([label, value], index) => (
                                            <div
                                                key={label}
                                                className={`grid grid-cols-[40%_60%] ${index > 0 ? 'border-t border-white/[0.07]' : ''}`}
                                            >
                                                <dt className="bg-white/[0.03] px-3.5 py-3 text-[12px] font-bold text-white/60">{label}</dt>
                                                <dd className="px-3.5 py-3 text-[13px] text-white">{value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : null}

                                {description ? (
                                    <div className="mt-6">
                                        <p className="text-[13px] font-black uppercase tracking-[0.14em] text-white">Description</p>
                                        <p className="mt-2 text-[15px] leading-7 text-white/70" style={{ fontFamily: 'Instrument Serif, serif' }}>
                                            {description}
                                        </p>
                                    </div>
                                ) : null}

                                <p className="mt-5 text-[11px] leading-5 text-white/35">
                                    Disclaimer: actual product colour may vary slightly from the image.
                                </p>
                            </div>
                        ) : null}

                        <div className="border-t border-white/[0.08] pt-6">
                            <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-white md:text-xl">Shopping security</h2>
                            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                                {[
                                    { icon: <ShieldCheck size={14} />, label: 'Safe payment' },
                                    { icon: <Truck size={14} />, label: 'Cash on delivery' },
                                    { icon: <RotateCcw size={14} />, label: `${RETURN_WINDOW_DAYS} day returns` },
                                    { icon: <Check size={14} />, label: 'Verified labels only' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-2 text-[13px] font-semibold text-white/80">
                                        <span className="text-emerald-400">{item.icon}</span>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {product.rating ? (
                            <div id="ratings" className="scroll-mt-24 border-t border-white/[0.08] pt-6">
                                <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-white md:text-xl">Ratings and reviews</h2>
                                <div className="mt-4 flex items-center gap-5">
                                    <div className="text-center">
                                        <p className="flex items-baseline gap-1 text-4xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                            {product.rating.toFixed(1)}
                                            <Star size={18} className="fill-amber-300 text-amber-300" />
                                        </p>
                                        {product.review_count ? <p className="mt-1 text-[11px] text-white/40">{product.review_count} ratings</p> : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={16}
                                                    className={star <= Math.round(rating ?? 0) ? 'fill-amber-300 text-amber-300' : 'text-white/15'}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-2 text-[12px] leading-5 text-white/45">
                                            Rating carried over from this label’s verified orders.
                                        </p>
                                    </div>
                                </div>
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

                {relatedProducts.length > 0 ? (
                    <section className="mt-16 border-t border-white/[0.08] pt-10 md:mt-24 md:pt-14">
                        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">Keep exploring</p>
                        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white md:text-3xl">Similar pieces</h2>
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
                            {relatedProducts.map((related, index) => (
                                <EditorialProductCard
                                    key={related.id}
                                    title={related.title}
                                    sellerName={related.seller_name}
                                    images={related.images}
                                    badges={related.badges}
                                    pricing={related.pricing}
                                    inventory={related.inventory}
                                    index={index}
                                    to={`/catalog/${related.id}`}
                                />
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>

            <AnimatePresence>
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                    className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050505]/96 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl lg:hidden"
                >
                    {inStock ? (
                    <>
                        <div className="mb-2.5 text-center text-[10px] text-white/55">
                            Arrives <span className="font-bold text-white">{fmtDay(deliveryDate)}</span>
                        </div>

                        {/* Unselected size keeps both buttons live: tapping scrolls to the
                            picker instead of leaving a dead control at the bottom of the screen. */}
                        <div className="mx-auto flex max-w-lg items-stretch gap-2">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={hasSelectedSize ? handleBuyNow : scrollToSize}
                                disabled={!inStock || isBuyingNow}
                                className="flex h-14 flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/[0.05] text-[13px] font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/[0.1] disabled:opacity-40"
                            >
                                {!hasSelectedSize ? 'Select size' : `Buy now · ${formatCurrency(currentPrice * quantity)}`}
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={hasSelectedSize ? handleAddToCart : scrollToSize}
                                disabled={!inStock || isAdding}
                                className="relative flex h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary text-[13px] font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(220,10,40,0.4)] disabled:opacity-40"
                            >
                                <ShoppingBag size={16} />
                                {isAdding ? 'Adding…' : 'Add to bag'}
                                <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2.8s_ease-in-out_infinite]" />
                            </motion.button>
                        </div>
                    </>
                    ) : (
                        <button type="button" disabled className="mx-auto flex h-14 w-full max-w-lg items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-[0.2em] text-white/45">
                            Currently sold out
                        </button>
                    )}
                </motion.div>
            </AnimatePresence>

            <SizeGuideModal
                isOpen={showSizeGuide}
                onClose={() => setShowSizeGuide(false)}
                productId={product.id}
                sizing={sizing}
                sourceGuide={sourceSizingGuide}
                selectedSize={Object.entries(selectedOptions).find(([name]) => name.toLowerCase().includes('size'))?.[1]}
                onSelectSize={selectRecommendedSize}
            />

            <AnimatePresence>
                {showImageLightbox ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Product image zoom" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setShowImageLightbox(false)}>
                        <img src={currentImage} alt={`${product.title} enlarged`} className="max-h-full max-w-full object-contain" onClick={(event) => event.stopPropagation()} />
                        <button type="button" className="absolute right-5 top-5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white" onClick={() => setShowImageLightbox(false)}>Close</button>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {showBuyNowConfirm ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
                        onClick={() => setShowBuyNowConfirm(false)}
                    >
                        <motion.div
                            ref={buyNowDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="buy-now-dialog-title"
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                                if (event.key !== 'Tab') return;
                                const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled])'));
                                const first = focusable[0];
                                const last = focusable.at(-1);
                                if (!first || !last) return;
                                if (event.shiftKey && document.activeElement === first) {
                                    event.preventDefault();
                                    last.focus();
                                } else if (!event.shiftKey && document.activeElement === last) {
                                    event.preventDefault();
                                    first.focus();
                                }
                            }}
                            className="w-full max-w-sm rounded-t-3xl border border-white/10 bg-[#0b0b0d] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] sm:rounded-3xl sm:pb-5"
                        >
                            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Confirm selection</p>
                            <div className="mt-4 flex gap-3.5">
                                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/5">
                                    <img src={currentImage} alt={product.title} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                                        {product.seller_name || 'Juno Label'}
                                    </p>
                                    <h3
                                        id="buy-now-dialog-title"
                                        className="mt-1 line-clamp-2 uppercase text-white"
                                        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.03em' }}
                                    >
                                        {product.title}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {Object.entries(selectedOptions).map(([name, value]) => (
                                            <span
                                                key={name}
                                                className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/75"
                                            >
                                                <span className="text-white/40">{name}:</span> {value}
                                            </span>
                                        ))}
                                        <span className="rounded-md border border-white/12 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-white/75">
                                            <span className="text-white/40">Qty:</span> {quantity}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4">
                                <span className="text-[12px] text-white/55">Total</span>
                                <span
                                    className="text-white"
                                    style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.04em' }}
                                >
                                    {formatCurrency(currentPrice * quantity)}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-[1fr_1.6fr] gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBuyNowConfirm(false)}
                                    className="rounded-xl border border-white/12 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmBuyNow}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary py-3.5 text-[12px] font-black uppercase tracking-[0.16em] text-white shadow-[0_12px_32px_rgba(220,10,40,0.4)]"
                                >
                                    <Zap size={15} className="fill-white" />
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(0%); }
                    60%, 100% { transform: translateX(400%); }
                }
            `}</style>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org', '@type': 'Product', name: product.title, image: imageGallery,
                description, brand: { '@type': 'Brand', name: product.seller_name || 'Juno' },
                offers: { '@type': 'Offer', priceCurrency: product.pricing.currency || 'PKR', price: currentPrice, availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`, url: window.location.href },
                ...(product.rating && product.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.review_count } } : {}),
            }) }} />
        </div>
    );
};

export default CatalogProductPage;
