import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, Search, X } from 'lucide-react';
import { PAKISTAN_CITIES } from '../../data/pakistanCities';

interface CitySelectModalProps {
    isOpen: boolean;
    selectedCity: string;
    onClose: () => void;
    onSelect: (city: string) => void;
}

// Where most orders go. Shown before anyone types so the common case is one tap.
const POPULAR_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta']
    .filter((city) => PAKISTAN_CITIES.includes(city));

const normalize = (value: string) => value.trim().toLowerCase();

// Exact, then starts-with, then any word starting with the query, then anywhere.
// "kar" should not put "Bahawalnagar" above "Karachi".
const rank = (city: string, needle: string): number => {
    const name = city.toLowerCase();
    if (name === needle) return 0;
    if (name.startsWith(needle)) return 1;
    if (name.split(/[\s-]+/).some((word) => word.startsWith(needle))) return 2;
    return name.includes(needle) ? 3 : Number.POSITIVE_INFINITY;
};

// Full-screen picker: no initial city-list DOM and no automatic keyboard opening.
// Common cities are one tap away; every other city is available through search.
const CitySelectModal: React.FC<CitySelectModalProps> = ({ isOpen, selectedCity, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCityListReady, setIsCityListReady] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    // Callers pass inline arrows, so these change identity on every parent render.
    // Held in a ref, they can never retrigger the effects below.
    const handlersRef = useRef({ onClose, onSelect });
    handlersRef.current = { onClose, onSelect };

    // Keyed on isOpen alone. This used to depend on onClose too, so any parent
    // re-render (the checkout draft autosaves on a timer) re-ran it and wiped
    // whatever the customer was typing.
    useEffect(() => {
        if (!isOpen) return undefined;
        setQuery('');
        setActiveIndex(0);
        setIsCityListReady(false);
        // Let the full-screen overlay paint before mounting every city row.
        const timer = window.setTimeout(() => setIsCityListReady(true), 160);
        return () => window.clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handlersRef.current.onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        // Block background scrolling without repositioning the document. Fixing
        // the body then restoring scrollY made closing look like a page animation.
        const previous = { documentOverflow: document.documentElement.style.overflow, bodyOverflow: document.body.style.overflow };
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        return () => {
            document.documentElement.style.overflow = previous.documentOverflow;
            document.body.style.overflow = previous.bodyOverflow;
        };
    }, [isOpen]);

    const trimmedQuery = query.trim();
    const needle = normalize(trimmedQuery);

    const matches = useMemo(() => {
        if (!needle) return PAKISTAN_CITIES;
        return PAKISTAN_CITIES
            .map((city) => ({ city, score: rank(city, needle) }))
            .filter((entry) => Number.isFinite(entry.score))
            .sort((a, b) => a.score - b.score || a.city.localeCompare(b.city))
            .map((entry) => entry.city);
    }, [needle]);

    const visibleMatches = useMemo(() => matches.slice(0, 50), [matches]);
    const isCustomCity = trimmedQuery.length > 1 && !matches.some((city) => normalize(city) === needle);
    // Real cities outrank the free-text row: typing a prefix and pressing Enter
    // should pick the city, not invent one. The custom row is the last resort.
    const options = useMemo(
        () => needle ? (isCustomCity ? [...visibleMatches, trimmedQuery] : visibleMatches) : PAKISTAN_CITIES,
        [isCustomCity, needle, trimmedQuery, visibleMatches]
    );

    useEffect(() => { setActiveIndex(0); }, [needle]);

    const commit = useCallback((city: string) => {
        const value = city.trim();
        if (!value) return;
        handlersRef.current.onSelect(value);
    }, []);

    const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const choice = options[activeIndex] ?? options[0];
            if (choice) commit(choice);
            return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        setActiveIndex((current) => {
            const next = event.key === 'ArrowDown' ? current + 1 : current - 1;
            const bounded = Math.min(Math.max(next, 0), Math.max(options.length - 1, 0));
            listRef.current?.querySelector(`[data-index="${bounded}"]`)?.scrollIntoView({ block: 'nearest' });
            return bounded;
        });
    };

    const renderCity = (city: string, index: number) => {
        const isSelected = normalize(city) === normalize(selectedCity);
        const isActive = index === activeIndex;
        return (
            <button
                key={city}
                type="button"
                data-index={index}
                onClick={() => commit(city)}
                onMouseEnter={() => setActiveIndex(index)}
                aria-current={isSelected ? 'true' : undefined}
                className={`flex w-full items-center justify-between border-b border-white/[0.05] px-5 py-4 text-left text-[16px] transition-colors ${
                    isActive ? 'bg-white/[0.06] text-white' : isSelected ? 'font-bold text-white' : 'text-white/75'
                }`}
            >
                {city}
                {isSelected ? <Check size={16} className="text-primary" /> : null}
            </button>
        );
    };

    const modal = isOpen ? (
                <div
                    className="fixed inset-0 z-[100] bg-[#0b0b0d]"
                    onClick={() => handlersRef.current.onClose()}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Select city"
                        onClick={(event) => event.stopPropagation()}
                        className="flex h-full w-full flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                            <h2 className="text-base font-black uppercase tracking-[-0.02em] text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                City
                            </h2>
                            <button
                                type="button"
                                onClick={() => handlersRef.current.onClose()}
                                aria-label="Close city picker"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/25 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="border-b border-white/[0.08] px-5 py-3">
                            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-3 focus-within:border-white/35">
                                <Search size={15} className="shrink-0 text-white/40" />
                                <input
                                    ref={searchRef}
                                    // Plain text, not type="search": phone autocorrect rewrites
                                    // half-typed place names, which reads as the field fighting you.
                                    type="text"
                                    inputMode="search"
                                    enterKeyHint="done"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="words"
                                    spellCheck={false}
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onKeyDown={onSearchKeyDown}
                                    placeholder="Search your city"
                                    aria-label="Search your city"
                                    className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/30"
                                />
                                {query ? (
                                    <button
                                        type="button"
                                        onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                                        aria-label="Clear search"
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                                    >
                                        <X size={12} />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
                            {!needle && POPULAR_CITIES.length ? (
                                <div className="px-3 pt-4">
                                    <p className="px-2 pb-2 text-[12px] font-black uppercase tracking-[0.16em] text-white/30">Most delivered to</p>
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_CITIES.map((city) => (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => commit(city)}
                                                className={`rounded-full px-3.5 py-2 text-[14px] font-bold transition-colors ${
                                                    normalize(city) === normalize(selectedCity)
                                                        ? 'bg-white text-black'
                                                        : 'bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white'
                                                }`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {needle && !matches.length && !isCustomCity ? (
                                <p className="px-5 py-8 text-center text-sm text-white/45">No city matches “{trimmedQuery}”.</p>
                            ) : null}

                            {needle ? (
                                <div className="pt-2">
                                    {visibleMatches.map((city, index) => renderCity(city, index))}
                                </div>
                            ) : !isCityListReady ? (
                                <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center text-white/50">
                                    <Loader2 size={22} className="animate-spin text-white/70" />
                                    <p className="text-sm">Loading all delivery cities…</p>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    {PAKISTAN_CITIES.map((city, index) => renderCity(city, index))}
                                </div>
                            )}

                            {isCustomCity ? (
                                <button
                                    type="button"
                                    data-index={visibleMatches.length}
                                    onClick={() => commit(trimmedQuery)}
                                    onMouseEnter={() => setActiveIndex(visibleMatches.length)}
                                    className={`mx-3 mb-3 mt-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                                        activeIndex === visibleMatches.length ? 'border-primary bg-primary/15' : 'border-primary/40 bg-primary/10'
                                    }`}
                                >
                                    <span className="min-w-0">
                                        <span className="block text-[15px] font-bold text-white">Use “{trimmedQuery}”</span>
                                        <span className="mt-0.5 block text-[13px] text-white/50">Not in the list? We still deliver there.</span>
                                    </span>
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
    ) : null;

    // The field lives inside animated checkout sections. A portal prevents those
    // transforms from turning this fixed sheet into a locally positioned layer.
    return typeof document === 'undefined' ? null : createPortal(modal, document.body);
};

// Memoised so a checkout re-render (autosave, shipping estimate) cannot disturb
// an open picker.
export default React.memo(CitySelectModal);
