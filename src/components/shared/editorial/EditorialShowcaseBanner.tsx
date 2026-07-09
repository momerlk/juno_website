import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface EditorialShowcaseBannerProps {
    imageUrl: string;
    mobileImageUrl?: string;
    title: string;
    subtitle?: string;
    eyebrow: string;
    badgeLabel?: string;
    className?: string;
    to?: string;
}

const EditorialShowcaseBanner: React.FC<EditorialShowcaseBannerProps> = ({
    imageUrl,
    mobileImageUrl,
    title,
    subtitle,
    eyebrow,
    badgeLabel,
    className = '',
    to,
}) => {
    const content = (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] md:rounded-3xl"
        >
            <div className="relative min-h-[340px] w-full md:min-h-[480px]">
                <picture>
                    {mobileImageUrl ? <source media="(max-width: 767px)" srcSet={mobileImageUrl} /> : null}
                    <motion.img
                        src={imageUrl}
                        alt={title}
                        initial={{ scale: 1.08 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                </picture>

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.45)_75%,rgba(0,0,0,0.92)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(220,10,40,0.18),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,rgba(255,69,133,0.12),transparent_45%)]" />

                <div className="absolute left-5 top-5 z-10 flex items-center gap-2.5 md:left-10 md:top-8">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(220,10,40,0.9)] animate-pulse" />
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.36em] text-white/85 md:text-[11px]">
                        {eyebrow}
                    </p>
                </div>

                {badgeLabel ? (
                    <div className="absolute right-5 top-5 z-10 hidden sm:block md:right-10 md:top-8">
                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md">
                            <span className="h-1 w-1 rounded-full bg-emerald-400" />
                            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/70">
                                {badgeLabel}
                            </p>
                        </div>
                    </div>
                ) : null}

                <div className="relative flex min-h-[340px] items-end px-5 py-8 md:min-h-[480px] md:px-10 md:py-12">
                    <div className="max-w-3xl">
                        <div className="mb-4 h-[3px] w-12 rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_14px_rgba(220,10,40,0.6)] md:mb-5 md:w-16" />

                        <h1
                            className="uppercase leading-[0.82] text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: 'clamp(2.6rem, 5.5vw, 5.5rem)',
                                letterSpacing: '-0.055em',
                                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                            }}
                        >
                            {title}
                        </h1>

                        {subtitle ? (
                            <p
                                className="mt-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic md:mt-4"
                                style={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.1,
                                }}
                            >
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <section className={`container mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-8 ${className}`.trim()}>
            {to ? (
                <Link to={to} aria-label={title} className="block transition-transform duration-300 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]">
                    {content}
                </Link>
            ) : (
                content
            )}
        </section>
    );
};

export default EditorialShowcaseBanner;
