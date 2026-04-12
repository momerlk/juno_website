import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import type { GenderOverviewProduct } from '../../../api/api.types';

type Props = {
    products: GenderOverviewProduct[];
    isLoading?: boolean;
};

const formatPrice = (price: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(price)}`;

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
    const image = product.images?.[0] ?? '';
    const price = product.pricing.discounted
        ? product.pricing.discounted_price
        : product.pricing.price;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Link to={`/catalog/${product.id}`} className="group block">
                {/* Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-white/5">
                    {image ? (
                        <img
                            src={image}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/10">
                            <ShoppingBag size={48} className="text-white/20" />
                        </div>
                    )}

                    {product.pricing.discounted && (
                        <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                            Sale
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="mt-2 space-y-1">
                    <p className="text-xs text-neutral-400">{product.seller_name}</p>
                    <p className="line-clamp-1 text-sm font-medium text-white">{product.title}</p>
                    <p className="text-sm font-bold text-white">
                        {formatPrice(price)}
                    </p>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductGrid;
