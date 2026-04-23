import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { Catalog, type CatalogProduct } from '../../api/api';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const FREE_SHIPPING_THRESHOLD = 5900;

const CartDrawer: React.FC = () => {
    const navigate = useNavigate();
    const { isCartOpen, setCartOpen, optimisticCart, itemCount, cartTotal, removeItem, updateQuantity, isHydrated } = useGuestCart();
    const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);

    useEffect(() => {
        const loadRelated = async () => {
            if (optimisticCart.length === 0) {
                setRelatedProducts([]);
                return;
            }
            const firstItem = optimisticCart[0];
            const response = await Catalog.getRelatedProducts(firstItem.product_id, 3);
            if (response.ok) setRelatedProducts(response.body);
        };
        if (isCartOpen) loadRelated();
    }, [optimisticCart, isCartOpen]);

    const handleCheckout = () => {
        setCartOpen(false);
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        setCartOpen(false);
        navigate('/catalog');
    };

    const today = new Date();
    const deliveryStart = addDays(today, 2);
    const deliveryEnd = addDays(today, 4);
    const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
    const freeShipProgress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

    return (
        <AnimatePresence>
            {isCartOpen && (
                <React.Fragment key="cart-drawer-shell">
                    {/* Backdrop */}
                    <motion.div
                        key="cart-drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
                        onClick={() => setCartOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.div
                        key="cart-drawer-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="fixed right-0 top-0 z-[61] h-full w-full max-w-md"
                    >
                        <div className="relative flex h-full flex-col overflow-hidden bg-[#050505] text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]">

                            {/* Ambient */}
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute -top-20 -right-20 h-[20rem] w-[20rem] rounded-full bg-primary/10 blur-[120px]" />
                                <div className="absolute bottom-0 -left-20 h-[18rem] w-[18rem] rounded-full bg-secondary/08 blur-[140px]" />
                            </div>

                            {/* Header */}
                            <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                    <ShoppingBag size={18} className="text-white" />
                                    <h2 className="text-base font-black uppercase tracking-[-0.02em]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        Your Bag
                                    </h2>
                                    {itemCount > 0 && (
                                        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                                            {itemCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setCartOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition-all hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Scrollable body */}
                            <div className="relative z-10 flex-1 overflow-y-auto">
                                {!isHydrated ? (
                                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                                        <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-white/70">Loading your bag</p>
                                    </div>
                                ) : optimisticCart.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                                            <ShoppingBag size={32} className="text-white/30" />
                                        </div>
                                        <p className="mt-5 text-xl font-black uppercase tracking-[-0.02em] text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                            Your bag is empty
                                        </p>
                                        <p className="mt-2 max-w-[18rem] text-sm text-white/50" style={{ fontFamily: 'Instrument Serif, serif' }}>
                                            Discover pieces from Pakistan's indie labels.
                                        </p>
                                        <button
                                            onClick={handleContinueShopping}
                                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-neutral-200"
                                        >
                                            Explore catalog
                                            <ArrowRight size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-5 py-4">
                                        {/* Delivery promise */}
                                        <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5">
                                            <p className="text-[11px] text-white/70">
                                                Order will arrive on{' '}
                                                <span className="font-bold text-white">
                                                    {fmtDay(deliveryStart)} — {fmtDay(deliveryEnd)}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Items */}
                                        <div className="space-y-3">
                                            {optimisticCart.map((item, index) => (
                                                <motion.div
                                                    key={`${item.product_id || 'p'}-${item.variant_id || 'v'}-${index}`}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(index * 0.035, 0.18) }}
                                                    className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 transition-colors hover:border-white/15"
                                                >
                                                    {/* Image */}
                                                    <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#0d0d0e]">
                                                        {item.image_url ? (
                                                            <img
                                                                src={item.image_url}
                                                                alt={item.product_title || 'Product'}
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <ShoppingBag size={22} className="text-white/20" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex flex-1 flex-col">
                                                        <div className="flex-1">
                                                            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">
                                                                {item.seller_name || 'Juno Label'}
                                                            </p>
                                                            <h3 className="mt-1 line-clamp-2 text-[13px] font-black uppercase leading-tight tracking-[-0.02em] text-white"
                                                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                                                {item.product_title || 'Product'}
                                                            </h3>
                                                            {item.variant_title && (
                                                                <p className="mt-0.5 text-[11px] text-white/45">{item.variant_title}</p>
                                                            )}
                                                            {typeof item.max_quantity === 'number' ? (
                                                                <p className="mt-0.5 text-[10px] text-white/40">
                                                                    Max {item.max_quantity} in stock
                                                                </p>
                                                            ) : null}
                                                        </div>

                                                        <div className="mt-2.5 flex items-center justify-between">
                                                            {/* Stepper */}
                                                            <div className="inline-flex items-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                                                                <button
                                                                    onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                                                                    className="flex h-7 w-7 items-center justify-center text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="w-7 text-center text-xs font-black text-white">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                                                                    disabled={typeof item.max_quantity === 'number' && item.quantity >= item.max_quantity}
                                                                    className="flex h-7 w-7 items-center justify-center text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                                                    {formatCurrency(item.price * item.quantity)}
                                                                </span>
                                                                <button
                                                                    onClick={() => removeItem(item.product_id, item.variant_id)}
                                                                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition-all hover:bg-red-500/10 hover:text-red-400"
                                                                    aria-label="Remove"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Upsell */}
                                        {relatedProducts.length > 0 && (
                                            <div className="mt-5">
                                                <p className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                                                    Complete the look
                                                </p>
                                                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                                                    {relatedProducts.map((product, idx) => (
                                                        <Link
                                                            key={product.id || `related-${idx}`}
                                                            to={`/catalog/${product.id}`}
                                                            onClick={() => setCartOpen(false)}
                                                            className="group w-28 shrink-0"
                                                        >
                                                            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d0e] transition-all group-hover:border-white/20">
                                                                <img
                                                                    src={product.images?.[0] || '/juno_app_icon.png'}
                                                                    alt={product.title}
                                                                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                            <p className="mt-1.5 line-clamp-1 text-[11px] font-bold text-white/80">{product.title}</p>
                                                            <p className="text-[11px] font-black text-white">
                                                                {formatCurrency(product.pricing.discounted_price || product.pricing.price)}
                                                            </p>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {optimisticCart.length > 0 && (
                                <div className="relative z-10 border-t border-white/[0.08] bg-[#050505]/90 px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur-xl">

                                    {/* Free shipping progress */}
                                    {remainingForFreeShip > 0 ? (
                                        <div className="mb-4">
                                            <div className="mb-1.5 flex items-center justify-between text-[10px]">
                                                <span className="font-bold uppercase tracking-[0.18em] text-white/55">
                                                    Add {formatCurrency(remainingForFreeShip)} for free shipping
                                                </span>
                                                <span className="font-mono font-bold text-white/40">
                                                    {Math.round(freeShipProgress)}%
                                                </span>
                                            </div>
                                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${freeShipProgress}%` }}
                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            Free shipping unlocked
                                        </div>
                                    )}

                                    {/* Subtotal */}
                                    <div className="mb-3 flex items-baseline justify-between">
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                                            Subtotal
                                        </span>
                                        <span className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.04em' }}>
                                            {formatCurrency(cartTotal)}
                                        </span>
                                    </div>

                                    {/* Checkout CTA */}
                                    <motion.button
                                        whileTap={{ scale: 0.985 }}
                                        onClick={handleCheckout}
                                        className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-[0_14px_36px_rgba(220,10,40,0.36)] transition-all hover:shadow-[0_18px_44px_rgba(220,10,40,0.5)]"
                                    >
                                        <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                                            <Zap size={15} className="fill-white" />
                                            Checkout · {formatCurrency(cartTotal)}
                                        </span>
                                        <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[shimmer_2.8s_ease-in-out_infinite]" />
                                    </motion.button>

                                    <button
                                        onClick={handleContinueShopping}
                                        className="mt-2.5 w-full py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-white"
                                    >
                                        Continue shopping
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </React.Fragment>
            )}

            <style key="cart-drawer-style">{`
                @keyframes shimmer {
                    0% { transform: translateX(0%); }
                    60%, 100% { transform: translateX(400%); }
                }
            `}</style>
        </AnimatePresence>
    );
};

export default CartDrawer;
