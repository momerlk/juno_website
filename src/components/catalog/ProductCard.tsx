import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Heart, ShoppingBag } from 'lucide-react';
import type { CatalogProduct } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';

interface ProductCardProps {
    product: CatalogProduct;
    index?: number;
    onQuickAdd?: (product: CatalogProduct) => void;
    showQuickAdd?: boolean;
}

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    index = 0,
    onQuickAdd,
    showQuickAdd = true,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addItem } = useGuestCart();

    // Check if product is new (created within last 7 days)
    const isNew = product.created_at
        ? new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        : product.is_featured || false;

    // Calculate discount percentage
    const discountPercentage = product.pricing.compare_at_price
        ? Math.round(
              ((product.pricing.compare_at_price -
                  (product.pricing.discounted_price || product.pricing.price)) /
                  product.pricing.compare_at_price) *
                  100
          )
        : 0;

    const isSoldOut = !product.inventory?.in_stock;
    const hasDiscount = product.pricing.discounted && discountPercentage > 0;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickAdd) {
            onQuickAdd(product);
        } else {
            const variant = product.variants?.[0];
            if (!variant) return;

            setAddedToCart(true);
            addItem(
                product.id,
                variant.id,
                1,
                variant.price || product.pricing.discounted_price || product.pricing.price,
                {
                    seller_name: product.seller_name,
                    product_title: product.title,
                    variant_title: variant.title,
                    image_url: getProductImage(product),
                }
            );

            setTimeout(() => setAddedToCart(false), 2000);
        }
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);

        const wishlist = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');
        if (isWishlisted) {
            localStorage.setItem(
                'juno_wishlist',
                JSON.stringify(wishlist.filter((id: string) => id !== product.id))
            );
        } else {
            localStorage.setItem('juno_wishlist', JSON.stringify([...wishlist, product.id]));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.12) }}
            className="h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                to={`/catalog/${product.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-2 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
            >
                {/* Image Section - Larger, More Prominent */}
                <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                    {/* Primary Image */}
                    <img
                        src={getProductImage(product)}
                        alt={product.title}
                        className={`h-full w-full object-cover transition-all duration-700 ${
                            isHovered && product.images?.length > 1 ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                        }`}
                    />

                    {/* Secondary Image (on hover) */}
                    {product.images?.length > 1 && (
                        <img
                            src={product.images[1]}
                            alt={product.title}
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                                isHovered ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                            }`}
                        />
                    )}

                    {/* Badges - More Visible */}
                    <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
                        {hasDiscount && (
                            <span className="rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-500/30">
                                -{discountPercentage}%
                            </span>
                        )}
                        {isNew && (
                            <span className="rounded-full bg-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-green-500/30">
                                New
                            </span>
                        )}
                        {product.is_trending && (
                            <span className="rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/30">
                                Trending
                            </span>
                        )}
                        {product.shipping_details?.free_shipping && (
                            <span className="rounded-full bg-blue-500/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm shadow-lg shadow-blue-500/30">
                                Free Shipping
                            </span>
                        )}
                    </div>

                    {/* Wishlist Button - More Prominent */}
                    <button
                        onClick={handleWishlistToggle}
                        className="absolute right-3 top-3 z-10 rounded-full border border-white/30 bg-black/50 p-2.5 text-white/80 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20 hover:text-white"
                        aria-label="Add to wishlist"
                    >
                        <Heart
                            size={18}
                            className={isWishlisted ? 'fill-red-500 text-red-500' : ''}
                        />
                    </button>

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px] z-10">
                            <span className="rounded-full border border-white/40 bg-black/80 px-5 py-2.5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl">
                                Sold Out
                            </span>
                        </div>
                    )}

                    {/* Quick Add Button */}
                    {showQuickAdd && !isSoldOut && (
                        <>
                            {/* Desktop - Show on Hover */}
                            <div className="absolute inset-x-3 bottom-4 hidden lg:block z-10">
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{
                                        opacity: isHovered ? 1 : 0,
                                        y: isHovered ? 0 : 10,
                                    }}
                                    onClick={handleQuickAdd}
                                    disabled={addedToCart}
                                    className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-md transition-all ${
                                        addedToCart
                                            ? 'bg-green-500/95'
                                            : 'bg-gradient-to-r from-primary to-secondary hover:scale-[1.03]'
                                    }`}
                                >
                                    {addedToCart ? (
                                        <>
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                ✓
                                            </motion.span>
                                            Added to Bag
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={16} />
                                            Quick Add
                                        </>
                                    )}
                                </motion.button>
                            </div>

                            {/* Mobile - Always Visible */}
                            <div className="absolute inset-x-3 bottom-4 lg:hidden z-10">
                                <button
                                    onClick={handleQuickAdd}
                                    disabled={addedToCart}
                                    className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xl backdrop-blur-md ${
                                        addedToCart
                                            ? 'bg-green-500/95'
                                            : 'bg-gradient-to-r from-primary to-secondary'
                                    }`}
                                >
                                    {addedToCart ? 'Added' : 'Quick Add'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col p-4 md:p-5">
                    <div className="min-h-[80px]">
                        <div className="flex items-start justify-between gap-3">
                            <p
                                className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80"
                                style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.25em' }}
                            >
                                {product.seller_name || 'Juno Label'}
                            </p>
                            {/* Rating */}
                            {product.rating && (
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-[10px] font-bold text-white/70">
                                        {product.rating.toFixed(1)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h2
                            className="mt-1 line-clamp-2 text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
                                lineHeight: 1.05,
                                letterSpacing: '0.01em',
                            }}
                        >
                            {product.title}
                        </h2>
                    </div>

                    {/* Category Tags */}
                    <div className="mt-3 flex min-h-[28px] flex-wrap gap-2">
                        {product.categories?.slice(0, 2).map((item) => (
                            <span
                                key={item.id}
                                className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-300"
                            >
                                {item.name}
                            </span>
                        ))}
                    </div>

                    {/* Price & View Link */}
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                        <div>
                            <p className="text-xl md:text-2xl font-black text-white">
                                {formatCurrency(product.pricing?.discounted_price ?? product.pricing?.price)}
                            </p>
                            {product.pricing?.compare_at_price && (
                                <p className="text-xs text-neutral-500 line-through">
                                    {formatCurrency(product.pricing.compare_at_price)}
                                </p>
                            )}
                        </div>
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">
                            View
                            <ArrowRight
                                size={14}
                                className="transition-transform group-hover:translate-x-2"
                            />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

// Helper function to get product image
const getProductImage = (product: Partial<CatalogProduct>) => {
    const images = Array.isArray(product.images) ? product.images : [];
    return images[0] || '/juno_app_icon.png';
};

export default ProductCard;
