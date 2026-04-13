import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu,
    X,
    ShoppingBag,
    Search,
    Heart,
    ArrowRight,
    Store,
    TrendingUp,
} from 'lucide-react';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Catalog } from '../../api/catalogApi';

interface SearchSuggestion {
    keyword: string;
    product_count?: number;
}

const CatalogNavbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const { itemCount, setCartOpen } = useGuestCart();

    const isCatalogPage = location.pathname.startsWith('/catalog');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('juno_recent_searches');
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    // Debounced autocomplete
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        setIsLoadingSuggestions(true);
        try {
            const response = await Catalog.autocomplete(query);
            if (response.ok && Array.isArray(response.body)) {
                setSuggestions(
                    response.body.slice(0, 6).map((keyword) => ({
                        keyword,
                    }))
                );
            }
        } catch {
            // Ignore errors
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSuggestions(searchQuery);
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, fetchSuggestions]);

    const handleSearchSubmit = (query: string) => {
        if (!query.trim()) return;

        // Save to recent searches
        const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('juno_recent_searches', JSON.stringify(updated));

        navigate(`/catalog?q=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
        setSearchQuery(query);
    };

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Women', href: '/catalog/women' },
        { name: 'Men', href: '/catalog/men' },
        { name: 'Collections', href: '/collections' },
        { name: 'Drops', href: '/drops' },
        { name: 'Wishlist', href: '/wishlist', icon: Heart },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled || isOpen ? 'py-3' : 'py-4'
                } ${isCatalogPage ? 'bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10' : ''}`}
            >
                <div className="container mx-auto px-4 md:px-6">
                    <div
                        className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-300 ${
                            scrolled || isOpen || isCatalogPage
                                ? 'bg-black/60 backdrop-blur-xl border-white/10 shadow-lg px-4 md:px-6 py-3'
                                : 'bg-transparent border-transparent px-0 py-0'
                        }`}
                    >
                        <div className="flex justify-between items-center gap-4">
                            {/* Logo */}
                            <Link
                                to={isCatalogPage ? '/catalog' : '/#home'}
                                className="flex items-center space-x-2 z-50"
                                onClick={closeMenu}
                            >
                                <img
                                    src="/juno_logos/icon+text_white.png"
                                    alt="Juno Logo"
                                    className="h-7 md:h-9 w-auto object-contain"
                                />
                            </Link>

                            {/* Search Bar - Desktop */}
                            {isCatalogPage && (
                                <div className="hidden md:flex flex-1 max-w-xl mx-4">
                                    <div className="relative w-full">
                                        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 focus-within:border-primary focus-within:bg-white/[0.06] transition-colors">
                                            <Search size={18} className="text-white/40" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSearchSubmit(searchQuery);
                                                    }
                                                }}
                                                placeholder="Search products, brands, styles..."
                                                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setSuggestions([]);
                                                    }}
                                                    className="text-white/40 hover:text-white"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        <AnimatePresence>
                                            {showSuggestions && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden"
                                                >
                                                    {isLoadingSuggestions ? (
                                                        <div className="px-4 py-3 text-sm text-white/40">Searching...</div>
                                                    ) : suggestions.length > 0 ? (
                                                        <div className="py-2">
                                                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                                Suggestions
                                                            </div>
                                                            {suggestions.map((suggestion, index) => (
                                                                <button
                                                                    key={suggestion.keyword}
                                                                    onClick={() => handleSearchSubmit(suggestion.keyword)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                                                                >
                                                                    <Search size={16} className="text-white/30" />
                                                                    {suggestion.keyword}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : recentSearches.length > 0 ? (
                                                        <div className="py-2">
                                                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                                Recent Searches
                                                            </div>
                                                            {recentSearches.map((recent) => (
                                                                <button
                                                                    key={recent}
                                                                    onClick={() => handleSearchSubmit(recent)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                                                                >
                                                                    <TrendingUp size={16} className="text-white/30" />
                                                                    {recent}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                                {isCatalogPage && (
                                    <Link
                                        to="/wishlist"
                                        className="hidden md:flex items-center justify-center rounded-full border border-white/10 p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <Heart size={20} />
                                    </Link>
                                )}

                                <button
                                    onClick={() => setCartOpen(true)}
                                    className="relative rounded-full border border-white/10 p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <ShoppingBag size={20} />
                                    {itemCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-white"
                                        >
                                            {itemCount > 9 ? '9+' : itemCount}
                                        </motion.span>
                                    )}
                                </button>

                                <button
                                    className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
                                    onClick={toggleMenu}
                                    aria-label="Toggle menu"
                                >
                                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>
                            </div>
                        </div>

                        {/* Desktop Nav Links */}
                        {isCatalogPage && (
                            <div className="hidden md:flex items-center space-x-1 mt-3 pt-3 border-t border-white/10">
                                {navLinks.map((link) => {
                                    const isGender = link.name === 'Women' || link.name === 'Men';
                                    const isActive = location.pathname === link.href;
                                    return (
                                        <Link
                                            key={link.name}
                                            to={link.href}
                                            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-2 ${
                                                isGender
                                                    ? isActive
                                                        ? 'bg-gradient-to-r from-primary to-secondary text-white font-bold tracking-wide'
                                                        : 'text-white font-bold tracking-wide border border-white/20 hover:border-white/40 hover:bg-white/5'
                                                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {link.icon && <link.icon size={14} />}
                                            {link.name}
                                        </Link>
                                    );
                                })}
                                <div className="flex-1" />
                                <Link
                                    to="/seller"
                                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Store size={14} />
                                    For Brands
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 md:hidden pt-24 px-4 pb-4"
                    >
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={closeMenu} />
                        <div className="relative z-50 bg-neutral-900/50 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -z-10" />

                            {/* Mobile Search */}
                            {isCatalogPage && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3">
                                        <Search size={18} className="text-white/40" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearchSubmit(searchQuery);
                                                    closeMenu();
                                                }
                                            }}
                                            placeholder="Search products..."
                                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col space-y-2">
                                {navLinks.map((link, index) => (
                                    <motion.a
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        href={link.href}
                                        className="text-xl font-bold text-white/80 hover:text-white py-3 px-4 rounded-xl hover:bg-white/5 transition-all flex items-center justify-between group"
                                        onClick={() => {
                                            closeMenu();
                                            if (link.name === 'Home' && !isCatalogPage) {
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        <span className="flex items-center gap-3">
                                            {link.icon && <link.icon size={20} />}
                                            {link.name}
                                        </span>
                                        <ArrowRight
                                            size={16}
                                            className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                                        />
                                    </motion.a>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                                    <span className="text-sm font-bold text-white">Shopping Bag</span>
                                    <button
                                        onClick={() => {
                                            setCartOpen(true);
                                            closeMenu();
                                        }}
                                        className="relative rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <ShoppingBag size={20} />
                                        {itemCount > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-white">
                                                {itemCount > 9 ? '9+' : itemCount}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {isCatalogPage && (
                                    <Link
                                        to="/wishlist"
                                        onClick={closeMenu}
                                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white font-semibold hover:bg-white/10 transition-colors"
                                    >
                                        <span className="flex items-center gap-3">
                                            <Heart size={20} />
                                            Wishlist
                                        </span>
                                        <ArrowRight size={16} className="text-white/40" />
                                    </Link>
                                )}

                                <Link
                                    to="/download"
                                    className="flex items-center justify-center w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg shadow-primary/20"
                                    onClick={closeMenu}
                                >
                                    Download App
                                </Link>
                                <Link
                                    to="/seller"
                                    className="flex items-center justify-center w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
                                    onClick={closeMenu}
                                >
                                    For Indie Brands
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close suggestions */}
            {showSuggestions && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowSuggestions(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
};

export default CatalogNavbar;
