import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    AlertCircle,
    Loader2,
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
import { getResponsiveShopifyImageSet } from '../../utils/shopifyImage';

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

const LEGACY_PARAM_KEYS = ['sizes'] as const;

type CatalogBrowsePageProps = {
    fixedQueryParams?: Partial<CatalogQueryParams>;
};

const CategoryShop: React.FC<{
    hierarchy: CatalogHierarchy | null;
    products: CatalogProduct[];
    activeGroup: string;
    activeGender: string;
    onSelect: (group: string) => void;
    onGenderSelect: (gender: string) => void;
}> = ({ hierarchy, products, activeGroup, activeGender, onSelect, onGenderSelect }) => {
    const groups = hierarchy?.departments
        .flatMap((department) => department.groups)
        .sort((a, b) => b.product_count - a.product_count)
        .slice(0, 8) ?? [];
    if (!groups.length) return null;

    // One representative image per group. No global products[0] fallback — that
    // made every image-less tile show the same photo. Missing images get a
    // branded gradient tile instead, which reads as intentional.
    const imageForGroup = (group: string) =>
        products.find((product) => product.metadata?.product_group === group && product.images?.[0])?.images?.[0];

    return (
        <section className="mb-9">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-[0.08em] text-white">Shop by category</h3>
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1" aria-label="Filter categories by gender">
                    {[
                        { value: '', label: 'Everyone' },
                        { value: 'women', label: 'Women' },
                        { value: 'men', label: 'Men' },
                    ].map(({ value, label }) => (
                        <button
                            key={value || 'everyone'}
                            type="button"
                            onClick={() => onGenderSelect(value)}
                            aria-pressed={activeGender === value}
                            className={`min-h-9 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                activeGender === value
                                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_6px_18px_rgba(220,10,40,0.28)]'
                                    : 'text-white/45 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:px-0 xl:grid-cols-8">
                {groups.map((group) => {
                    const image = imageForGroup(group.product_group);
                    const imageSet = getResponsiveShopifyImageSet(image ?? '', [180, 240, 360]);
                    const isActive = activeGroup === group.product_group;
                    const label = humanizeCatalogValue(group.product_group);

                    return (
                        <button
                            key={group.product_group}
                            type="button"
                            onClick={() => onSelect(isActive ? '' : group.product_group)}
                            aria-pressed={isActive}
                            aria-label={`${isActive ? 'Remove' : 'Shop'} ${label} filter`}
                            className="group w-24 shrink-0 snap-start text-center focus-visible:outline-none md:w-auto"
                        >
                            <span className={`relative block aspect-square overflow-hidden rounded-full transition-all duration-300 group-hover:-translate-y-1 ${
                                isActive
                                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#050505] shadow-[0_12px_28px_rgba(255,24,24,0.2)]'
                                    : 'ring-1 ring-white/15 group-hover:ring-white/40'
                            }`}>
                                {image ? (
                                    <img
                                        src={imageSet.src}
                                        srcSet={imageSet.srcSet}
                                        sizes="(max-width: 768px) 96px, 140px"
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-[#1a0d12] to-secondary/20 font-mono text-xl font-black uppercase text-white/30">
                                        {label.slice(0, 2)}
                                    </span>
                                )}
                                <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                            </span>
                            <span className={`mt-2.5 block truncate text-[11px] font-bold ${isActive ? 'text-primary' : 'text-white/75 group-hover:text-white'}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

const ProductGridSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading products" role="status">
        <span className="sr-only">Loading products</span>
        {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="aspect-[3/4] animate-pulse bg-white/[0.08]" />
                <div className="space-y-3 p-4">
                    <div className="h-2.5 w-20 animate-pulse rounded bg-white/[0.08]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.08]" />
                    <div className="h-3 w-16 animate-pulse rounded bg-white/[0.08]" />
                </div>
            </div>
        ))}
    </div>
);

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

    const requestIdRef = useRef(0);

    const query = searchParams.get('q') ?? '';
    const categoryId = searchParams.get('category') ?? '';
    const collectionId = searchParams.get('collection') ?? '';
    const sellerId = searchParams.get('seller_id') ?? '';
    const sort = searchParams.get('sort') ?? 'priority';
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
            limit: 100,
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
                Catalog.getFilters(discoveryParams),
                Catalog.getHierarchy(discoveryParams),
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
    }, [discoveryParams]);

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

            let requestSort = sort;
            const fetchPage = async (cursor?: string) => {
                if (collectionId) {
                    return Catalog.getCollectionProducts(collectionId, {
                        page: append ? collectionPage : 1,
                        limit: 48,
                    });
                }

                const params = { ...discoveryParams, sort: requestSort as CatalogQueryParams['sort'], ...(cursor ? { cursor } : {}) };
                const response = debouncedQuery
                    ? await Catalog.searchProducts({ keyword: debouncedQuery, ...params })
                    : usesAdvancedFilters
                    ? await Catalog.filterProducts({
                        ...(params as ProductFilterRequest),
                        category_id: categoryId || undefined,
                        seller_ids: list(brandIds),
                        min_price: minPrice || undefined,
                        max_price: maxPrice || undefined,
                        limit: '100',
                    })
                    : await Catalog.getProducts(params);

                // ponytail: legacy API fallback; remove after every environment supports priority.
                if (!response.ok && requestSort === 'priority') {
                    requestSort = 'popularity';
                    return fetchPage(cursor);
                }
                return response;
            };

            let response = await fetchPage(append ? nextCursor : undefined);

            // The catalog contract is cursor-based: keep following next_cursor
            // so the browse grid represents the complete catalog, not one page.
            if (response.ok && !append && !collectionId) {
                const allProducts = asArray(response.body);
                let pagination = response.meta?.pagination as CatalogPagination | undefined;

                while (pagination?.has_more && pagination.next_cursor) {
                    const page = await fetchPage(pagination.next_cursor);
                    if (requestId !== requestIdRef.current) return;
                    if (!page.ok) {
                        break;
                    }

                    allProducts.push(...asArray(page.body));
                    pagination = page.meta?.pagination as CatalogPagination | undefined;
                    response = { ...page, body: allProducts };
                }
            }

            if (requestId !== requestIdRef.current) {
                return;
            }

            if (response.ok) {
                let nextProducts = asArray(response.body);

                if (!debouncedQuery && !categoryId && !collectionId && !sellerId && nextProducts.length === 0) {
                    const fallback = await Catalog.getPopularProducts(48);
                    if (fallback.ok) nextProducts = asArray(fallback.body);
                }

                setProducts((prev) => {
                    if (!append) return nextProducts;
                    const seen = new Set(prev.map((product) => product.id));
                    return [...prev, ...nextProducts.filter((product) => !seen.has(product.id))];
                });

                const pagination = response.meta?.pagination as CatalogPagination | undefined;
                setLoadedProductsCount((prev) => (append ? prev + nextProducts.length : nextProducts.length));
                const paginationTotal = pagination?.total ?? null;
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
            sort,
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

    const loadMoreRef = useRef({ hasMore, isLoading, loadProducts });
    loadMoreRef.current = { hasMore, isLoading, loadProducts };

    // Callback ref: the sentinel div mounts/unmounts with the product grid, so
    // the observer is created exactly once per sentinel instead of on every
    // state change (the old deps caused constant disconnect/reconnect churn).
    const observerRef = useRef<IntersectionObserver | null>(null);
    const observerTarget = useCallback((node: HTMLDivElement | null) => {
        observerRef.current?.disconnect();
        observerRef.current = null;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const { hasMore: more, isLoading: loading, loadProducts: load } = loadMoreRef.current;
                if (entries[0]?.isIntersecting && more && !loading) {
                    load(true);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(node);
        observerRef.current = observer;
    }, []);

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

    const visibleProductsCount = products.length;
    const actualProductsTotal = matchingProductsTotal;
    const displayTotalProducts = actualProductsTotal ?? loadedProductsCount;
    const productCountLabel = actualProductsTotal !== null
        ? `Showing ${visibleProductsCount} of ${actualProductsTotal} products`
        : `Showing ${visibleProductsCount}${hasMore ? '+' : ''} products`;
    const handleSearchSubmit = useCallback(
        (nextQuery: string) => {
            updateParam('q', nextQuery.trim() || undefined);
        },
        [updateParam]
    );

    const handleSortChange = useCallback(
        (value: string) => {
            const [nextSort, nextOrder] = value.split(':');
            const next = new URLSearchParams(searchParams);
            next.set('sort', nextSort);
            next.set('order', nextOrder);
            next.delete('page');
            next.delete('cursor');
            setSearchParams(next);
        },
        [searchParams, setSearchParams]
    );

    return (
        <div className="min-h-screen bg-[#050505] pb-16 text-white">
            <CatalogNavbar
                onSearch={handleSearchSubmit}
                initialQuery={query}
                showInlineSearch
                showMobileFiltersButton
                mobileFiltersOpen={isMobileFiltersOpen}
                onOpenFilters={() => setIsMobileFiltersOpen((open) => !open)}
            />

            {/* Static radial gradients instead of blurred divs: identical glow,
                but no giant blur layers for the GPU to composite on scroll. */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(40rem 40rem at 0% 0%, rgba(255,24,24,0.08), transparent 70%), radial-gradient(32rem 32rem at 100% 100%, rgba(255,69,133,0.08), transparent 70%)',
                }}
            />

            <div className="relative z-10 mx-auto max-w-[1500px] px-4 md:px-6 lg:px-8">
                {showShowcase ? (
                    <div className="pt-4 md:pt-6">
                        <ResponsiveDownloadBanner className="shadow-[0_22px_60px_rgba(0,0,0,0.35)]" />
                    </div>
                ) : null}

                {/* Mobile filter drawer. Mounted only while open so exactly one
                    CatalogSidebar instance ever manages the body scroll lock —
                    two concurrent instances corrupt the saved overflow value and
                    leave the whole site unscrollable. */}
                {isMobileFiltersOpen ? (
                    <div className="lg:hidden">
                        <CatalogSidebar
                            options={filterOptions}
                            hierarchy={hierarchy}
                            isLoading={isRefreshingResults || isMetaLoading}
                            totalProducts={displayTotalProducts}
                            isMobileOpen
                            onMobileOpenChange={setIsMobileFiltersOpen}
                        />
                    </div>
                ) : null}

                <div className="pb-16 pt-6 md:pb-24 md:pt-8 lg:flex lg:items-start lg:gap-10">
                    <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-[16.5rem] shrink-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 lg:block">
                        <CatalogSidebar
                            options={filterOptions}
                            hierarchy={hierarchy}
                            isLoading={isRefreshingResults || isMetaLoading}
                            totalProducts={displayTotalProducts}
                        />
                    </aside>

                    <main className="min-w-0 lg:flex-1">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 md:mb-7">
                                <div className="min-w-0">
                                    <h2
                                        className="text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 900,
                                            fontSize: 'clamp(1.5rem, 3vw, 2.15rem)',
                                            lineHeight: 0.95,
                                            letterSpacing: '-0.04em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {debouncedQuery ? 'Search Results' : hasFilters ? 'Catalog' : 'All Products'}
                                    </h2>
                                    <p className="mt-1.5 text-[12px] tabular-nums text-white/40">
                                        {productCountLabel}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2.5">
                                    {hasFilters ? (
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-[12px] font-semibold text-white/65 transition-colors hover:border-white/25 hover:text-white"
                                        >
                                            <X size={13} />
                                            Clear
                                        </button>
                                    ) : null}
                                    <select
                                        value={`${sort}:${order}`}
                                        onChange={(event) => handleSortChange(event.target.value)}
                                        aria-label="Sort products"
                                        className="rounded-lg border border-white/12 bg-[#121214] px-3 py-2 text-[12px] font-semibold text-white/80 outline-none focus:border-primary/60"
                                    >
                                        <option value="priority:desc">Discover</option>
                                        <option value="popularity:desc">Most popular</option>
                                        <option value="created_at:desc">Newest first</option>
                                        <option value="rating:desc">Top rated</option>
                                        <option value="updated_at:desc">Recently updated</option>
                                        <option value="price:asc">Price: low to high</option>
                                        <option value="price:desc">Price: high to low</option>
                                        <option value="title:asc">Title A-Z</option>
                                    </select>
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

                            <CategoryShop
                                hierarchy={hierarchy}
                                products={products}
                                activeGroup={productGroups}
                                activeGender={genders}
                                onSelect={(group) => updateParam('product_groups', group || undefined)}
                                onGenderSelect={(gender) => updateParam('genders', gender || undefined)}
                            />

                            {isLoading && products.length === 0 ? (
                                <ProductGridSkeleton />
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
                                        className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
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

                                </div>
                            )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const CatalogBrowsePage: React.FC = () => <CatalogBrowsePageView />;

export default CatalogBrowsePage;
