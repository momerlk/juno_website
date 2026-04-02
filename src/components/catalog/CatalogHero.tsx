import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Sparkles, TrendingUp, ShoppingBag, Flame } from 'lucide-react';
import { Catalog, type Collection, type Drop } from '../../api/api';

interface CatalogHeroProps {
    onFilterChange?: (filters: { collection?: string; drop?: string }) => void;
}

const CatalogHero: React.FC<CatalogHeroProps> = ({ onFilterChange }) => {
    const [featuredCollection, setFeaturedCollection] = useState<Collection | null>(null);
    const [liveDrop, setLiveDrop] = useState<Drop | null>(null);
    const [trendingSearches, setTrendingSearches] = useState<{ term: string; count: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);

            const [collectionsResponse, dropsResponse, trendingResponse] = await Promise.all([
                Catalog.getCollections(),
                Catalog.getDrops({ status: 'live' }),
                Catalog.getTrendingSearches(5),
            ]);

            if (collectionsResponse.ok && collectionsResponse.body.length > 0) {
                const activeCollections = collectionsResponse.body.filter((c) => c.is_active);
                setFeaturedCollection(activeCollections[0] || collectionsResponse.body[0]);
            }

            if (dropsResponse.ok && dropsResponse.body.length > 0) {
                setLiveDrop(dropsResponse.body[0]);
            }

            if (trendingResponse.ok && Array.isArray(trendingResponse.body)) {
                setTrendingSearches(trendingResponse.body);
            }

            setIsLoading(false);
        };

        loadData();
    }, []);

    // Countdown timer for live drop
    useEffect(() => {
        if (!liveDrop?.end_at) return;

        const calculateTimeLeft = () => {
            const end = new Date(liveDrop.end_at!).getTime();
            const now = Date.now();
            const difference = end - now;

            if (difference <= 0) {
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [liveDrop]);

    const handleTrendingClick = (term: string) => {
        if (onFilterChange) {
            onFilterChange({});
        }
        window.location.href = `/catalog?q=${encodeURIComponent(term)}`;
    };

    if (isLoading) {
        return (
            <div className="mt-20 space-y-6 md:space-y-8">
                <div className="h-[280px] md:h-[380px] w-full animate-pulse rounded-[2.4rem] bg-white/[0.02]" />
                <div className="h-[140px] w-full animate-pulse rounded-[2rem] bg-white/[0.02]" />
            </div>
        );
    }

    // Don't render if no content
    if (!featuredCollection && !liveDrop && trendingSearches.length === 0) {
        return <div className="mt-20" />;
    }

    return (
        <div className="mt-20 space-y-6 md:space-y-8">
            {/* Hero Banner - Collection or Drop */}
            {(featuredCollection || liveDrop) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent"
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

                    {liveDrop ? (
                        <Link
                            to={`/drops/${liveDrop.slug}`}
                            className="relative block p-6 md:p-10 lg:p-12"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 animate-pulse">
                                            <div className="h-3 w-3 rounded-full bg-red-500" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                                            Live Now
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-[-0.04em] text-white">
                                        {liveDrop.title}
                                    </h2>
                                    <p className="mt-3 text-sm md:text-base text-white/70">
                                        {liveDrop.product_ids?.length || 0} exclusive pieces from independent labels
                                    </p>

                                    {/* Countdown Timer */}
                                    {timeLeft && (
                                        <div className="mt-6 flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-white/60">
                                                <Clock size={16} />
                                                <span className="text-xs font-bold uppercase tracking-[0.16em]">
                                                    Ends in
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex flex-col items-center rounded-xl bg-white/10 px-3 py-2">
                                                    <span className="text-lg font-black text-white">
                                                        {String(timeLeft.hours).padStart(2, '0')}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
                                                        H
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center rounded-xl bg-white/10 px-3 py-2">
                                                    <span className="text-lg font-black text-white">
                                                        {String(timeLeft.minutes).padStart(2, '0')}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
                                                        M
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center rounded-xl bg-white/10 px-3 py-2">
                                                    <span className="text-lg font-black text-white">
                                                        {String(timeLeft.seconds).padStart(2, '0')}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/50">
                                                        S
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-white">
                                    <span className="text-sm font-bold uppercase tracking-[0.16em]">
                                        Shop Drop
                                    </span>
                                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-2" />
                                </div>
                            </div>
                        </Link>
                    ) : featuredCollection ? (
                        <Link
                            to={`/catalog?collection=${featuredCollection.id}`}
                            className="relative block p-6 md:p-10 lg:p-12 group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles size={16} className="text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                                            Featured Collection
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-[-0.04em] text-white">
                                        {featuredCollection.title}
                                    </h2>
                                    {featuredCollection.description && (
                                        <p className="mt-3 text-sm md:text-base text-white/70 line-clamp-2">
                                            {featuredCollection.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-white group-hover:translate-x-2 transition-transform">
                                    <span className="text-sm font-bold uppercase tracking-[0.16em]">
                                        Explore
                                    </span>
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </Link>
                    ) : null}
                </motion.div>
            )}

            {/* Trending Searches Ribbon */}
            {trendingSearches.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Flame size={18} className="text-primary" />
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                            Trending Searches
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((search, index) => (
                            <motion.button
                                key={search.term}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleTrendingClick(search.term)}
                                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition-all hover:border-primary hover:bg-primary/20 hover:text-white"
                            >
                                <ShoppingBag size={14} className="text-white/40 group-hover:text-primary transition-colors" />
                                {search.term}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default CatalogHero;
