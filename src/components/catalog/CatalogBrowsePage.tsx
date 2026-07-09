import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    Filter,
    Loader2,
    RefreshCw,
    X,
} from 'lucide-react';
import {
    Catalog,
    type CatalogHierarchy,
    type CatalogPagination,
    type CatalogProduct,
    type CatalogQueryParams,
    type FilterOptions,
    type ProductFilterRequest,
} from '../../api/api';
import CatalogNavbar from './CatalogNavbar';
import CatalogSidebar from './CatalogSidebar';
import EditorialProductCard from '../shared/editorial/EditorialProductCard';
import ResponsiveDownloadBanner from '../shared/ResponsiveDownloadBanner';

// Routes: `/catalog/all`, wrapped by `/catalog/women` and `/catalog/men`
// Purpose: shared listing engine for public catalog browse routes. Route-level
// differences should come from API scope, not separate UI implementations.
const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const MULTI_PARAM_KEYS = [
    'brand_ids',
    'colors',
    'product_types',
    'materials',
    'occasions',
    'departments',
    'product_groups',
    'genders',
    'style_categories',
    'pakistani_wear',
] as const;

type MultiParamKey = (typeof MULTI_PARAM_KEYS)[number];
const LEGACY_PARAM_KEYS = ['sizes'] as const;

type CatalogBrowsePageProps = {
    fixedQueryParams?: Partial<CatalogQueryParams>;
};

