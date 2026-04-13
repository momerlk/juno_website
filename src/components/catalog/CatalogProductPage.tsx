import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Minus,
    Plus,
    Ruler,
    Search,
    ShoppingBag,
    Sparkles,
    Star,
    Store,
    Truck,
} from 'lucide-react';
import { Catalog, type CatalogProduct, type ProductVariant } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { useTrackProductView } from '../../hooks/useProbe';
import CatalogNavbar from './CatalogNavbar';
import SizeGuideModal from './SizeGuideModal';

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
const getProductImage = (product: Partial<CatalogProduct>) =>
    asArray(product.images)[0] || '/juno_app_icon.png';

/* ── Skeleton (zero-CLS placeholder that reserves full layout) ── */
const SkeletonPulse = 'animate-pulse rounded-lg bg-white/[0.06]';

const ProductSkeleton: React.FC = () => (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] pb-24 text-white">
        <CatalogNavbar />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 pt-8">
            <div className={`mb-8 h-5 w-36 ${SkeletonPulse}`} />
            <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:gap-12">
                {/* Left column — image */}
                <div className="space-y-5">
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#101011]">
                        <div className={`absolute inset-4 ${SkeletonPulse}`} />
                    </div>
                    <div className="grid grid-cols-4 gap-2 md:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`aspect-square ${SkeletonPulse}`} />
                        ))}
                    </div>
                </div>
                {/* Right column — details */}
                <div className="space-y-8">
                    <div className="space-y-5">
                        <div className={`h-4 w-44 ${SkeletonPulse}`} />
                        <div className={`mt-4 h-14 w-full max-w-lg ${SkeletonPulse}`} />
                        <div className={`mt-4 h-9 w-48 ${SkeletonPulse}`} />
                        <div className={`mt-5 h-6 w-56 ${SkeletonPulse}`} />
                    </div>
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-3">
                            <div className={`h-4 w-28 ${SkeletonPulse}`} />
                            <div className={`mt-2 h-20 w-full ${SkeletonPulse}`} />
                        </div>
                        <div className={`h-44 rounded-[1.8rem] ${SkeletonPulse}`} />
                    </div>
                    <div className={`h-8 w-full ${SkeletonPulse}`} />
                    <div className={`h-52 rounded-[2.1rem] ${SkeletonPulse}`} />
                    <div className={`h-36 rounded-[2.2rem] ${SkeletonPulse}`} />
                </div>
            </div>
        </div>
    </div>
);

