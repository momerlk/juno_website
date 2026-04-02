import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, Package, MapPin, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import type { ParentOrder } from '../../api/api.types';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

interface LocationState {
    order?: ParentOrder;
}

const OrderConfirmationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState<ParentOrder | null>(null);
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        const state = location.state as LocationState;
        if (state?.order) {
            setOrder(state.order);
        } else {
            // Try to get from sessionStorage (fallback)
            const storedOrder = sessionStorage.getItem('juno_last_order');
            if (storedOrder) {
                setOrder(JSON.parse(storedOrder));
            }
        }
    }, [location.state]);

    useEffect(() => {
        // Store order in sessionStorage for refresh resilience
        if (order) {
            sessionStorage.setItem('juno_last_order', JSON.stringify(order));
        }

        // Hide confetti after 5 seconds
        const timeoutId = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timeoutId);
    }, [order]);

    if (!order) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-24 text-white">
                <div className="text-center">
                    <p className="text-xl font-black uppercase text-white/60">No order found</p>
                    <Link
                        to="/catalog"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white"
                    >
                        Continue Shopping
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 pt-24 text-white">
            {/* Confetti Animation */}
            {showConfetti && (
                <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{
                                y: -20,
                                x: Math.random() * window.innerWidth,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                y: window.innerHeight + 20,
                                rotate: Math.random() * 720 - 360,
                                opacity: 0,
                            }}
                            transition={{
                                duration: Math.random() * 2 + 2,
                                delay: Math.random() * 0.5,
                                ease: 'linear',
                            }}
                            className="absolute h-3 w-3 rounded-sm"
                            style={{
                                backgroundColor: ['#ef4444', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)],
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="container mx-auto max-w-3xl px-4">
                {/* Success Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 text-center"
                >
                    <div className="mb-6 flex justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary"
                        >
                            <CheckCircle size={48} className="text-white" />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
                        Order Confirmed!
                    </h1>
                    <p className="mt-3 text-lg text-white/70">
                        Thank you for shopping with Juno
                    </p>
                    <p className="mt-2 text-sm text-white/50">
                        Order ID: <span className="font-mono font-bold text-primary">{order.id}</span>
                    </p>
                </motion.div>

                {/* Order Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8"
                >
                    <div className="mb-6 flex items-center gap-3">
                        <Sparkles size={20} className="text-primary" />
                        <h2 className="text-lg font-black uppercase tracking-[-0.02em]">Order Details</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Order Status */}
                        <div className="rounded-[1.6rem] border border-green-500/30 bg-green-500/10 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                                    <Package size={20} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-400">Order Placed</p>
                                    <p className="text-xs text-green-300/70">
                                        {new Date(order.created_at).toLocaleDateString('en-PK', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <MapPin size={18} className="text-primary" />
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        Delivery Address
                                    </p>
                                </div>
                                <div className="text-sm text-white/80">
                                    <p className="font-bold text-white">{order.shipping_address.full_name}</p>
                                    <p className="mt-1">{order.shipping_address.address_line1}</p>
                                    {order.shipping_address.address_line2 && (
                                        <p>{order.shipping_address.address_line2}</p>
                                    )}
                                    <p>
                                        {order.shipping_address.city}
                                        {order.shipping_address.province && `, ${order.shipping_address.province}`}
                                        {order.shipping_address.postal_code && ` ${order.shipping_address.postal_code}`}
                                    </p>
                                    <p className="mt-1 text-white/60">{order.shipping_address.phone_number}</p>
                                </div>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-3 flex items-center gap-2">
                                <CreditCard size={18} className="text-primary" />
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                    Payment Method
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                                    <CreditCard size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Cash on Delivery</p>
                                    <p className="text-xs text-white/50">Pay when you receive your order</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <ShoppingBag size={18} className="text-primary" />
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                    Order Summary
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Subtotal</span>
                                    <span className="font-bold text-white">{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Shipping</span>
                                    <span className="font-bold text-white">{formatCurrency(order.shipping_fee)}</span>
                                </div>
                                <div className="border-t border-white/10 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">Total</span>
                                        <span className="text-xl font-black text-white">
                                            {formatCurrency(order.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                >
                    <Link
                        to="/track"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30"
                    >
                        Track Your Order
                        <ArrowRight size={16} />
                    </Link>

                    <Link
                        to="/catalog"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        Continue Shopping
                    </Link>
                </motion.div>

                {/* What's Next */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-center"
                >
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-white/70">What's Next?</h3>
                    <div className="space-y-3 text-sm text-white/60">
                        <p>
                            <span className="font-bold text-white">1.</span> We'll prepare your order for shipment
                        </p>
                        <p>
                            <span className="font-bold text-white">2.</span> You'll receive updates via phone/email
                        </p>
                        <p>
                            <span className="font-bold text-white">3.</span> Delivery within 3-7 business days
                        </p>
                        <p>
                            <span className="font-bold text-white">4.</span> Pay cash when you receive your order
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
