import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import type { CatalogHierarchy, FilterOptions } from '../../api/api';

const humanizeCatalogValue = (value: string) =>
    value
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const splitParam = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

// Color names → swatch hex. Covers the common catalog vocabulary; anything
// unmapped falls back to a neutral chip so the swatch grid never breaks.
const COLOR_HEX: Record<string, string> = {
    black: '#111111', white: '#f5f5f5', grey: '#8a8a8a', gray: '#8a8a8a', silver: '#c0c0c0',
    red: '#d81f2a', maroon: '#7c1220', pink: '#ff4585', 'hot pink': '#ff2d7a', 'rose': '#e75480', fuchsia: '#d6216f',
    orange: '#ff6b1a', peach: '#ffb18a', coral: '#ff6f61', rust: '#b7410e',
    yellow: '#ffcf33', mustard: '#d4a017', gold: '#d4af37',
    green: '#2e8b57', olive: '#708238', teal: '#188f8f', mint: '#98e2c6', lime: '#a6d608',
    blue: '#2563d8', navy: '#1e2a52', 'navy blue': '#1e2a52', 'sky blue': '#7dc3ff', cyan: '#22c1c3', 'royal blue': '#2447c7',
    purple: '#7c3aed', lavender: '#c4b5fd', violet: '#8b5cf6', mauve: '#9d7c8f',
    brown: '#6b4226', tan: '#c9a76b', beige: '#e4d5b7', cream: '#f3ead3', khaki: '#b7a26a', camel: '#c19a6b',
    ivory: '#fffff0', 'off white': '#f2efe6', multicolor: 'linear-gradient(135deg,#ff4585,#ffcf33,#2e8b57,#2563d8)',
    multi: 'linear-gradient(135deg,#ff4585,#ffcf33,#2e8b57,#2563d8)',
};

const swatchFor = (name: string): string => {
    const key = name.trim().toLowerCase();
    return COLOR_HEX[key] ?? '#3a3a3d';
};

const MULTI_FILTERS = [
    { key: 'genders', label: 'Gender', source: 'genders' },
    { key: 'brand_ids', label: 'Brands', source: 'brands' },
    { key: 'colors', label: 'Color', source: 'colors' },
    { key: 'materials', label: 'Material', source: 'materials' },
    { key: 'occasions', label: 'Occasion', source: 'occasions' },
    { key: 'style_categories', label: 'Style', source: 'style_categories' },
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

// Collapsible filter group. Expansion is purely visual — it never changes
// the selected filters, which was the core UX problem with the old sidebar.
const FilterSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    count?: number;
}> = ({ title, children, defaultExpanded = false, count = 0 }) => {
    const [expanded, setExpanded] = useState(defaultExpanded || count > 0);

    return (
        <div className="border-b border-white/[0.07]">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="group flex w-full items-center justify-between py-3.5 text-left"
                aria-expanded={expanded}
            >
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85 transition-colors group-hover:text-white">
                    {title}
                    {count > 0 ? (
                        <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary px-1 text-[10px] font-bold text-white">
                            {count}
                        </span>
                    ) : null}
                </span>
                <ChevronDown
                    size={15}
                    className={`text-white/40 transition-transform duration-200 group-hover:text-white/70 ${expanded ? 'rotate-180' : ''}`}
                />
            </button>
            {expanded ? <div className="pb-4">{children}</div> : null}
        </div>
    );
};

// Compact checkbox row: label left, count right. No pill cards.
const CheckRow: React.FC<{
    label: string;
    selected: boolean;
    count?: number;
    indent?: boolean;
    onClick: () => void;
}> = ({ label, selected, count, indent = false, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-left transition-colors hover:bg-white/[0.04] ${
            indent ? 'pl-6' : ''
        }`}
    >
        <span
            className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                selected ? 'border-primary bg-primary' : 'border-white/25 group-hover:border-white/45'
            }`}
        >
            {selected ? <Check size={11} strokeWidth={3} className="text-white" /> : null}
        </span>
        <span className={`min-w-0 flex-1 truncate text-[13px] ${selected ? 'text-white' : 'text-white/65 group-hover:text-white/90'}`}>
            {label}
        </span>
        {typeof count === 'number' ? (
            <span className="shrink-0 text-[11px] tabular-nums text-white/30">{count}</span>
        ) : null}
    </button>
);

