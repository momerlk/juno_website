import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Loader2, Minus, Plus } from 'lucide-react';
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
    { key: 'colors', label: 'Color', source: 'colors' },
    { key: 'materials', label: 'Material', source: 'materials' },
    { key: 'occasions', label: 'Occasion', source: 'occasions' },
    { key: 'genders', label: 'Gender', source: 'genders' },
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
                className="flex w-full items-center justify-between py-3.5 text-left"
                aria-expanded={expanded}
            >
                <span className="flex items-center gap-2 text-[13px] font-semibold text-white/90">
                    {title}
                    {count > 0 ? (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                            {count}
                        </span>
                    ) : null}
                </span>
                <ChevronDown
                    size={15}
                    className={`text-white/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
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
            <div className="flex items-center justify-between pb-1 pt-1">
                <span className="flex items-center gap-2 text-[15px] font-bold text-white">
                    Filters
                    {isLoading ? <Loader2 size={13} className="animate-spin text-primary" /> : null}
                </span>
                {activeCount > 0 ? (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-[12px] font-semibold text-primary transition-colors hover:text-white"
                    >
                        Clear all ({activeCount})
                    </button>
                ) : (
                    <span className="text-[12px] tabular-nums text-white/35">{totalProducts} items</span>
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
                                            <CheckRow
                                                label={humanizeCatalogValue(deptId)}
                                                selected={activeDepartments.includes(deptId)}
                                                count={department.product_count}
                                                onClick={() => toggleMulti('departments', deptId)}
                                            />
                                        </div>
                                        {hasChildren ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleOpen(deptId)}
                                                aria-label={`${isDeptOpen ? 'Collapse' : 'Expand'} ${humanizeCatalogValue(deptId)}`}
                                                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
                                            >
                                                {isDeptOpen ? <Minus size={13} /> : <Plus size={13} />}
                                            </button>
                                        ) : null}
                                    </div>

                                    {isDeptOpen && hasChildren ? (
                                        <ul className="space-y-px">
                                            {department.groups.map((group) => {
                                                const groupId = group.product_group;
                                                const isGroupOpen =
                                                    openDepartments.has(`${deptId}/${groupId}`) || activeGroups.includes(groupId);
                                                const hasTypes = group.types.length > 0;

                                                return (
                                                    <li key={groupId}>
                                                        <div className="flex items-center">
                                                            <div className="min-w-0 flex-1">
                                                                <CheckRow
                                                                    label={humanizeCatalogValue(groupId)}
                                                                    selected={activeGroups.includes(groupId)}
                                                                    count={group.product_count}
                                                                    indent
                                                                    onClick={() => toggleMulti('product_groups', groupId)}
                                                                />
                                                            </div>
                                                            {hasTypes ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleOpen(`${deptId}/${groupId}`)}
                                                                    aria-label={`${isGroupOpen ? 'Collapse' : 'Expand'} ${humanizeCatalogValue(groupId)}`}
                                                                    className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
                                                                >
                                                                    {isGroupOpen ? <Minus size={13} /> : <Plus size={13} />}
                                                                </button>
                                                            ) : null}
                                                        </div>

                                                        {isGroupOpen && hasTypes ? (
                                                            <ul className="space-y-px pl-4">
                                                                {group.types.map((type) => (
                                                                    <li key={type.product_type}>
                                                                        <CheckRow
                                                                            label={humanizeCatalogValue(type.product_type)}
                                                                            selected={activeTypes.includes(type.product_type)}
                                                                            indent
                                                                            onClick={() => toggleMulti('product_types', type.product_type)}
                                                                        />
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
                                Show {totalProducts} items
                            </button>
                        </div>
                </div>
            ) : null}
        </>
    );
};

export default CatalogSidebar;
