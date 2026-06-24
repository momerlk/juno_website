import React, { useMemo, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { FilterOptions } from '../../api/api';

type FilterKey = 'brand_ids' | 'sizes' | 'colors' | 'product_types' | 'materials' | 'occasions';

type Props = {
    options: FilterOptions | null;
    compact?: boolean;
    supportedKeys?: Array<
        FilterKey | 'category' | 'min_price' | 'max_price' | 'in_stock' | 'sort'
    >;
};

const DEFAULT_KEYS: NonNullable<Props['supportedKeys']> = [
    'category',
    'brand_ids',
    'min_price',
    'max_price',
    'in_stock',
    'sizes',
    'colors',
    'product_types',
    'materials',
    'occasions',
    'sort',
];

const MULTI_FILTERS: Array<{
    key: FilterKey;
    label: string;
    source: keyof Pick<
        FilterOptions,
        'brands' | 'sizes' | 'colors' | 'product_types' | 'materials' | 'occasions'
    >;
}> = [
    { key: 'brand_ids', label: 'Labels', source: 'brands' },
    { key: 'sizes', label: 'Sizes', source: 'sizes' },
    { key: 'colors', label: 'Colors', source: 'colors' },
    { key: 'product_types', label: 'Product types', source: 'product_types' },
    { key: 'materials', label: 'Materials', source: 'materials' },
    { key: 'occasions', label: 'Occasions', source: 'occasions' },
];

const splitParam = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

const CatalogFilters: React.FC<Props> = ({ options, compact = false, supportedKeys = DEFAULT_KEYS }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [expanded, setExpanded] = useState(false);
    const supported = useMemo(() => new Set(supportedKeys), [supportedKeys]);

    const updateParam = (key: string, value?: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('collection');
        next.delete('page');
        next.delete('cursor');
        setSearchParams(next);
    };

    const toggleMulti = (key: FilterKey, value: string) => {
        const active = splitParam(searchParams.get(key));
        const next = active.includes(value)
            ? active.filter((item) => item !== value)
            : [...active, value];
        updateParam(key, next.join(','));
    };

    const clearAll = () => {
        const next = new URLSearchParams();
        const query = searchParams.get('q');
        const collection = searchParams.get('collection');
        if (query) next.set('q', query);
        if (collection) next.set('collection', collection);
        setSearchParams(next);
    };

    const activeCount = supportedKeys.reduce((count, key) => {
        if (key === 'sort') return count;
        return count + (searchParams.has(key) ? 1 : 0);
    }, 0);

    return (
        <section className="mb-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0c]/90 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3 p-3 md:p-4">
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:border-primary/40"
                    aria-expanded={expanded}
                >
                    <SlidersHorizontal size={14} className="text-primary" />
                    Refine {activeCount ? `· ${activeCount}` : ''}
                    <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {supported.has('category') ? (
                    <select
                        value={searchParams.get('category') ?? ''}
                        onChange={(event) => updateParam('category', event.target.value)}
                        className="rounded-full border border-white/10 bg-[#121214] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 outline-none focus:border-primary/50"
                    >
                        <option value="">All categories</option>
                        {(options?.categories ?? []).map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                ) : null}

                {supported.has('sort') ? (
                    <select
                        value={`${searchParams.get('sort') ?? 'created_at'}:${searchParams.get('order') ?? 'desc'}`}
                        onChange={(event) => {
                            const [sort, order] = event.target.value.split(':');
                            const next = new URLSearchParams(searchParams);
                            next.set('sort', sort);
                            next.set('order', order);
                            next.delete('collection');
                            next.delete('page');
                            next.delete('cursor');
                            setSearchParams(next);
                        }}
                        className="ml-auto rounded-full border border-white/10 bg-[#121214] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75 outline-none focus:border-primary/50"
                    >
                        <option value="created_at:desc">Newest first</option>
                        {!compact ? <option value="popularity:desc">Most popular</option> : null}
                        {!compact ? <option value="rating:desc">Top rated</option> : null}
                        {!compact ? <option value="updated_at:desc">Recently updated</option> : null}
                        <option value="price:asc">Price low to high</option>
                        <option value="price:desc">Price high to low</option>
                        {!compact ? <option value="title:asc">Title A–Z</option> : null}
                    </select>
                ) : null}

                {activeCount ? (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1.5 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 hover:text-white"
                    >
                        <X size={12} />
                        Reset
                    </button>
                ) : null}
            </div>

            {expanded ? (
                <div className="border-t border-white/[0.07] p-4 md:p-5">
                    {(supported.has('min_price') || supported.has('max_price') || supported.has('in_stock')) ? (
                        <div className="mb-6 flex flex-wrap items-end gap-3">
                            {supported.has('min_price') ? (
                                <PriceField
                                    label="Minimum price"
                                    value={searchParams.get('min_price') ?? ''}
                                    onChange={(value) => updateParam('min_price', value)}
                                />
                            ) : null}
                            {supported.has('max_price') ? (
                                <PriceField
                                    label="Maximum price"
                                    value={searchParams.get('max_price') ?? ''}
                                    onChange={(value) => updateParam('max_price', value)}
                                />
                            ) : null}
                            {supported.has('in_stock') ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateParam(
                                            'in_stock',
                                            searchParams.get('in_stock') === 'true' ? undefined : 'true'
                                        )
                                    }
                                    className={`rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                                        searchParams.get('in_stock') === 'true'
                                            ? 'border-primary/50 bg-primary/15 text-white'
                                            : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white'
                                    }`}
                                >
                                    In stock only
                                </button>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {MULTI_FILTERS.filter(({ key }) => supported.has(key)).map(({ key, label, source }) => {
                            const values = options?.[source] ?? [];
                            if (!values.length) return null;
                            const active = splitParam(searchParams.get(key));

                            return (
                                <div key={key}>
                                    <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">
                                        {label}
                                    </p>
                                    <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
                                        {values.map((entry) => {
                                            const value = typeof entry === 'string' ? entry : entry.id;
                                            const name = typeof entry === 'string' ? entry : entry.name;
                                            const count = typeof entry === 'string' ? undefined : entry.product_count;
                                            const isActive = active.includes(value);
                                            return (
                                                <button
                                                    type="button"
                                                    key={value}
                                                    onClick={() => toggleMulti(key, value)}
                                                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                                                        isActive
                                                            ? 'border-primary/45 bg-gradient-to-r from-primary/20 to-secondary/15 text-white'
                                                            : 'border-white/10 bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white'
                                                    }`}
                                                >
                                                    {name}{typeof count === 'number' ? ` · ${count}` : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </section>
    );
};

const PriceField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({
    label,
    value,
    onChange,
}) => (
    <label className="block">
        <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.24em] text-white/35">
            {label}
        </span>
        <input
            type="number"
            min="0"
            inputMode="numeric"
            value={value}
            placeholder="Rs 0"
            onChange={(event) => onChange(event.target.value)}
            className="w-36 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-primary/45"
        />
    </label>
);

export default CatalogFilters;
