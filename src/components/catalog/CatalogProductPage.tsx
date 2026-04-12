import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Search, Store, ShoppingBag, Minus, Plus, Star, Users, Ruler } from 'lucide-react';
import { Catalog, type CatalogProduct, type ProductVariant } from '../../api/api';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { useTrackProductView } from '../../hooks/useProbe';
import SizeGuideModal from './SizeGuideModal';

const formatCurrency = (value?: number) =>
  `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const asArray = <T,>(value: T[] | null | undefined): T[] => (Array.isArray(value) ? value : []);
const getProductImage = (product: Partial<CatalogProduct>) => asArray(product.images)[0] || '/juno_app_icon.png';

const CatalogProductPage: React.FC = () => {
  const { productId, genderOrId } = useParams<{ productId?: string; genderOrId?: string }>();
  const actualProductId = productId || genderOrId || '';
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { addItem, setCartOpen } = useGuestCart();

  const mainCTARef = useRef<HTMLDivElement>(null);
  const [viewersCount] = useState(() => Math.floor(Math.random() * 15) + 3);

  useTrackProductView(actualProductId, product?.categories?.[0]?.id);

  useEffect(() => {
    const loadProduct = async () => {
      if (!actualProductId) {
        setError('Product not found.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log('[CatalogProductPage] Loading product:', actualProductId);

      const [productResponse, relatedResponse] = await Promise.all([
        Catalog.getProduct(actualProductId),
        Catalog.getRelatedProducts(actualProductId, 4),
      ]);

      console.log('[CatalogProductPage] Product API response:', {
        ok: productResponse.ok,
        status: productResponse.status,
        body: productResponse.body,
      });

      if (!productResponse.ok) {
        setError((productResponse.body as { message?: string }).message ?? 'Could not load this product.');
        setProduct(null);
        setRelated([]);
        setIsLoading(false);
        return;
      }

      const nextProduct = productResponse.body;
      setProduct(nextProduct);
      setSelectedImage(getProductImage(nextProduct));
      setSelectedOptions(
        Object.fromEntries(asArray(nextProduct.options).map((option) => [option.name, asArray(option.values)[0] ?? '']))
      );
      setRelated(relatedResponse.ok ? asArray(relatedResponse.body).filter((item) => item.id !== nextProduct.id) : []);
      setIsLoading(false);
    };

    loadProduct();
  }, [actualProductId]);

  const selectedVariant = useMemo<ProductVariant | undefined>(() => {
    if (!product) return undefined;
    return asArray(product.variants).find((variant) =>
      Object.entries(selectedOptions).every(([name, value]) => variant.options?.[name] === value)
    ) ?? asArray(product.variants)[0];
  }, [product, selectedOptions]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    setIsAdding(true);
    
    // Get the first image as the product image
    const imageUrl = getProductImage(product);
    
    // Add to cart with optimistic update
    addItem(
      product.id,
      selectedVariant.id,
      quantity,
      selectedVariant.price || product.pricing.discounted_price || product.pricing.price,
      {
        seller_name: product.seller_name,
        product_title: product.title,
        variant_title: selectedVariant.title,
        image_url: imageUrl,
      }
    );
    
    // Show success feedback
    setShowAddedFeedback(true);
    setIsAdding(false);
    
    // Open cart drawer after short delay
    setTimeout(() => {
      setCartOpen(true);
    }, 400);
  };

  // Sticky bar visibility observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (mainCTARef.current) {
      observer.observe(mainCTARef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-24 text-white">
        <div className="text-sm font-bold uppercase tracking-[0.22em] text-white/60">Loading product…</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-24 text-white">
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-10 text-center">
          <p className="text-2xl font-black uppercase text-white">Product unavailable</p>
          <p className="mt-3 text-sm text-red-100/80">{error ?? 'We couldn’t find this product.'}</p>
          <Link to="/catalog" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white">
            <ArrowLeft size={14} />
            Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-24 text-white">
      <div className="container mx-auto px-4">
        <Link to="/catalog" className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white">
          <ArrowLeft size={14} />
          Back to catalog
        </Link>

        <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.04]">
              <img src={selectedImage || getProductImage(product)} alt={product.title} className="aspect-[4/5] w-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {asArray(product.images).map((image) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-[1.2rem] border ${selectedImage === image ? 'border-primary' : 'border-white/10'} bg-white/[0.04]`}
                >
                  <img src={image} alt={product.title} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {product.product_type}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-300">
                  {product.seller_name}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white md:text-6xl">
                {product.title}
              </h1>

              <div className="mt-5 flex items-end gap-3">
                <p className="text-3xl font-black text-white">{formatCurrency(selectedVariant?.price ?? product.pricing.discounted_price ?? product.pricing.price)}</p>
                {product.pricing.compare_at_price ? (
                  <p className="text-lg text-neutral-500 line-through">{formatCurrency(product.pricing.compare_at_price)}</p>
                ) : null}
              </div>

              {/* Social Proof */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {product.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= Math.round(product.rating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-white/20'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-white/70">
                      {product.rating.toFixed(1)} ({product.review_count || 0} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Users size={16} />
                  <span className="font-bold">{viewersCount} people are viewing this</span>
                </div>
              </div>

              <p className="mt-6 text-base text-neutral-300">{product.short_description || product.description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {asArray(product.tags).slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {asArray(product.options).length > 0 && (
              <div className="rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Search size={16} className="text-primary" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">Product options</p>
                  </div>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:text-white"
                  >
                    <Ruler size={14} />
                    Size Guide
                  </button>
                </div>
                <div className="space-y-5">
                  {asArray(product.options).map((option) => (
                    <div key={option.name}>
                      <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white">{option.name}</p>
                      <div className="flex flex-wrap gap-3">
                        {asArray(option.values).map((value) => {
                          const isActive = selectedOptions[option.name] === value;
                          return (
                            <button
                              key={value}
                              onClick={() => setSelectedOptions((current) => ({ ...current, [option.name]: value }))}
                              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                                isActive ? 'border-primary bg-primary text-white' : 'border-white/10 bg-white/5 text-neutral-200'
                              }`}
                            >
                              {isActive ? <Check size={14} /> : null}
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">Availability</p>
                <p className="mt-3 text-lg font-black text-white">{product.inventory?.in_stock ? 'In stock' : 'Out of stock'}</p>
                <p className="mt-2 text-sm text-neutral-400">{product.inventory?.available_quantity ?? 0} units visible</p>
              </div>
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">Brand</p>
                <p className="mt-3 text-lg font-black text-white">{product.seller_name}</p>
                <p className="mt-2 text-sm text-neutral-400">Independent label on Juno</p>
              </div>
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">Shipping</p>
                <p className="mt-3 text-lg font-black text-white">
                  {product.shipping_details?.estimated_delivery_days
                    ? `${product.shipping_details.estimated_delivery_days} day delivery`
                    : 'Delivery info on request'}
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  {product.shipping_details?.free_shipping ? 'Free shipping eligible' : 'Standard shipping applies'}
                </p>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div ref={mainCTARef} className="rounded-[2.2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
              {/* Quantity Selector */}
              <div className="mb-5">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white/70">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center text-2xl font-black text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Add to Bag Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inventory?.in_stock || isAdding}
                className={`relative inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <AnimatePresence>
                  {showAddedFeedback ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={20} />
                      <span>Added to Bag</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="add"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag size={20} />
                      <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Success Feedback Reset */}
              {showAddedFeedback && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowAddedFeedback(false)}
                  className="mt-3 w-full rounded-full border border-white/10 bg-white/[0.04] py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Continue Shopping
                </motion.button>
              )}

              {!product.inventory?.in_stock && (
                <p className="mt-4 text-center text-sm font-bold uppercase tracking-[0.16em] text-red-400">
                  Currently out of stock
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <Store size={18} className="text-primary" />
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/55">Related products</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <Link key={item.id} to={`/catalog/${item.id}`} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-white/20">
                  <img src={getProductImage(item)} alt={item.title} className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{item.seller_name}</p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-black uppercase tracking-[-0.03em] text-white">{item.title}</h3>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{formatCurrency(item.pricing.discounted_price ?? item.pricing.price)}</span>
                      <ArrowRight size={15} className="text-white/65 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Add to Cart Bar (Mobile) */}
      <AnimatePresence>
        {showStickyBar && product?.inventory?.in_stock && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0A0A0A]/95 backdrop-blur-xl p-4 lg:hidden"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Total</p>
                <p className="text-lg font-black text-white">
                  {formatCurrency((selectedVariant?.price || product.pricing.discounted_price || product.pricing.price) * quantity)}
                </p>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20"
              >
                {isAdding ? 'Adding...' : 'Add to Bag'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
};

export default CatalogProductPage;
