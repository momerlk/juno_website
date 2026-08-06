import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getResponsiveShopifyImageSet } from '../../utils/shopifyImage';

// The gallery owns its own slide state. Left on the product page, every swipe
// re-rendered the price, the option pickers, the spec table and the sticky bar
// with it — roughly 100ms of React work per slide on a mid-range phone.
const FALLBACK_IMAGE = '/images/misc/juno_app_icon.png';
const THUMBNAILS_LOADED_UPFRONT = 4;

// `hidden lg:block` still downloads and decodes everything inside it, so the
// phone was also paying for the desktop main image and its thumbnail rail.
// Render one gallery or the other, never both.
const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
    useEffect(() => {
        const query = window.matchMedia('(min-width: 1024px)');
        const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
        query.addEventListener('change', onChange);
        setIsDesktop(query.matches);
        return () => query.removeEventListener('change', onChange);
    }, []);
    return isDesktop;
};

type ProductGalleryProps = {
    images: string[];
    title: string;
    /** Fires when the visible image changes; the page keeps it in a ref so the
     *  cart payload knows the current image without re-rendering on every swipe. */
    onImageChange?: (url: string) => void;
};

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, title, onImageChange }) => {
    const isDesktop = useIsDesktop();
    const [selectedIdx, setSelectedIdx] = useState(0);
    // Furthest slide the customer has reached; nothing past it is requested.
    const [maxSlideLoaded, setMaxSlideLoaded] = useState(1);
    const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
    const [showLightbox, setShowLightbox] = useState(false);
    const scrollFrame = useRef(0);
    const touchStartXRef = useRef<number | null>(null);

    const currentImage = images[selectedIdx] || images[0] || FALLBACK_IMAGE;
    const currentAspectRatio = aspectRatios[currentImage];
    const useContainedImage = typeof currentAspectRatio === 'number' && currentAspectRatio > 0.95;
    const mainImage = getResponsiveShopifyImageSet(currentImage, [480, 720, 960, 1280, 1600]);

    useEffect(() => {
        setSelectedIdx(0);
        setMaxSlideLoaded(1);
    }, [images]);

    useEffect(() => { onImageChange?.(currentImage); }, [currentImage, onImageChange]);

    useEffect(() => () => {
        if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current);
    }, []);

    useEffect(() => {
        if (!showLightbox) return undefined;
        const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowLightbox(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showLightbox]);

    const cycleImage = useCallback((direction: 1 | -1) => {
        if (images.length < 2) return;
        setSelectedIdx((current) => {
            const next = (current + direction + images.length) % images.length;
            setMaxSlideLoaded((frontier) => Math.max(frontier, next + 1));
            return next;
        });
    }, [images.length]);

    const captureAspectRatio = useCallback((src: string, width: number, height: number) => {
        if (!src || width <= 0 || height <= 0) return;
        const ratio = width / height;
        setAspectRatios((prev) => (prev[src] === ratio ? prev : { ...prev, [src]: ratio }));
    }, []);

    return (
        <div className="min-w-0 space-y-3 xl:sticky xl:top-24">
            {/* Mobile: every image in one horizontal snap strip, no thumbnail row
                eating vertical space. Desktop keeps the main image + thumbnails. */}
            {!isDesktop ? (
                <div className="relative -mx-4">
                    <div
                        onScroll={(event) => {
                            // Scroll fires per frame on touch devices. Read geometry once,
                            // then coalesce to a single rAF so a flick cannot queue dozens
                            // of renders.
                            const { scrollLeft, scrollWidth } = event.currentTarget;
                            if (scrollFrame.current) return;
                            scrollFrame.current = window.requestAnimationFrame(() => {
                                scrollFrame.current = 0;
                                const raw = Math.round(scrollLeft / (scrollWidth / Math.max(images.length, 1)));
                                const index = Math.min(Math.max(raw, 0), Math.max(images.length - 1, 0));
                                setSelectedIdx(index);
                                setMaxSlideLoaded((current) => Math.max(current, index + 1));
                            });
                        }}
                        className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 scrollbar-none"
                        style={{ scrollPaddingLeft: '1rem' }}
                    >
                        {(images.length ? images : [currentImage]).map((image, index) => {
                            // Capped at 720: the slide is ~86vw, so a 3x phone would
                            // otherwise pull a 960w file for a 340px box. This is the
                            // LCP image, and the cheapest place to spend fewer bytes.
                            const slide = getResponsiveShopifyImageSet(image, [360, 480, 720]);
                            return (
                                <button
                                    key={`slide-${index}`}
                                    type="button"
                                    onClick={() => { setSelectedIdx(index); setShowLightbox(true); }}
                                    aria-label={`Zoom image ${index + 1}`}
                                    className="relative aspect-[4/5] w-[86%] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#0d0d0e]"
                                >
                                    {/* Slides past the scroll frontier stay unmounted, so an
                                        eight-image product costs two requests, not eight. */}
                                    {index <= maxSlideLoaded ? (
                                        <img
                                            src={slide.src}
                                            srcSet={slide.srcSet}
                                            sizes="86vw"
                                            alt={`${title} ${index + 1}`}
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                            fetchPriority={index === 0 ? 'high' : 'auto'}
                                            decoding="async"
                                            draggable={false}
                                            className="h-full w-full select-none object-cover"
                                        />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            {isDesktop ? (
                <>
                    <div className="group relative w-full overflow-hidden rounded-2xl bg-[#0d0d0e]">
                        {images.length > 1 ? (
                            <>
                                <button
                                    onClick={() => cycleImage(-1)}
                                    className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all hover:bg-white group-hover:opacity-100 md:flex"
                                    aria-label="Previous"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => cycleImage(1)}
                                    className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all hover:bg-white group-hover:opacity-100 md:flex"
                                    aria-label="Next"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </>
                        ) : null}

                        <div
                            onTouchStart={(event) => {
                                // Ignore multi-finger gestures (pinch-zoom) so they
                                // don't get misread as a horizontal swipe.
                                touchStartXRef.current = event.touches.length === 1 ? event.touches[0]?.clientX ?? null : null;
                            }}
                            onTouchEnd={(event) => {
                                const startX = touchStartXRef.current;
                                touchStartXRef.current = null;
                                if (startX === null || images.length < 2 || event.touches.length > 0) return;
                                const endX = event.changedTouches[0]?.clientX ?? startX;
                                const delta = endX - startX;
                                if (delta < -50) cycleImage(1);
                                else if (delta > 50) cycleImage(-1);
                            }}
                            style={{ touchAction: 'pan-y pinch-zoom' }}
                            className="relative aspect-[4/5] w-full sm:aspect-[3/4]"
                        >
                            <img
                                key={currentImage}
                                src={mainImage.src}
                                srcSet={mainImage.srcSet}
                                sizes="(max-width: 1279px) 100vw, 55vw"
                                alt={`${title} ${selectedIdx + 1}`}
                                loading={selectedIdx === 0 ? 'eager' : 'lazy'}
                                fetchPriority={selectedIdx === 0 ? 'high' : 'auto'}
                                decoding="async"
                                draggable={false}
                                onLoad={(event) => {
                                    const target = event.currentTarget;
                                    captureAspectRatio(currentImage, target.naturalWidth, target.naturalHeight);
                                }}
                                className={`block h-full w-full select-none ${useContainedImage ? 'object-contain bg-[#0a0a0b]' : 'object-cover'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowLightbox(true)}
                                className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                                aria-label="Zoom product image"
                            >
                                <ZoomIn size={18} />
                            </button>
                        </div>
                    </div>

                    {images.length > 1 ? (
                        <div
                            onScroll={(event) => {
                                // Same frontier idea as the mobile strip: a 20-image product
                                // must not fire 20 thumbnail requests on first paint.
                                const { scrollLeft, scrollWidth, clientWidth } = event.currentTarget;
                                if (scrollFrame.current) return;
                                scrollFrame.current = window.requestAnimationFrame(() => {
                                    scrollFrame.current = 0;
                                    const perItem = scrollWidth / Math.max(images.length, 1);
                                    const rightmost = Math.ceil((scrollLeft + clientWidth) / perItem);
                                    setMaxSlideLoaded((frontier) => Math.max(frontier, rightmost));
                                });
                            }}
                            className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 pt-1 scrollbar-none"
                        >
                            {images.map((image, index) => {
                                const active = selectedIdx === index;
                                const thumbnail = getResponsiveShopifyImageSet(image, [120, 180, 240, 320]);
                                const loadThumbnail = index <= Math.max(maxSlideLoaded, THUMBNAILS_LOADED_UPFRONT - 1) || active;
                                return (
                                    <button
                                        key={`thumb-${index}`}
                                        onClick={() => {
                                            setSelectedIdx(index);
                                            setMaxSlideLoaded((frontier) => Math.max(frontier, index + 1));
                                        }}
                                        aria-label={`Show image ${index + 1}`}
                                        aria-current={active ? 'true' : undefined}
                                        className={`relative w-[82px] shrink-0 overflow-hidden rounded-xl transition-all md:w-[96px] ${
                                            active ? 'ring-2 ring-inset ring-white' : 'opacity-55 hover:opacity-95'
                                        }`}
                                    >
                                        {loadThumbnail ? (
                                            <img
                                                src={thumbnail.src}
                                                srcSet={thumbnail.srcSet}
                                                sizes="(max-width: 768px) 82px, 96px"
                                                alt={`View ${index + 1}`}
                                                loading="lazy"
                                                decoding="async"
                                                className="aspect-[3/4] w-full object-cover"
                                            />
                                        ) : (
                                            <span className="block aspect-[3/4] w-full bg-white/[0.06]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </>
            ) : null}

            <AnimatePresence>
                {showLightbox ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Product image zoom"
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setShowLightbox(false)}
                    >
                        {/* Bounded width, not the raw original. Seller uploads run several
                            MB; decoding one full-size on a low-RAM Android kills the tab. */}
                        <img
                            src={getResponsiveShopifyImageSet(currentImage, [1080, 1440]).src}
                            alt={`${title} enlarged`}
                            decoding="async"
                            className="max-h-full max-w-full object-contain"
                            onClick={(event) => event.stopPropagation()}
                        />
                        <button
                            type="button"
                            className="absolute right-5 top-5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white"
                            onClick={() => setShowLightbox(false)}
                        >
                            Close
                        </button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(ProductGallery);
