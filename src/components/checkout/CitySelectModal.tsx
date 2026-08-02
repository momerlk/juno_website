import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';
import { PAKISTAN_CITIES } from '../../data/pakistanCities';

interface CitySelectModalProps {
    isOpen: boolean;
    selectedCity: string;
    onClose: () => void;
    onSelect: (city: string) => void;
}

// Full-height picker instead of a native <select>: the list is long, needs search,
// and a typed value must still be accepted because delivery reaches towns that are
// not in the list.
const CitySelectModal: React.FC<CitySelectModalProps> = ({ isOpen, selectedCity, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setQuery('');
        const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 120);
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen, onClose]);

    const trimmedQuery = query.trim();
    const matches = useMemo(() => {
        if (!trimmedQuery) return PAKISTAN_CITIES;
        const needle = trimmedQuery.toLowerCase();
        return PAKISTAN_CITIES.filter((city) => city.toLowerCase().includes(needle));
    }, [trimmedQuery]);

    // Group by first letter so a long list stays scannable.
    const groups = useMemo(() => {
        const buckets = new Map<string, string[]>();
        matches.forEach((city) => {
            const letter = city[0].toUpperCase();
            buckets.set(letter, [...(buckets.get(letter) || []), city]);
        });
        return [...buckets.entries()];
    }, [matches]);

    const isCustomCity = trimmedQuery.length > 1 && !matches.some((city) => city.toLowerCase() === trimmedQuery.toLowerCase());

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Select city"
                        initial={{ y: '6%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '6%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        onClick={(event) => event.stopPropagation()}
                        className="flex h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b0d] sm:h-[70vh] sm:rounded-3xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                            <h2 className="text-base font-black uppercase tracking-[-0.02em] text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                City
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
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
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search your city"
                                    className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/30"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-6">
                            {isCustomCity ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(trimmedQuery)}
                                    className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3.5 text-left"
                                >
                                    <span className="min-w-0">
                                        <span className="block text-[15px] font-bold text-white">Use “{trimmedQuery}”</span>
                                        <span className="mt-0.5 block text-[13px] text-white/50">Not in the list? We still deliver there.</span>
                                    </span>
                                </button>
                            ) : null}

                            {groups.length === 0 && !isCustomCity ? (
                                <p className="px-5 py-8 text-center text-sm text-white/45">No city matches “{trimmedQuery}”.</p>
                            ) : null}

                            {groups.map(([letter, cities]) => (
                                <div key={letter}>
                                    <p className="px-5 pb-1 pt-4 text-[12px] font-black uppercase tracking-[0.16em] text-white/30">{letter}</p>
                                    {cities.map((city) => {
                                        const isSelected = city.toLowerCase() === selectedCity.trim().toLowerCase();
                                        return (
                                            <button
                                                key={city}
                                                type="button"
                                                onClick={() => onSelect(city)}
                                                aria-current={isSelected ? 'true' : undefined}
                                                className={`flex w-full items-center justify-between border-b border-white/[0.05] px-5 py-4 text-left text-[16px] transition-colors ${
                                                    isSelected ? 'font-bold text-white' : 'text-white/75 hover:bg-white/[0.04] hover:text-white'
                                                }`}
                                            >
                                                {city}
                                                {isSelected ? <Check size={16} className="text-primary" /> : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
};

export default CitySelectModal;
