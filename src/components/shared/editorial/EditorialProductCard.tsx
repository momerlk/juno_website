import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { getResponsiveShopifyImageSet } from '../../../utils/shopifyImage';

type EditorialProductCardProps = {
    title: string;
    sellerName?: string;
    images?: string[];
    badges?: {
        marketing_campaign?: boolean;
        best_seller?: boolean;
        thrifted?: boolean;
    };
    pricing: {
        price: number;
        discounted?: boolean;
        discounted_price?: number;
        compare_at_price?: number;
    };
    inventory?: {
        in_stock?: boolean;
        quantity?: number;
        available_quantity?: number;
    };
    to: string;
    onClick?: () => void;
    index?: number;
};

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const EditorialProductCard: React.FC<EditorialProductCardProps> = ({
    title,
    sellerName,
    images,
    badges,
    pricing,
    inventory,
    to,
    onClick,
    index = 0,
}) => {
    const image = images?.[0] ?? '';
    const imageSet = getResponsiveShopifyImageSet(image, [240, 360, 540, 720]);
    const price = pricing.discounted ? pricing.discounted_price ?? pricing.price : pricing.price;
    const comparePrice = pricing.compare_at_price;
    const discountPct =
        comparePrice && comparePrice > price
            ? Math.round(((comparePrice - price) / comparePrice) * 100)
            : 0;
    const stockCount = inventory?.available_quantity ?? inventory?.quantity;
    const inStock = inventory?.in_stock ?? true;
    const lowStock = typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.25) }}
        >
            <Link
                to={to}
                onClick={onClick}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04]"
            >
                <div className="relative overflow-hidden bg-[#0d0d0e]">
                    {image ? (
                        <img
                            src={imageSet.src}
                            srcSet={imageSet.srcSet}
                            sizes="(max-width: 640px) 92vw, (max-width: 1280px) 46vw, 30vw"
                            alt={title}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                        />
                    ) : (
                        <div className="flex aspect-[4/5] w-full items-center justify-center bg-white/5">
                            <ShoppingBag size={40} className="text-white/20" />
                        </div>
                    )}

                    <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
                        {discountPct > 0 ? (
                            <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(220,10,40,0.35)]">
                                -{discountPct}%
                            </span>
                        ) : null}
                        {badges?.best_seller ? (
                            <span className="rounded-md bg-amber-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                Best Seller
                            </span>
                        ) : null}
                        {badges?.thrifted ? (
                            <>
                                <span className="rounded-md bg-emerald-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                    Pre-Loved
                                </span>
                                <span className="rounded-md border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                    One of One
                                </span>
                            </>
                        ) : null}
                        {lowStock && inStock ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                Only {stockCount} left
                            </span>
                        ) : null}
                    </div>

                    {!inStock ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
                            <span className="rounded-md bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-black">
                                Sold out
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-1 flex-col p-3 md:p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40 md:text-[10px]">
                        {sellerName || 'Juno Label'}
                    </p>

                    <h3
                        className="mt-1.5 line-clamp-2 uppercase text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
                            lineHeight: 1.05,
                            letterSpacing: '-0.035em',
                        }}
                    >
                        {title}
                    </h3>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                        <div className="flex items-baseline gap-2">
                            <span
                                className="text-white"
                                style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {formatCurrency(price)}
                            </span>
                            {comparePrice && comparePrice > price ? (
                                <span className="text-xs text-white/30 line-through">
                                    {formatCurrency(comparePrice)}
                                </span>
                            ) : null}
                        </div>

                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-all group-hover:border-white/30 group-hover:bg-white group-hover:text-black">
                            <ArrowRight size={13} />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

// Memoized: browse pages accumulate hundreds of cards via infinite scroll and
// re-render the whole grid on every loading-state toggle. Product props keep
// stable identities across appends, so memo comparison stays cheap.
export default React.memo(EditorialProductCard);
