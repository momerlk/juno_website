import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Catalog } from '../../../api/api';
import type { GenderOverview, GenderBrand } from '../../../api/api.types';
import GenderHeader from './GenderHeader';
import ProductGrid from './ProductGrid';
import BrandList from './BrandList';

const GenderCatalogPage: React.FC = () => {
    const { genderOrId } = useParams<{ genderOrId: string }>();
    const [searchParams] = useSearchParams();
    const [overview, setOverview] = useState<GenderOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const validGender =
        genderOrId === 'men' || genderOrId === 'women' ? (genderOrId as 'men' | 'women') : null;

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
            setError(`Invalid gender category: ${genderOrId}. Must be 'men' or 'women'.`);
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
            <div className="min-h-screen bg-[#050505] px-4 pb-16 pt-28 text-white md:px-6">
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
        <div className="relative min-h-screen overflow-hidden bg-[#050505] pb-16 pt-24 text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12%] top-8 h-[30rem] w-[30rem] rounded-full bg-white/[0.035] blur-[170px]" />
                <div className="absolute bottom-[-10%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-white/[0.02] blur-[180px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 md:px-6">
                <GenderHeader gender={validGender} />

                {activeBrandName ? (
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.06 }}
                        className="mb-5 border border-white/10 bg-white/[0.03] px-4 py-3 md:px-5"
                    >
                        <p
                            className="text-lg uppercase text-white"
                            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, letterSpacing: '-0.03em' }}
                        >
                            {activeBrandName}
                        </p>
                    </motion.section>
                ) : null}

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
                    <div className="mb-5 lg:hidden">
                        <MobileBrandChips brands={overview.brands} gender={validGender} />
                    </div>
                ) : null}

                <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
                    <aside className="hidden w-72 shrink-0 lg:block">
                        {!isLoading && overview ? (
                            <BrandList brands={overview.brands} gender={validGender} />
                        ) : (
                            <div className="border border-white/10 bg-white/[0.04] p-5">
                                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/45">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    Loading labels
                                </div>
                            </div>
                        )}
                    </aside>

                    <main className="min-w-0 flex-1">
                        <ProductGrid products={filteredOverview?.products ?? []} isLoading={isLoading} />
                    </main>
                </div>
            </div>
        </div>
    );
};

const MobileBrandChips: React.FC<{ brands: GenderBrand[]; gender: 'men' | 'women' }> = ({
    brands,
    gender,
}) => {
    const [searchParams] = useSearchParams();
    const activeBrandId = searchParams.get('brand');

    return (
        <div className="overflow-hidden border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 inline-flex items-center gap-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                    Label filter
                </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
                <ChipLink href={`/catalog/${gender}`} active={!activeBrandId} text="All" />
                {brands.map((brand) => (
                    <ChipLink
                        key={brand.id}
                        href={`/catalog/${gender}?brand=${brand.id}`}
                        active={activeBrandId === brand.id}
                        text={brand.name}
                    />
                ))}
            </div>
        </div>
    );
};

const ChipLink: React.FC<{ href: string; active: boolean; text: string }> = ({
    href,
    active,
    text,
}) => (
    <Link
        to={href}
            className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-all ${
            active
                ? 'border-white/20 bg-white/[0.10] text-white'
                : 'border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:text-white'
        }`}
    >
        {text}
    </Link>
);

export default GenderCatalogPage;
