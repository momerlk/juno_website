import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Flame } from 'lucide-react';
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
        <div className="mt-20 space-y-5 md:space-y-6">
            {/* ── HERO BANNER ────────────────────────────────────── */}
            {(featuredCollection || liveDrop) && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2.4rem] bg-black min-h-[380px] md:min-h-[280px]"
                >
                    {/* Grain texture overlay for editorial feel */}
                    <div
                        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* Red-pink gradient background mesh */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-secondary/20" />
                    <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/15 blur-[100px]" />
                    <div className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-secondary/15 blur-[80px]" />

                    {liveDrop ? (
                        <Link to={`/drops/${liveDrop.slug}`} className="relative z-20 block p-8 md:p-12 lg:p-16 group">
                            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                                <div>
                                    {/* Live pill */}
                                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                        </span>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-red-400">
                                            Live Drop
                                        </span>
                                    </div>

                                    {/* Drop title in Montserrat Black */}
                                    <h2
                                        className="leading-none text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 900,
                                            fontSize: 'clamp(1.8rem, 6vw, 6rem)',
                                        }}
                                    >
                                        {liveDrop.title}
                                    </h2>

                                    <p
                                        className="mt-3 text-base italic text-white/50"
                                        style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                                    >
                                        {liveDrop.product_ids?.length || 0} exclusive pieces from independent labels
                                    </p>

                                    {/* Countdown timer */}
                                    {timeLeft && (
                                        <div className="mt-6 flex w-fit flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 md:flex-row md:items-center md:gap-4 md:px-5">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-white/40" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                    Ends in
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-4">
                                                {[
                                                    { val: timeLeft.hours, label: 'H' },
                                                    { val: timeLeft.minutes, label: 'M' },
                                                    { val: timeLeft.seconds, label: 'S' },
                                                ].map(({ val, label }) => (
                                                    <div key={label} className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900 }}>
                                                            {String(val).padStart(2, '0')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-white/30">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 transition-all group-hover:bg-white/10 group-hover:border-white/30 self-start md:self-auto">
                                    <span
                                        className="text-sm font-bold uppercase tracking-[0.2em] text-white"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        Shop Drop
                                    </span>
                                    <ArrowRight size={16} className="text-white transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ) : featuredCollection ? (
                        <Link
                            to={`/catalog?collection=${featuredCollection.id}`}
                            className="relative z-20 block p-8 md:p-12 lg:p-16 group"
                        >
                            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p
                                        className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40"
                                    >
                                        Featured Collection
                                    </p>

                                    <h2
                                        className="leading-none text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 900,
                                            fontSize: 'clamp(1.8rem, 6vw, 6rem)',
                                        }}
                                    >
                                        {featuredCollection.title}
                                    </h2>

                                    {featuredCollection.description && (
                                        <p
                                            className="mt-3 max-w-lg text-base italic text-white/50 line-clamp-2"
                                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                                        >
                                            {featuredCollection.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 transition-all group-hover:bg-white/10 group-hover:border-white/30 self-start md:self-auto">
                                    <span
                                        className="text-sm font-bold uppercase tracking-[0.2em] text-white"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        Explore
                                    </span>
                                    <ArrowRight size={16} className="text-white transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ) : null}
                </motion.div>
            )}

            {/* ── TRENDING SEARCHES ──────────────────────────────── */}
            {trendingSearches.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] px-6 py-5"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Flame size={16} className="text-primary" />
                        <p
                            className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40"
                        >
                            Trending Now
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((search, index) => (
                            <motion.button
                                key={search.term}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => handleTrendingClick(search.term)}
                                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                            >
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
