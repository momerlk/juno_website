import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, LayoutGrid, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import CatalogNavbar from './CatalogNavbar';

// Used by: /catalog.
// Purpose: fork between the classic browse catalog and the swipe deck. Both
// panels preview their own interaction so the choice reads without copy.

const DECK = [
    { rotate: -9, x: -26, from: 'from-secondary/70', to: 'to-[#2a0d16]' },
    { rotate: 5, x: 18, from: 'from-primary/70', to: 'to-[#1f0a0d]' },
    { rotate: 0, x: 0, from: 'from-[#ff6a3d]/80', to: 'to-[#1a0b10]' },
];

const SwipePreview: React.FC = () => (
    <div className="relative mx-auto h-44 w-32 sm:h-56 sm:w-40">
        {DECK.map((card, index) => {
            const top = index === DECK.length - 1;
            return (
                <motion.div
                    key={index}
                    initial={{ rotate: card.rotate, x: card.x }}
                    animate={top ? { x: [0, 0, 70, 70, -70, -70, 0], rotate: [0, 0, 14, 14, -14, -14, 0], opacity: [1, 1, 0, 0, 0, 0, 1] } : { rotate: card.rotate, x: card.x, y: [0, -4, 0] }}
                    transition={top ? { duration: 5.2, times: [0, 0.25, 0.4, 0.5, 0.65, 0.75, 0.9], repeat: Infinity, ease: 'easeInOut' } : { duration: 3 + index, repeat: Infinity, ease: 'easeInOut' }}
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${card.from} ${card.to} ring-1 ring-white/15 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]`}
                >
                    <div className="absolute inset-x-3 bottom-3 space-y-1.5">
                        <span className="block h-1.5 w-8 rounded-full bg-white/40" />
                        <span className="block h-2.5 w-20 rounded-full bg-white/80" />
                        <span className="block h-1.5 w-12 rounded-full bg-white/50" />
                    </div>
                </motion.div>
            );
        })}
        <motion.span animate={{ opacity: [0, 0, 1, 1, 0, 0, 0, 0], scale: [0.6, 0.6, 1, 1, 0.6, 0.6, 0.6, 0.6] }} transition={{ duration: 5.2, times: [0, 0.25, 0.32, 0.45, 0.5, 0.6, 0.9, 1], repeat: Infinity }} className="absolute -right-6 top-8 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-[0_10px_30px_rgba(255,50,90,0.6)]"><Heart size={18} fill="currentColor" /></motion.span>
        <motion.span animate={{ opacity: [0, 0, 0, 0, 1, 1, 0, 0], scale: [0.6, 0.6, 0.6, 0.6, 1, 1, 0.6, 0.6] }} transition={{ duration: 5.2, times: [0, 0.25, 0.5, 0.58, 0.65, 0.78, 0.85, 1], repeat: Infinity }} className="absolute -left-6 top-8 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white backdrop-blur"><X size={18} strokeWidth={2.5} /></motion.span>
    </div>
);

const GridPreview: React.FC = () => (
    <div className="mx-auto w-44 sm:w-56">
        <div className="mb-2 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1.5 text-[9px] text-white/50"><Search size={10} /> <span className="h-1.5 w-16 rounded-full bg-white/25" /><SlidersHorizontal size={10} className="ml-auto" /></div>
        <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
                <motion.span key={index} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.4, delay: index * 0.25, repeat: Infinity, ease: 'easeInOut' }} className="aspect-[3/4] rounded-lg bg-gradient-to-b from-white/20 to-white/[0.04] ring-1 ring-white/10" />
            ))}
        </div>
    </div>
);

const CatalogChoicePage: React.FC = () => (
    <div className="min-h-dvh bg-[#070707] text-white">
        <CatalogNavbar homeHref="/" />
        <main className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-8 sm:px-6 md:pt-14">
            <div className="mb-6 text-center md:mb-10">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">Two ways to shop</p>
                <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">Pick your pace.</h1>
            </div>

            <div className="grid gap-4 md:min-h-[520px] md:grid-cols-2 md:gap-5">
                <Link to="/catalog/swipe" className="group relative flex min-h-[380px] flex-col overflow-hidden rounded-[2rem] border border-primary/30 bg-[#120a0d] p-6 transition duration-300 hover:border-primary/70 sm:p-8">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl transition duration-500 group-hover:bg-secondary/40" />
                    <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-primary/30 blur-3xl transition duration-500 group-hover:bg-primary/40" />
                    <div className="relative flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]"><Sparkles size={12} /> New · Juno AI</span>
                    </div>
                    <div className="relative flex flex-1 items-center justify-center py-8 transition duration-500 group-hover:scale-105"><SwipePreview /></div>
                    <div className="relative">
                        <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">Swipe to shop</h2>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">One piece at a time. Right to save, left to pass — the deck learns what you like.</p>
                        <span className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[11px] font-black uppercase tracking-[0.16em] text-black">Start swiping <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
                    </div>
                </Link>

                <Link to="/catalog/legacy" className="group relative flex min-h-[380px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111] p-6 transition duration-300 hover:border-white/30 sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.08),transparent_45%)]" />
                    <div className="relative flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/80"><LayoutGrid size={12} /> Classic</span>
                    </div>
                    <div className="relative flex flex-1 items-center justify-center py-8 transition duration-500 group-hover:scale-105"><GridPreview /></div>
                    <div className="relative">
                        <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">Browse catalog</h2>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">Search, filter and scan the whole collection at once.</p>
                        <span className="mt-5 inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-[11px] font-black uppercase tracking-[0.16em] transition group-hover:border-white/50">Open catalog <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
                    </div>
                </Link>
            </div>
        </main>
    </div>
);

export default CatalogChoicePage;
