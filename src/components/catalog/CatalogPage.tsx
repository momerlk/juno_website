import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { Catalog, type CatalogProduct } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';
import CatalogNavbar from './CatalogNavbar';
import CatalogHero from './CatalogHero';
import CatalogDiscovery from './CatalogDiscovery';
import ProductCard from './ProductCard';

type SortValue = 'newest' | 'price_asc' | 'price_desc';
type CatalogCategoryOption = { id: string; name: string; slug?: string };

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
const getBaseProductPrice = (product: CatalogProduct): number =>
    product.pricing.discounted
        ? product.pricing.discounted_price ?? product.pricing.price
        : product.pricing.price;
const getVariantAvailableQuantity = (variant: any, product: CatalogProduct): number | undefined => {
    const variantQty = variant?.inventory?.available_quantity ?? variant?.inventory?.quantity;
    if (typeof variantQty === 'number' && Number.isFinite(variantQty)) return Math.max(0, variantQty);
    const productQty = product.inventory?.available_quantity ?? product.inventory?.quantity;
    if (typeof productQty === 'number' && Number.isFinite(productQty)) return Math.max(0, productQty);
    return undefined;
};

// Product diversification algorithm - separates similar products
const diversifyProducts = (products: CatalogProduct[]): CatalogProduct[] => {
    if (products.length <= 1) return products;

    const diversified = [...products];
    const maxIterations = diversified.length * 2;
    let iterations = 0;

    // Create a similarity key based on brand and category
    const getSimilarityKey = (product: CatalogProduct) => {
        const brand = product.seller_id || '';
        const category = product.categories?.[0]?.id || '';
        const type = product.product_type || '';
        return `${brand}:${category}`;
    };

    // Diversify: move similar products apart
    for (let i = 0; i < diversified.length - 1 && iterations < maxIterations; i++) {
        const currentKey = getSimilarityKey(diversified[i]);
        const nextKey = getSimilarityKey(diversified[i + 1]);

        // If adjacent products are too similar, find a different product to swap
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

    // Second pass: ensure brand diversity in each row of 4
    const rowSize = 4;
    for (let rowStart = 0; rowStart < diversified.length - rowSize; rowStart += rowSize) {
        const row = diversified.slice(rowStart, rowStart + rowSize);
        const brandCounts = new Map<string, number>();

        row.forEach((product) => {
            const brand = product.seller_id || 'unknown';
            brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
        });

        // If any brand appears more than twice in a row, try to swap
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
    const [displayProducts, setDisplayProducts] = useState<CatalogProduct[]>([]);
    const [categories, setCategories] = useState<CatalogCategoryOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingProductId, setAddingProductId] = useState<string | null>(null);
    const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
    const { addItem } = useGuestCart();

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);

    // Search debounce state
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') ?? '');

    const query = searchParams.get('q') ?? '';
    const categoryId = searchParams.get('category') ?? '';
    const collectionId = searchParams.get('collection') ?? '';
    const sellerId = searchParams.get('seller_id') ?? '';
    const sort = (searchParams.get('sort') as SortValue | null) ?? 'newest';

    // Debounce search query
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedQuery(query);
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
        setHasMore(true);
    }, [debouncedQuery, categoryId, collectionId, sellerId, sort]);

    useEffect(() => {
        const loadFilters = async () => {
            const response = await Catalog.getFilters();
            if (!response.ok || !('categories' in response.body)) return;
            setCategories(asArray(response.body.categories));
        };

        loadFilters();
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

            let response;
            const shouldUseFilterEndpoint = Boolean(
                debouncedQuery || categoryId || collectionId || sellerId
            );

            if (shouldUseFilterEndpoint) {
                response = await Catalog.filterProducts({
                    ...(debouncedQuery ? { keyword: debouncedQuery } : {}),
                    ...(categoryId ? { category_id: categoryId } : {}),
                    ...(collectionId ? { collection_id: collectionId } : {}),
                    ...(sellerId ? { seller_id: sellerId } : {}),
                    sort: requestSort.sort,
                    order: requestSort.order,
                    limit: '48',
                    page: pageNum.toString(),
                });
            } else {
                response = await Catalog.getProducts({
                    ...requestSort,
                    limit: 48,
                    page: pageNum,
                });
            }

            if (response.ok) {
                let nextProducts = asArray(response.body);

                if (!debouncedQuery && !categoryId && !collectionId && !sellerId && nextProducts.length === 0) {
                    const fallback = await Catalog.getPopularProducts(48);
                    if (fallback.ok) nextProducts = asArray(fallback.body);
                }

                // Apply diversification algorithm
                const diversified = diversifyProducts(nextProducts);

                setProducts((prev) => (append ? [...prev, ...diversified] : diversified));
                setDisplayProducts((prev) => (append ? [...prev, ...diversified] : diversified));
                setTotalProducts((prev) => (append ? prev + nextProducts.length : nextProducts.length));
                setHasMore(nextProducts.length === 48);
            } else {
                if (!append) {
                    setProducts([]);
                    setDisplayProducts([]);
                    setError((response.body as { message?: string }).message ?? 'Unable to load the catalogue.');
                }
            }

            setIsLoading(false);
        },
        [debouncedQuery, categoryId, collectionId, sellerId, sort]
    );

    useEffect(() => {
        loadProducts(page, page > 1);
    }, [page, loadProducts]);

    // Infinite scroll with IntersectionObserver
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    const activeCategory = categories.find((item) => item.id === categoryId);

    const clearFilters = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('category');
        next.delete('collection');
        next.delete('seller_id');
        setSearchParams(next);
    };

    const handleQuickAdd = (product: CatalogProduct) => {
        const variant = product.variants?.[0];
        if (!variant) return;
        if (!variant.available || !product.inventory?.in_stock) return;
        const maxVariantQuantity = getVariantAvailableQuantity(variant, product);
        if (typeof maxVariantQuantity === 'number' && maxVariantQuantity <= 0) return;

        setAddingProductId(product.id);

        addItem(
            product.id,
            variant.id,
            1,
            getBaseProductPrice(product),
            {
                seller_name: product.seller_name,
                product_title: product.title,
                variant_title: variant.title,
                variant_options: variant.options,
                image_url: getProductImage(product),
                max_quantity: maxVariantQuantity,
                is_available: variant.available && !!product.inventory?.in_stock,
            }
        );

        setAddedProductIds((prev) => new Set(prev).add(product.id));
        setAddingProductId(null);

        setTimeout(() => {
            setAddedProductIds((prev) => {
                const next = new Set(prev);
                next.delete(product.id);
                return next;
            });
        }, 2000);
    };

    const getProductImage = (product: Partial<CatalogProduct>) =>
        asArray(product.images)[0] || '/juno_app_icon.png';

    // Check if we should show discovery mode (no filters active)
    const isDiscoveryMode = !debouncedQuery && !categoryId && !collectionId && !sellerId && page === 1;

    return (
        <div className="min-h-screen bg-background pb-16 pt-24 text-white">
            <CatalogNavbar />

            <div className="container mx-auto px-4">
                {/* Hero Section */}
                {isDiscoveryMode && <CatalogHero />}

                {/* Main Content - Full Width (No Sidebar) */}
                <div className="mt-8">
                        {/* Results Bar */}
                        {!isDiscoveryMode && (
                            <div className="mb-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        {totalProducts} products
                                    </p>
                                    <p className="text-sm text-neutral-400">
                                        {debouncedQuery
                                            ? `Search: "${debouncedQuery}"`
                                            : 'Full catalog'}
                                        {activeCategory ? ` • ${activeCategory.name}` : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"
                                >
                                    <X size={14} />
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {/* Discovery Mode - Show curated sections */}
                        {isDiscoveryMode && (
                            <CatalogDiscovery />
                        )}

                        {/* Products Grid */}
                        {!isDiscoveryMode && (
                            <>

                                {/* Loading State */}
                                {isLoading && page === 1 ? (
                                    <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03]">
                                        <div className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                                            <Loader2 size={18} className="animate-spin text-primary" />
                                            Loading products
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8 text-center">
                                        <p className="text-xl font-bold text-white">Couldn't load the catalogue</p>
                                        <p className="mt-2 text-sm text-red-100/80">{error}</p>
                                    </div>
                                ) : displayProducts.length === 0 ? (
                                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center">
                                        <p className="text-xl font-bold text-white">No products found</p>
                                        <p className="mt-2 text-sm text-neutral-400">
                                            Try a broader search or remove a few filters.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Product Grid - 4 per row on laptop, 2 on tablet, 1 on mobile */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                            {displayProducts.map((product, index) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    index={index}
                                                    onQuickAdd={handleQuickAdd}
                                                    showQuickAdd={true}
                                                />
                                            ))}
                                        </div>

                                        {/* Infinite Scroll Sentinel */}
                                        <div ref={observerTarget} className="h-20" />

                                        {/* Loading More Indicator */}
                                        {isLoading && page > 1 && (
                                            <div className="flex items-center justify-center gap-3 py-8 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                                                <Loader2 size={18} className="animate-spin text-primary" />
                                                Loading more products
                                            </div>
                                        )}

                                        {/* End of Results */}
                                        {!hasMore && displayProducts.length > 0 && (
                                            <div className="mt-8 text-center">
                                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/50">
                                                    You've reached the end
                                                </p>
                                                <p className="mt-1 text-xs text-white/30">
                                                    {displayProducts.length} products total
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                </div>
            </div>
        </div>
    );
};

export default CatalogPage;
