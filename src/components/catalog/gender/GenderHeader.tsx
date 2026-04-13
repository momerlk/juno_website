import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

type Props = {
    gender: 'men' | 'women';
    total: number;
};

const WOMEN_CONFIG = {
    headline: 'Women',
    subline: 'Wear what you mean',
    image: '/brand_banners/kara2.webp',
    objectPosition: 'object-center',
    eyebrow: 'The Feminine Revolution',
};

const MEN_CONFIG = {
    headline: 'Men',
    subline: 'Dressed with intent',
    image: '/brand_banners/Rakh.png',
    objectPosition: 'object-top',
    eyebrow: 'New Wave Menswear',
};

const GenderHeader: React.FC<Props> = ({ gender, total }) => {
    const config = gender === 'women' ? WOMEN_CONFIG : MEN_CONFIG;

    return (
        <div className="mb-10">
            {/* Back link */}
            <Link
                to="/catalog"
                className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
            >
                <ArrowLeft size={14} />
                All Products
            </Link>

            {/* Editorial header banner */}
            <motion.div
                className="relative h-[260px] md:h-[340px] w-full overflow-hidden rounded-[2rem]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Background image */}
                <img
                    src={config.image}
                    alt={config.headline}
                    className={`absolute inset-0 h-full w-full object-cover ${config.objectPosition}`}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Text content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <p className="mb-2 text-[10px] font-mono tracking-[0.32em] uppercase text-white/35">
                        {config.eyebrow}
                    </p>

                    <h1
                        className="leading-none text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                        }}
                    >
                        {config.headline}
                    </h1>

                    <div className="mt-3 flex items-center gap-4">
                        <p
                            className="text-base italic text-white/60"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            {config.subline}
                        </p>
                        <span className="h-px flex-1 max-w-[80px] bg-white/20" />
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                            {total} pieces
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GenderHeader;
