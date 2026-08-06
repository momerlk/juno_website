import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Catalog, type CatalogProduct } from '../../api/api';
import EditorialProductCard from '../shared/editorial/EditorialProductCard';
import { runWhenIdle } from '../../utils/runWhenIdle';

// Isolated for the same reason as the reviews: four cards arriving mid-scroll
// should cost four mounts, not a re-render of the whole product page.
const NEAR_VIEWPORT = { triggerOnce: true, rootMargin: '600px 0px' } as const;
const RELATED_LIMIT = 4;

const RelatedProductsSection: React.FC<{ productId: string }> = ({ productId }) => {
    const { ref: anchorRef, inView } = useInView(NEAR_VIEWPORT);
    const [products, setProducts] = useState<CatalogProduct[]>([]);

    useEffect(() => { setProducts([]); }, [productId]);

    useEffect(() => {
        let cancelled = false;
        if (!productId || !inView) return undefined;
        void Catalog.getRelatedProducts(productId, RELATED_LIMIT).then((response) => {
            if (cancelled || !response.ok) return;
            const next = (Array.isArray(response.body) ? response.body : []).slice(0, RELATED_LIMIT);
            runWhenIdle(() => { if (!cancelled) setProducts(next); });
        });
        return () => { cancelled = true; };
    }, [inView, productId]);

    return (
        <div ref={anchorRef}>
            {products.length > 0 ? (
                <section className="mt-16 border-t border-white/[0.08] pt-10 md:mt-24 md:pt-14">
                    <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/35">Keep exploring</p>
                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white md:text-3xl">Similar pieces</h2>
                    {/* Native offscreen skipping: the browser stops laying out and
                        painting this grid until it is close to the viewport. */}
                    <div
                        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}
                    >
                        {products.map((related) => (
                            <EditorialProductCard
                                key={related.id}
                                title={related.title}
                                sellerName={related.seller_name}
                                images={related.images}
                                badges={related.badges}
                                pricing={related.pricing}
                                inventory={related.inventory}
                                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 23vw"
                                // These mount while the shopper is scrolling past them; a staggered
                                // entrance here buys nothing and costs frames.
                                animateIn={false}
                                to={`/catalog/${related.id}`}
                            />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
};

export default RelatedProductsSection;
