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
        <div className="sticky top-28 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">
                    Brands
                </p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40">
                    {brands.length}
                </span>
            </div>

            {/* All link */}
            <Link
                to={`/catalog/${gender}`}
                className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                    !activeBrandId
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
            >
                <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        !activeBrandId ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
                    }`}
                >
                    ∞
                </span>
                <span>All Brands</span>
            </Link>

            {/* Brand list */}
            <ul className="space-y-0.5">
                {brands.map((brand) => {
                    const isActive = activeBrandId === brand.id;
                    const initials = brand.name
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase() ?? '')
                        .join('');

                    return (
                        <li key={brand.id}>
                            <Link
                                to={`/catalog/${gender}?brand=${brand.id}`}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-white font-bold border border-primary/30'
                                        : 'text-neutral-400 hover:bg-white/5 hover:text-white font-medium border border-transparent'
                                }`}
                            >
                                {/* Logo or initials avatar */}
                                <div
                                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border ${
                                        isActive
                                            ? 'border-primary/50 bg-primary/10'
                                            : 'border-white/10 bg-white/5'
                                    }`}
                                >
                                    {brand.logo ? (
                                        <img
                                            src={brand.logo}
                                            alt={brand.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span
                                            className={`text-[9px] font-black ${isActive ? 'text-primary' : 'text-white/40'}`}
                                        >
                                            {initials}
                                        </span>
                                    )}
                                </div>

                                {/* Name */}
                                <span className="min-w-0 flex-1 truncate">{brand.name}</span>

                                {/* Product count */}
                                {brand.product_count !== undefined && brand.product_count > 0 && (
                                    <span
                                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            isActive
                                                ? 'bg-white/15 text-white/80'
                                                : 'bg-white/5 text-white/30'
                                        }`}
                                    >
                                        {brand.product_count}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default BrandList;
