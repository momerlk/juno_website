import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
        <div className="sticky top-28 overflow-hidden border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 p-5">
                <div className="inline-flex items-center gap-3">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                        Label Index
                    </p>
                </div>
                <p
                    className="mt-4 text-2xl uppercase text-white"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}
                >
                    Browse by brand
                </p>
                <p className="mt-2 text-sm leading-6 text-white/55" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Independent labels first. Product count stays secondary.
                </p>
            </div>

            <div className="p-3">
                <BrandLink
                    href={`/catalog/${gender}`}
                    name="All Brands"
                    active={!activeBrandId}
                    count={brands.length}
                    initials="∞"
                />

                <div className="mt-2 max-h-[28rem] space-y-1 overflow-y-auto pr-1">
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
        className={`group flex items-center gap-3 border px-3 py-3 transition-all duration-300 ${
            active
                ? 'border-primary/35 bg-[linear-gradient(90deg,rgba(255,24,24,0.18),rgba(255,69,133,0.12))]'
                : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]'
        }`}
    >
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border ${
                active ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-white/[0.04]'
            }`}
        >
            {logo ? (
                <img src={logo} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className={`text-[10px] font-black ${active ? 'text-primary' : 'text-white/60'}`}>
                    {initials}
                </span>
            )}
        </div>

        <div className="min-w-0 flex-1">
            <p
                className={`truncate text-sm uppercase tracking-[0.04em] ${
                    active ? 'text-white' : 'text-white/72'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: active ? 700 : 600 }}
            >
                {name}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.26em] text-white/28">
                Indie label
            </p>
        </div>

        <div className="flex items-center gap-2">
            {typeof count === 'number' && count > 0 ? (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold text-white/55">
                    {count}
                </span>
            ) : null}
            <ArrowRight
                size={14}
                className={`transition-transform duration-300 ${
                    active ? 'translate-x-1 text-white' : 'text-white/30 group-hover:translate-x-1 group-hover:text-white/65'
                }`}
            />
        </div>
    </Link>
);

export default BrandList;
