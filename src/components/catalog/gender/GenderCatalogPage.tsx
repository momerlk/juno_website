import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { Catalog } from '../../../api/api';
import type { GenderOverview, GenderBrand } from '../../../api/api.types';
import CatalogNavbar from '../CatalogNavbar';
import GenderHeader from './GenderHeader';
import ProductGrid from './ProductGrid';
import BrandList from './BrandList';

const GenderCatalogPage: React.FC<{ gender?: 'men' | 'women' }> = ({ gender }) => {
    const { genderOrId } = useParams<{ genderOrId?: string }>();
    const [searchParams] = useSearchParams();
    const [overview, setOverview] = useState<GenderOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const routeGender =
        genderOrId === 'men' || genderOrId === 'women' ? (genderOrId as 'men' | 'women') : null;
    const validGender = gender ?? routeGender;

    const brand = searchParams.get('brand') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const sort = (searchParams.get('sort') as 'price' | 'created_at' | undefined) || 'created_at';
    const order = (searchParams.get('order') as 'asc' | 'desc' | undefined) || 'desc';
    const minPrice = searchParams.get('min_price')
        ? parseInt(searchParams.get('min_price') || '0', 10)
        : undefined;
    const maxPrice = searchParams.get('max_price')
        ? parseInt(searchParams.get('max_price') || '0', 10)
        : undefined;
    const category = searchParams.get('category') || undefined;

    useEffect(() => {
        if (!validGender) {
            setError(`Invalid gender category: ${genderOrId || 'unknown'}. Must be 'men' or 'women'.`);
            setIsLoading(false);
            return;
        }

        const loadGenderOverview = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await Catalog.getGenderOverview(validGender, {
                    page,
                    limit: 20,
                    sort,
                    order,
                    min_price: minPrice,
                    max_price: maxPrice,
                    category,
                });

                if (response.ok) {
                    setOverview(response.body as GenderOverview);
                } else {
                    const body = response.body as { message?: string };
                    setError(body.message || 'Failed to load products. Please try again.');
                }
            } catch {
                setError('Failed to load products. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadGenderOverview();
    }, [validGender, genderOrId, page, sort, order, minPrice, maxPrice, category]);

    const filteredOverview = useMemo(() => {
        if (!overview) return null;
        if (!brand) return overview;

        const activeBrand = overview.brands.find((item) => item.id === brand);
        const matchingProducts = overview.products.filter((product) => {
            const sellerName = product.seller_name?.trim().toLowerCase();
            const brandName = activeBrand?.name?.trim().toLowerCase();
            return sellerName && brandName ? sellerName === brandName : false;
        });

        return {
            ...overview,
            products: matchingProducts,
            total: matchingProducts.length,
        };
    }, [overview, brand]);

    if (!validGender) {
        return (
            <div className="min-h-screen bg-[#050505] px-4 pb-16 pt-8 text-white md:px-6">
                <div className="mx-auto max-w-7xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                    <p
                        className="text-3xl uppercase text-white"
                        style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}
                    >
                        Invalid gender category
                    </p>
                    <p className="mt-3 text-sm text-red-100/75">Received: {genderOrId}</p>
                </div>
            </div>
        );
    }

    const activeBrandName = filteredOverview?.brands.find((item) => item.id === brand)?.name;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] pb-16 text-white">
            <CatalogNavbar />
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12%] top-8 h-[30rem] w-[30rem] rounded-full bg-white/[0.035] blur-[170px]" />
                <div className="absolute bottom-[-10%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-white/[0.02] blur-[180px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pt-8 md:px-6">
                <GenderHeader gender={validGender} />

                <div className="mb-6 flex items-end justify-between gap-4 md:mb-10">
                    <div>
                        <div className="mb-2 flex items-center gap-2.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40 md:text-[10px]">
                                {activeBrandName || `${validGender} edit`}
                            </p>
                        </div>
                        <h2
                            className="text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                                lineHeight: 0.92,
                                letterSpacing: '-0.045em',
                                textTransform: 'uppercase',
                            }}
                        >
                            Featured pieces
                        </h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        {activeBrandName ? (
                            <Link
                                to={`/catalog/${validGender}`}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/20 hover:text-white"
                            >
                                <X size={12} />
                                Clear
                            </Link>
                        ) : null}
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                            {filteredOverview?.total ?? 0} {(filteredOverview?.total ?? 0) === 1 ? 'piece' : 'pieces'}
                        </p>
                    </div>
                </div>

                {error ? (
                    <div className="mb-6 border border-red-500/20 bg-red-500/5 p-6 text-center">
                        <p
                            className="text-2xl uppercase text-white"
                            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, letterSpacing: '-0.04em' }}
                        >
                            Couldn&apos;t load the catalogue
                        </p>
                        <p className="mt-2 text-sm text-red-100/80">{error}</p>
                    </div>
                ) : null}

                {!isLoading && overview && overview.brands.length > 0 ? (
                    <div className="mb-5">
                        <BrandList brands={overview.brands} gender={validGender} />
                    </div>
                ) : isLoading ? (
                    <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/45">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            Loading labels
                        </div>
                    </div>
                ) : null}

                <main className="min-w-0">
                    <ProductGrid products={filteredOverview?.products ?? []} isLoading={isLoading} />
                </main>
            </div>
        </div>
    );
};

export default GenderCatalogPage;
