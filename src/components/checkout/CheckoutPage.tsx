import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, User, Mail, Phone, CheckCircle, Loader2, Zap, Truck } from 'lucide-react';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { GuestCommerce } from '../../api/commerceApi';
import type { GuestCheckoutDetails } from '../../api/api.types';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const fmtDay = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const STORAGE_KEYS = {
    CHECKOUT_DRAFT: 'juno_checkout_draft',
    LAST_CHECKOUT_PHONE: 'juno_last_checkout_phone',
    LAST_CHECKOUT_EMAIL: 'juno_last_checkout_email',
};

const FREE_SHIPPING_THRESHOLD = 5000;

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { optimisticCart, cartTotal, itemCount, clearCart, guestCartId, syncState } = useGuestCart();

    const [formData, setFormData] = useState<GuestCheckoutDetails>({
        full_name: '',
        phone_number: '',
        email: '',
        address_line1: '',
        address_line2: '',
        city: '',
        province: '',
        postal_code: '',
        country: 'Pakistan',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEYS.CHECKOUT_DRAFT);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(parsed);
            } catch {
                // ignore
            }
        }

        const lastPhone = localStorage.getItem(STORAGE_KEYS.LAST_CHECKOUT_PHONE);
        const lastEmail = localStorage.getItem(STORAGE_KEYS.LAST_CHECKOUT_EMAIL);
        if (lastPhone || lastEmail) {
            setFormData((prev) => ({
                ...prev,
                phone_number: lastPhone || prev.phone_number,
                email: lastEmail || prev.email,
            }));
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem(STORAGE_KEYS.CHECKOUT_DRAFT, JSON.stringify(formData));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [formData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(formData.phone_number)) {
            newErrors.phone_number = 'Please enter a valid phone number';
        }
        if (!formData.address_line1.trim()) newErrors.address_line1 = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        // If we are currently syncing or have unsynced changes, we should wait or show a message
        if (syncState === 'dirty' || syncState === 'syncing') {
            setErrors({ general: 'Updating your bag... Please try again in a second.' });
            return;
        }

        if (!guestCartId) {
            if (optimisticCart.length > 0) {
                setErrors({ general: 'Your bag is still being synchronized. Please wait a moment and try again.' });
            } else {
                setErrors({ general: 'Your bag is empty. Please add items to your cart first.' });
            }
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const detailsResponse = await GuestCommerce.saveCustomerDetails(formData, guestCartId);
            if (!detailsResponse.ok) throw new Error('Failed to save delivery details');

            const checkoutResponse = await GuestCommerce.checkout(
                { payment_method: 'cod' },
                guestCartId
            );
            if (!checkoutResponse.ok) throw new Error('Failed to place order');

            const order = checkoutResponse.body;

            if (formData.phone_number) {
                localStorage.setItem(STORAGE_KEYS.LAST_CHECKOUT_PHONE, formData.phone_number);
            }
            if (formData.email) {
                localStorage.setItem(STORAGE_KEYS.LAST_CHECKOUT_EMAIL, formData.email);
            }

            localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DRAFT);
            clearCart();

            navigate('/checkout/confirmation', { state: { order } });
        } catch (error: any) {
            setErrors({
                general: error.message || 'Failed to place order. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field: keyof GuestCheckoutDetails, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    useEffect(() => {
        if (optimisticCart.length === 0 && !isSubmitting) {
            const timeoutId = setTimeout(() => {
                navigate('/catalog');
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [optimisticCart.length, navigate, isSubmitting]);

    const shippingFee = cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 199;
    const orderTotal = cartTotal + shippingFee;
    const progressPct = Math.min(100, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100));
    const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);

    const today = new Date();
    const deliveryStart = addDays(today, 2);
    const deliveryEnd = addDays(today, 4);

    if (optimisticCart.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] pt-24 text-white">
                <div className="text-center">
                    <Loader2 size={32} className="mx-auto mb-4 animate-spin text-primary" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                        Loading checkout…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#050505] pt-24 text-white">
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>

            {/* Ambient atmosphere */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-[140px]" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[160px]" />
            </div>

            <div className="relative z-10 container mx-auto max-w-6xl px-4 md:px-6 pb-40 md:pb-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 md:mb-10"
                >
                    <div className="mb-2 flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                            Final step
                        </p>
                    </div>
                    <h1
                        className="text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                            lineHeight: 0.92,
                            letterSpacing: '-0.055em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Checkout
                    </h1>
                </motion.div>

                <div className="grid gap-6 md:gap-8 lg:grid-cols-[1fr_0.8fr]">
                    {/* Left — Forms */}
                    <div className="space-y-5 md:space-y-6">
                        {/* Delivery Promise */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 md:p-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10">
                                    <Truck size={18} className="text-white/80" />
                                </div>
                                <div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                                        Free delivery over {formatCurrency(FREE_SHIPPING_THRESHOLD)}
                                    </p>
                                    <p
                                        className="mt-0.5 text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        Order will arrive {fmtDay(deliveryStart)} — {fmtDay(deliveryEnd)}
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Order Summary */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 md:p-7"
                        >
                            <div className="mb-5 flex items-center gap-2.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">
                                    Your bag · {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
                                </p>
                            </div>

                            <div className="space-y-3.5">
                                {optimisticCart.map((item, index) => (
                                    <motion.div
                                        key={`${item.product_id}-${item.variant_id}`}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + index * 0.04 }}
                                        className="flex gap-4"
                                    >
                                        <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/5">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_title || 'Product'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <ShoppingBag size={18} className="text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                                                {item.seller_name || 'Juno Label'}
                                            </p>
                                            <h3
                                                className="mt-1 line-clamp-1 text-white uppercase"
                                                style={{
                                                    fontFamily: 'Montserrat, sans-serif',
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem',
                                                    letterSpacing: '-0.03em',
                                                }}
                                            >
                                                {item.product_title || 'Product'}
                                            </h3>
                                            <p className="mt-1 text-xs text-white/40">Qty · {item.quantity}</p>
                                        </div>
                                        <p
                                            className="text-white shrink-0"
                                            style={{
                                                fontFamily: 'Montserrat, sans-serif',
                                                fontWeight: 900,
                                                fontSize: '0.9rem',
                                                letterSpacing: '-0.03em',
                                            }}
                                        >
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Breakdown — visible on mobile too */}
                            <div className="mt-5 border-t border-white/[0.08] pt-4 space-y-2.5 lg:hidden">
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-white/55">Subtotal</span>
                                    <span className="font-semibold text-white">{formatCurrency(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-white/55">Shipping</span>
                                    {shippingFee === 0 ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                                Free
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-white">{formatCurrency(shippingFee)}</span>
                                    )}
                                </div>
                                {remainingForFreeShip > 0 && (
                                    <div className="pt-1">
                                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPct}%` }}
                                                transition={{ duration: 0.6 }}
                                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                            />
                                        </div>
                                        <p className="mt-1.5 text-[11px] text-white/45">
                                            {formatCurrency(remainingForFreeShip)} away from free delivery
                                        </p>
                                    </div>
                                )}
                                <div className="border-t border-white/[0.08] pt-3 flex items-end justify-between">
                                    <span className="text-[13px] font-semibold text-white/80">Total</span>
                                    <span
                                        className="text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 900,
                                            fontSize: '1.3rem',
                                            letterSpacing: '-0.04em',
                                        }}
                                    >
                                        {formatCurrency(orderTotal)}
                                    </span>
                                </div>
                            </div>
                        </motion.section>

                        {/* Delivery Details */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 md:p-7"
                        >
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <MapPin size={16} className="text-primary" />
                                    <h2
                                        className="text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            letterSpacing: '-0.02em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Where should we ship?
                                    </h2>
                                </div>
                                {saveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-[11px] text-white/50">
                                        <CheckCircle size={11} />
                                        Saved
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Field
                                    label="Full name"
                                    required
                                    error={errors.full_name}
                                    icon={<User size={16} className="text-white/40" />}
                                >
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => updateField('full_name', e.target.value)}
                                        className={inputClass(errors.full_name, true)}
                                        placeholder="Enter your full name"
                                        autoComplete="name"
                                    />
                                </Field>

                                <Field
                                    label="Phone number"
                                    required
                                    error={errors.phone_number}
                                    icon={<Phone size={16} className="text-white/40" />}
                                >
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => updateField('phone_number', e.target.value)}
                                        className={inputClass(errors.phone_number, true)}
                                        placeholder="0300 1234567"
                                        autoComplete="tel"
                                    />
                                </Field>

                                <Field
                                    label="Email"
                                    hint="for receipt"
                                    icon={<Mail size={16} className="text-white/40" />}
                                >
                                    <input
                                        type="email"
                                        inputMode="email"
                                        value={formData.email || ''}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className={inputClass(undefined, true)}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </Field>

                                <Field label="Delivery address" required error={errors.address_line1}>
                                    <input
                                        type="text"
                                        value={formData.address_line1}
                                        onChange={(e) => updateField('address_line1', e.target.value)}
                                        className={inputClass(errors.address_line1, false)}
                                        placeholder="House no., street, area, apartment"
                                        autoComplete="street-address"
                                    />
                                </Field>

                                <Field label="City" required error={errors.city}>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        className={inputClass(errors.city, false)}
                                        placeholder="e.g., Karachi, Lahore"
                                        autoComplete="address-level2"
                                    />
                                </Field>
                            </div>
                        </motion.section>

                        {/* Payment + Place Order (desktop inline CTA) */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 md:p-7"
                        >
                            <div className="mb-5 flex items-center gap-2.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">
                                    Payment
                                </p>
                            </div>

                            <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                                    <CheckCircle size={18} className="text-white" />
                                </div>
                                <div>
                                    <p
                                        className="text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        Cash on delivery
                                    </p>
                                    <p className="text-xs text-white/45">Pay when you receive your order</p>
                                </div>
                            </div>

                            {errors.general && (
                                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-300">
                                    {errors.general}
                                </div>
                            )}

                            {/* Desktop inline CTA */}
                            <motion.button
                                whileTap={{ scale: 0.985 }}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="relative hidden md:flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-5 text-white shadow-[0_10px_40px_-10px_rgba(220,10,40,0.45)] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="pointer-events-none absolute inset-0 overflow-hidden">
                                    <span
                                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                        style={{ animation: 'shimmer 2.6s linear infinite' }}
                                    />
                                </span>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span
                                            style={{
                                                fontFamily: 'Montserrat, sans-serif',
                                                fontWeight: 900,
                                                fontSize: '0.95rem',
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Placing order…
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} fill="currentColor" />
                                        <span
                                            style={{
                                                fontFamily: 'Montserrat, sans-serif',
                                                fontWeight: 900,
                                                fontSize: '0.95rem',
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Place order · {formatCurrency(orderTotal)}
                                        </span>
                                    </>
                                )}
                            </motion.button>

                            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                                By placing this order, you agree to our Terms & Conditions
                            </p>
                        </motion.section>
                    </div>

                    {/* Right — Sticky summary (desktop only) */}
                    <motion.aside
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="hidden lg:block"
                    >
                        <div className="sticky top-28 space-y-5">
                            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40 mb-4">
                                    Order total
                                </p>

                                <div className="space-y-3">
                                    <Row label={`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}>
                                        {formatCurrency(cartTotal)}
                                    </Row>
                                    <Row label="Shipping">
                                        <span className={shippingFee === 0 ? 'text-white' : 'text-white/80'}>
                                            {shippingFee === 0 ? 'Free' : formatCurrency(shippingFee)}
                                        </span>
                                    </Row>

                                    {remainingForFreeShip > 0 && (
                                        <div className="pt-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                                                    Free shipping
                                                </p>
                                                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                                                    {progressPct}%
                                                </p>
                                            </div>
                                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPct}%` }}
                                                    transition={{ duration: 0.6 }}
                                                    className="h-full bg-gradient-to-r from-primary to-secondary"
                                                />
                                            </div>
                                            <p className="mt-2 text-[11px] text-white/50">
                                                {formatCurrency(remainingForFreeShip)} away from free delivery
                                            </p>
                                        </div>
                                    )}

                                    <div className="border-t border-white/[0.08] pt-4 flex items-end justify-between">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50">
                                            Total
                                        </span>
                                        <span
                                            className="text-white"
                                            style={{
                                                fontFamily: 'Montserrat, sans-serif',
                                                fontWeight: 900,
                                                fontSize: '1.5rem',
                                                letterSpacing: '-0.04em',
                                            }}
                                        >
                                            {formatCurrency(orderTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40 mb-4">
                                    Why Juno
                                </p>
                                <div className="space-y-2.5">
                                    <TrustRow text="Direct from Pakistan's indie labels" />
                                    <TrustRow text="Easy 7-day returns" />
                                    <TrustRow text="Pay only on delivery" />
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </div>

            {/* Sticky mobile Place Order bar */}
            <div
                className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#050505]/95 backdrop-blur-xl md:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="px-4 py-3">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-white/40">
                            Total
                        </p>
                        <p
                            className="text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 900,
                                fontSize: '1.1rem',
                                letterSpacing: '-0.03em',
                            }}
                        >
                            {formatCurrency(orderTotal)}
                        </p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary py-4 text-white shadow-[0_10px_30px_-10px_rgba(220,10,40,0.5)] disabled:opacity-60"
                    >
                        <span className="pointer-events-none absolute inset-0 overflow-hidden">
                            <span
                                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                style={{ animation: 'shimmer 2.4s linear infinite' }}
                            />
                        </span>
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span
                                    style={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Placing…
                                </span>
                            </>
                        ) : (
                            <>
                                <Zap size={16} fill="currentColor" />
                                <span
                                    style={{
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontWeight: 900,
                                        fontSize: '0.85rem',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Place order
                                </span>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

const inputClass = (error: string | undefined, hasIcon: boolean) =>
    `w-full rounded-xl border bg-black/40 py-4 ${hasIcon ? 'pl-11 pr-4' : 'px-4'} text-[15px] text-white outline-none transition-colors placeholder:text-white/30 ${
        error ? 'border-red-500/50 focus:border-red-400' : 'border-white/[0.1] focus:border-white/40'
    }`;

const Field: React.FC<{
    label: string;
    hint?: string;
    required?: boolean;
    error?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}> = ({ label, hint, required, error, icon, children }) => (
    <div>
        <label className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-white/85">
            {label}
            {required && <span className="text-primary">*</span>}
            {hint && <span className="font-normal text-white/40">· {hint}</span>}
        </label>
        <div className="relative">
            {icon && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</span>
            )}
            {children}
        </div>
        {error && <p className="mt-1.5 text-[12px] text-red-400">{error}</p>}
    </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex justify-between text-sm">
        <span className="text-white/55">{label}</span>
        <span className="font-semibold text-white">{children}</span>
    </div>
);

const TrustRow: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center gap-2.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.05]">
            <CheckCircle size={11} className="text-white/70" />
        </span>
        <p className="text-[13px] text-white/70">{text}</p>
    </div>
);

export default CheckoutPage;
