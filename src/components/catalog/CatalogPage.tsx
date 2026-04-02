import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Search, SlidersHorizontal, X, ShoppingBag, Check } from 'lucide-react';
import { Catalog, type CatalogProduct } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';

type SortValue = 'newest' | 'price_asc' | 'price_desc';
type CatalogCategoryOption = { id: string; name: string; slug?: string };

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
const getProductImage = (product: Partial<CatalogProduct>) => asArray(product.images)[0] || '/juno_app_icon.png';
const formatCurrency = (value?: number) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategoryOption[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());
  const { addItem } = useGuestCart();

  const query = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('category') ?? '';
  const color = searchParams.get('color') ?? '';
  const size = searchParams.get('size') ?? '';
  const sort = (searchParams.get('sort') as SortValue | null) ?? 'newest';

  useEffect(() => {
    const loadFilters = async () => {
      const response = await Catalog.getFilters();
      if (!response.ok) return;
      setCategories(asArray(response.body.categories));
      setColors(asArray(response.body.colors));
      setSizes(asArray(response.body.sizes));
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setError(null);
      setIsLoading(true);

      const requestSort = sort === 'price_asc'
        ? { sort: 'price' as const, order: 'asc' as const }
        : sort === 'price_desc'
          ? { sort: 'price' as const, order: 'desc' as const }
          : { sort: 'created_at' as const, order: 'desc' as const };

      let response;
      const hasAdvancedFilters = Boolean(color || size);
      const shouldUseFilterEndpoint = Boolean(query || categoryId || color || size);

      if (shouldUseFilterEndpoint) {
        response = await Catalog.filterProducts({
          ...(query ? { keyword: query } : {}),
          ...(categoryId ? { category_id: categoryId } : {}),
          ...(color ? { colors: [color] } : {}),
          ...(size ? { sizes: [size] } : {}),
          sort: requestSort.sort,
          order: requestSort.order,
          limit: '48',
          page: '1',
        });
      } else if (query) {
        response = await Catalog.searchProducts({ keyword: query, limit: 48 });
      } else {
        response = await Catalog.getProducts({
          ...requestSort,
          limit: 48,
        });
      }

      if (response.ok) {
        let nextProducts = asArray(response.body);

        if (!query && !categoryId && !color && !size && nextProducts.length === 0) {
          const fallback = await Catalog.getPopularProducts(24);
          if (fallback.ok) nextProducts = asArray(fallback.body);
        }

        setProducts(nextProducts);
      } else {
        setProducts([]);
        setError((response.body as { message?: string }).message ?? 'Unable to load the catalogue.');
      }

      setIsLoading(false);
    };

    loadProducts();
  }, [query, categoryId, color, size, sort]);

  const activeFilterCount = [categoryId, color, size].filter(Boolean).length;
  const activeCategory = categories.find((item) => item.id === categoryId);

  const handleQuickAdd = (product: CatalogProduct) => {
    const variant = product.variants?.[0];
    if (!variant) return;
    
    setAddingProductId(product.id);
    
    addItem(
      product.id,
      variant.id,
      1,
      variant.price || product.pricing.discounted_price || product.pricing.price,
      {
        seller_name: product.seller_name,
        product_title: product.title,
        variant_title: variant.title,
        image_url: getProductImage(product),
      }
    );
    
    setAddedProductIds((prev) => new Set(prev).add(product.id));
    setAddingProductId(null);
    
    // Remove the added state after 2 seconds
    setTimeout(() => {
      setAddedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const updateSearchParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('color');
    next.delete('size');
    setSearchParams(next);
  };

  const popularCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const FiltersPanel = (
    <div className="space-y-6">
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Filters</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.03em] text-white">Refine products</h2>
          </div>
          {activeFilterCount > 0 ? (
            <button onClick={clearFilters} className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Category</p>
        <div className="mt-4 space-y-2">
          {categories.map((item) => (
            <button
              key={item.id}
              onClick={() => updateSearchParam('category', categoryId === item.id ? '' : item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-all ${
                categoryId === item.id
                  ? 'bg-primary text-white'
                  : 'bg-black/25 text-neutral-300 hover:bg-white/5'
              }`}
            >
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Color</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {colors.slice(0, 16).map((item) => (
            <button
              key={item}
              onClick={() => updateSearchParam('color', color === item ? '' : item)}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] ${
                color === item ? 'border-primary bg-primary text-white' : 'border-white/10 bg-black/25 text-neutral-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">Size</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {sizes.slice(0, 12).map((item) => (
            <button
              key={item}
              onClick={() => updateSearchParam('size', size === item ? '' : item)}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] ${
                size === item ? 'border-primary bg-primary text-white' : 'border-white/10 bg-black/25 text-neutral-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-16 pt-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/35">Juno Catalog</p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
                Shop the indie catalogue
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateSearchParam('category', categoryId === item.id ? '' : item.id)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] ${
                    categoryId === item.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-white/10 bg-black/25 text-neutral-300'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3">
              <Search size={18} className="text-primary" />
              <input
                value={query}
                onChange={(event) => updateSearchParam('q', event.target.value)}
                placeholder="Search products, labels, styles"
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-neutral-500"
              />
            </div>

            <div className="flex items-center rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3">
              <select
                value={sort}
                onChange={(event) => updateSearchParam('sort', event.target.value)}
                className="bg-transparent text-sm font-semibold text-white outline-none"
              >
                <option value="newest" className="bg-neutral-900">Newest</option>
                <option value="price_asc" className="bg-neutral-900">Price: Low to High</option>
                <option value="price_desc" className="bg-neutral-900">Price: High to Low</option>
              </select>
            </div>

            <button
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">{FiltersPanel}</div>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {products.length} products
                </p>
                <p className="text-sm text-neutral-400">
                  {query ? `Search: "${query}"` : 'Full catalog'}{activeCategory ? ` • ${activeCategory.name}` : ''}{activeFilterCount > 0 ? ` • ${activeFilterCount} filters active` : ''}
                </p>
              </div>
              {activeFilterCount > 0 ? (
                <button onClick={clearFilters} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <X size={14} />
                  Clear filters
                </button>
              ) : null}
            </div>

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.03]">
                <div className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                  <Loader2 size={18} className="animate-spin text-primary" />
                  Loading products
                </div>
              </div>
            ) : error ? (
              <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8 text-center">
                <p className="text-xl font-bold text-white">Couldn’t load the catalogue</p>
                <p className="mt-2 text-sm text-red-100/80">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-xl font-bold text-white">No products found</p>
                <p className="mt-2 text-sm text-neutral-400">Try a broader search or remove a few filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.12) }}
                    className="h-full"
                  >
                    <Link to={`/catalog/${product.id}`} className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-white/20">
                      <div className="relative aspect-[4/5] overflow-hidden bg-black/30">
                        <img src={getProductImage(product)} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        {product.is_trending ? (
                          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                            Trending
                          </span>
                        ) : null}
                        
                        {/* Quick Add Button Overlay */}
                        <div className="absolute inset-x-3 bottom-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:opacity-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickAdd(product);
                            }}
                            disabled={addingProductId === product.id || !product.inventory?.in_stock}
                            className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-sm transition-all ${
                              addedProductIds.has(product.id)
                                ? 'bg-green-500/90'
                                : 'bg-gradient-to-r from-primary to-secondary hover:scale-[1.02]'
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {addedProductIds.has(product.id) ? (
                              <>
                                <Check size={16} />
                                Added
                              </>
                            ) : addingProductId === product.id ? (
                              'Adding...'
                            ) : !product.inventory?.in_stock ? (
                              'Out of Stock'
                            ) : (
                              <>
                                <ShoppingBag size={16} />
                                Quick Add
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Always visible on mobile */}
                        <div className="absolute inset-x-3 bottom-3 lg:hidden">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickAdd(product);
                            }}
                            disabled={addingProductId === product.id || !product.inventory?.in_stock}
                            className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-sm transition-all ${
                              addedProductIds.has(product.id)
                                ? 'bg-green-500/90'
                                : 'bg-gradient-to-r from-primary to-secondary'
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {addedProductIds.has(product.id) ? (
                              <>
                                <Check size={16} />
                                Added
                              </>
                            ) : addingProductId === product.id ? (
                              'Adding...'
                            ) : !product.inventory?.in_stock ? (
                              'Out of Stock'
                            ) : (
                              <>
                                <ShoppingBag size={16} />
                                Quick Add
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="min-h-[72px]">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{product.seller_name || 'Juno Label'}</p>
                          </div>
                          <h2 className="mt-1 line-clamp-2 text-lg font-black uppercase tracking-[-0.03em] text-white">
                            {product.title}
                          </h2>
                        </div>

                        <div className="mt-3 flex min-h-[28px] flex-wrap gap-2">
                          {asArray(product.categories).slice(0, 2).map((item) => (
                            <span key={item.id} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-300">
                              {item.name}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/5 pt-3">
                          <div>
                            <p className="text-xl font-black text-white">
                              {formatCurrency(product.pricing?.discounted_price ?? product.pricing?.price)}
                            </p>
                            {product.pricing?.compare_at_price ? (
                              <p className="text-xs text-neutral-500 line-through">{formatCurrency(product.pricing.compare_at_price)}</p>
                            ) : null}
                          </div>
                          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/65">
                            View
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {showMobileFilters ? (
          <div className="fixed inset-0 z-50 bg-black/70 p-4 lg:hidden">
            <div className="ml-auto h-full w-full max-w-sm overflow-y-auto rounded-[2rem] border border-white/10 bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase text-white">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="rounded-full border border-white/10 p-2 text-white">
                  <X size={16} />
                </button>
              </div>
              {FiltersPanel}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CatalogPage;
