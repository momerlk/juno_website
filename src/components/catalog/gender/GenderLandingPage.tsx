import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GenderLandingPage: React.FC = () => {
    const [hoveredSide, setHoveredSide] = useState<'men' | 'women' | null>(null);

    return (
        <div className="relative flex min-h-screen w-full overflow-hidden bg-black">
            {/* ── WOMEN SIDE ─────────────────────────────────────── */}
            <motion.div
                className="relative flex-1 overflow-hidden cursor-pointer"
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

                    {/* Right edge fade to blend with men's side */}
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-black/60" />

                    {/* Top-left corner label */}
                    <div className="absolute left-8 top-8">
                        <p className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35">
                            Juno / Women
                        </p>
                    </div>

                    {/* Centre content */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end pb-16 pl-10">
                        {/* Eyebrow text */}
                        <motion.p
                            className="mb-3 text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                            animate={{ opacity: hoveredSide === 'women' ? 1 : 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            The Feminine Revolution
                        </motion.p>

                        {/* Main headline — split into two lines */}
                        <h2
                            className="leading-none text-white"
                            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(3.4rem, 6.5vw, 6.2rem)' }}
                        >
                            <span className="block">Women</span>
                        </h2>

                        {/* Italic serif sub-headline */}
                        <p
                            className="mt-3 text-lg italic text-white/70"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            Wear what you mean
                        </p>

                        {/* CTA pill — only fully visible on hover */}
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
                </Link>
            </motion.div>

            {/* ── DIVIDER LINE ───────────────────────────────────── */}
            <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white/20" />

            {/* ── MEN SIDE ───────────────────────────────────────── */}
            <motion.div
                className="relative flex-1 overflow-hidden cursor-pointer"
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

                    {/* Left edge fade */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-l from-transparent to-black/60" />

                    {/* Top-right corner label */}
                    <div className="absolute right-8 top-8">
                        <p className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35">
                            Juno / Men
                        </p>
                    </div>

                    {/* Centre content — right-aligned */}
                    <div className="absolute inset-0 flex flex-col items-end justify-end pb-16 pr-10">
                        {/* Eyebrow text */}
                        <motion.p
                            className="mb-3 text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                            animate={{ opacity: hoveredSide === 'men' ? 1 : 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            New Wave Menswear
                        </motion.p>

                        {/* Main headline */}
                        <h2
                            className="leading-none text-white text-right"
                            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(3.4rem, 6.5vw, 6.2rem)' }}
                        >
                            <span className="block">Men</span>
                        </h2>

                        {/* Italic serif sub-headline */}
                        <p
                            className="mt-3 text-lg italic text-white/70 text-right"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            Dressed with intent
                        </p>

                        {/* CTA pill */}
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
                </Link>
            </motion.div>

            {/* ── CENTRE BADGE (always visible) ───────────────────── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <img
                        src="/juno_logos/icon+text_white.png"
                        alt="Juno"
                        className="h-8 w-auto object-contain opacity-90"
                    />
                    <p className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35">
                        Select your world
                    </p>
                </motion.div>
            </div>

            {/* ── PAGE ENTER ANIMATION OVERLAY ────────────────────── */}
            <motion.div
                className="pointer-events-none absolute inset-0 bg-black z-30"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            />
        </div>
    );
};

export default GenderLandingPage;