const diversifyProducts = (products: CatalogProduct[]): CatalogProduct[] => {
    if (products.length <= 1) return products;

    const diversified = [...products];
    const maxIterations = diversified.length * 2;
    let iterations = 0;

    const getSimilarityKey = (product: CatalogProduct) => {
        const brand = product.seller_id || '';
        const category = product.categories?.[0]?.id || '';
        const group = product.metadata?.product_group || '';
        return `${brand}:${category}:${group}`;
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

    return diversified;
};

const moveSoldOutToEnd = (products: CatalogProduct[]): CatalogProduct[] => {
    if (products.length <= 1) return products;

    const inStockProducts: CatalogProduct[] = [];
    const soldOutProducts: CatalogProduct[] = [];

    products.forEach((product) => {
        if (product.inventory?.in_stock) {
            inStockProducts.push(product);
        } else {
            soldOutProducts.push(product);
        }
    });

    return [...inStockProducts, ...soldOutProducts];
};

const humanizeCatalogValue = (value: string) =>
    value
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const formatCurrency = (value?: number) =>
    typeof value === 'number'
        ? `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`
        : 'Rs 0';

const mergeFixedAndDynamicParams = (
    dynamicParams: CatalogQueryParams,
    fixedParams?: Partial<CatalogQueryParams>
): CatalogQueryParams => {
    if (!fixedParams) return dynamicParams;

    const merged: CatalogQueryParams = { ...dynamicParams, ...fixedParams };

    if (fixedParams.genders) {
        const dynamicGenders = dynamicParams.genders;
        merged.genders = dynamicGenders?.length
            ? dynamicGenders.filter((value) => fixedParams.genders?.includes(value))
            : fixedParams.genders;
    }

    return merged;
};

export const CatalogBrowsePageView: React.FC<CatalogBrowsePageProps> = ({ fixedQueryParams }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [hierarchy, setHierarchy] = useState<CatalogHierarchy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetaLoading, setIsMetaLoading] = useState(true);
    const [isRefreshingResults, setIsRefreshingResults] = useState(false);
    const [isAppending, setIsAppending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | undefined>();
    const [collectionPage, setCollectionPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadedProductsCount, setLoadedProductsCount] = useState(0);
    const [matchingProductsTotal, setMatchingProductsTotal] = useState<number | null>(null);
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') ?? '');
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const observerTarget = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);

    const query = searchParams.get('q') ?? '';
    const categoryId = searchParams.get('category') ?? '';
    const collectionId = searchParams.get('collection') ?? '';
    const sellerId = searchParams.get('seller_id') ?? '';
    const sort = searchParams.get('sort') ?? 'popularity';
    const order = (searchParams.get('order') as 'asc' | 'desc' | null) ?? 'desc';
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const inStock = searchParams.get('in_stock');

    const brandIds = searchParams.get('brand_ids') ?? '';
    const colors = searchParams.get('colors') ?? '';
    const productTypes = searchParams.get('product_types') ?? '';
    const materials = searchParams.get('materials') ?? '';
    const occasions = searchParams.get('occasions') ?? '';
    const departments = searchParams.get('departments') ?? '';
    const productGroups = searchParams.get('product_groups') ?? '';
    const genders = searchParams.get('genders') ?? '';
    const styleCategories = searchParams.get('style_categories') ?? '';
    const pakistaniWear = searchParams.get('pakistani_wear') ?? '';

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        let changed = false;
        LEGACY_PARAM_KEYS.forEach((key) => {
            if (next.has(key)) {
                next.delete(key);
                changed = true;
            }
        });
        if (changed) {
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        setNextCursor(undefined);
        setCollectionPage(1);
        setHasMore(true);
    }, [
        debouncedQuery,
        categoryId,
        collectionId,
        sellerId,
        sort,
        order,
        minPrice,
        maxPrice,
        inStock,
        brandIds,
        colors,
        productTypes,
        materials,
        occasions,
        departments,
        productGroups,
        genders,
        styleCategories,
        pakistaniWear,
    ]);

    const list = useCallback((value: string) => (value ? value.split(',').filter(Boolean) : undefined), []);

    const discoveryParams = useMemo<CatalogQueryParams>(
        () => mergeFixedAndDynamicParams({
            ...(categoryId ? { category: categoryId } : {}),
            ...(sellerId ? { seller_id: sellerId } : {}),
            ...(brandIds ? { brand_ids: list(brandIds) } : {}),
            ...(minPrice ? { min_price: Number(minPrice) } : {}),
            ...(maxPrice ? { max_price: Number(maxPrice) } : {}),
            ...(inStock ? { in_stock: inStock === 'true' } : {}),
            ...(colors ? { colors: list(colors) } : {}),
            ...(productTypes ? { product_types: list(productTypes) } : {}),
            ...(materials ? { materials: list(materials) } : {}),
            ...(occasions ? { occasions: list(occasions) } : {}),
            ...(departments ? { departments: list(departments) } : {}),
            ...(productGroups ? { product_groups: list(productGroups) } : {}),
            ...(genders ? { genders: list(genders) } : {}),
            ...(styleCategories ? { style_categories: list(styleCategories) } : {}),
            ...(pakistaniWear ? { pakistani_wear: list(pakistaniWear) } : {}),
            sort: sort as CatalogQueryParams['sort'],
            order,
            limit: 48,
        }, fixedQueryParams),
        [
            brandIds,
            categoryId,
            colors,
            departments,
            genders,
            inStock,
            list,
            materials,
            maxPrice,
            minPrice,
            occasions,
            order,
            pakistaniWear,
            productGroups,
            productTypes,
            sellerId,
            sort,
            styleCategories,
            fixedQueryParams,
        ]
    );

    useEffect(() => {
        const loadMeta = async () => {
            setIsMetaLoading(true);

            const [filtersResponse, hierarchyResponse] = await Promise.all([
                Catalog.getFilters(fixedQueryParams),
                Catalog.getHierarchy(fixedQueryParams),
            ]);

            if (filtersResponse.ok) {
                setFilterOptions(filtersResponse.body);
            }

            if (hierarchyResponse.ok) {
                setHierarchy(hierarchyResponse.body);
            }

            setIsMetaLoading(false);
        };

        loadMeta();
    }, [fixedQueryParams]);

    const loadProducts = useCallback(
        async (append = false) => {
            const requestId = requestIdRef.current + 1;
            requestIdRef.current = requestId;

            if (!append) {
                setError(null);
            }
            setIsLoading(true);
            setIsAppending(append);
            setIsRefreshingResults(!append && products.length > 0);

            const baseParams: CatalogQueryParams = {
                ...discoveryParams,
                ...(append && nextCursor ? { cursor: nextCursor } : {}),
            };

            const usesAdvancedFilters = Boolean(
                brandIds ||
                    colors ||
                    productTypes ||
                    materials ||
                    occasions ||
                    departments ||
                    productGroups ||
                    genders ||
                    styleCategories ||
                    pakistaniWear
            );

            const response = collectionId
                ? await Catalog.getCollectionProducts(collectionId, {
                      page: append ? collectionPage : 1,
                      limit: 48,
                  })
                : debouncedQuery
                  ? await Catalog.searchProducts({ keyword: debouncedQuery, ...baseParams })
                    : usesAdvancedFilters
                    ? await Catalog.filterProducts({
                          ...(baseParams as unknown as ProductFilterRequest),
                          category_id: categoryId || undefined,
                          seller_ids: list(brandIds),
                          min_price: minPrice || undefined,
                          max_price: maxPrice || undefined,
                          limit: '48',
                          cursor: append ? nextCursor : undefined,
                      })
                    : await Catalog.getProducts(baseParams);

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (response.ok) {
                let nextProducts = asArray(response.body);

                if (!debouncedQuery && !categoryId && !collectionId && !sellerId && nextProducts.length === 0) {
                    const fallback = await Catalog.getPopularProducts(48);
                    if (fallback.ok) nextProducts = asArray(fallback.body);
                }

                const diversified = moveSoldOutToEnd(diversifyProducts(nextProducts));
                setProducts((prev) => {
                    if (!append) return diversified;
                    const seen = new Set(prev.map((product) => product.id));
                    return [...prev, ...diversified.filter((product) => !seen.has(product.id))];
                });

                const pagination = response.meta?.pagination as CatalogPagination | undefined;
                setLoadedProductsCount((prev) => (append ? prev + nextProducts.length : nextProducts.length));
                const paginationTotal =
                    typeof pagination?.total === 'number'
                        ? pagination.total
                        : typeof (pagination as CatalogPagination & { total_count?: number } | undefined)?.total_count === 'number'
                          ? (pagination as CatalogPagination & { total_count?: number }).total_count ?? null
                          : null;
                setMatchingProductsTotal((prev) => (append ? prev : paginationTotal));
                setNextCursor(pagination?.next_cursor);
                setHasMore(pagination ? pagination.has_more : nextProducts.length === 48);
                if (collectionId) setCollectionPage((value) => (append ? value + 1 : 2));
            } else if (!append) {
                setProducts([]);
                setLoadedProductsCount(0);
                setMatchingProductsTotal(null);
                setError((response.body as { message?: string }).message ?? 'Unable to load the catalog.');
            }

            setIsLoading(false);
            setIsAppending(false);
            setIsRefreshingResults(false);
        },
        [
            brandIds,
            categoryId,
            collectionId,
            collectionPage,
            colors,
            debouncedQuery,
            departments,
            discoveryParams,
            genders,
            list,
            materials,
            maxPrice,
            minPrice,
            nextCursor,
            occasions,
            pakistaniWear,
            productGroups,
            productTypes,
            products.length,
            sellerId,
            styleCategories,
        ]
    );

    useEffect(() => {
        loadProducts(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedQuery,
        categoryId,
        collectionId,
        sellerId,
        sort,
        order,
        minPrice,
        maxPrice,
        inStock,
        brandIds,
        colors,
        productTypes,
        materials,
        occasions,
        departments,
        productGroups,
        genders,
        styleCategories,
        pakistaniWear,
    ]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !isLoading) {
                    loadProducts(true);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading, loadProducts]);

    const hasFilters = Boolean(
        debouncedQuery ||
            categoryId ||
            collectionId ||
            sellerId ||
            brandIds ||
            minPrice ||
            maxPrice ||
            inStock ||
            colors ||
            productTypes ||
            materials ||
            occasions ||
            departments ||
            productGroups ||
            genders ||
            styleCategories ||
            pakistaniWear
    );
    const showShowcase = !hasFilters;

    const updateParam = useCallback(
        (key: string, value?: string) => {
            const next = new URLSearchParams(searchParams);
            if (value) next.set(key, value);
            else next.delete(key);
            next.delete('collection');
            next.delete('page');
            next.delete('cursor');
            setSearchParams(next);
        },
        [searchParams, setSearchParams]
    );

    const clearFilters = useCallback(() => {
        const next = new URLSearchParams(searchParams);
        next.delete('category');
        next.delete('collection');
        next.delete('seller_id');
        next.delete('min_price');
        next.delete('max_price');
        next.delete('in_stock');
        next.delete('q');
        next.delete('page');
        next.delete('cursor');
        MULTI_PARAM_KEYS.forEach((key) => next.delete(key));
        setSearchParams(next);
    }, [searchParams, setSearchParams]);

    const activeFilterChips = useMemo(() => {
        const chips: Array<{ key: string; label: string; value?: string }> = [];
        const brandMap = new Map(asArray(filterOptions?.brands).map((brand) => [brand.id, brand.name]));

        if (debouncedQuery) chips.push({ key: 'q', label: `Search: ${debouncedQuery}` });
        if (minPrice) chips.push({ key: 'min_price', label: `Min ${formatCurrency(Number(minPrice))}` });
        if (maxPrice) chips.push({ key: 'max_price', label: `Max ${formatCurrency(Number(maxPrice))}` });

        MULTI_PARAM_KEYS.forEach((key) => {
            (list(searchParams.get(key) ?? '') ?? []).forEach((value) => {
                chips.push({
                    key,
                    value,
                    label: key === 'brand_ids' ? brandMap.get(value) ?? value : humanizeCatalogValue(value),
                });
            });
        });

        return chips;
    }, [debouncedQuery, filterOptions?.brands, list, maxPrice, minPrice, searchParams]);

    const activeFilterCount = activeFilterChips.length;
    const visibleProductsCount = products.length;
    const displayTotalProducts = matchingProductsTotal ?? loadedProductsCount;
    const handleSearchSubmit = useCallback(
        (nextQuery: string) => {
            updateParam('q', nextQuery.trim() || undefined);
        },
        [updateParam]
    );

    return (
        <div className="min-h-screen bg-[#050505] pb-16 text-white">
            <CatalogNavbar
                onSearch={handleSearchSubmit}
                initialQuery={query}
                showInlineSearch
                showMobileFiltersButton
                onOpenFilters={() => setIsMobileFiltersOpen(true)}
            />

            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -left-32 -top-32 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[140px]" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[160px]" />
            </div>

            <div className="relative z-10 lg:pl-[24rem]">
                {showShowcase ? (
                    <div className="w-full px-4 pt-4 md:px-6 lg:px-8">
                        <ResponsiveDownloadBanner className="shadow-[0_22px_60px_rgba(0,0,0,0.35)]" rounded={false} />
                    </div>
                ) : null}

                <div className="hidden lg:fixed lg:inset-y-20 lg:left-0 lg:z-20 lg:block lg:w-[24rem]">
                    <CatalogSidebar
                        options={filterOptions}
                        hierarchy={hierarchy}
                        isLoading={isRefreshingResults || (isMetaLoading && products.length > 0)}
                        totalProducts={displayTotalProducts}
                        isMobileOpen={isMobileFiltersOpen}
                        onMobileOpenChange={setIsMobileFiltersOpen}
                    />
                </div>

                <div className="px-4 pb-16 pt-8 md:px-6 md:pb-24 md:pt-12 lg:px-8">
                    <div className="flex flex-col gap-8">
                        <aside className="w-full lg:hidden">
                            <CatalogSidebar
                                options={filterOptions}
                                hierarchy={hierarchy}
                                isLoading={isRefreshingResults || (isMetaLoading && products.length > 0)}
                                totalProducts={displayTotalProducts}
                                isMobileOpen={isMobileFiltersOpen}
                                onMobileOpenChange={setIsMobileFiltersOpen}
                            />
                        </aside>

                        <main className="min-w-0">
                            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-10">
                                <div className="min-w-0 flex-1">
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
                                        {debouncedQuery ? 'Search Results' : hasFilters ? 'Catalog' : 'All Products'}
                                    </h2>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 md:inline-flex">
                                        <Filter size={12} />
                                        {activeFilterCount} active
                                    </div>
                                    {hasFilters ? (
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/20 hover:text-white"
                                        >
                                            <X size={12} />
                                            Clear
                                        </button>
                                    ) : null}
                                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                                        Showing {visibleProductsCount} of {displayTotalProducts}
                                    </p>
                                </div>
                            </div>

                            {activeFilterChips.length > 0 ? (
                                <div className="mb-8 flex flex-wrap gap-2">
                                    {activeFilterChips.map((chip, index) => (
                                        <button
                                            key={`${chip.key}-${chip.label}-${index}`}
                                            type="button"
                                            onClick={() => {
                                                if (chip.key === 'q' || chip.key === 'min_price' || chip.key === 'max_price') {
                                                    updateParam(chip.key, undefined);
                                                    return;
                                                }

                                                const current = list(searchParams.get(chip.key) ?? '') ?? [];
                                                const nextValues = current.filter((value) => value !== chip.value);
                                                updateParam(chip.key, nextValues.length > 0 ? nextValues.join(',') : undefined);
                                            }}
                                            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60"
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            ) : null}

                            {isLoading && products.length === 0 ? (
                                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                                    <div className="flex flex-col items-center gap-4">
                                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                                            Fetching marketplace pieces...
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
                                        {debouncedQuery ? 'No matches found.' : 'No pieces in this catalog view yet.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div
                                        className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${
                                            isRefreshingResults ? 'opacity-45' : 'opacity-100'
                                        }`}
                                    >
                                        {products.map((product, index) => (
                                            <EditorialProductCard
                                                key={product.id}
                                                title={product.title}
                                                sellerName={product.seller_name}
                                                images={product.images}
                                                badges={product.badges}
                                                pricing={product.pricing}
                                                inventory={product.inventory}
                                                index={index}
                                                to={`/catalog/${product.id}`}
                                            />
                                        ))}
                                    </div>

                                    {isRefreshingResults ? (
                                        <div className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-3xl">
                                            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#09090b]/90 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 shadow-[0_18px_40px_rgba(0,0,0,0.4)] backdrop-blur">
                                                <Loader2 size={16} className="animate-spin text-primary" />
                                                Updating results
                                            </div>
                                        </div>
                                    ) : null}

                                    <div ref={observerTarget} className="h-20" />

                                    {(isAppending || (isMetaLoading && products.length > 0 && !isRefreshingResults)) ? (
                                        <div className="flex items-center justify-center gap-3 py-8 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                                            <Loader2 size={18} className="animate-spin text-primary" />
                                            Loading more pieces
                                        </div>
                                    ) : null}

                                    {!hasMore ? (
                                        <div className="mt-8 text-center">
                                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/50">
                                                You&apos;ve reached the end
                                            </p>
                                            <p className="mt-1 text-xs text-white/30">{products.length} products total in this loaded run</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CatalogBrowsePage: React.FC = () => <CatalogBrowsePageView />;

export default CatalogBrowsePage;
