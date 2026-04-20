import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PublicCampaigns } from '../../api/campaignsApi';
import CampaignLayout from './CampaignLayout';
import { RefreshCw, AlertCircle, ArrowRight, ShoppingBag } from 'lucide-react';

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

type CampaignProduct = {
    id: string;
    title: string;
    images: string[];
    seller_name: string;
    pricing: { price: number; discounted?: boolean; discounted_price?: number; compare_at_price?: number };
    inventory?: { in_stock?: boolean; quantity?: number };
};

const CampaignLandingPage: React.FC = () => {
    const { campaignSlug } = useParams<{ campaignSlug: string }>();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!campaignSlug || !campaignSlug.endsWith('-campaign')) {
            navigate('/404', { replace: true });
            return;
        }

        const slug = campaignSlug.replace(/-campaign$/, '');

        const fetchCampaign = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const resp = await PublicCampaigns.getPublicCampaign(slug);
                if (resp.ok) {
                    setData(resp.body);
                } else {
                    setError('This campaign has ended or does not exist.');
                }
            } catch {
                setError('Something went wrong. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaign();
    }, [campaignSlug, navigate]);

    const handleSearch = (query: string) => setSearchQuery(query);

    const products: CampaignProduct[] = useMemo(() => {
        if (!data?.products) return [];
        const mapped: CampaignProduct[] = data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            images: p.images,
            seller_name: p.seller_name,
            pricing: p.pricing,
            inventory: p.inventory,
        }));
        if (!searchQuery) return mapped;
        const q = searchQuery.toLowerCase();
        return mapped.filter(
            (p) => p.title.toLowerCase().includes(q) || p.seller_name.toLowerCase().includes(q)
        );
    }, [data, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Fetching edit…</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="inline-flex p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                        <AlertCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {error || 'Campaign unavailable'}
                    </h1>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-5 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-200 transition-all active:scale-95"
                    >
                        Return to Juno
                    </button>
                </div>
            </div>
        );
    }

    return (
        <CampaignLayout campaign={data.campaign} onSearch={handleSearch}>
            <div className="relative pb-16 md:pb-24">

                {/* ── Ambient atmosphere ── */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[140px]" />
                    <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[160px]" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 pt-8 md:pt-12">

                    {/* ── Section header ── */}
                    <div className="mb-6 md:mb-10 flex items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.32em] text-white/40">
                                    The collection
                                </p>
                            </div>
                            <h2
                                className="text-white"
                                style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 900,
                                    fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                                    lineHeight: 0.92,
                                    letterSpacing: '-0.045em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Featured pieces
                            </h2>
                        </div>
                        <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                            {products.length} {products.length === 1 ? 'piece' : 'pieces'}
                        </p>
                    </div>

                    {/* ── Grid ── */}
                    {products.length === 0 ? (
                        <div className="py-32 text-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <p className="text-sm font-mono uppercase tracking-[0.3em] text-white/30">
                                {searchQuery ? 'No matches found.' : 'No pieces in this edit yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                            {products.map((product, index) => (
                                <CampaignProductCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    basePath={campaignSlug || ''}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </CampaignLayout>
    );
};

const CampaignProductCard: React.FC<{
    product: CampaignProduct;
    index: number;
    basePath: string;
}> = ({ product, index, basePath }) => {
    const image = product.images?.[0] ?? '';
    const price = product.pricing.discounted
        ? product.pricing.discounted_price ?? product.pricing.price
        : product.pricing.price;
    const comparePrice = product.pricing.compare_at_price;
    const discountPct =
        comparePrice && comparePrice > price
            ? Math.round(((comparePrice - price) / comparePrice) * 100)
            : 0;
    const inStock = product.inventory?.in_stock ?? true;
    const stockCount = product.inventory?.quantity;
    const lowStock = typeof stockCount === 'number' && stockCount > 0 && stockCount <= 5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.25) }}
        >
            <Link
                to={`/${basePath}/${product.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04]"
            >
                <div className="relative overflow-hidden bg-[#0d0d0e]">
                    {image ? (
                        <img
                            src={image}
                            alt={product.title}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                        />
                    ) : (
                        <div className="flex aspect-[4/5] w-full items-center justify-center bg-white/5">
                            <ShoppingBag size={40} className="text-white/20" />
                        </div>
                    )}

                    {/* Badges — clean top-left */}
                    <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
                        {discountPct > 0 ? (
                            <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(220,10,40,0.35)]">
                                −{discountPct}%
                            </span>
                        ) : null}
                        {lowStock && inStock ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                Only {stockCount} left
                            </span>
                        ) : null}
                    </div>

                    {/* Sold out overlay */}
                    {!inStock ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
                            <span className="rounded-md bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-black">
                                Sold out
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-1 flex-col p-4 md:p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                        {product.seller_name || 'Juno Label'}
                    </p>

                    <h3
                        className="mt-1.5 line-clamp-2 uppercase text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(1.05rem, 1.6vw, 1.35rem)',
                            lineHeight: 1,
                            letterSpacing: '-0.045em',
                        }}
                    >
                        {product.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-end justify-between gap-3">
                        <div className="flex items-baseline gap-2">
                            <span
                                className="text-white"
                                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.04em' }}
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

export default CampaignLandingPage;
