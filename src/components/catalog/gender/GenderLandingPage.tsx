import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GenderLandingPage: React.FC = () => {
    const [hoveredSide, setHoveredSide] = useState<'men' | 'women' | null>(null);

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black md:flex-row">
            {/* ── WOMEN SIDE ─────────────────────────────────────── */}
            <motion.div
                className="relative flex-1 cursor-pointer overflow-hidden"
                animate={{
                    flex: hoveredSide === 'women' ? 1.35 : hoveredSide === 'men' ? 0.65 : 1,
                }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                onMouseEnter={() => setHoveredSide('women')}
                onMouseLeave={() => setHoveredSide(null)}
            >
                <Link to="/catalog/women" className="block h-full w-full">
                    {/* Background Image */}
                    <motion.img
                        src="/brand_banners/kara2.webp"
                        alt="Women's Collection"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        animate={{ scale: hoveredSide === 'women' ? 1.06 : 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />

                    {/* Dark gradient overlay — stronger at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                    {/* Right edge fade — desktop only (men's side is to the right) */}
                    <div className="absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-r from-transparent to-black/60 md:block" />

                    {/* Bottom edge fade — mobile only (men's side is below) */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-black/60 md:hidden" />

                    {/* Top-left corner label */}
                    <div className="absolute left-6 top-6 md:left-8 md:top-8">
                        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                            Juno / Women
                        </p>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end pb-10 pl-7 md:pb-16 md:pl-10">
                        {/* Eyebrow */}
                        <motion.p
                            className="mb-3 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35"
                            animate={{ opacity: hoveredSide === 'women' ? 1 : 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            The Feminine Revolution
                        </motion.p>

                        {/* Headline */}
                        <h2
                            className="leading-none text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: 'clamp(2.4rem, 6.5vw, 6.2rem)',
                            }}
                        >
                            <span className="block">Women</span>
                        </h2>

                        {/* Italic sub-headline */}
                        <p
                            className="mt-3 text-base italic text-white/70 md:text-lg"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            Wear what you mean
                        </p>

                        {/* CTA — always visible on mobile, hover-only on desktop */}
                        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/30 px-5 py-2.5 md:hidden">
                            <span className="text-sm font-bold uppercase tracking-[0.22em] text-white">
                                Shop Women
                            </span>
                            <span className="text-white/60">→</span>
                        </div>

                        <div className="hidden md:block">
                            <motion.div
                                className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3"
                                animate={{
                                    opacity: hoveredSide === 'women' ? 1 : 0,
                                    y: hoveredSide === 'women' ? 0 : 12,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="text-sm font-bold uppercase tracking-[0.22em] text-white">
                                    Shop Women
                                </span>
                                <span className="text-white/60">→</span>
                            </motion.div>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* ── DIVIDER — desktop only ──────────────────────────── */}
            <div className="absolute inset-y-0 left-1/2 z-10 hidden w-px -translate-x-1/2 bg-white/20 md:block" />

            {/* ── MEN SIDE ───────────────────────────────────────── */}
            <motion.div
                className="relative flex-1 cursor-pointer overflow-hidden"
                animate={{
                    flex: hoveredSide === 'men' ? 1.35 : hoveredSide === 'women' ? 0.65 : 1,
                }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                onMouseEnter={() => setHoveredSide('men')}
                onMouseLeave={() => setHoveredSide(null)}
            >
                <Link to="/catalog/men" className="block h-full w-full">
                    {/* Background Image */}
                    <motion.img
                        src="/brand_banners/Rakh.png"
                        alt="Men's Collection"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                        animate={{ scale: hoveredSide === 'men' ? 1.06 : 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                    {/* Left edge fade — desktop only (women's side is to the left) */}
                    <div className="absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-l from-transparent to-black/60 md:block" />

                    {/* Top edge fade — mobile only (women's side is above) */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-t from-transparent to-black/60 md:hidden" />

                    {/* Top-right corner label */}
                    <div className="absolute right-6 top-6 md:right-8 md:top-8">
                        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                            Juno / Men
                        </p>
                    </div>

                    {/* Content — right-aligned on desktop, left-aligned on mobile */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end pb-10 pl-7 md:items-end md:pb-16 md:pl-0 md:pr-10">
                        {/* Eyebrow */}
                        <motion.p
                            className="mb-3 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35 md:text-right"
                            animate={{ opacity: hoveredSide === 'men' ? 1 : 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            New Wave Menswear
                        </motion.p>

                        {/* Headline */}
                        <h2
                            className="leading-none text-white md:text-right"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: 'clamp(2.4rem, 6.5vw, 6.2rem)',
                            }}
                        >
                            <span className="block">Men</span>
                        </h2>

                        {/* Italic sub-headline */}
                        <p
                            className="mt-3 text-base italic text-white/70 md:text-right md:text-lg"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            Dressed with intent
                        </p>

                        {/* CTA — always visible on mobile, hover-only on desktop */}
                        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/30 px-5 py-2.5 md:hidden">
                            <span className="text-sm font-bold uppercase tracking-[0.22em] text-white">
                                Shop Men
                            </span>
                            <span className="text-white/60">→</span>
                        </div>

                        <div className="hidden md:block">
                            <motion.div
                                className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3"
                                animate={{
                                    opacity: hoveredSide === 'men' ? 1 : 0,
                                    y: hoveredSide === 'men' ? 0 : 12,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="text-white/60">←</span>
                                <span className="text-sm font-bold uppercase tracking-[0.22em] text-white">
                                    Shop Men
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* ── PAGE ENTER ANIMATION OVERLAY ────────────────────── */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-30 bg-black"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            />
        </div>
    );
};

export default GenderLandingPage;
