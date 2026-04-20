import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import type { GenderOverviewProduct } from '../../../api/api.types';

type Props = {
    products: GenderOverviewProduct[];
    isLoading?: boolean;
    basePath?: string;
};

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const ProductGrid: React.FC<Props> = ({ products, isLoading = false, basePath = 'catalog' }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="overflow-hidden border border-white/10 bg-white/[0.04] animate-pulse">
                        <div className="aspect-[4/5] w-full bg-white/10" />
                        <div className="space-y-3 p-4">
                            <div className="h-2.5 w-24 bg-white/10" />
                            <div className="h-5 w-4/5 bg-white/10" />
                            <div className="h-5 w-2/3 bg-white/10" />
                            <div className="h-4 w-28 bg-white/10" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex min-h-[420px] items-center justify-center border border-white/10 bg-white/[0.03] px-6 text-center">
                <div className="max-w-md">
                    <p
                        className="text-3xl uppercase text-white"
                        style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}
                    >
                        Nothing here yet
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/55" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Try a different brand or reset the current filter. The edit is intentionally selective.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
            {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} basePath={basePath} />
            ))}
        </div>
    );
};

const ProductCard: React.FC<{ product: GenderOverviewProduct; index: number; basePath: string }> = ({
    product,
    index,
    basePath,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const image = product.images?.[0] ?? '';
    const price = product.pricing.discounted
        ? product.pricing.discounted_price ?? product.pricing.price
        : product.pricing.price;
    const comparePrice = product.pricing.compare_at_price;
    const discountPct =
        comparePrice && comparePrice > price
            ? Math.round(((comparePrice - price) / comparePrice) * 100)
            : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.2) }}
            className="h-full"
        >
            <Link
                to={`/${basePath}/${product.id}`}
                className="group flex h-full flex-col overflow-hidden border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative overflow-hidden bg-black/10">
                    {image ? (
                        <img
                            src={image}
                            alt={product.title}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex aspect-[4/5] w-full items-center justify-center bg-white/5">
                            <ShoppingBag size={38} className="text-white/20" />
                        </div>
                    )}

                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {discountPct > 0 ? (
                            <span className="rounded-full border border-primary/40 bg-primary/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                                Save {discountPct}%
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
                        {product.seller_name || 'Juno Label'}
                    </p>

                    <h3
                        className="mt-2 line-clamp-2 uppercase text-white"
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 800,
                            fontSize: 'clamp(1rem,1.8vw,1.35rem)',
                            lineHeight: 1,
                            letterSpacing: '-0.04em',
                        }}
                    >
                        {product.title}
                    </h3>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                            <p
                                className="text-lg text-white"
                                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, letterSpacing: '-0.03em' }}
                            >
                                {formatCurrency(price)}
                            </p>
                            {comparePrice && comparePrice > price ? (
                                <p className="text-sm text-white/30 line-through">
                                    {formatCurrency(comparePrice)}
                                </p>
                            ) : (
                                <p
                                    className="text-sm italic text-white/45"
                                    style={{ fontFamily: 'Instrument Serif, serif' }}
                                >
                                    Curated piece
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
