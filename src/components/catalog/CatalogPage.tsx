import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { Catalog, type CatalogProduct, type Collection } from '../../api/api';
import CatalogNavbar from './CatalogNavbar';
import EditorialProductCard from '../shared/editorial/EditorialProductCard';
import EditorialShowcaseBanner from '../shared/editorial/EditorialShowcaseBanner';

type SortValue = 'newest' | 'price_asc' | 'price_desc';
type CatalogCategoryOption = { id: string; name: string; slug?: string };

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const diversifyProducts = (products: CatalogProduct[]): CatalogProduct[] => {
    if (products.length <= 1) return products;

    const diversified = [...products];
    const maxIterations = diversified.length * 2;
    let iterations = 0;

    const getSimilarityKey = (product: CatalogProduct) => {
        const brand = product.seller_id || '';
        const category = product.categories?.[0]?.id || '';
        return `${brand}:${category}`;
    };

    for (let i = 0; i < diversified.length - 1 && iterations < maxIterations; i++) {
        const currentKey = getSimilarityKey(diversified[i]);
        const nextKey = getSimilarityKey(diversified[i + 1]);

        if (currentKey === nextKey && i + 2 < diversified.length) {
            for (let j = i + 2; j < diversified.length; j++) {
                const swapKey = getSimilarityKey(diversified[j]);
                if (swapKey !== currentKey) {
                    [diversified[i + 1], diversified[j]] = [diversified[j], diversified[i + 1]];
                    iterations++;
                    break;
                }
            }
        }
        iterations++;
    }

    const rowSize = 4;
    for (let rowStart = 0; rowStart < diversified.length - rowSize; rowStart += rowSize) {
        const row = diversified.slice(rowStart, rowStart + rowSize);
        const brandCounts = new Map<string, number>();

        row.forEach((product) => {
            const brand = product.seller_id || 'unknown';
            brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
        });

        for (const [brand, count] of brandCounts.entries()) {
            if (count > 2) {
                const brandIndices = row
                    .map((p, idx) => (p.seller_id === brand ? rowStart + idx : -1))
                    .filter((idx) => idx !== -1);

                if (brandIndices.length > 1 && rowStart + rowSize < diversified.length) {
                    const swapIndex = brandIndices[brandIndices.length - 1];
                    for (let j = rowStart + rowSize; j < Math.min(rowStart + rowSize * 2, diversified.length); j++) {
                        if (diversified[j].seller_id !== brand) {
                            [diversified[swapIndex], diversified[j]] = [diversified[j], diversified[swapIndex]];
                            break;
                        }
                    }
                }
            }
        }
    }

    return diversified;
};

const CatalogPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [categories, setCategories] = useState<CatalogCategoryOption[]>([]);
    const [featuredCollection, setFeaturedCollection] = useState<Collection | null>(null);
    const [showcaseImage, setShowcaseImage] = useState('/juno_app_icon.png');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') ?? '');

    const observerTarget = useRef<HTMLDivElement>(null);

    const query = searchParams.get('q') ?? '';
    const categoryId = searchParams.get('category') ?? '';
    const collectionId = searchParams.get('collection') ?? '';
    const sellerId = searchParams.get('seller_id') ?? '';
    const sort = (searchParams.get('sort') as SortValue | null) ?? 'newest';

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, 400);

        return () => window.clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
    }, [debouncedQuery, categoryId, collectionId, sellerId, sort]);

    useEffect(() => {
        const loadMeta = async () => {
            const [filtersResponse, collectionsResponse, popularResponse] = await Promise.all([
                Catalog.getFilters(),
                Catalog.getCollections(),
                Catalog.getPopularProducts(1),
            ]);

            if (filtersResponse.ok && 'categories' in filtersResponse.body) {
                setCategories(asArray(filtersResponse.body.categories));
            }

            if (collectionsResponse.ok) {
                const activeCollection =
                    collectionsResponse.body.find((collection) => collection.is_active) ||
                    collectionsResponse.body[0] ||
                    null;
                setFeaturedCollection(activeCollection);

                const fallbackImage = popularResponse.ok
                    ? asArray(popularResponse.body)[0]?.images?.[0]
                    : undefined;
                setShowcaseImage(activeCollection?.image_url || fallbackImage || '/juno_app_icon.png');
            } else if (popularResponse.ok) {
                setShowcaseImage(asArray(popularResponse.body)[0]?.images?.[0] || '/juno_app_icon.png');
            }
        };

        loadMeta();
    }, []);

    const loadProducts = useCallback(
        async (pageNum: number, append = false) => {
            if (!append) {
                setError(null);
                setIsLoading(true);
            }

            const requestSort =
                sort === 'price_asc'
                    ? { sort: 'price' as const, order: 'asc' as const }
                    : sort === 'price_desc'
                      ? { sort: 'price' as const, order: 'desc' as const }
                      : { sort: 'created_at' as const, order: 'desc' as const };

            const shouldUseFilterEndpoint = Boolean(
                debouncedQuery || categoryId || collectionId || sellerId
            );

            const response = shouldUseFilterEndpoint
                ? await Catalog.filterProducts({
                      ...(debouncedQuery ? { keyword: debouncedQuery } : {}),
                      ...(categoryId ? { category_id: categoryId } : {}),
                      ...(collectionId ? { collection_id: collectionId } : {}),
                      ...(sellerId ? { seller_id: sellerId } : {}),
                      sort: requestSort.sort,
                      order: requestSort.order,
                      limit: '48',
                      page: pageNum.toString(),
                  })
                : await Catalog.getProducts({
                      ...requestSort,
                      limit: 48,
                      page: pageNum,
                  });

            if (response.ok) {
                let nextProducts = asArray(response.body);

                if (!debouncedQuery && !categoryId && !collectionId && !sellerId && nextProducts.length === 0) {
                    const fallback = await Catalog.getPopularProducts(48);
                    if (fallback.ok) nextProducts = asArray(fallback.body);
                }

                const diversified = diversifyProducts(nextProducts);
                setProducts((prev) => (append ? [...prev, ...diversified] : diversified));
                setTotalProducts((prev) => (append ? prev + nextProducts.length : nextProducts.length));
                setHasMore(nextProducts.length === 48);
            } else if (!append) {
                setProducts([]);
                setError((response.body as { message?: string }).message ?? 'Unable to load the catalog.');
            }

            setIsLoading(false);
        },
        [debouncedQuery, categoryId, collectionId, sellerId, sort]
    );

    useEffect(() => {
        loadProducts(page, page > 1);
    }, [page, loadProducts]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !isLoading) {
                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    const activeCategory = categories.find((item) => item.id === categoryId);
    const showShowcase = !debouncedQuery && !categoryId && !collectionId && !sellerId;

    const clearFilters = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('category');
        next.delete('collection');
        next.delete('seller_id');
        next.delete('q');
        setSearchParams(next);
    };

    const sectionTitle = debouncedQuery ? 'Search results' : showShowcase ? 'Featured pieces' : 'Catalog edit';
    const sectionLabel = debouncedQuery
        ? `Search: "${debouncedQuery}"`
        : activeCategory?.name || featuredCollection?.title || 'The catalog';

    return (
        <div className="min-h-screen bg-[#050505] pb-16 text-white">
            <CatalogNavbar />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[140px]" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[160px]" />
            </div>

            <div className="relative z-10">
                {showShowcase ? (
                    <EditorialShowcaseBanner
                        imageUrl={showcaseImage}
                        eyebrow="Juno · Catalog"
                        badgeLabel="Curated now"
                        title={featuredCollection?.title || 'The Catalog'}
                        subtitle={
                            featuredCollection?.description ||
                            "Pakistan's independent labels, cut with the same editorial energy as the campaign drops."
                        }
                    />
                ) : null}

                <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 md:px-6 md:pt-12 md:pb-24">
                    <div className="mb-6 flex items-end justify-between gap-4 md:mb-10">
                        <div>
                            <div className="mb-2 flex items-center gap-2.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40 md:text-[10px]">
                                    {sectionLabel}
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
                                {sectionTitle}
                            </h2>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            {(debouncedQuery || categoryId || collectionId || sellerId) ? (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/20 hover:text-white"
                                >
                                    <X size={12} />
                                    Clear
                                </button>
                            ) : null}
                            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                                {totalProducts} {totalProducts === 1 ? 'piece' : 'pieces'}
                            </p>
                        </div>
                    </div>

                    {isLoading && page === 1 ? (
                        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                            <div className="flex flex-col items-center gap-4">
                                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                                    Fetching pieces...
                                </p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 py-20 text-center">
                            <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-6">
                                <span className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                                    <AlertCircle size={28} />
                                </span>
                                <div>
                                    <p className="text-2xl font-black uppercase text-white">Catalog unavailable</p>
                                    <p className="mt-2 text-sm text-red-100/80">{error}</p>
                                </div>
                            </div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-32 text-center">
                            <p className="text-sm font-mono uppercase tracking-[0.3em] text-white/30">
                                {debouncedQuery ? 'No matches found.' : 'No pieces in this edit yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
                                {products.map((product, index) => (
                                    <EditorialProductCard
                                        key={product.id}
                                        title={product.title}
                                        sellerName={product.seller_name}
                                        images={product.images}
                                        pricing={product.pricing}
                                        inventory={product.inventory}
                                        index={index}
                                        to={`/catalog/${product.id}`}
                                    />
                                ))}
                            </div>

                            <div ref={observerTarget} className="h-20" />

                            {isLoading && page > 1 ? (
                                <div className="flex items-center justify-center gap-3 py-8 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                                    <Loader2 size={18} className="animate-spin text-primary" />
                                    Loading more pieces
                                </div>
                            ) : null}

                            {!hasMore ? (
                                <div className="mt-8 text-center">
                                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/50">
                                        You've reached the end
                                    </p>
                                    <p className="mt-1 text-xs text-white/30">
                                        {products.length} products total
                                    </p>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CatalogPage;
