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
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                Brands
            </h2>
            <ul className="space-y-1">
                {brands.map((brand) => {
                    const isActive = activeBrandId === brand.id;
                    return (
                        <li key={brand.id}>
                            <Link
                                to={`/catalog/${gender}?brand=${brand.id}`}
                                className={`block rounded-lg px-3 py-2 text-sm transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-primary to-secondary text-white font-semibold'
                                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                {brand.name}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default BrandList;
