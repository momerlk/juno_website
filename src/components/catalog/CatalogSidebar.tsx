import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import type { CatalogHierarchy, FilterOptions } from '../../api/api';

const humanizeCatalogValue = (value: string) =>
    value
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const splitParam = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

const MULTI_FILTERS = [
    { key: 'brand_ids', label: 'Brands', source: 'brands' },
    { key: 'colors', label: 'Colors', source: 'colors' },
    { key: 'materials', label: 'Materials', source: 'materials' },
    { key: 'occasions', label: 'Occasions', source: 'occasions' },
    { key: 'genders', label: 'Gender', source: 'genders' },
    { key: 'style_categories', label: 'Styles', source: 'style_categories' },
    { key: 'pakistani_wear', label: 'Pakistani Wear', source: 'pakistani_wear' },
] as const;

interface CatalogSidebarProps {
    options: FilterOptions | null;
    hierarchy: CatalogHierarchy | null;
    isLoading?: boolean;
    totalProducts?: number;
    isMobileOpen?: boolean;
    onMobileOpenChange?: (open: boolean) => void;
}

const FilterSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    count?: number;
    onClear?: () => void;
}> = ({ title, children, defaultExpanded = true, count = 0, onClear }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className="border-b border-white/[0.08] py-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex min-w-0 flex-1 items-center justify-between text-left text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 hover:text-white"
                >
                    <span className="truncate">{title}</span>
                    <span className="ml-3 inline-flex items-center gap-2">
                        {count > 0 ? (
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] text-primary">
                                {count}
                            </span>
                        ) : null}
                        <ChevronDown
                            size={14}
                            className={`transition-transform ${expanded ? 'rotate-180' : ''} text-white/50`}
                        />
                    </span>
                </button>
                {onClear ? (
                    <button
                        type="button"
                        onClick={onClear}
                        className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45 transition-colors hover:border-white/20 hover:text-white"
                    >
                        Clear
                    </button>
                ) : null}
            </div>
            {expanded ? <div className="mt-4">{children}</div> : null}
        </div>
    );
};

const FilterPill: React.FC<{
    label: string;
    selected?: boolean;
    count?: number;
    onClick: () => void;
}> = ({ label, selected = false, count, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
            selected
                ? 'border-primary/40 bg-primary/12 text-white'
                : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.04] hover:text-white'
        }`}
        aria-pressed={selected}
    >
        <span className="flex min-w-0 items-center gap-3">
            <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                    selected ? 'border-primary bg-primary' : 'border-white/20 bg-transparent group-hover:border-white/40'
                }`}
            >
                {selected ? <Check size={12} className="text-white" /> : null}
            </span>
            <span className="truncate text-sm">{label}</span>
        </span>
        <span className="ml-3 shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/35">
            {selected ? 'Selected' : typeof count === 'number' ? count : ''}
        </span>
    </button>
);

