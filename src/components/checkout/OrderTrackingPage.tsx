import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Mail, Phone, ArrowLeft, Clock, CheckCircle, Truck, AlertCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Commerce, GuestCommerce } from '../../api/commerceApi';
import type { ParentOrder } from '../../api/api.types';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

const STORAGE_KEYS = {
    LAST_LOOKUP_PHONE: 'juno_last_lookup_phone',
    LAST_LOOKUP_EMAIL: 'juno_last_lookup_email',
};
const SUPPORT_CATEGORY = 'delivery';
const SUPPORT_WHATSAPP_NUMBER = '923158972405';

const extractSupportUrl = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') return null;
    if (!('support_url' in value)) return null;
    return typeof value.support_url === 'string' ? value.support_url : null;
};

const openExternalUrl = (url: string) => {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
};

const buildFallbackSupportUrl = (orderRef?: string) => {
    const baseText = orderRef
        ? `I need help with order ${orderRef}`
        : 'I need help with my order';
    return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(baseText)}`;
};

const formatStatusLabel = (status: string) => status.replace(/_/g, ' ');

const OrderTrackingPage: React.FC = () => {
    const [lookupBy, setLookupBy] = useState<'phone' | 'email'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [orders, setOrders] = useState<ParentOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [supportLoadingOrderId, setSupportLoadingOrderId] = useState<string | null>(null);

    // Load last used lookup credentials
    useEffect(() => {
        const lastPhone = localStorage.getItem(STORAGE_KEYS.LAST_LOOKUP_PHONE);
        const lastEmail = localStorage.getItem(STORAGE_KEYS.LAST_LOOKUP_EMAIL);
        if (lastPhone) setPhoneNumber(lastPhone);
        if (lastEmail) setEmail(lastEmail);
    }, []);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setOrders([]);

        const lookupValue = lookupBy === 'phone' ? phoneNumber.trim() : email.trim();

        if (!lookupValue) {
            setError(lookupBy === 'phone' ? 'Please enter your phone number' : 'Please enter your email');
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const payload = lookupBy === 'phone'
                ? { phone_number: lookupValue }
                : { email: lookupValue };

            const response = await GuestCommerce.lookupOrders(payload);

            if (!response.ok) {
                throw new Error('No orders found. Please check your details and try again.');
            }

            const foundOrders = response.body;

            if (foundOrders.length === 0) {
                throw new Error('No orders found with this ' + (lookupBy === 'phone' ? 'phone number' : 'email'));
            }

            setOrders(foundOrders);

            // Save for next time
            if (lookupBy === 'phone') {
                localStorage.setItem(STORAGE_KEYS.LAST_LOOKUP_PHONE, lookupValue);
            } else {
                localStorage.setItem(STORAGE_KEYS.LAST_LOOKUP_EMAIL, lookupValue);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to lookup orders';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
            case 'confirmed':
                return <Clock size={18} className="text-yellow-400" />;
            case 'packed':
                return <Package size={18} className="text-blue-400" />;
            case 'handed_to_rider':
            case 'at_warehouse':
            case 'out_for_delivery':
            case 'delivery_attempted':
                return <Truck size={18} className="text-primary" />;
            case 'delivered':
                return <CheckCircle size={18} className="text-green-400" />;
            case 'cancelled':
            case 'returned':
                return <AlertCircle size={18} className="text-red-400" />;
            default:
                return <Package size={18} className="text-white/60" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
            case 'confirmed':
                return 'text-yellow-400';
            case 'packed':
                return 'text-blue-400';
            case 'handed_to_rider':
            case 'at_warehouse':
            case 'out_for_delivery':
            case 'delivery_attempted':
                return 'text-primary';
            case 'delivered':
                return 'text-green-400';
            case 'cancelled':
            case 'returned':
                return 'text-red-400';
            default:
                return 'text-white/60';
        }
    };

    const buildTrackingUrl = (order: ParentOrder) => {
        const params = new URLSearchParams();
        if (lookupBy === 'phone' && phoneNumber.trim()) {
            params.set('phone_number', phoneNumber.trim());
        }
        if (lookupBy === 'email' && email.trim()) {
            params.set('email', email.trim());
        }
        const trackingOrderId = order.child_order_ids?.[0] || order.id;
        const query = params.toString();
        return query ? `/checkout/track/${trackingOrderId}?${query}` : `/checkout/track/${trackingOrderId}`;
    };

    const handleContactSupport = async (order: ParentOrder) => {
        if (supportLoadingOrderId) return;

        setSupportLoadingOrderId(order.id);
        try {
            const orderCandidates = Array.from(new Set([order.id, ...(order.child_order_ids || [])]));
            for (const candidateOrderId of orderCandidates) {
                const response = await Commerce.getOrderSupportLink(candidateOrderId, SUPPORT_CATEGORY);
                const supportUrl = response.ok ? extractSupportUrl(response.body) : null;
                if (supportUrl) {
                    openExternalUrl(supportUrl);
                    return;
                }
            }

            const response = await Commerce.getSupportLink(SUPPORT_CATEGORY);
            const fallbackUrl = response.ok ? extractSupportUrl(response.body) : null;

            if (fallbackUrl) {
                openExternalUrl(fallbackUrl);
                return;
            }

            openExternalUrl(buildFallbackSupportUrl(order.id));
        } catch {
            openExternalUrl(buildFallbackSupportUrl(order.id));
        } finally {
            setSupportLoadingOrderId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-24 text-white">
            <div className="container mx-auto max-w-3xl px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link
                        to="/"
                        className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
                        Track Your Order
                    </h1>
                    <p className="mt-2 text-sm text-white/60">
                        Enter your phone number or email to find your orders
                    </p>
                </motion.div>

                {/* Lookup Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8"
                >
                    {/* Toggle */}
                    <div className="mb-6 flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                        <button
                            onClick={() => setLookupBy('phone')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all ${
                                lookupBy === 'phone'
                                    ? 'bg-gradient-to-r from-primary to-secondary text-white'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Phone size={16} />
                            Phone Number
                        </button>
                        <button
                            onClick={() => setLookupBy('email')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all ${
                                lookupBy === 'email'
                                    ? 'bg-gradient-to-r from-primary to-secondary text-white'
                                    : 'text-white/60 hover:text-white'
                            }`}
                        >
                            <Mail size={16} />
                            Email
                        </button>
                    </div>

                    <form onSubmit={handleLookup}>
                        {lookupBy === 'phone' ? (
                            <div className="mb-6">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-primary"
                                        placeholder="0300 1234567"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-primary"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 rounded-[1.2rem] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search size={18} />
                                    Track Order
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Results */}
                {hasSearched && !isLoading && orders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-black uppercase tracking-[-0.02em]">
                                Found {orders.length} order{orders.length > 1 ? 's' : ''}
                            </h2>
                        </div>

                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
                            >
                                {/* Order Header */}
                                <div className="mb-4 flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                                            Order ID
                                        </p>
                                        <p className="mt-1 font-mono text-sm font-bold text-primary">{order.id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(order.status)}
                                        <span className={`text-sm font-bold uppercase tracking-[0.16em] ${getStatusColor(order.status)}`}>
                                            {formatStatusLabel(order.status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Info */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                                            Date
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-white">
                                            {new Date(order.created_at).toLocaleDateString('en-PK', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                                            Total
                                        </p>
                                        <p className="mt-1 text-sm font-black text-white">
                                            {formatCurrency(order.total_amount)}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                                            Items
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-white">
                                            {order.child_order_ids?.length || 1} package{order.child_order_ids?.length || 1 > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                {order.shipping_address && (
                                    <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                                            Delivery Address
                                        </p>
                                        <p className="text-sm text-white/80">
                                            {order.shipping_address.full_name}
                                        </p>
                                        <p className="text-sm text-white/60">
                                            {order.shipping_address.address_line1}
                                            {order.shipping_address.city && `, ${order.shipping_address.city}`}
                                        </p>
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div className="mt-4 flex items-center gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                                        <Package size={14} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                                            Payment
                                        </p>
                                        <p className="text-sm font-bold text-white">
                                            {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                                        </p>
                                    </div>
                                </div>

                                {/* Live Tracking CTA */}
                                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                                    <Link
                                        to={buildTrackingUrl(order)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-white hover:text-black"
                                    >
                                        <Truck size={14} />
                                        Watch Live Tracking
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleContactSupport(order)}
                                        disabled={supportLoadingOrderId === order.id}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-white hover:text-black disabled:opacity-60"
                                    >
                                        <MessageCircle size={14} />
                                        {supportLoadingOrderId === order.id ? 'Opening...' : 'Contact Support'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Empty State */}
                {hasSearched && !isLoading && orders.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center"
                    >
                        <Package size={48} className="mx-auto mb-4 text-white/20" />
                        <p className="text-lg font-bold text-white/60">No orders found</p>
                        <p className="mt-2 text-sm text-white/40">
                            Try a different phone number or email
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default OrderTrackingPage;
