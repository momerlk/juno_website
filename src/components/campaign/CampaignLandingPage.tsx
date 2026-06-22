import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { PublicCampaigns } from '../../api/campaignsApi';
import CampaignLayout from './CampaignLayout';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { setClarityTags, trackClarityEventWithTags, upgradeClaritySession } from '../../utils/clarity';
import EditorialProductCard from '../shared/editorial/EditorialProductCard';

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

const fuzzySearch = (query: string, text: string): boolean => {
    const q = query.toLowerCase().replace(/\s+/g, '');
    const t = text.toLowerCase().replace(/\s+/g, '');
    if (t.includes(q)) return true;
    
    let n = -1;
    for (let i = 0; i < q.length; i++) {
        if (!~(n = t.indexOf(q[i], n + 1))) return false;
    }
    return true;
};

const CampaignLandingPage: React.FC = () => {
    const { campaignSlug } = useParams<{ campaignSlug: string }>();
    const location = useLocation();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get('q');
        setSearchQuery(q || '');
    }, [location.search]);

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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const url = new URL(window.location.href);
        if (query) url.searchParams.set('q', query);
        else url.searchParams.delete('q');
        window.history.replaceState({}, '', url);

        const normalizedQuery = query.trim();
        if (!data?.campaign) return;
        const matchedCount = !normalizedQuery
            ? data.products?.length ?? 0
            : products.length;

        trackClarityEventWithTags('campaign_search_submit', {
            campaign_slug: data.campaign.slug,
            campaign_name: data.campaign.name,
            search_query: normalizedQuery || 'empty',
            result_count: String(matchedCount),
        });
        if (normalizedQuery && matchedCount === 0) {
            trackClarityEventWithTags('campaign_search_no_results', {
                campaign_slug: data.campaign.slug,
                campaign_name: data.campaign.name,
                search_query: normalizedQuery.toLowerCase(),
            });
        }
    };

    const handleQueryChange = (query: string) => {
        setSearchQuery(query);
        const url = new URL(window.location.href);
        if (query) url.searchParams.set('q', query);
        else url.searchParams.delete('q');
        window.history.replaceState({}, '', url);
    };

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
        return mapped.filter(
            (p) => fuzzySearch(searchQuery, p.title) || fuzzySearch(searchQuery, p.seller_name)
        );
    }, [data, searchQuery]);

    const suggestions = useMemo(() => {
        if (!searchQuery || !data?.products) return [];
        return data.products
            .filter((p: any) => fuzzySearch(searchQuery, p.title))
            .slice(0, 5)
            .map((p: any) => ({ keyword: p.title }));
    }, [data, searchQuery]);

    useEffect(() => {
        if (!data?.campaign) return;
        setClarityTags({
            campaign_slug: data.campaign.slug,
            campaign_name: data.campaign.name,
            campaign_stage: 'landing',
            campaign_product_count: String(data.products?.length ?? 0),
        });
        trackClarityEventWithTags('campaign_landing_view', {
            campaign_slug: data.campaign.slug,
            campaign_name: data.campaign.name,
        });
    }, [data?.campaign?.slug, data?.campaign?.name, data?.products?.length]);

    const handleProductClick = (product: CampaignProduct) => {
        if (!data?.campaign) return;
        const price = product.pricing.discounted
            ? product.pricing.discounted_price ?? product.pricing.price
            : product.pricing.price;

        trackClarityEventWithTags('campaign_product_card_click', {
            campaign_slug: data.campaign.slug,
            product_id: product.id,
            product_title: product.title,
            seller_name: product.seller_name,
            product_price: String(price),
            in_stock: String(product.inventory?.in_stock ?? true),
        });
        upgradeClaritySession('campaign_product_interest');
    };

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
        <CampaignLayout 
            campaign={data.campaign} 
            onSearch={handleSearch} 
            onQueryChange={handleQueryChange}
            suggestionsOverride={suggestions}
            initialQuery={searchQuery}
            hideBanner={!!searchQuery}
        >
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
                                <EditorialProductCard
                                    key={product.id}
                                    title={product.title}
                                    sellerName={product.seller_name}
                                    images={product.images}
                                    pricing={product.pricing}
                                    inventory={product.inventory}
                                    index={index}
                                    to={`/${campaignSlug || ''}/${product.id}`}
                                    onClick={() => handleProductClick(product)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </CampaignLayout>
    );
};

export default CampaignLandingPage;
