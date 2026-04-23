import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Check,
    CheckCircle,
    MapPin,
    MessageCircle,
    Package,
    Printer,
    ShoppingBag,
    Sparkles,
    Truck,
} from 'lucide-react';
import { Commerce } from '../../api/commerceApi';
import type { ParentOrder } from '../../api/api.types';

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

interface ReceiptItem {
    product_id: string;
    variant_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_title?: string;
    variant_title?: string;
    variant_options?: Record<string, string>;
    image_url?: string;
    seller_name?: string;
}

interface LocationState {
    order?: ParentOrder;
    receiptItems?: ReceiptItem[];
}

const buildGuestTrackingPath = (order: ParentOrder): string => {
    const params = new URLSearchParams();
    const phone = order.shipping_address?.phone_number?.trim() || order.customer_phone?.trim() || '';
    const email = order.shipping_address?.email?.trim() || order.customer_email?.trim() || '';
    const trackingOrderId = order.child_order_ids?.[0] || order.id;

    if (phone) params.set('phone_number', phone);
    else if (email) params.set('email', email);

    const query = params.toString();
    return query ? `/checkout/track/${trackingOrderId}?${query}` : `/checkout/track/${trackingOrderId}`;
};

const STORAGE_KEY = 'juno_last_order_payload';
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

