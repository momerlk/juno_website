import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, MapPin, User, Mail, Phone, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { useGuestCart } from '../../contexts/GuestCartContext';
import { GuestCommerce } from '../../api/commerceApi';
import type { GuestCheckoutDetails } from '../../api/api.types';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

const STORAGE_KEYS = {
    CHECKOUT_DRAFT: 'juno_checkout_draft',
    LAST_CHECKOUT_PHONE: 'juno_last_checkout_phone',
    LAST_CHECKOUT_EMAIL: 'juno_last_checkout_email',
};

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { optimisticCart, cartTotal, itemCount, clearCart, guestCartId } = useGuestCart();
    
    // Form state
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
    
    // Load saved draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(STORAGE_KEYS.CHECKOUT_DRAFT);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(parsed);
            } catch {
                // Ignore parse errors
            }
        }
        
        // Load last used phone/email
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
    
    // Save draft on change with debounce
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
        
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }
        
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(formData.phone_number)) {
            newErrors.phone_number = 'Please enter a valid phone number';
        }
        
        if (!formData.address_line1.trim()) {
            newErrors.address_line1 = 'Address is required';
        }
        
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (!guestCartId) {
            setErrors({ general: 'Cart not found. Please add items to your cart first.' });
            return;
        }
        
        setIsSubmitting(true);
        setErrors({});
        
        try {
            // First, save customer details to the cart
            const detailsResponse = await GuestCommerce.saveCustomerDetails(formData, guestCartId);
            
            if (!detailsResponse.ok) {
                throw new Error('Failed to save delivery details');
            }
            
            // Then, place the order (COD - Cash on Delivery)
            const checkoutResponse = await GuestCommerce.checkout(
                { payment_method: 'cod' },
                guestCartId
            );
            
            if (!checkoutResponse.ok) {
                throw new Error('Failed to place order');
            }
            
            const order = checkoutResponse.body;
            
            // Save phone/email for next time
            if (formData.phone_number) {
                localStorage.setItem(STORAGE_KEYS.LAST_CHECKOUT_PHONE, formData.phone_number);
            }
            if (formData.email) {
                localStorage.setItem(STORAGE_KEYS.LAST_CHECKOUT_EMAIL, formData.email);
            }
            
            // Clear checkout draft and cart
            localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DRAFT);
            clearCart();
            
            // Navigate to confirmation
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
    
    // Redirect if cart is empty
    useEffect(() => {
        if (optimisticCart.length === 0 && !isSubmitting) {
            // Allow page to load briefly before redirecting
            const timeoutId = setTimeout(() => {
                navigate('/catalog');
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [optimisticCart.length, navigate, isSubmitting]);
    
    const shippingFee = cartTotal >= 5000 ? 0 : 200;
    const orderTotal = cartTotal + shippingFee;
    
    if (optimisticCart.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-24 text-white">
                <div className="text-center">
                    <Loader2 size={40} className="mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Loading checkout...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-background pb-20 pt-24 text-white">
            <div className="container mx-auto max-w-6xl px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">Checkout</h1>
                    <p className="mt-2 text-sm text-white/60">Complete your order in minutes</p>
                </motion.div>
                
                <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
                    {/* Left Column - Forms */}
                    <div className="space-y-6">
                        {/* Section 1: Order Summary */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8"
                        >
                            <div className="mb-6 flex items-center gap-3">
                                <Package size={20} className="text-primary" />
                                <h2 className="text-lg font-black uppercase tracking-[-0.02em]">Order Summary</h2>
                            </div>
                            
                            <div className="space-y-4">
                                {optimisticCart.map((item, index) => (
                                    <motion.div
                                        key={`${item.product_id}-${item.variant_id}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + index * 0.05 }}
                                        className="flex gap-4"
                                    >
                                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/5">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_title || 'Product'}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-white/5">
                                                    <ShoppingBag size={20} className="text-white/20" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                                {item.seller_name || 'Juno Label'}
                                            </p>
                                            <h3 className="mt-1 line-clamp-1 text-sm font-black uppercase tracking-[-0.02em] text-white">
                                                {item.product_title || 'Product'}
                                            </h3>
                                            <p className="mt-1 text-xs text-white/50">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                        
                        {/* Section 2: Delivery Details */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8"
                        >
                            <div className="mb-6 flex items-center gap-3">
                                <MapPin size={20} className="text-primary" />
                                <h2 className="text-lg font-black uppercase tracking-[-0.02em]">Delivery Details</h2>
                                {saveStatus === 'saved' && (
                                    <span className="ml-auto flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-green-400">
                                        <CheckCircle size={12} />
                                        Saved
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        Full Name <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => updateField('full_name', e.target.value)}
                                            className={`w-full rounded-[1.2rem] border bg-black/30 py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 ${
                                                errors.full_name ? 'border-red-500/50' : 'border-white/10 focus:border-primary'
                                            }`}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>}
                                </div>
                                
                                {/* Phone Number */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        Phone Number <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="tel"
                                            value={formData.phone_number}
                                            onChange={(e) => updateField('phone_number', e.target.value)}
                                            className={`w-full rounded-[1.2rem] border bg-black/30 py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 ${
                                                errors.phone_number ? 'border-red-500/50' : 'border-white/10 focus:border-primary'
                                            }`}
                                            placeholder="0300 1234567"
                                        />
                                    </div>
                                    {errors.phone_number && <p className="mt-1 text-xs text-red-400">{errors.phone_number}</p>}
                                </div>
                                
                                {/* Email (Optional) */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        Email <span className="text-white/40">(for receipt)</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-primary"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                
                                {/* Address Line 1 */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        Address <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_line1}
                                        onChange={(e) => updateField('address_line1', e.target.value)}
                                        className={`w-full rounded-[1.2rem] border bg-black/30 py-3 px-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 ${
                                            errors.address_line1 ? 'border-red-500/50' : 'border-white/10 focus:border-primary'
                                        }`}
                                        placeholder="House no., street name, area"
                                    />
                                    {errors.address_line1 && <p className="mt-1 text-xs text-red-400">{errors.address_line1}</p>}
                                </div>
                                
                                {/* Address Line 2 (Optional) */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        Address Line 2 <span className="text-white/40">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address_line2 || ''}
                                        onChange={(e) => updateField('address_line2', e.target.value)}
                                        className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-3 px-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-primary"
                                        placeholder="Apartment, suite, etc."
                                    />
                                </div>
                                
                                {/* City */}
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                        City <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        className={`w-full rounded-[1.2rem] border bg-black/30 py-3 px-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 ${
                                            errors.city ? 'border-red-500/50' : 'border-white/10 focus:border-primary'
                                        }`}
                                        placeholder="e.g., Karachi, Lahore"
                                    />
                                    {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
                                </div>
                                
                                {/* Province & Postal Code */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                            Province <span className="text-white/40">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.province || ''}
                                            onChange={(e) => updateField('province', e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-3 px-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-primary"
                                            placeholder="e.g., Sindh"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                                            Postal Code <span className="text-white/40">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.postal_code || ''}
                                            onChange={(e) => updateField('postal_code', e.target.value)}
                                            className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-3 px-4 text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-primary"
                                            placeholder="e.g., 75500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                        
                        {/* Section 3: Payment & Place Order */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8"
                        >
                            <div className="mb-6 flex items-center gap-3">
                                <CreditCard size={20} className="text-primary" />
                                <h2 className="text-lg font-black uppercase tracking-[-0.02em]">Payment Method</h2>
                            </div>
                            
                            <div className="mb-6 rounded-[1.6rem] border border-primary/30 bg-primary/10 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                                        <CheckCircle size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Cash on Delivery</p>
                                        <p className="text-xs text-white/60">Pay when you receive your order</p>
                                    </div>
                                </div>
                            </div>
                            
                            {errors.general && (
                                <div className="mb-6 rounded-[1.2rem] border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
                                    {errors.general}
                                </div>
                            )}
                            
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Placing Order...
                                    </>
                                ) : (
                                    <>
                                        Place Order
                                        <span className="text-white/80">•</span>
                                        {formatCurrency(orderTotal)}
                                    </>
                                )}
                            </button>
                            
                            <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                                By placing this order, you agree to our Terms & Conditions
                            </p>
                        </motion.section>
                    </div>
                    
                    {/* Right Column - Order Summary Sticky */}
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="hidden lg:block"
                    >
                        <div className="sticky top-28 space-y-6">
                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-white/70">Order Total</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Subtotal ({itemCount} items)</span>
                                        <span className="font-bold text-white">{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/60">Shipping</span>
                                        <span className={`font-bold ${shippingFee === 0 ? 'text-green-400' : 'text-white'}`}>
                                            {shippingFee === 0 ? 'Free' : formatCurrency(shippingFee)}
                                        </span>
                                    </div>
                                    {cartTotal < 5000 && cartTotal > 0 && (
                                        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                                                Add {formatCurrency(5000 - cartTotal)} more for free shipping
                                            </p>
                                        </div>
                                    )}
                                    <div className="border-t border-white/10 pt-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">Total</span>
                                            <span className="text-2xl font-black text-white">{formatCurrency(orderTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Trust Badges */}
                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
                                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-white/70">Why shop with Juno</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-sm font-bold text-white">Authentic Indie Brands</p>
                                            <p className="text-xs text-white/50">Direct from Pakistan's best labels</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-sm font-bold text-white">Secure Checkout</p>
                                            <p className="text-xs text-white/50">Your data is protected</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-sm font-bold text-white">Easy Returns</p>
                                            <p className="text-xs text-white/50">Hassle-free return policy</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
