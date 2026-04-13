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
            className="h-full"
        >
            <Link
                to={`/catalog/${product.id}`}
                className="group flex h-full flex-col overflow-hidden border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative overflow-hidden bg-black/40">
                    {image ? (
                        <img
                            src={image}
                            alt={product.title}
                            loading="lazy"
                            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex aspect-[4/5] w-full items-center justify-center bg-white/5">
                            <ShoppingBag size={40} className="text-white/20" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]" />

                    {discountPct > 0 && (
                        <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-primary/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                            Save {discountPct}%
                        </span>
                    )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
                        {product.seller_name}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-black uppercase tracking-[-0.04em] text-white">
                        {product.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-lg font-bold text-white">
                                Rs {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(price)}
                            </p>
                            {comparePrice && comparePrice > price && (
                                <p className="text-sm text-white/30 line-through">
                                    Rs {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(comparePrice)}
                                </p>
                            )}
                        </div>
                        <ArrowRight
                            size={15}
                            className={`text-white/65 transition-transform duration-300 ${
                                isHovered ? 'translate-x-1.5' : ''
                            }`}
                        />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductGrid;