const OrderConfirmationPage: React.FC = () => {
    const location = useLocation();
    const [order, setOrder] = useState<ParentOrder | null>(null);
    const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
    const [showParticles, setShowParticles] = useState(true);
    const [isOpeningSupport, setIsOpeningSupport] = useState(false);

    useEffect(() => {
        const state = location.state as LocationState;
        if (state?.order) {
            setOrder(state.order);
            setReceiptItems(Array.isArray(state.receiptItems) ? state.receiptItems : []);
            return;
        }

        const storedPayload = sessionStorage.getItem(STORAGE_KEY);
        if (storedPayload) {
            try {
                const parsed = JSON.parse(storedPayload) as { order?: ParentOrder; receiptItems?: ReceiptItem[] };
                if (parsed?.order) {
                    setOrder(parsed.order);
                    setReceiptItems(Array.isArray(parsed.receiptItems) ? parsed.receiptItems : []);
                    return;
                }
            } catch {
                // Ignore and fallback
            }
        }

        const legacyOrder = sessionStorage.getItem('juno_last_order');
        if (legacyOrder) {
            setOrder(JSON.parse(legacyOrder));
        }
    }, [location.state]);

    useEffect(() => {
        if (order) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ order, receiptItems }));
            sessionStorage.setItem('juno_last_order', JSON.stringify(order));
        }

        const timeoutId = window.setTimeout(() => setShowParticles(false), 4200);
        return () => window.clearTimeout(timeoutId);
    }, [order, receiptItems]);

    const orderTrackingPath = useMemo(() => {
        if (!order) return '/track';
        return order.customer_type === 'guest' ? buildGuestTrackingPath(order) : `/checkout/track/${order.id}`;
    }, [order]);

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleContactSupport = async () => {
        if (!order || isOpeningSupport) return;

        setIsOpeningSupport(true);
        try {
            if (order.customer_type !== 'guest') {
                const orderCandidates = Array.from(new Set([order.id, ...(order.child_order_ids || [])]));
                for (const candidateOrderId of orderCandidates) {
                    const candidateResp = await Commerce.getOrderSupportLink(candidateOrderId, SUPPORT_CATEGORY);
                    const candidateUrl = candidateResp.ok ? extractSupportUrl(candidateResp.body) : null;
                    if (candidateUrl) {
                        openExternalUrl(candidateUrl);
                        return;
                    }
                }
            }

            const genericResp = await Commerce.getSupportLink(SUPPORT_CATEGORY);
            const genericUrl = genericResp.ok ? extractSupportUrl(genericResp.body) : null;
            if (genericUrl) {
                openExternalUrl(genericUrl);
                return;
            }

            openExternalUrl(buildFallbackSupportUrl(order.id));
        } catch {
            openExternalUrl(buildFallbackSupportUrl(order.id));
        } finally {
            setIsOpeningSupport(false);
        }
    };

    if (!order) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 pt-24 text-white">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-[140px]" />
                    <div className="absolute -bottom-28 -right-24 h-[26rem] w-[26rem] rounded-full bg-secondary/10 blur-[140px]" />
                </div>

                <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/35">Order Session</p>
                    <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        No Order Found
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
                        We could not locate an order in this session. You can continue shopping and place a new order.
                    </p>
                    <Link
                        to="/catalog"
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.03] hover:bg-neutral-200"
                    >
                        Continue Shopping
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    const orderPlacedAt = new Date(order.created_at);

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] pb-20 pt-24 text-white">
            <style>{`
                @media print {
                    body { background: #fff !important; color: #000 !important; }
                    .no-print { display: none !important; }
                    .print-wrap { max-width: none !important; padding: 0 !important; }
                    .print-card { border: 1px solid #d4d4d4 !important; background: #fff !important; box-shadow: none !important; }
                    .print-text { color: #000 !important; }
                    .print-muted { color: #525252 !important; }
                    .print-only { display: block !important; }
                }
            `}</style>

            <div className="pointer-events-none fixed inset-0 no-print">
                <div className="absolute -top-28 -left-24 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-[150px]" />
                <div className="absolute -bottom-24 -right-20 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[150px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,24,24,0.06)_0%,transparent_34%),radial-gradient(circle_at_84%_84%,rgba(255,69,133,0.06)_0%,transparent_35%)]" />
            </div>

            <AnimatePresence>
                {showParticles && (
                    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden no-print">
                        {Array.from({ length: 26 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -24, x: Math.random() * window.innerWidth, scale: 0.8 }}
                                animate={{ opacity: [0, 1, 0], y: window.innerHeight + 20, scale: [0.8, 1, 0.8] }}
                                transition={{ duration: Math.random() * 1.2 + 2, delay: Math.random() * 0.5, ease: 'linear' }}
                                className="absolute h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: ['#FF1818', '#FF4585', '#FFB800'][Math.floor(Math.random() * 3)] }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 print-wrap">
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_35px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-8 print-card"
                >
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
                        <div>
                            <div className="mb-3 flex items-center gap-2.5 no-print">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40 print-muted">Checkout Complete</p>
                            </div>

                            <div className="mb-5 h-[3px] w-14 rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_16px_rgba(255,24,24,0.6)] no-print" />

                            <h1 className="uppercase leading-[0.85] text-white print-text" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(2.1rem,4.8vw,4.2rem)', letterSpacing: '-0.05em' }}>
                                Order Confirmed
                            </h1>

                            <p className="mt-4 text-white/75 print-muted" style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 'clamp(1.05rem,1.7vw,1.45rem)' }}>
                                Your indie picks are now in motion.
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/70 print-card print-muted">
                                    <CheckCircle size={14} className="text-green-400" /> Confirmed
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/70 print-card print-muted">
                                    ID {order.id}
                                </div>
                                <button
                                    onClick={handlePrintReceipt}
                                    className="no-print inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:bg-white/[0.07]"
                                >
                                    <Printer size={13} />
                                    Print Receipt
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[1.6rem] border border-white/10 bg-black/25 p-5 print-card">
                            <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/35 print-muted">Order Snapshot</p>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/55 print-muted">Order Date</span>
                                    <span className="font-bold text-white print-text">{orderPlacedAt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/55 print-muted">Child Orders</span>
                                    <span className="font-bold text-white print-text">{order.child_order_ids?.length || 1}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/55 print-muted">Payment</span>
                                    <span className="font-bold uppercase text-white print-text">{order.payment_method || 'COD'}</span>
                                </div>
                                <div className="border-t border-white/10 pt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60 print-muted">Total</span>
                                        <span className="text-2xl font-black text-white print-text" style={{ fontFamily: 'Montserrat, sans-serif' }}>{formatCurrency(order.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-white/10 pt-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <MapPin size={14} className="text-primary" />
                                    <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45 print-muted">Delivery Address</p>
                                </div>
                                <p className="text-sm font-semibold text-white print-text">{order.shipping_address?.full_name || order.customer_name || 'Customer'}</p>
                                <p className="mt-1 text-sm text-white/65 print-muted">{order.shipping_address?.address_line1 || 'Address unavailable'}</p>
                                {order.shipping_address?.address_line2 && <p className="text-sm text-white/65 print-muted">{order.shipping_address.address_line2}</p>}
                                <p className="text-sm text-white/65 print-muted">
                                    {order.shipping_address?.city || ''}
                                    {order.shipping_address?.province ? `, ${order.shipping_address.province}` : ''}
                                    {order.shipping_address?.postal_code ? ` ${order.shipping_address.postal_code}` : ''}
                                </p>
                                <p className="mt-2 text-sm text-white/55 print-muted">{order.shipping_address?.phone_number || order.customer_phone || 'No phone'}</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {receiptItems.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.45 }}
                        className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 print-card"
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <ShoppingBag size={16} className="text-primary" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45 print-muted">Order Items</p>
                        </div>
                        <div className="space-y-3">
                            {receiptItems.map((item, idx) => (
                                <div key={`${item.product_id}-${item.variant_id}-${idx}`} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-3 print-card">
                                    <img
                                        src={item.image_url || '/juno_app_icon.png'}
                                        alt={item.product_title || item.product_id}
                                        className="h-16 w-14 rounded-md border border-white/10 object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-white print-text">{item.product_title || item.product_id}</p>
                                        <p className="text-xs text-white/60 print-muted">Variant: {item.variant_title || item.variant_id}</p>
                                        {item.variant_options && Object.keys(item.variant_options).length > 0 && (
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {Object.entries(item.variant_options).map(([key, value]) => (
                                                    <span key={key} className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/75 print-muted">
                                                        {key}: {String(value)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white/60 print-muted">Qty {item.quantity}</p>
                                        <p className="text-sm font-bold text-white print-text">{formatCurrency(item.line_total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.45 }}
                    className="mt-5 grid gap-4 lg:grid-cols-1"
                >
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 print-card">
                        <div className="mb-3 flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45 print-muted">What Happens Next</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                { icon: Check, label: 'Order placed', tone: 'text-green-400' },
                                { icon: ShoppingBag, label: 'Seller preparing parcel', tone: 'text-white/80' },
                                { icon: Truck, label: 'Delivery updates live', tone: 'text-white/80' },
                            ].map((step, idx) => (
                                <div key={step.label} className="flex items-center gap-2.5">
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/30 ${idx === 0 ? 'text-green-400' : 'text-white/70'} print-card`}>
                                        <step.icon size={13} className={step.tone} />
                                    </div>
                                    <p className="text-sm text-white/75 print-muted">{step.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14, duration: 0.45 }}
                    className="mt-6 grid gap-3 md:grid-cols-3 no-print"
                >
                    <Link
                        to={orderTrackingPath}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] hover:bg-neutral-200"
                    >
                        <Truck size={15} /> Track Order Live <ArrowRight size={14} />
                    </Link>

                    <button
                        type="button"
                        onClick={handleContactSupport}
                        disabled={isOpeningSupport}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:bg-white/[0.07] disabled:opacity-60"
                    >
                        <MessageCircle size={15} />
                        {isOpeningSupport ? 'Opening Support...' : 'Contact Support'}
                    </button>

                    <Link
                        to="/catalog"
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:bg-white/[0.07]"
                    >
                        <Sparkles size={15} /> Continue Shopping
                    </Link>
                </motion.section>

                <section className="print-only hidden mt-6 rounded-lg border border-neutral-300 bg-white p-4 text-xs text-black">
                    <h3 className="mb-3 text-sm font-bold">Full Order Data</h3>
                    <div className="space-y-1">
                        <p><strong>Order ID:</strong> {order.id}</p>
                        <p><strong>Customer Type:</strong> {order.customer_type}</p>
                        <p><strong>Customer Name:</strong> {order.customer_name || order.shipping_address?.full_name || '-'}</p>
                        <p><strong>Customer Phone:</strong> {order.customer_phone || order.shipping_address?.phone_number || '-'}</p>
                        <p><strong>Customer Email:</strong> {order.customer_email || order.shipping_address?.email || '-'}</p>
                        <p><strong>Payment Method:</strong> {order.payment_method}</p>
                        <p><strong>Status:</strong> {order.status}</p>
                        <p><strong>Rollup Status:</strong> {order.rollup_status || '-'}</p>
                        <p><strong>Subtotal:</strong> {order.subtotal}</p>
                        <p><strong>Shipping Fee:</strong> {order.shipping_fee}</p>
                        <p><strong>Total Amount:</strong> {order.total_amount}</p>
                        <p><strong>Address:</strong> {order.shipping_address?.address_line1 || '-'} {order.shipping_address?.address_line2 || ''}, {order.shipping_address?.city || '-'} {order.shipping_address?.province || ''} {order.shipping_address?.postal_code || ''}</p>
                        <p><strong>Child Order IDs:</strong> {(order.child_order_ids || []).join(', ') || '-'}</p>
                    </div>
                    {receiptItems.length > 0 && (
                        <div className="mt-4 border-t border-neutral-300 pt-3">
                            <p className="mb-2 font-bold">Receipt Items</p>
                            {receiptItems.map((item, idx) => (
                                <div key={`${item.product_id}-${item.variant_id}-${idx}`} className="mb-2 rounded border border-neutral-300 p-2">
                                    <p><strong>Product:</strong> {item.product_title || item.product_id}</p>
                                    <p><strong>Variant:</strong> {item.variant_title || item.variant_id}</p>
                                    <p><strong>Options:</strong> {item.variant_options ? Object.entries(item.variant_options).map(([k, v]) => `${k}:${String(v)}`).join(', ') : '-'}</p>
                                    <p><strong>Qty:</strong> {item.quantity} <strong>Unit Price:</strong> {item.unit_price} <strong>Line Total:</strong> {item.line_total}</p>
                                    <p><strong>Seller:</strong> {item.seller_name || '-'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
