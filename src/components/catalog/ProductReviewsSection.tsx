import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Star } from 'lucide-react';
import { Catalog, type ProductReview } from '../../api/api';
import { runWhenIdle } from '../../utils/runWhenIdle';

// Own component, not a branch of the product page: reviews arrive while the
// shopper is mid-scroll, and a state change here must not re-render the gallery,
// the price, the option pickers and the sticky bar with it.
const NEAR_VIEWPORT = { triggerOnce: true, rootMargin: '600px 0px' } as const;
const MODAL_PAGE_SIZE = 20;

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);

const ReviewCard: React.FC<{ review: ProductReview }> = ({ review }) => (
    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4">
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={13}
                    className={star <= Math.round(review.rating) ? 'fill-amber-300 text-amber-300' : 'text-white/15'}
                />
            ))}
        </div>
        <p className="mt-2 text-[12px] font-bold text-white">{review.reviewer_name || 'Anonymous'}</p>
        {review.comment ? <p className="mt-2 text-[14px] leading-6 text-white/70">{review.comment}</p> : null}
    </div>
);

type ProductReviewsSectionProps = {
    productId: string;
    rating?: number;
    reviewCount: number;
    ratingDistribution?: Record<string, number>;
};

const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
    productId, rating, reviewCount: productReviewCount, ratingDistribution,
}) => {
    const { ref: anchorRef, inView } = useInView(NEAR_VIEWPORT);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalReviews, setModalReviews] = useState<ProductReview[]>([]);
    const [modalPage, setModalPage] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const reviewCount = totalCount ?? productReviewCount;

    useEffect(() => {
        setReviews([]);
        setReviewsLoaded(false);
        setTotalCount(null);
        setShowModal(false);
        setModalReviews([]);
        setModalPage(0);
    }, [productId]);

    useEffect(() => {
        let cancelled = false;
        if (!productId || !inView) return undefined;
        void Catalog.getProductReviews(productId).then((response) => {
            if (cancelled) return;
            runWhenIdle(() => {
                if (cancelled) return;
                if (response.ok) {
                    setReviews(asArray(response.body.reviews));
                    setTotalCount(response.body.total_count);
                }
                setReviewsLoaded(true);
            });
        }).catch(() => {
            if (!cancelled) runWhenIdle(() => setReviewsLoaded(true));
        });
        return () => { cancelled = true; };
    }, [inView, productId]);

    const loadModalReviews = useCallback(async (page: number) => {
        if (!productId || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const response = await Catalog.getProductReviews(productId, { page, limit: MODAL_PAGE_SIZE });
            if (!response.ok) return;
            setModalReviews((current) => (page === 1 ? response.body.reviews : [...current, ...response.body.reviews]));
            setModalPage(page);
            setTotalCount(response.body.total_count);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, productId]);

    const openModal = useCallback(() => {
        setShowModal(true);
        void loadModalReviews(1);
    }, [loadModalReviews]);

    if (!rating && !reviewCount) return <div ref={anchorRef} />;

    return (
        <div ref={anchorRef} id="ratings" className="scroll-mt-24 border-t border-white/[0.08] pt-6">
            <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-white md:text-xl">Ratings and reviews</h2>
            <div className="mt-4 flex items-start gap-5">
                <div className="shrink-0 text-center">
                    <p className="flex items-baseline gap-1 text-4xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {(rating ?? 0).toFixed(1)}
                        <Star size={18} className="fill-amber-300 text-amber-300" />
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                        {new Intl.NumberFormat('en-PK').format(reviewCount)} ratings
                    </p>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingDistribution?.[String(star)] ?? 0;
                        const width = reviewCount ? (count / reviewCount) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2">
                                <span className="w-3 text-right text-[11px] font-semibold text-white/50">{star}</span>
                                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                                    <span className="block h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${width}%` }} />
                                </span>
                                <span className="w-6 text-[11px] text-white/35">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {!reviewsLoaded ? (
                <div className="mt-5 space-y-3" aria-label="Loading reviews">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/[0.05]" />
                    ))}
                </div>
            ) : reviews.length ? (
                <div className="mt-5 space-y-3">
                    {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                    {reviewCount > reviews.length ? (
                        <button
                            type="button"
                            onClick={openModal}
                            className="w-full rounded-2xl border border-white/15 bg-white/[0.03] py-3 text-[13px] font-bold text-white transition-colors hover:border-white/30 hover:bg-white/[0.06]"
                        >
                            Read all {new Intl.NumberFormat('en-PK').format(reviewCount)} reviews
                        </button>
                    ) : null}
                </div>
            ) : (
                <p className="mt-4 text-[13px] text-white/45">No written reviews for this piece yet.</p>
            )}

            <AnimatePresence>
                {showModal ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="All reviews"
                        className="fixed inset-0 z-[70] flex items-end bg-black/75 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ y: 24 }}
                            animate={{ y: 0 }}
                            exit={{ y: 24 }}
                            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0b] p-5 shadow-2xl"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <h2 className="text-lg font-black uppercase tracking-[-0.02em] text-white">All reviews</h2>
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/[0.06]">Close</button>
                            </div>
                            {isLoadingMore && modalReviews.length === 0 ? (
                                <p className="text-sm text-white/50">Loading reviews…</p>
                            ) : (
                                <div className="space-y-3">{modalReviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>
                            )}
                            {modalReviews.length < reviewCount ? (
                                <button
                                    type="button"
                                    onClick={() => void loadModalReviews(modalPage + 1)}
                                    disabled={isLoadingMore}
                                    className="mt-4 w-full rounded-2xl border border-white/15 bg-white/[0.03] py-3 text-[13px] font-bold text-white transition-colors hover:border-white/30 hover:bg-white/[0.06] disabled:opacity-50"
                                >
                                    {isLoadingMore ? 'Loading…' : 'Load more reviews'}
                                </button>
                            ) : null}
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default ProductReviewsSection;
