import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { GenderBrand } from '../../../api/api.types';

type Props = {
    brands: GenderBrand[];
    gender: 'men' | 'women';
};

const BrandList: React.FC<Props> = ({ brands, gender }) => {
    const [searchParams] = useSearchParams();
    const activeBrandId = searchParams.get('brand');

    if (brands.length === 0) return null;

    return (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 md:p-5">
            <div className="mb-3 inline-flex items-center gap-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                    Browse by brand
                </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                <BrandLink
                    href={`/catalog/${gender}`}
                    name="All Brands"
                    active={!activeBrandId}
                    initials="∞"
                />
                {brands.map((brand) => {
                    const isActive = activeBrandId === brand.id;
                    const initials = brand.name
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0]?.toUpperCase() ?? '')
                        .join('');

                    return (
                        <BrandLink
                            key={brand.id}
                            href={`/catalog/${gender}?brand=${brand.id}`}
                            name={brand.name}
                            active={isActive}
                            count={brand.product_count}
                            initials={initials}
                            logo={brand.logo}
                        />
                    );
                })}
            </div>
        </div>
    );
};

type BrandLinkProps = {
    href: string;
    name: string;
    active: boolean;
    count?: number;
    initials: string;
    logo?: string;
};

const BrandLink: React.FC<BrandLinkProps> = ({ href, name, active, count, initials, logo }) => (
    <Link
        to={href}
        className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 transition-all duration-300 ${
            active
                ? 'border-primary/35 bg-[linear-gradient(90deg,rgba(255,24,24,0.18),rgba(255,69,133,0.12))]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        }`}
    >
        <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
                active ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/[0.04]'
            }`}
        >
            {logo ? (
                <img src={logo} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className={`text-[9px] font-black ${active ? 'text-primary' : 'text-white/60'}`}>
                    {initials}
                </span>
            )}
        </div>

        <div className="min-w-0">
            <p
                className={`truncate text-[11px] uppercase tracking-[0.14em] ${
                    active ? 'text-white' : 'text-white/72'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: active ? 700 : 600 }}
            >
                {name}
            </p>
        </div>

        {typeof count === 'number' && count > 0 ? (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-white/50">
                {count}
            </span>
        ) : null}
    </Link>
);

export default BrandList;
