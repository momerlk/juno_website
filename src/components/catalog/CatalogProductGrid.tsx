import React from 'react';
import type { CatalogProduct, GenderOverviewProduct } from '../../api/api.types';
import EditorialProductCard from '../shared/editorial/EditorialProductCard';

type GridProduct = Pick<CatalogProduct, 'id' | 'title' | 'seller_name' | 'images' | 'pricing'> | GenderOverviewProduct;

type Props = {
    products: GridProduct[];
    isLoading?: boolean;
    basePath?: string;
};

// Used by: `CatalogGenderPage`
// Purpose: reusable product grid for the curated gender edits. The full browse
// page (`/catalog/all`) has its own heavier layout and does not use this grid.
const CatalogProductGrid: React.FC<Props> = ({ products, isLoading = false, basePath = 'catalog' }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] animate-pulse">
                        <div className="aspect-[4/5] w-full bg-white/10" />
                        <div className="space-y-3 p-4 md:p-5">
                            <div className="h-2.5 w-24 bg-white/10" />
                            <div className="h-5 w-4/5 bg-white/10" />
                            <div className="h-5 w-2/3 bg-white/10" />
                            <div className="h-4 w-28 bg-white/10" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] py-32 text-center">
                <p className="text-sm font-mono uppercase tracking-[0.3em] text-white/30">
                    No pieces in this edit yet.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {products.map((product, index) => (
                <EditorialProductCard
                    key={product.id}
                    title={product.title}
                    sellerName={product.seller_name}
                    images={product.images}
                    pricing={product.pricing}
                    to={`/${basePath}/${product.id}`}
                    index={index}
                />
            ))}
        </div>
    );
};

export default CatalogProductGrid;
