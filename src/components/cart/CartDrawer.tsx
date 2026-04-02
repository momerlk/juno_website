import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Catalog, type CatalogProduct } from '../../api/api';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

const CartDrawer: React.FC = () => {
    const navigate = useNavigate();
    const { isCartOpen, setCartOpen, optimisticCart, itemCount, cartTotal, removeItem, updateQuantity, syncState } = useGuestCart();
    const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);

    useEffect(() => {
        // Load related products based on first cart item
        const loadRelated = async () => {
            if (optimisticCart.length === 0) {
                setRelatedProducts([]);
                return;
            }

            const firstItem = optimisticCart[0];
            const response = await Catalog.getRelatedProducts(firstItem.product_id, 3);
            if (response.ok) {
                setRelatedProducts(response.body);
            }
        };

        if (isCartOpen) {
            loadRelated();
        }
    }, [optimisticCart, isCartOpen]);

    const handleCheckout = () => {
        setCartOpen(false);
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        setCartOpen(false);
        navigate('/catalog');
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 z-[61] h-full w-full max-w-md"
                    >
                        <div className="flex h-full flex-col bg-[#0A0A0A] text-white shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag size={20} className="text-primary" />
                                    <h2 className="text-lg font-black uppercase tracking-[-0.02em]">Your Bag</h2>
                                    {itemCount > 0 && (
                                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold">
                                            {itemCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setCartOpen(false)}
                                    className="rounded-full border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {optimisticCart.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <ShoppingBag size={64} className="mb-4 text-white/20" />
                                        <p className="text-xl font-black uppercase text-white/60">Your bag is empty</p>
                                        <p className="mt-2 text-sm text-white/40">Discover unique pieces from Pakistan's indie brands</p>
                                        <button
                                            onClick={handleContinueShopping}
                                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white"
                                        >
                                            Explore Catalog
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {optimisticCart.map((item, index) => (
                                            <motion.div
                                                key={`${item.product_id}-${item.variant_id}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4"
                                            >
                                                {/* Product Image */}
                                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/5">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.product_title || 'Product'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-white/5">
                                                            <ShoppingBag size={24} className="text-white/20" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex flex-1 flex-col">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                                            {item.seller_name || 'Juno Label'}
                                                        </p>
                                                        <h3 className="mt-1 line-clamp-2 text-sm font-black uppercase tracking-[-0.02em] text-white">
                                                            {item.product_title || 'Product'}
                                                        </h3>
                                                        {item.variant_title && (
                                                            <p className="mt-1 text-xs text-white/50">{item.variant_title}</p>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        {/* Quantity Stepper */}
                                                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">
                                                            <button
                                                                onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                                                                className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                                            >
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                                                                className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Price & Remove */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-black text-white">
                                                                {formatCurrency(item.price * item.quantity)}
                                                            </span>
                                                            <button
                                                                onClick={() => removeItem(item.product_id, item.variant_id)}
                                                                className="rounded-full border border-white/10 p-1.5 text-white/40 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {optimisticCart.length > 0 && (
                                <div className="border-t border-white/10 px-6 py-5">
                                    {/* Sync Indicator */}
                                    {syncState !== 'idle' && (
                                        <div className="mb-3 flex items-center justify-center gap-2">
                                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                {syncState === 'syncing' ? 'Syncing...' : syncState === 'error' ? 'Sync error' : 'Saving...'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Subtotal */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">Subtotal</span>
                                        <span className="text-2xl font-black text-white">{formatCurrency(cartTotal)}</span>
                                    </div>

                                    {/* Related Products Upsell */}
                                    {relatedProducts.length > 0 && (
                                        <div className="mb-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Sparkles size={16} className="text-primary" />
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                                    You May Also Like
                                                </p>
                                            </div>
                                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                                {relatedProducts.map((product) => (
                                                    <Link
                                                        key={product.id}
                                                        to={`/catalog/${product.id}`}
                                                        className="flex-shrink-0 w-32"
                                                    >
                                                        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                                            <img
                                                                src={product.images?.[0] || '/juno_app_icon.png'}
                                                                alt={product.title}
                                                                className="aspect-square w-full object-cover"
                                                            />
                                                        </div>
                                                        <p className="mt-2 line-clamp-1 text-xs font-bold text-white/80">
                                                            {product.title}
                                                        </p>
                                                        <p className="text-xs font-black text-primary">
                                                            {formatCurrency(product.pricing.discounted_price || product.pricing.price)}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Checkout Button */}
                                    <button
                                        onClick={handleCheckout}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30"
                                    >
                                        Checkout
                                        <ArrowRight size={16} />
                                    </button>

                                    {/* Continue Shopping */}
                                    <button
                                        onClick={handleContinueShopping}
                                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        Continue Shopping
                                    </button>

                                    {/* Free Shipping Progress */}
                                    {cartTotal < 5000 && cartTotal > 0 && (
                                        <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                                                Add {formatCurrency(5000 - cartTotal)} more for free shipping
                                            </p>
                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((cartTotal / 5000) * 100, 100)}%` }}
                                                    className="h-full bg-gradient-to-r from-primary to-secondary"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
