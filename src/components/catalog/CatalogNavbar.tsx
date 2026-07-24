import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Catalog } from '../../api/catalogApi';
import { trackTikTokSearch } from '../../utils/tiktokPixel';

type SearchSuggestion = {
    keyword: string;
};

// Used by: all public catalog-facing routes.
// Purpose: shared top navigation for catalog surfaces. Browse pages can opt
// into the inline navbar search and mobile filter action, while product and
// campaign pages can continue using the simpler navigation shell.
interface CatalogNavbarProps {
    homeHref?: string;
    onSearch?: (query: string) => void;
    onQueryChange?: (query: string) => void;
    suggestionsOverride?: SearchSuggestion[];
    initialQuery?: string;
    showInlineSearch?: boolean;
    showMobileFiltersButton?: boolean;
    mobileFiltersOpen?: boolean;
    onOpenFilters?: () => void;
}

const iconButtonClass =
    'relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.06]';

const CatalogNavbar: React.FC<CatalogNavbarProps> = ({
    homeHref = '/',
    onSearch,
    onQueryChange,
    suggestionsOverride,
    initialQuery = '',
    showInlineSearch = false,
    showMobileFiltersButton = false,
    mobileFiltersOpen = false,
    onOpenFilters,
}) => {
    const navigate = useNavigate();
    const { itemCount, setCartOpen } = useGuestCart();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const activeSuggestions = suggestionsOverride || suggestions;

    useEffect(() => {
        setSearchQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        if (onQueryChange) {
            onQueryChange(searchQuery);
        }
    }, [searchQuery, onQueryChange]);

    useEffect(() => {
        const stored = localStorage.getItem('juno_recent_searches');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch {
                // ignore corrupt local storage values
            }
        }
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        setIsLoadingSuggestions(true);
        try {
            const response = await Catalog.autocomplete(query);
            if (response.ok && Array.isArray(response.body)) {
                setSuggestions(response.body.slice(0, 6).map((keyword) => ({ keyword })));
            }
        } catch {
            // ignore autocomplete failures
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            fetchSuggestions(searchQuery);
        }, 200);

        return () => window.clearTimeout(timeoutId);
    }, [fetchSuggestions, searchQuery]);

    useEffect(() => {
        if (searchOpen) {
            window.setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [searchOpen]);

    const handleSearchSubmit = useCallback(
        (query: string) => {
            const trimmed = query.trim();

            if (trimmed) {
                const updated = [trimmed, ...recentSearches.filter((entry) => entry !== trimmed)].slice(0, 5);
                setRecentSearches(updated);
                localStorage.setItem('juno_recent_searches', JSON.stringify(updated));
            }

            setSearchQuery(trimmed);
            trackTikTokSearch(trimmed);

            if (onSearch) {
                onSearch(trimmed);
            } else {
                navigate(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : '/catalog');
            }

            setSearchOpen(false);
        },
        [navigate, onSearch, recentSearches]
    );

    const clearSearch = () => {
        setSearchQuery('');
        if (onSearch) {
            onSearch('');
        }
    };

    const desktopSearch = useMemo(() => {
        if (!showInlineSearch) return null;

        return (
            <form
                className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 md:flex"
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSearchSubmit(searchQuery);
                }}
            >
                <img src="/images/icons/search.png" alt="" className="h-4 w-4 shrink-0 opacity-65" />
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products, brands, and styles"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                {searchQuery ? (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white"
                        aria-label="Clear search"
                    >
                        <X size={15} />
                    </button>
                ) : null}
                <button
                    type="submit"
                    className="rounded-full border border-primary/30 bg-primary/12 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:border-primary/50 hover:bg-primary/18"
                >
                    Search
                </button>
            </form>
        );
    }, [handleSearchSubmit, searchQuery, showInlineSearch]);

    return (
        <>
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="flex min-h-20 items-center gap-3 py-3">
                        {/* On filterable pages the Filters button replaces the logo on mobile. */}
                        {showMobileFiltersButton ? (
                            <button
                                type="button"
                                onClick={onOpenFilters}
                                aria-pressed={mobileFiltersOpen}
                                className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors lg:hidden ${
                                    mobileFiltersOpen
                                        ? 'border-primary/50 bg-primary/15 text-white'
                                        : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.06]'
                                }`}
                            >
                                {mobileFiltersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
                                Filters
                            </button>
                        ) : null}

                        <Link
                            to={homeHref}
                            className={`shrink-0 ${showMobileFiltersButton ? 'hidden lg:block' : ''}`}
                            onClick={() => {
                                setSearchQuery('');
                                if (onSearch) onSearch('');
                            }}
                        >
                            <img
                                src="/images/juno-logos/icon+text_white.png"
                                alt="Juno"
                                className="h-8 w-auto object-contain md:h-9"
                            />
                        </Link>

                        {desktopSearch}

                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                className={iconButtonClass}
                                aria-label="Search"
                            >
                                <img src="/images/icons/search.png" alt="" className="h-5 w-5 opacity-90" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setCartOpen(true)}
                                className={iconButtonClass}
                                aria-label="Cart"
                            >
                                <img src="/images/icons/shopping_bag.png" alt="" className="h-5 w-5 opacity-90" />
                                {itemCount > 0 ? (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[9px] font-bold text-white shadow-glow-primary"
                                    >
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </motion.span>
                                ) : null}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {searchOpen ? (
                    <>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                            onClick={() => {
                                setSearchOpen(false);
                                setSuggestions([]);
                            }}
                            aria-label="Close search"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0A0A0A] px-4 py-4 md:px-6"
                        >
                            <div className="mx-auto max-w-2xl">
                                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-white/25">
                                    <img src="/images/icons/search.png" alt="" className="h-4 w-4 shrink-0 opacity-65" />
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') handleSearchSubmit(searchQuery);
                                            if (event.key === 'Escape') setSearchOpen(false);
                                        }}
                                        placeholder="Search products, brands, and styles"
                                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (searchQuery) setSearchQuery('');
                                            else {
                                                setSearchOpen(false);
                                                setSuggestions([]);
                                            }
                                        }}
                                        className="shrink-0 text-white/40 hover:text-white"
                                        aria-label="Clear search"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {isLoadingSuggestions && !suggestionsOverride ? (
                                    <p className="mt-3 px-1 text-xs text-white/30">Searching…</p>
                                ) : activeSuggestions.length > 0 ? (
                                    <div className="mt-2">
                                        {activeSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.keyword}
                                                type="button"
                                                onClick={() => handleSearchSubmit(suggestion.keyword)}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                                            >
                                                <img src="/images/icons/search.png" alt="" className="h-3.5 w-3.5 opacity-40" />
                                                {suggestion.keyword}
                                            </button>
                                        ))}
                                    </div>
                                ) : recentSearches.length > 0 && !searchQuery ? (
                                    <div className="mt-3">
                                        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Recent</p>
                                        {recentSearches.map((recent) => (
                                            <button
                                                key={recent}
                                                type="button"
                                                onClick={() => handleSearchSubmit(recent)}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                                            >
                                                <img src="/images/icons/search.png" alt="" className="h-3.5 w-3.5 opacity-40" />
                                                {recent}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </>
                ) : null}
            </AnimatePresence>
        </>
    );
};

export default CatalogNavbar;