// Used by: `CatalogBrowsePage` and the scoped gender wrappers through it.
// Purpose: one responsive filter surface for the public catalog. It owns the
// query-param interactions so `/catalog/all`, `/catalog/women`, and `/catalog/men`
// behave identically and differ only by API scope.
const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
    options,
    hierarchy,
    isLoading = false,
    totalProducts = 0,
    isMobileOpen = false,
    onMobileOpenChange,
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [priceDraft, setPriceDraft] = useState({
        min: searchParams.get('min_price') ?? '',
        max: searchParams.get('max_price') ?? '',
    });

    useEffect(() => {
        setPriceDraft({
            min: searchParams.get('min_price') ?? '',
            max: searchParams.get('max_price') ?? '',
        });
    }, [searchParams]);

    useEffect(() => {
        if (!isMobileOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileOpen]);

    const updateSearchParams = (updater: (next: URLSearchParams) => void) => {
        const next = new URLSearchParams(searchParams);
        updater(next);
        next.delete('collection');
        next.delete('page');
        next.delete('cursor');
        setSearchParams(next);
    };

    const updateParam = (key: string, value?: string) => {
        updateSearchParams((next) => {
            if (value) next.set(key, value);
            else next.delete(key);
        });
    };

    const toggleMulti = (key: string, value: string) => {
        updateSearchParams((next) => {
            const active = splitParam(next.get(key));
            const values = active.includes(value) ? active.filter((item) => item !== value) : [...active, value];
            if (values.length > 0) next.set(key, values.join(','));
            else next.delete(key);
        });
    };

    const clearKey = (key: string) => updateParam(key, undefined);

    const clearAll = () => {
        const next = new URLSearchParams(searchParams);
        [
            'category',
            'collection',
            'seller_id',
            'min_price',
            'max_price',
            'in_stock',
            'q',
            'page',
            'cursor',
            'sort',
            'order',
            'departments',
            'product_groups',
            'product_types',
            ...MULTI_FILTERS.map((section) => section.key),
        ].forEach((key) => next.delete(key));
        setSearchParams(next);
    };

    const applyPriceDraft = () => {
        updateSearchParams((next) => {
            if (priceDraft.min.trim()) next.set('min_price', priceDraft.min.trim());
            else next.delete('min_price');

            if (priceDraft.max.trim()) next.set('max_price', priceDraft.max.trim());
            else next.delete('max_price');
        });
    };

    const activeFilterChips = useMemo(() => {
        const chips: Array<{ key: string; value?: string; label: string }> = [];
        const brandMap = new Map((options?.brands ?? []).map((brand) => [brand.id, brand.name]));

        if (searchParams.get('in_stock') === 'true') {
            chips.push({ key: 'in_stock', label: 'In stock only' });
        }
        if (searchParams.get('min_price')) {
            chips.push({ key: 'min_price', label: `Min ${searchParams.get('min_price')}` });
        }
        if (searchParams.get('max_price')) {
            chips.push({ key: 'max_price', label: `Max ${searchParams.get('max_price')}` });
        }

        ['departments', 'product_groups', 'product_types', ...MULTI_FILTERS.map((section) => section.key)].forEach((key) => {
            splitParam(searchParams.get(key)).forEach((value) => {
                chips.push({
                    key,
                    value,
                    label: key === 'brand_ids' ? brandMap.get(value) ?? value : humanizeCatalogValue(value),
                });
            });
        });

        return chips;
    }, [options?.brands, searchParams]);

    const activeCount = activeFilterChips.length;

    const dismissChip = (key: string, value?: string) => {
        if (!value) {
            clearKey(key);
            return;
        }
        updateSearchParams((next) => {
            const values = splitParam(next.get(key)).filter((item) => item !== value);
            if (values.length > 0) next.set(key, values.join(','));
            else next.delete(key);
        });
    };

    const content = (
        <div className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <div className="min-h-full border-r border-white/[0.08] bg-[#09090b]/96 p-4 md:p-5">
                <div className="mb-5 flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Catalog</p>
                        <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-white">Filters</h3>
                        <p className="mt-2 text-sm text-white/70">
                            {isLoading ? 'Updating results…' : `${totalProducts} products`}
                        </p>
                    </div>
                    {isLoading ? <Loader2 size={16} className="shrink-0 animate-spin text-primary" /> : null}
                </div>

                <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Active filters</p>
                            <p className="mt-1 text-sm text-white/75">
                                {activeCount > 0 ? `${activeCount} selected` : 'Nothing selected'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={activeCount === 0}
                            className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Clear all
                        </button>
                    </div>
                    {activeCount > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {activeFilterChips.map((chip) => (
                                <button
                                    key={`${chip.key}-${chip.value ?? chip.label}`}
                                    type="button"
                                    onClick={() => dismissChip(chip.key, chip.value)}
                                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 transition-colors hover:border-primary/40 hover:bg-primary/15 hover:text-white"
                                >
                                    <span>{chip.label}</span>
                                    <X size={12} />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="mb-6">
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Sort By</h3>
                    <select
                        value={`${searchParams.get('sort') ?? 'popularity'}:${searchParams.get('order') ?? 'desc'}`}
                        onChange={(event) => {
                            const [sort, order] = event.target.value.split(':');
                            updateSearchParams((next) => {
                                next.set('sort', sort);
                                next.set('order', order);
                            });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-[#121214] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 outline-none focus:border-primary/50"
                    >
                        <option value="popularity:desc">Most popular</option>
                        <option value="created_at:desc">Newest first</option>
                        <option value="rating:desc">Top rated</option>
                        <option value="updated_at:desc">Recently updated</option>
                        <option value="price:asc">Price low to high</option>
                        <option value="price:desc">Price high to low</option>
                        <option value="title:asc">Title A-Z</option>
                    </select>
                </div>

                {hierarchy?.departments && hierarchy.departments.length > 0 ? (
                    <div className="mb-2">
                        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Categories</h3>
                        <ul className="space-y-2">
                            {hierarchy.departments.map((department) => {
                                const activeDepartments = splitParam(searchParams.get('departments'));
                                const activeGroups = splitParam(searchParams.get('product_groups'));
                                const activeTypes = splitParam(searchParams.get('product_types'));
                                const isDepartmentActive = activeDepartments.includes(department.department);

                                return (
                                    <li key={department.department} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2">
                                        <FilterPill
                                            label={humanizeCatalogValue(department.department)}
                                            selected={isDepartmentActive}
                                            count={department.product_count}
                                            onClick={() => toggleMulti('departments', department.department)}
                                        />

                                        {(isDepartmentActive || activeGroups.length > 0 || activeTypes.length > 0) && department.groups.length > 0 ? (
                                            <ul className="mt-2 space-y-2 border-l border-white/10 pl-3">
                                                {department.groups.map((group) => {
                                                    const isGroupActive = activeGroups.includes(group.product_group);
                                                    return (
                                                        <li key={group.product_group}>
                                                            <FilterPill
                                                                label={humanizeCatalogValue(group.product_group)}
                                                                selected={isGroupActive}
                                                                count={group.product_count}
                                                                onClick={() => toggleMulti('product_groups', group.product_group)}
                                                            />
                                                            {(isGroupActive || activeTypes.length > 0) && group.types.length > 0 ? (
                                                                <div className="mt-2 space-y-2 border-l border-white/10 pl-3">
                                                                    {group.types.map((type) => (
                                                                        <FilterPill
                                                                            key={type.product_type}
                                                                            label={humanizeCatalogValue(type.product_type)}
                                                                            selected={activeTypes.includes(type.product_type)}
                                                                            onClick={() => toggleMulti('product_types', type.product_type)}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : null}

                <FilterSection
                    title="Price Range"
                    count={Number(Boolean(searchParams.get('min_price'))) + Number(Boolean(searchParams.get('max_price'))) + Number(searchParams.get('in_stock') === 'true')}
                    onClear={
                        searchParams.get('min_price') || searchParams.get('max_price') || searchParams.get('in_stock')
                            ? () => {
                                  setPriceDraft({ min: '', max: '' });
                                  updateSearchParams((next) => {
                                      next.delete('min_price');
                                      next.delete('max_price');
                                      next.delete('in_stock');
                                  });
                              }
                            : undefined
                    }
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="Min"
                            value={priceDraft.min}
                            onChange={(event) => setPriceDraft((current) => ({ ...current, min: event.target.value }))}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') applyPriceDraft();
                            }}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/50"
                        />
                        <span className="text-white/40">-</span>
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="Max"
                            value={priceDraft.max}
                            onChange={(event) => setPriceDraft((current) => ({ ...current, max: event.target.value }))}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') applyPriceDraft();
                            }}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/50"
                        />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={applyPriceDraft}
                            className="rounded-full border border-primary/30 bg-primary/12 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-primary/50 hover:bg-primary/18"
                        >
                            Apply price
                        </button>
                        <button
                            type="button"
                            onClick={() => setPriceDraft({ min: searchParams.get('min_price') ?? '', max: searchParams.get('max_price') ?? '' })}
                            className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
                        >
                            Reset draft
                        </button>
                    </div>
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => updateParam('in_stock', searchParams.get('in_stock') === 'true' ? undefined : 'true')}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${
                                searchParams.get('in_stock') === 'true'
                                    ? 'border-primary/40 bg-primary/12 text-white'
                                    : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.04] hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                                        searchParams.get('in_stock') === 'true' ? 'border-primary bg-primary' : 'border-white/20'
                                    }`}
                                >
                                    {searchParams.get('in_stock') === 'true' ? <Check size={12} className="text-white" /> : null}
                                </span>
                                <span className="text-sm">In stock only</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                                {searchParams.get('in_stock') === 'true' ? 'Selected' : 'Optional'}
                            </span>
                        </button>
                    </div>
                </FilterSection>

                {MULTI_FILTERS.map(({ key, label, source }) => {
                    const values = options?.[source] ?? [];
                    if (!values.length) return null;
                    const activeValues = splitParam(searchParams.get(key));

                    return (
                        <FilterSection
                            key={key}
                            title={label}
                            defaultExpanded={activeValues.length > 0}
                            count={activeValues.length}
                            onClear={activeValues.length > 0 ? () => clearKey(key) : undefined}
                        >
                            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                                {values.map((entry) => {
                                    const isString = typeof entry === 'string';
                                    const value =
                                        isString
                                            ? entry
                                            : (entry as { id?: string; value?: string }).id || (entry as { id?: string; value?: string }).value;
                                    if (!value) return null;

                                    const rawName = isString
                                        ? entry
                                        : (entry as { name?: string }).name || (entry as { value?: string }).value || value;
                                    const count = isString
                                        ? undefined
                                        : (entry as { product_count?: number; count?: number }).product_count ||
                                          (entry as { product_count?: number; count?: number }).count;
                                    const isActive = activeValues.includes(value);

                                    return (
                                        <FilterPill
                                            key={value}
                                            label={key === 'brand_ids' ? rawName : humanizeCatalogValue(rawName)}
                                            selected={isActive}
                                            count={count}
                                            onClick={() => toggleMulti(key, value)}
                                        />
                                    );
                                })}
                            </div>
                        </FilterSection>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden h-full lg:block">{content}</div>

            {isMobileOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 flex flex-col bg-[#08080b]">
                        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Catalog</p>
                                <p className="mt-1 text-sm text-white/75">
                                    {activeCount > 0 ? `${activeCount} selected` : 'Filters'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onMobileOpenChange?.(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/65"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
                        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.08] bg-[#08080b] px-4 py-4">
                            <button
                                type="button"
                                onClick={clearAll}
                                className="rounded-full border border-white/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/65"
                            >
                                Clear all
                            </button>
                            <button
                                type="button"
                                onClick={() => onMobileOpenChange?.(false)}
                                className="rounded-full border border-primary/30 bg-primary/12 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default CatalogSidebar;
