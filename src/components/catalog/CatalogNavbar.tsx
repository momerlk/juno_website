import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, Search, Heart, ArrowRight } from 'lucide-react';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Catalog } from '../../api/catalogApi';

interface CatalogNavbarProps {
    homeHref?: string;
    onSearch?: (query: string) => void;
    onQueryChange?: (query: string) => void;
    suggestionsOverride?: SearchSuggestion[];
    initialQuery?: string;
}

const CatalogNavbar: React.FC<CatalogNavbarProps> = ({ 
    homeHref = '/', 
    onSearch, 
    onQueryChange,
    suggestionsOverride,
    initialQuery = ''
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const { itemCount, setCartOpen } = useGuestCart();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const activeSuggestions = suggestionsOverride || suggestions;

    // Only sync initial query when the search overlay is first opened
    const lastOpenRef = useRef(false);
    useEffect(() => {
        if (searchOpen && !lastOpenRef.current && initialQuery) {
            setSearchQuery(initialQuery);
        }
        lastOpenRef.current = searchOpen;
    }, [searchOpen, initialQuery]);

    useEffect(() => {
        if (onQueryChange) {
            onQueryChange(searchQuery);
        }
    }, [searchQuery, onQueryChange]);

    useEffect(() => {
        const stored = localStorage.getItem('juno_recent_searches');
        if (stored) {
            try { setRecentSearches(JSON.parse(stored)); } catch { /* ignore */ }
        }
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query.trim()) { setSuggestions([]); return; }
        setIsLoadingSuggestions(true);
        try {
            const response = await Catalog.autocomplete(query);
            if (response.ok && Array.isArray(response.body)) {
                setSuggestions(response.body.slice(0, 6).map((keyword) => ({ keyword })));
            }
        } catch { /* ignore */ } finally {
            setIsLoadingSuggestions(false);
        }
    }, []);

    useEffect(() => {
        const id = setTimeout(() => fetchSuggestions(searchQuery), 200);
        return () => clearTimeout(id);
    }, [searchQuery, fetchSuggestions]);

    useEffect(() => {
        if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    }, [searchOpen]);

    const handleSearchSubmit = (query: string) => {
        const trimmed = query.trim();
        
        // Only add to recent searches if not empty
        if (trimmed) {
            const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem('juno_recent_searches', JSON.stringify(updated));
        }

        setSearchQuery(trimmed);
        
        if (onSearch) {
            onSearch(trimmed);
        } else {
            navigate(`/catalog?q=${encodeURIComponent(trimmed)}`);
        }
        setSearchOpen(false);
    };

    return (
        <>
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="flex h-20 items-center justify-between gap-6">

                        {/* Logo */}
                        <Link
                            to={homeHref}
                            className="shrink-0"
                            onClick={() => setIsOpen(false)}
                        >
                            <img
                                src="/juno_logos/icon+text_white.png"
                                alt="Juno"
                                className="h-8 w-auto object-contain"
                            />
                        </Link>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Search */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="rounded-full p-2 text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                                aria-label="Search"
                            >
                                <Search size={20} />
                            </button>

                            {/* Cart */}
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative rounded-full p-2 text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                                aria-label="Cart"
                            >
                                <ShoppingBag size={20} />
                                {itemCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[9px] font-bold text-white shadow-glow-primary"
                                    >
                                        {itemCount > 9 ? '9+' : itemCount}
                                    </motion.span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Search overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                            onClick={() => { setSearchOpen(false); setSuggestions([]); }}
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
                                    <Search size={16} className="shrink-0 text-white/40" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSearchSubmit(searchQuery);
                                            if (e.key === 'Escape') { setSearchOpen(false); }
                                        }}
                                        placeholder="Search products, brands, styles..."
                                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                    />
                                    <button
                                        onClick={() => { 
                                            if (searchQuery) setSearchQuery('');
                                            else { setSearchOpen(false); setSuggestions([]); }
                                        }}
                                        className="shrink-0 text-white/40 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Suggestions */}
                                {isLoadingSuggestions && !suggestionsOverride ? (
                                    <p className="mt-3 px-1 text-xs text-white/30">Searching…</p>
                                ) : activeSuggestions.length > 0 ? (
                                    <div className="mt-2">
                                        {activeSuggestions.map((s) => (
                                            <button
                                                key={s.keyword}
                                                onClick={() => handleSearchSubmit(s.keyword)}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                                            >
                                                <Search size={14} className="text-white/25" />
                                                {s.keyword}
                                            </button>
                                        ))}
                                    </div>
                                ) : recentSearches.length > 0 && !searchQuery ? (
                                    <div className="mt-3">
                                        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Recent</p>
                                        {recentSearches.map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => handleSearchSubmit(r)}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                                            >
                                                <Search size={14} className="text-white/25" />
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="sticky top-20 z-40 border-b border-white/10 bg-[#0A0A0A] md:hidden"
                    >
                        <div className="mx-auto max-w-7xl px-4 pb-4 pt-2">
                            <div className="flex flex-col gap-0.5">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                                    >
                                        {link.name}
                                        <ArrowRight size={14} className="text-white/25" />
                                    </Link>
                                ))}
                                {isCatalogPage && (
                                    <Link
                                        to="/wishlist"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                                    >
                                        <span className="flex items-center gap-2"><Heart size={14} /> Wishlist</span>
                                        <ArrowRight size={14} className="text-white/25" />
                                    </Link>
                                )}
                            </div>
                            <div className="mt-3 border-t border-white/8 pt-3 flex gap-2">
                                <Link
                                    to="/download"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary py-2.5 text-center text-sm font-bold text-white"
                                >
                                    Download App
                                </Link>
                                <Link
                                    to="/seller"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-center text-sm font-semibold text-white"
                                >
                                    For Brands
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CatalogNavbar;
