import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, ShoppingBag, Sparkles, Star } from 'lucide-react';
import type { CatalogProduct } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';

interface ProductCardProps {
    product: CatalogProduct;
    index?: number;
    onQuickAdd?: (product: CatalogProduct) => void;
    showQuickAdd?: boolean;
    to?: string;
}

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const getBaseProductPrice = (product: CatalogProduct): number =>
    product.pricing.discounted
        ? product.pricing.discounted_price ?? product.pricing.price
        : product.pricing.price;

const getProductImage = (product: Partial<CatalogProduct>) => {
    const images = Array.isArray(product.images) ? product.images : [];
    return images[0] || '/juno_app_icon.png';
};

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    index = 0,
    onQuickAdd,
    showQuickAdd = true,
    to,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addItem } = useGuestCart();

    useEffect(() => {
        const wishlist = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');
        setIsWishlisted(Array.isArray(wishlist) && wishlist.includes(product.id));
    }, [product.id]);

    const isNew = product.created_at
        ? new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        : product.is_featured || false;

    const discountPercentage = product.pricing.compare_at_price
        ? Math.round(
              ((product.pricing.compare_at_price -
                  (product.pricing.discounted_price || product.pricing.price)) /
                  product.pricing.compare_at_price) *
                  100
          )
        : 0;

    const hasDiscount = product.pricing.discounted && discountPercentage > 0;
    const isSoldOut = !product.inventory?.in_stock;
    const productImage = getProductImage(product);
    const hoverImage = product.images?.[1];
    const activePrice = getBaseProductPrice(product);
    const categoryLabel = product.categories?.[0]?.name;
    const accentTags = [
        hasDiscount ? `${discountPercentage}% off` : null,
        product.is_trending ? 'Trending now' : null,
        product.shipping_details?.free_shipping ? 'Free shipping' : null,
    ].filter(Boolean) as string[];

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickAdd) {
            onQuickAdd(product);
            return;
        }

        const variant = product.variants?.[0];
        if (!variant) return;
        if (!variant.available || !product.inventory?.in_stock) return;

        setAddedToCart(true);
        addItem(
            product.id,
            variant.id,
            1,
            getBaseProductPrice(product),
            {
                seller_name: product.seller_name,
                product_title: product.title,
                variant_title: variant.title,
                image_url: productImage,
                max_quantity: product.inventory?.available_quantity,
                is_available: variant.available && !!product.inventory?.in_stock,
            }
        );

        window.setTimeout(() => setAddedToCart(false), 1800);
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const wishlist = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');
        const nextWishlisted = !isWishlisted;
        setIsWishlisted(nextWishlisted);

        localStorage.setItem(
            'juno_wishlist',
            JSON.stringify(
                nextWishlisted
                    ? [...wishlist, product.id]
                    : wishlist.filter((id: string) => id !== product.id)
            )
        );
    };

    const targetUrl = to || `/catalog/${product.id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.18) }}
            className="h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                to={targetUrl}
                className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-[#0f0f10] transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
            >
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-14 top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_22%,rgba(0,0,0,0.3)_100%)]" />
                </div>

                <div className="relative aspect-[0.77] overflow-hidden">
                    <img
                        src={productImage}
                        alt={product.title}
                        className={`h-full w-full object-cover transition-all duration-700 ${
                            isHovered && hoverImage ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                        }`}
                    />
                    {hoverImage ? (
                        <img
                            src={hoverImage}
                            alt={product.title}
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                                isHovered ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                            }`}
                        />
                    ) : null}

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.08)_0%,rgba(5,5,5,0.02)_28%,rgba(5,5,5,0.68)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-[radial-gradient(circle_at_bottom,rgba(255,24,24,0.2),transparent_58%)]" />

                    <div className="absolute left-4 top-4 flex max-w-[70%] flex-wrap gap-2">
                        {hasDiscount ? (
                            <span className="rounded-full border border-primary/40 bg-primary/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_12px_32px_rgba(255,24,24,0.26)]">
                                -{discountPercentage}%
                            </span>
                        ) : null}
                        {isNew ? (
                            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                                New drop
                            </span>
                        ) : null}
                        {product.is_trending ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                                <Sparkles size={11} />
                                Trending
                            </span>
                        ) : null}
                    </div>

                    <button
                        onClick={handleWishlistToggle}
                        className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 p-3 text-white/80 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/30 hover:bg-white/10 hover:text-white"
                        aria-label="Add to wishlist"
                    >
                        <Heart size={18} className={isWishlisted ? 'fill-primary text-primary' : ''} />
                    </button>

                    {isSoldOut ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 backdrop-blur-[3px]">
                            <span className="rounded-full border border-white/20 bg-black/70 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.28em] text-white">
                                Sold Out
                            </span>
                        </div>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4">
                        <div className="max-w-[70%]">
                            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
                                {product.seller_name || 'Juno Label'}
                            </p>
                            <h2
                                className="mt-1 line-clamp-2 text-white"
                                style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 900,
                                    fontSize: 'clamp(1.1rem, 1.8vw, 1.45rem)',
                                    lineHeight: 0.95,
                                    letterSpacing: '-0.04em',
                                }}
                            >
                                {product.title}
                            </h2>
                            {categoryLabel ? (
                                <p
                                    className="mt-1 text-sm text-white/72"
                                    style={{ fontFamily: 'Instrument Serif, serif' }}
                                >
                                    {categoryLabel}
                                </p>
                            ) : null}
                        </div>

                        {product.rating ? (
                            <div className="flex min-w-[4.75rem] flex-col items-center rounded-[1.25rem] border border-white/10 bg-black/40 px-3 py-2.5 backdrop-blur-md">
                                <div className="flex items-center gap-1 text-amber-300">
                                    <Star size={13} className="fill-current" />
                                    <span className="text-xs font-bold text-white">
                                        {product.rating.toFixed(1)}
                                    </span>
                                </div>
                                <span className="mt-1 text-[10px] uppercase tracking-[0.24em] text-white/35">
                                    Rated
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col px-5 pb-5 pt-3">
                    <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3">
                                <p className="text-[1.45rem] font-black tracking-[-0.04em] text-white">
                                    {formatCurrency(activePrice)}
                                </p>
                                {product.pricing.compare_at_price ? (
                                    <p className="text-sm text-white/30 line-through">
                                        {formatCurrency(product.pricing.compare_at_price)}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {showQuickAdd && !isSoldOut ? (
                            <motion.button
                                initial={false}
                                animate={{
                                    width: isHovered ? 148 : 52,
                                    backgroundColor: addedToCart
                                        ? 'rgba(0,216,117,0.95)'
                                        : 'rgba(255,255,255,0.06)',
                                }}
                                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                onClick={handleQuickAdd}
                                disabled={addedToCart}
                                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/12 px-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_35px_rgba(0,0,0,0.25)] backdrop-blur-md"
                            >
                                <ShoppingBag size={16} />
                                <span className="whitespace-nowrap text-[11px]">
                                    {addedToCart ? 'Added' : isHovered ? 'Quick Add' : ''}
                                </span>
                            </motion.button>
                        ) : (
                            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                                View
                                <ArrowRight
                                    size={14}
                                    className="transition-transform duration-300 group-hover:translate-x-1.5"
                                />
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
