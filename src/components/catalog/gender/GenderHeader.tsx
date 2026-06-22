import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EditorialShowcaseBanner from '../../shared/editorial/EditorialShowcaseBanner';

type Props = {
    gender: 'men' | 'women';
};

const CONFIG = {
    women: {
        headline: 'Women',
        subline: 'Wear what you mean',
        image: '/brand_banners/kara2.webp',
        eyebrow: 'Juno · Women',
    },
    men: {
        headline: 'Men',
        subline: 'Dressed with intent',
        image: '/brand_banners/Rakh.png',
        eyebrow: 'Juno · Men',
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
            <div className="-mx-4 md:-mx-6">
                <EditorialShowcaseBanner
                    imageUrl={config.image}
                    eyebrow={config.eyebrow}
                    badgeLabel="Curated now"
                    title={config.headline}
                    subtitle={config.subline}
                    className="pt-0"
                />
            </div>
        </div>
    );
};

export default GenderHeader;