/* ── Main component ── */
const CatalogProductPage: React.FC = () => {
    const { productId, genderOrId } = useParams<{ productId?: string; genderOrId?: string }>();
    const actualProductId = productId || genderOrId || '';
    const [product, setProduct] = useState<CatalogProduct | null>(null);
    const [related, setRelated] = useState<CatalogProduct[]>([]);
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [showStickyBar, setShowStickyBar] = useState(false);
    const { addItem, setCartOpen } = useGuestCart();
    const navigate = useNavigate();

    const mainCTARef = useRef<HTMLDivElement>(null);

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
                const [productResponse, relatedResponse] = await Promise.all([
                    Catalog.getProduct(actualProductId),
                    Catalog.getRelatedProducts(actualProductId, 4),
                ]);

                if (cancelled) return;

                if (!productResponse.ok) {
                    setError(
                        (productResponse.body as { message?: string }).message ??
                            'Could not load this product.'
                    );
                    setProduct(null);
                    setRelated([]);
                    setIsLoading(false);
                    return;
                }

                const nextProduct = productResponse.body;
                setProduct(nextProduct);
                setSelectedImage(getProductImage(nextProduct));
                setSelectedOptions(
                    Object.fromEntries(
                        asArray(nextProduct.options).map((option) => [
                            option.name,
                            asArray(option.values)[0] ?? '',
                        ])
                    )
                );
                setRelated(
                    relatedResponse.ok
                        ? asArray(relatedResponse.body).filter((item) => item.id !== nextProduct.id)
                        : []
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
        return () => { cancelled = true; };
    }, [actualProductId]);

    const selectedVariant = useMemo<ProductVariant | undefined>(() => {
        if (!product) return undefined;
        return (
            asArray(product.variants).find((variant) =>
                Object.entries(selectedOptions).every(
                    ([name, value]) => variant.options?.[name] === value
                )
            ) ?? asArray(product.variants)[0]
        );
    }, [product, selectedOptions]);

    const currentPrice =
        selectedVariant?.price ?? product?.pricing.discounted_price ?? product?.pricing.price ?? 0;
    const compareAt = product?.pricing.compare_at_price;
    const discountPercentage =
        compareAt && currentPrice
            ? Math.max(0, Math.round(((compareAt - currentPrice) / compareAt) * 100))
            : 0;
    const imageGallery = asArray(product?.images);
    const description = product?.short_description || product?.description;
    const eta = product?.shipping_details?.estimated_delivery_days;

    const handleAddToCart = useCallback(() => {
        if (!product || !selectedVariant) return;

        setIsAdding(true);
        addItem(product.id, selectedVariant.id, quantity, currentPrice, {
            seller_name: product.seller_name,
            product_title: product.title,
            variant_title: selectedVariant.title,
            image_url: getProductImage(product),
        });

        setShowAddedFeedback(true);
        setIsAdding(false);

        window.setTimeout(() => {
            setCartOpen(true);
        }, 350);
    }, [product, selectedVariant, quantity, currentPrice, addItem, setCartOpen]);

    useEffect(() => {
        if (!showAddedFeedback) return;
        const timer = window.setTimeout(() => setShowAddedFeedback(false), 2400);
        return () => window.clearTimeout(timer);
    }, [showAddedFeedback]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowStickyBar(!entry.isIntersecting);
            },
            { threshold: 0.2 }
        );

        if (mainCTARef.current) observer.observe(mainCTARef.current);

        return () => observer.disconnect();
    }, []);

    /* Show skeleton during load — reserves full page layout so CLS stays ~0 */
    if (isLoading || !product) {
        return <ProductSkeleton />;
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 pt-24 text-white">
                <div className="max-w-xl rounded-[2rem] border border-red-500/20 bg-red-500/5 p-10 text-center">
                    <p className="text-2xl font-black uppercase text-white">Product unavailable</p>
                    <p className="mt-3 text-sm text-red-100/80">
                        {error}
                    </p>
                    <Link
                        to="/catalog"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white"
                    >
                        <ArrowLeft size={14} />
                        Back to catalog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] pb-24 text-white">
            <CatalogNavbar />
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-0 top-0 h-[32rem] w-[32rem] bg-primary/12 blur-[170px]" />
                <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] bg-secondary/12 blur-[180px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,24,24,0.06),transparent_30%),radial-gradient(circle_at_80%_55%,rgba(255,69,133,0.07),transparent_32%)]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 md:px-6">
                <button
                    onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/catalog'))}
                    className="mb-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors hover:text-white"
                >
                    <ArrowLeft size={14} />
                    Back to catalog
                </button>

                <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:gap-12">
                    {/* ── Left: Image Gallery ── */}
                    <section className="space-y-5">
                        <div className="relative overflow-hidden bg-[#101011]">
                            <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.01)_0%,rgba(0,0,0,0.03)_25%,rgba(0,0,0,0.50)_100%)]" />
                            <div className="absolute left-5 top-5 z-20 flex flex-wrap gap-2">
                                <span className="rounded-full border border-white/12 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md">
                                    {product.product_type || 'Curated Piece'}
                                </span>
                                {discountPercentage > 0 ? (
                                    <span className="rounded-full border border-primary/40 bg-primary/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                                        Save {discountPercentage}%
                                    </span>
                                ) : null}
                            </div>
                            {/* LCP image — eager, high priority, decoding async */}
                            <img
                                src={selectedImage || getProductImage(product)}
                                alt={product.title}
                                loading="eager"
                                fetchpriority="high"
                                decoding="async"
                                className="aspect-[3/4] w-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-5 md:p-6">
                                <div className="max-w-md">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                                        {product.seller_name || 'Juno Label'}
                                    </p>
                                    <p
                                        className="mt-1 text-base text-white/75"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        {product.categories?.[0]?.name || 'Independent label'}
                                    </p>
                                </div>
                                {product.rating ? (
                                    <div className="hidden text-right sm:block">
                                        <div className="flex items-center justify-end gap-1.5 text-amber-300">
                                            <Star size={14} className="fill-current" />
                                            <span className="text-sm font-bold text-white">
                                                {product.rating.toFixed(1)}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/35">
                                            {product.review_count || 0} reviews
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {imageGallery.length > 1 ? (
                            <div className="grid grid-cols-4 gap-2 md:grid-cols-5">
                                {imageGallery.map((image, imageIndex) => {
                                    const isActive = selectedImage === image;
                                    return (
                                        <button
                                            key={image}
                                            onClick={() => setSelectedImage(image)}
                                            className={`group relative overflow-hidden border transition-all ${
                                                isActive
                                                    ? 'border-primary shadow-[0_0_0_1px_rgba(255,24,24,0.5)]'
                                                    : 'border-transparent hover:border-white/20'
                                            }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.title} ${imageIndex + 1}`}
                                                loading="lazy"
                                                decoding="async"
                                                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div
                                                className={`absolute inset-0 ${
                                                    isActive
                                                        ? 'bg-[linear-gradient(180deg,transparent,rgba(255,24,24,0.28))]'
                                                        : 'bg-black/10'
                                                }`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </section>

                    {/* ── Right: Product Details ── */}
                    <section className="space-y-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                                    Juno / Product Story
                                </span>
                                {product.is_featured ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                                        <Sparkles size={11} />
                                        Featured
                                    </span>
                                ) : null}
                            </div>

                            <h1
                                className="mt-4 text-white"
                                style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 900,
                                    fontSize: 'clamp(2.6rem,5vw,5rem)',
                                    lineHeight: 0.88,
                                    letterSpacing: '-0.05em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {product.title}
                            </h1>

                            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                                <p className="text-[2.1rem] font-black tracking-[-0.05em] text-white md:text-[2.5rem]">
                                    {formatCurrency(currentPrice)}
                                </p>
                                {compareAt ? (
                                    <p className="pb-1 text-lg text-white/30 line-through">
                                        {formatCurrency(compareAt)}
                                    </p>
                                ) : null}
                                {discountPercentage > 0 ? (
                                    <p
                                        className="pb-1 text-lg text-white/80"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        marked down for this drop
                                    </p>
                                ) : null}
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-4">
                                {product.rating ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-amber-300">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={15}
                                                    className={
                                                        star <= Math.round(product.rating)
                                                            ? 'fill-current'
                                                            : 'text-white/18'
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-white/72">
                                            {product.rating.toFixed(1)} rating
                                        </span>
                                    </div>
                                ) : null}
                                {product.shipping_details?.free_shipping ? (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75">
                                        <Truck size={15} className="text-primary" />
                                        <span>Free shipping available</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                                    Editorial note
                                </p>
                                <p
                                    className="mt-3 text-lg leading-8 text-white/78"
                                    style={{ fontFamily: 'Instrument Serif, serif' }}
                                >
                                    {description || "A strong silhouette from Pakistan's independent fashion underground."}
                                </p>
                            </div>

                            <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                                    Drop details
                                </p>
                                <div className="mt-4 space-y-3 text-sm text-white/75">
                                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                                        <span>Brand</span>
                                        <span className="font-semibold text-white">
                                            {product.seller_name || 'Juno Label'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                                        <span>Availability</span>
                                        <span className="font-semibold text-white">
                                            {product.inventory?.in_stock ? 'In stock' : 'Sold out'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span>Estimated delivery</span>
                                        <span className="font-semibold text-white">
                                            {eta ? `${eta} day${eta > 1 ? 's' : ''}` : 'On request'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {asArray(product.tags).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {asArray(product.tags).slice(0, 8).map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/62"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : null}

                        {asArray(product.options).length > 0 ? (
                            <div className="rounded-[2.1rem] border border-white/10 bg-white/[0.04] p-6 md:p-7">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Search size={16} className="text-primary" />
                                        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                                            Choose your fit
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowSizeGuide(true)}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-white/20 hover:text-white"
                                    >
                                        <Ruler size={14} />
                                        Size guide
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {asArray(product.options).map((option) => (
                                        <div key={option.name}>
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
                                                    {option.name}
                                                </p>
                                                <p
                                                    className="text-sm text-white/52"
                                                    style={{ fontFamily: 'Instrument Serif, serif' }}
                                                >
                                                    {selectedOptions[option.name]}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {asArray(option.values).map((value) => {
                                                    const isActive =
                                                        selectedOptions[option.name] === value;
                                                    return (
                                                        <button
                                                            key={value}
                                                            onClick={() =>
                                                                setSelectedOptions((current) => ({
                                                                    ...current,
                                                                    [option.name]: value,
                                                                }))
                                                            }
                                                            className={`inline-flex min-w-[4.5rem] items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-all ${
                                                                isActive
                                                                    ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white shadow-[0_18px_40px_rgba(255,24,24,0.24)]'
                                                                    : 'border-white/10 bg-white/[0.04] text-neutral-200 hover:border-white/20 hover:bg-white/[0.07]'
                                                            }`}
                                                        >
                                                            {isActive ? <Check size={14} /> : null}
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div
                            ref={mainCTARef}
                            className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 md:p-7"
                        >
                            <div className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-end">
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                                        Purchase panel
                                    </p>
                                    <p
                                        className="mt-3 text-lg text-white/78"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        Claim the piece before the next edit takes over.
                                    </p>

                                    <div className="mt-6">
                                        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
                                            Quantity
                                        </p>
                                        <div className="inline-flex items-center rounded-full border border-white/10 bg-black/20 p-1">
                                            <button
                                                onClick={() =>
                                                    setQuantity((current) =>
                                                        Math.max(1, current - 1)
                                                    )
                                                }
                                                className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <span className="w-14 text-center text-xl font-black text-white">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity((current) => current + 1)}
                                                className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4 flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                                                Total
                                            </p>
                                            <p className="mt-1 text-[2rem] font-black tracking-[-0.05em] text-white">
                                                {formatCurrency(currentPrice * quantity)}
                                            </p>
                                        </div>
                                        {showAddedFeedback ? (
                                            <span className="rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-green-300">
                                                Added to bag
                                            </span>
                                        ) : null}
                                    </div>

                                    <button
                                        onClick={handleAddToCart}
                                        disabled={!product.inventory?.in_stock || isAdding}
                                        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_20px_45px_rgba(255,24,24,0.22)] transition-all hover:scale-[1.01] hover:shadow-[0_24px_50px_rgba(255,24,24,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ShoppingBag size={18} />
                                        <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
                                    </button>

                                    {!product.inventory?.in_stock ? (
                                        <p className="mt-4 text-center text-sm font-bold uppercase tracking-[0.16em] text-red-400">
                                            Currently out of stock
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {related.length > 0 ? (
                    <section className="mt-20">
                        <div className="mb-7 flex items-center gap-3">
                            <Store size={18} className="text-primary" />
                            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/55">
                                More from the edit
                            </p>
                        </div>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {related.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/catalog/${item.id}`}
                                    className="group overflow-hidden border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20"
                                >
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={getProductImage(item)}
                                            alt={item.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]" />
                                    </div>
                                    <div className="p-4">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
                                            {item.seller_name}
                                        </p>
                                        <h3 className="mt-2 line-clamp-2 text-xl font-black uppercase tracking-[-0.04em] text-white">
                                            {item.title}
                                        </h3>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-lg font-bold text-white">
                                                {formatCurrency(
                                                    item.pricing.discounted_price ??
                                                        item.pricing.price
                                                )}
                                            </span>
                                            <ArrowRight
                                                size={15}
                                                className="text-white/65 transition-transform group-hover:translate-x-1.5"
                                            />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>

            <AnimatePresence>
                {showStickyBar && product.inventory?.in_stock ? (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#070707]/95 p-4 backdrop-blur-xl lg:hidden"
                    >
                        <div className="mx-auto flex max-w-7xl items-center gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-white/42">
                                    {product.title}
                                </p>
                                <p className="mt-1 text-lg font-black text-white">
                                    {formatCurrency(currentPrice * quantity)}
                                </p>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isAdding}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_16px_36px_rgba(255,24,24,0.24)]"
                            >
                                <ShoppingBag size={15} />
                                <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
                            </button>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
        </div>
    );
};

export default CatalogProductPage;
