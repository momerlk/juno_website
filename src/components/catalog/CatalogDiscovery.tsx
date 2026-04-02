import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Layers, Store } from 'lucide-react';
import { Catalog, type CatalogProduct, type Collection as CollectionType } from '../../api/api';
import ProductCard from './ProductCard';

interface CatalogDiscoveryProps {
    onProductClick?: (product: CatalogProduct) => void;
}

const CatalogDiscovery: React.FC<CatalogDiscoveryProps> = ({ onProductClick }) => {
    const [popularProducts, setPopularProducts] = useState<CatalogProduct[]>([]);
    const [collections, setCollections] = useState<CollectionType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [popularResponse, collectionsResponse] = await Promise.all([
                Catalog.getPopularProducts(24),
                Catalog.getCollections(),
            ]);

            if (popularResponse.ok) {
                setPopularProducts(popularResponse.body);
            }

            if (collectionsResponse.ok) {
                setCollections(collectionsResponse.body.filter((c) => c.is_active).slice(0, 3));
            }

            setIsLoading(false);
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-12 py-12">
                <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] animate-pulse rounded-[1.6rem] bg-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    if (popularProducts.length === 0 && collections.length === 0) {
        return null;
    }

    return (
        <div className="space-y-12 py-8">
            {/* Popular Right Now Section */}
            {popularProducts.length > 0 && (
                <section>
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles size={20} className="text-primary" />
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                                    Discovery
                                </p>
                                <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                                    Popular Right Now
                                </h2>
                            </div>
                        </div>
                        <Link
                            to="/catalog?sort=newest"
                            className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:text-white md:inline-flex"
                        >
                            View All
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                        {popularProducts.slice(0, 8).map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                showQuickAdd={true}
                            />
                        ))}
                    </div>

                    {/* Mobile View All */}
                    <div className="mt-6 md:hidden">
                        <Link
                            to="/catalog?sort=newest"
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            View All Products
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </section>
            )}

            {/* Collections Grid Section */}
            {collections.length > 0 && (
                <section>
                    <div className="mb-6 flex items-center gap-3">
                        <Layers size={20} className="text-primary" />
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                                Curated
                            </p>
                            <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                                Shop by Collection
                            </h2>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {collections.map((collection, index) => (
                            <CollectionCard
                                key={collection.id}
                                collection={collection}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Brand Shortcuts */}
            <section>
                <div className="mb-6 flex items-center gap-3">
                    <Store size={20} className="text-primary" />
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                            Brands
                        </p>
                        <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                            Shop by Brand
                        </h2>
                    </div>
                </div>

                <BrandShortcuts />
            </section>
        </div>
    );
};

// Collection Card Component
const CollectionCard: React.FC<{ collection: CollectionType; index: number }> = ({
    collection,
    index,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link
                to={`/catalog?collection=${collection.id}`}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-white/20"
            >
                <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                        Collection
                    </p>
                    <h3 className="mt-2 text-xl md:text-2xl font-black uppercase tracking-[-0.03em] text-white">
                        {collection.title}
                    </h3>
                    {collection.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-white/60">
                            {collection.description}
                        </p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        <span>Shop Now</span>
                        <ArrowRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                        />
                    </div>
                </div>

                {/* Decorative Background */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-secondary/10 blur-2xl" />
            </Link>
        </motion.div>
    );
};

// Brand Shortcuts Component
const BrandShortcuts: React.FC = () => {
    const [brands, setBrands] = useState<{ id: string; name: string; logo?: string }[]>([]);

    useEffect(() => {
        // Extract unique brands from popular products
        const loadBrands = async () => {
            const response = await Catalog.getPopularProducts(24);
            if (response.ok) {
                const brandMap = new Map<string, { id: string; name: string; logo?: string }>();
                response.body.forEach((product) => {
                    if (product.seller_id && !brandMap.has(product.seller_id)) {
                        brandMap.set(product.seller_id, {
                            id: product.seller_id,
                            name: product.seller_name,
                            logo: product.seller_logo,
                        });
                    }
                });
                setBrands(Array.from(brandMap.values()).slice(0, 12));
            }
        };

        loadBrands();
    }, []);

    if (brands.length === 0) return null;

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {brands.map((brand, index) => (
                <motion.a
                    key={brand.id}
                    href={`/catalog?seller_id=${brand.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex-shrink-0"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all group-hover:border-primary group-hover:bg-primary/10">
                            {brand.logo ? (
                                <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="h-10 w-10 object-contain"
                                />
                            ) : (
                                <span className="text-lg font-black text-white/60">
                                    {brand.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span className="max-w-[80px] truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 group-hover:text-white">
                            {brand.name}
                        </span>
                    </div>
                </motion.a>
            ))}
        </div>
    );
};

export default CatalogDiscovery;
