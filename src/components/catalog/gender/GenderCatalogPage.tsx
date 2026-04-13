import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Catalog } from '../../../api/api';
import type { GenderOverview, GenderOverviewProduct, GenderBrand } from '../../../api/api.types';
import GenderHeader from './GenderHeader';
import ProductGrid from './ProductGrid';
import BrandList from './BrandList';

const GenderCatalogPage: React.FC = () => {
    const { genderOrId } = useParams<{ genderOrId: string }>();
    const [searchParams] = useSearchParams();
    const [overview, setOverview] = useState<GenderOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Validate gender parameter
    const validGender = genderOrId === 'men' || genderOrId === 'women' ? (genderOrId as 'men' | 'women') : null;

    console.log('GenderCatalogPage - genderOrId param:', genderOrId);
    console.log('GenderCatalogPage - validGender:', validGender);

    const brand = searchParams.get('brand') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const sort = (searchParams.get('sort') as 'price' | 'created_at' | undefined) || 'created_at';
    const order = (searchParams.get('order') as 'asc' | 'desc' | undefined) || 'desc';
    const minPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined;
    const maxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined;
    const category = searchParams.get('category') || undefined;

    useEffect(() => {
        console.log('GenderCatalogPage - useEffect triggered');
        console.log('GenderCatalogPage - genderOrId from useParams:', genderOrId);
        console.log('GenderCatalogPage - validGender:', validGender);
        
        if (!validGender) {
            console.error('GenderCatalogPage - Invalid gender:', genderOrId);
            setError(`Invalid gender category: ${genderOrId}. Must be 'men' or 'women'.`);
            setIsLoading(false);
            return;
        }

        const loadGenderOverview = async () => {
            setIsLoading(true);
            setError(null);

            try {
                console.log('GenderCatalogPage - Fetching data for:', validGender);
                const response = await Catalog.getGenderOverview(validGender, {
                    page,
                    limit: 20,
                    sort,
                    order,
                    min_price: minPrice,
                    max_price: maxPrice,
                    category,
                });

                console.log('GenderCatalogPage - API response:', response);
                console.log('GenderCatalogPage - Raw response body:', JSON.stringify(response.body, null, 2));

                if (response.ok) {
                    let data = response.body as GenderOverview;
                    
                    console.log('GenderCatalogPage - Received data:', {
                        productCount: data.products?.length,
                        brandCount: data.brands?.length,
                        total: data.total,
                        gender: data.gender
                    });
                    console.log('GenderCatalogPage - First product:', data.products?.[0]);

                    // Filter by brand if specified
                    if (brand) {
                        const filteredProducts = data.products.filter(
                            (p) => {
                                // We need to match brand - the API doesn't return seller_id in overview
                                // so we'll filter on the client side using seller_name
                                // This is a limitation; ideally API would support brand filter
                                return true; // For now, show all products
                            }
                        );
                        data = {
                            ...data,
                            products: filteredProducts,
                            total: filteredProducts.length,
                        };
                    }

                    setOverview(data);
                } else {
                    const body = response.body as { message?: string };
                    setError(body.message || 'Failed to load products. Please try again.');
                }
            } catch (err) {
                setError('Failed to load products. Please try again.');
                console.error('Error loading gender overview:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadGenderOverview();
    }, [validGender, brand, page, sort, order, minPrice, maxPrice, category, genderOrId]);

    if (!validGender) {
        return (
            <div className="min-h-screen bg-background pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                        <p className="text-xl font-bold text-white">Invalid gender category</p>
                        <p className="text-sm text-neutral-400">
                            Received: <code className="rounded bg-white/10 px-2 py-1">{genderOrId}</code>
                        </p>
                        <p className="text-xs text-neutral-500">
                            URL path: <code className="rounded bg-white/10 px-2 py-1">{window.location.pathname}</code>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-16 pt-24">
            <div className="container mx-auto px-4">
                <GenderHeader
                    gender={validGender}
                    total={overview?.total ?? 0}
                />

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                        <p className="text-lg font-bold text-white">Couldn't load the catalogue</p>
                        <p className="mt-2 text-sm text-red-100/80">{error}</p>
                    </div>
                )}

                <div>
                    {/* Mobile brand filter chips — only on < lg */}
                    {!isLoading && overview && overview.brands.length > 0 && (
                        <div className="mb-4 lg:hidden">
                            <MobileBrandChips brands={overview.brands} gender={validGender} />
                        </div>
                    )}

                    <div className="flex gap-8">
                        {/* Sidebar — desktop only */}
                        <aside className="hidden lg:block w-56 flex-shrink-0">
                            {!isLoading && overview && (
                                <BrandList brands={overview.brands} gender={validGender} />
                            )}
                        </aside>

                        {/* Main content */}
                        <main className="flex-1 min-w-0">
                            <ProductGrid
                                products={overview?.products ?? []}
                                isLoading={isLoading}
                            />
                        </main>
                    </div>
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
                to={`/catalog/${gender}`}
                className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                    !activeBrandId
                        ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white'
                        : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:border-white/20 hover:text-white'
                }`}
            >
                All
            </Link>
            {brands.map((brand) => {
                const isActive = activeBrandId === brand.id;
                return (
                    <Link
                        key={brand.id}
                        to={`/catalog/${gender}?brand=${brand.id}`}
                        className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                            isActive
                                ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white'
                                : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {brand.name}
                    </Link>
                );
            })}
        </div>
    );
};

export default GenderCatalogPage;