const CategoryNavRow: React.FC<{
    label: string;
    selected: boolean;
    count?: number;
    level?: 0 | 1;
    expanded?: boolean;
    onSelect: () => void;
    onExpand?: () => void;
}> = ({ label, selected, count, level = 0, expanded, onSelect, onExpand }) => (
    <div className={`flex items-center gap-1 rounded-lg border transition-colors ${
        selected ? 'border-primary/35 bg-primary/10' : level === 0 ? 'border-white/[0.08] bg-white/[0.025]' : 'border-transparent'
    }`}>
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/70 ${
                level === 0 ? 'min-h-11' : 'min-h-9'
            }`}
        >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-primary bg-primary' : 'border-white/25'}`}>
                {selected ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <span className={`min-w-0 flex-1 truncate ${level === 0 ? 'text-[13px] font-semibold text-white/90' : 'text-[12px] text-white/65'}`}>
                {label}
            </span>
            {typeof count === 'number' ? <span className="text-[10px] tabular-nums text-white/30">{count}</span> : null}
        </button>
        {onExpand ? (
            <button
                type="button"
                onClick={onExpand}
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
                aria-expanded={expanded}
                className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/70"
            >
                <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
        ) : null}
    </div>
);

// Color filter as tappable swatches instead of a checkbox list — far faster
// to scan for a fashion catalog.
const ColorSwatches: React.FC<{
    values: string[];
    selected: string[];
    onToggle: (value: string) => void;
}> = ({ values, selected, onToggle }) => (
    <div className="flex flex-wrap gap-2.5 pt-1">
        {values.map((name) => {
            const isSelected = selected.includes(name);
            const swatch = swatchFor(name);
            const isGradient = swatch.startsWith('linear-gradient');
            return (
                <button
                    key={name}
                    type="button"
                    onClick={() => onToggle(name)}
                    aria-pressed={isSelected}
                    title={humanizeCatalogValue(name)}
                    className="group relative flex flex-col items-center gap-1"
                >
                    <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-110 ${
                            isSelected
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#0b0b0d]'
                                : 'ring-1 ring-white/15'
                        }`}
                        style={isGradient ? { backgroundImage: swatch } : { backgroundColor: swatch }}
                    >
                        {isSelected ? (
                            <Check
                                size={13}
                                strokeWidth={3}
                                className={swatch === '#f5f5f5' || swatch === '#fffff0' || swatch === '#f3ead3' ? 'text-black' : 'text-white'}
                            />
                        ) : null}
                    </span>
                    <span className={`max-w-[3.5rem] truncate text-[10px] ${isSelected ? 'text-white' : 'text-white/50'}`}>
                        {humanizeCatalogValue(name)}
                    </span>
                </button>
            );
        })}
    </div>
);

const FilterSkeleton: React.FC = () => (
    <div className="space-y-4 pt-2" aria-label="Loading filters" role="status">
        <span className="sr-only">Loading filters</span>
        {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-white/[0.07] pb-4">
                <div className="h-4 w-24 animate-pulse rounded bg-white/[0.08]" />
                <div className="mt-4 space-y-3">
                    {Array.from({ length: index % 2 === 0 ? 3 : 2 }).map((_, row) => (
                        <div key={row} className="flex items-center gap-2.5 px-2">
                            <div className="h-[15px] w-[15px] animate-pulse rounded-[3px] bg-white/[0.08]" />
                            <div className={`h-3 animate-pulse rounded bg-white/[0.08] ${row === 0 ? 'w-3/4' : 'w-1/2'}`} />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
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
    // Which departments/groups the user has manually opened in the category tree.
    const [openDepartments, setOpenDepartments] = useState<Set<string>>(new Set());

    useEffect(() => {
        setPriceDraft({
            min: searchParams.get('min_price') ?? '',
            max: searchParams.get('max_price') ?? '',
        });
    }, [searchParams]);

    useEffect(() => {
        if (!isMobileOpen) return undefined;
        document.body.style.overflow = 'hidden';
        return () => {
            // Restore to the stylesheet default rather than a captured value:
            // a stale capture from overlapping locks is how the page got stuck
            // unscrollable before.
            document.body.style.overflow = '';
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

    const activeDepartments = splitParam(searchParams.get('departments'));
    const activeGroups = splitParam(searchParams.get('product_groups'));
    const activeTypes = splitParam(searchParams.get('product_types'));
    const displayedProductsCount = totalProducts;
    const categoryCount = activeDepartments.length + activeGroups.length + activeTypes.length;
    const priceCount =
        Number(Boolean(searchParams.get('min_price'))) +
        Number(Boolean(searchParams.get('max_price'))) +
        Number(searchParams.get('in_stock') === 'true');

    const activeCount = useMemo(() => {
        let total = categoryCount + priceCount;
        MULTI_FILTERS.forEach(({ key }) => {
            total += splitParam(searchParams.get(key)).length;
        });
        return total;
    }, [categoryCount, priceCount, searchParams]);

    const toggleOpen = (id: string) => {
        setOpenDepartments((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const content = (
        // No h-full here: inside the mobile drawer this is the scroll content,
        // and a forced 100% height makes flex crush the sections and kills
        // scrolling (container never sees overflow).
        <div>
            {isLoading && !options && !hierarchy ? <FilterSkeleton /> : <>
            <div className="mb-1 flex items-center justify-between border-b border-white/10 pb-3 pt-1">
                <span className="flex items-center gap-2 text-lg font-black uppercase tracking-[-0.02em] text-white">
                    Filters
                    {isLoading ? <Loader2 size={13} className="animate-spin text-primary" /> : null}
                </span>
                {activeCount > 0 ? (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                        Clear ({activeCount})
                    </button>
                ) : (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] tabular-nums text-white/35">
                        {displayedProductsCount} items
                    </span>
                )}
            </div>

            {hierarchy?.departments && hierarchy.departments.length > 0 ? (
                <FilterSection title="Category" defaultExpanded count={categoryCount}>
                    <ul className="space-y-px">
                        {hierarchy.departments.map((department) => {
                            const deptId = department.department;
                            const isDeptOpen = openDepartments.has(deptId) || activeDepartments.includes(deptId);
                            const hasChildren = department.groups.length > 0;

                            return (
                                <li key={deptId}>
                                    <div className="flex items-center">
                                        <div className="min-w-0 flex-1">
                                            <CategoryNavRow
                                                label={humanizeCatalogValue(deptId)}
                                                selected={activeDepartments.includes(deptId)}
                                                count={department.product_count}
                                                expanded={isDeptOpen}
                                                onSelect={() => toggleMulti('departments', deptId)}
                                                onExpand={hasChildren ? () => toggleOpen(deptId) : undefined}
                                            />
                                        </div>
                                    </div>

                                    {isDeptOpen && hasChildren ? (
                                        <ul className="ml-3 mt-1.5 space-y-1 border-l border-white/10 pl-2">
                                            {department.groups.map((group) => {
                                                const groupId = group.product_group;
                                                const isGroupOpen =
                                                    openDepartments.has(`${deptId}/${groupId}`) || activeGroups.includes(groupId);
                                                const hasTypes = group.types.length > 0;

                                                return (
                                                    <li key={groupId}>
                                                        <div className="flex items-center">
                                                            <div className="min-w-0 flex-1">
                                                                <CategoryNavRow
                                                                    label={humanizeCatalogValue(groupId)}
                                                                    selected={activeGroups.includes(groupId)}
                                                                    count={group.product_count}
                                                                    level={1}
                                                                    expanded={isGroupOpen}
                                                                    onSelect={() => toggleMulti('product_groups', groupId)}
                                                                    onExpand={hasTypes ? () => toggleOpen(`${deptId}/${groupId}`) : undefined}
                                                                />
                                                            </div>
                                                        </div>

                                                        {isGroupOpen && hasTypes ? (
                                                            <ul className="flex flex-wrap gap-1.5 pb-1 pl-2 pt-1">
                                                                {group.types.map((type) => (
                                                                    <li key={type.product_type}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleMulti('product_types', type.product_type)}
                                                                            aria-pressed={activeTypes.includes(type.product_type)}
                                                                            className={`rounded-full border px-2.5 py-1.5 text-[10px] transition-colors ${
                                                                                activeTypes.includes(type.product_type)
                                                                                    ? 'border-primary/40 bg-primary/15 text-white'
                                                                                    : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white'
                                                                            }`}
                                                                        >
                                                                            {humanizeCatalogValue(type.product_type)}
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
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
                </FilterSection>
            ) : null}

            <FilterSection title="Price" defaultExpanded count={priceCount}>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/35">Rs</span>
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
                            className="w-full rounded-lg border border-white/12 bg-white/[0.03] py-2 pl-9 pr-2 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                        />
                    </div>
                    <span className="text-white/30">–</span>
                    <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/35">Rs</span>
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
                            className="w-full rounded-lg border border-white/12 bg-white/[0.03] py-2 pl-9 pr-2 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-primary/60"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={applyPriceDraft}
                        className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                    >
                        Go
                    </button>
                </div>
                <div className="mt-3">
                    <CheckRow
                        label="In stock only"
                        selected={searchParams.get('in_stock') === 'true'}
                        onClick={() => updateParam('in_stock', searchParams.get('in_stock') === 'true' ? undefined : 'true')}
                    />
                </div>
            </FilterSection>

            {MULTI_FILTERS.map(({ key, label, source }) => {
                const values = options?.[source] ?? [];
                if (!values.length) return null;
                const activeValues = splitParam(searchParams.get(key));

                if (key === 'colors') {
                    return (
                        <FilterSection key={key} title={label} count={activeValues.length}>
                            <ColorSwatches
                                values={(values as string[]).filter(Boolean)}
                                selected={activeValues}
                                onToggle={(value) => toggleMulti(key, value)}
                            />
                        </FilterSection>
                    );
                }

                return (
                    <FilterSection key={key} title={label} count={activeValues.length}>
                        <div className="max-h-60 space-y-px overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            {values.map((entry) => {
                                const isString = typeof entry === 'string';
                                const value = isString
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

                                return (
                                    <CheckRow
                                        key={value}
                                        label={key === 'brand_ids' ? rawName : humanizeCatalogValue(rawName)}
                                        selected={activeValues.includes(value)}
                                        count={count}
                                        onClick={() => toggleMulti(key, value)}
                                    />
                                );
                            })}
                        </div>
                    </FilterSection>
                );
            })}
            </>}
        </div>
    );

    return (
        <>
            <div className="hidden lg:block">{content}</div>

            {/* Sits below the sticky navbar (top-20, z-40 < navbar z-50) so the
                navbar Filters button stays tappable and toggles the panel shut. */}
            {isMobileOpen ? (
                <div className="fixed inset-x-0 bottom-0 top-20 z-40 flex flex-col overflow-hidden bg-[#0b0b0d] lg:hidden">
                        <div className="border-b border-white/[0.08] px-5 py-4">
                            <span className="text-[15px] font-bold text-white">
                                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                            </span>
                        </div>
                        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-4">
                            {content}
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.08] bg-[#0b0b0d] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={clearAll}
                                className="rounded-lg border border-white/12 px-4 py-3 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
                            >
                                Clear all
                            </button>
                            <button
                                type="button"
                                onClick={() => onMobileOpenChange?.(false)}
                                className="rounded-lg bg-primary px-4 py-3 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                            >
                                Show {displayedProductsCount} items
                            </button>
                        </div>
                </div>
            ) : null}
        </>
    );
};

export default CatalogSidebar;
