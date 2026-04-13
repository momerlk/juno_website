import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import type { GenderOverviewProduct } from '../../../api/api.types';

type Props = {
    products: GenderOverviewProduct[];
    isLoading?: boolean;
};

const ProductGrid: React.FC<Props> = ({ products, isLoading = false }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse rounded-2xl bg-white/5"
                    >
                        <div className="aspect-[3/4] w-full bg-white/10" />
                        <div className="p-3 space-y-2">
                            <div className="h-3 w-1/2 rounded bg-white/10" />
                            <div className="h-4 w-3/4 rounded bg-white/10" />
                            <div className="h-4 w-1/3 rounded bg-white/10" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <p className="text-center text-neutral-400">No products found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
            ))}
        </div>
    );
};

const ProductCard: React.FC<{ product: GenderOverviewProduct; index: number }> = ({
    product,
    index,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const image = product.images?.[0] ?? '';
    const secondImage = product.images?.[1] ?? '';
    const price = product.pricing.discounted
        ? (product.pricing.discounted_price ?? product.pricing.price)
        : product.pricing.price;
    const comparePrice = product.pricing.compare_at_price;
    const discountPct = comparePrice && comparePrice > price
        ? Math.round(((comparePrice - price) / comparePrice) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.18) }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-full"
        >
            <Link
                to={`/catalog/${product.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
            >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                    {image ? (
                        <>
                            <img
                                src={image}
                                alt={product.title}
                                loading="lazy"
                                className={`h-full w-full object-cover transition-all duration-700 ${
                                    isHovered && secondImage ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                                }`}
                            />
                            {secondImage && (
                                <img
                                    src={secondImage}
                                    alt={product.title}
                                    loading="lazy"
                                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                                        isHovered ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                                    }`}
                                />
                            )}
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <ShoppingBag size={40} className="text-white/20" />
                        </div>
                    )}

                    {/* Discount badge */}
                    {discountPct > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-500/30">
                            -{discountPct}%
                        </span>
                    )}

                    {/* Gradient scrim for text legibility on hover */}
                    <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1.5 p-3.5 md:p-4">
                    <p
                        className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80"
                        style={{ fontFamily: 'Instrument Serif, serif' }}
                    >
                        {product.seller_name}
                    </p>
                    <h3
                        className="line-clamp-2 text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
                            lineHeight: 1.1,
                        }}
                    >
                        {product.title}
                    </h3>
                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/10 pt-3">
                        <div>
                            <p className="text-base font-black text-white md:text-lg">
                                Rs {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(price)}
                            </p>
                            {comparePrice && comparePrice > price && (
                                <p className="text-xs text-neutral-500 line-through">
                                    Rs {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(comparePrice)}
                                </p>
                            )}
                        </div>
                        <ArrowRight
                            size={14}
                            className="mb-0.5 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white/70"
                        />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductGrid;
