import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

type Props = {
    gender: 'men' | 'women';
};

const CONFIG = {
    women: {
        headline: 'Women',
        subline: 'Wear what you mean',
        image: '/brand_banners/kara2.webp',
        objectPosition: 'object-center',
    },
    men: {
        headline: 'Men',
        subline: 'Dressed with intent',
        image: '/brand_banners/Rakh.png',
        objectPosition: 'object-top',
    },
} as const;

const GenderHeader: React.FC<Props> = ({ gender }) => {
    const config = CONFIG[gender];

    return (
        <div className="mb-10 md:mb-12">
            <Link
                to="/catalog"
                className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-white"
            >
                <ArrowLeft size={14} />
                Back to catalog
            </Link>

            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="relative min-h-[320px] overflow-hidden border border-white/10 bg-white/[0.04] md:min-h-[400px] lg:min-h-[460px]"
            >
                <div className="pointer-events-none absolute inset-0">
                    <img
                        src={config.image}
                        alt={config.headline}
                        className={`absolute inset-0 h-full w-full object-cover ${config.objectPosition}`}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.48)_42%,rgba(0,0,0,0.16)_100%)]" />
                </div>

                <div className="relative flex min-h-[320px] items-end px-5 py-7 md:min-h-[400px] md:px-8 md:py-10 lg:min-h-[460px] lg:px-10 lg:py-12">
                    <div className="max-w-3xl">
                        <h1
                            className="uppercase leading-[0.86] text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: 'clamp(3rem,6vw,5.75rem)',
                                letterSpacing: '-0.05em',
                            }}
                        >
                            {config.headline}
                            <span
                                className="mt-2 block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                                style={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontStyle: 'italic',
                                    fontWeight: 400,
                                    textTransform: 'none',
                                    letterSpacing: '-0.03em',
                                }}
                            >
                                {config.subline}
                            </span>
                        </h1>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default GenderHeader;
