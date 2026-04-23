import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Truck, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';

const formatCurrency = (value?: number) => `Rs ${(value ?? 0).toLocaleString()}`;

const getAllowedTransitions = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return ['confirmed', 'cancelled'];
  if (normalized === 'confirmed') return ['packed', 'cancelled'];
  if (normalized === 'packed') return ['handed_to_rider', 'cancelled'];
  return [];
};

const getItemImage = (item: any) => item?.product_image || item?.image || item?.product?.image || 'https://via.placeholder.com/80x80?text=No+Image';
const getItemTitle = (item: any) => item?.product_name || item?.title || item?.product_title || item?.product_id || 'Product';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams();
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');

  const fetchOrder = async () => {
    if (!seller?.token || !orderId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.Seller.GetOrderByID(seller.token, orderId);
      if (!response.ok || !response.body) {
        throw new Error((response.body as any)?.message || 'Failed to fetch order details');
      }
      setOrder(response.body);
      const transitions = getAllowedTransitions(response.body.status);
      setSelectedStatus(transitions[0] || response.body.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller?.token, orderId]);

  const transitions = useMemo(() => getAllowedTransitions(order?.status), [order?.status]);

  const handleStatusUpdate = async () => {
    if (!seller?.token || !order?.id || transitions.length === 0) return;

    setIsUpdating(true);
    setError(null);
    try {
      const response = await api.Seller.UpdateOrderStatus(seller.token, order.id, {
        status: selectedStatus as 'confirmed' | 'packed' | 'handed_to_rider' | 'cancelled',
        note: note || undefined,
      });
      if (!response.ok) {
        throw new Error((response.body as any)?.message || 'Failed to update order status');
      }
      await fetchOrder();
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="glass-panel p-6 mt-6 text-white">Loading order details...</div>;
  }

  if (error) {
    return <div className="glass-panel p-6 mt-6 text-red-400">{error}</div>;
  }

  if (!order) {
    return <div className="glass-panel p-6 mt-6 text-white">Order not found.</div>;
  }

  const shipping = order.shipping_address as any;
  const financials = (order as any).financials || {};

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`${prefix}/dashboard/orders`)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Order</p>
          <p className="text-white font-mono text-sm mt-2">#{order.order_number || order.id}</p>
          <p className="text-xs text-white/55 mt-1">{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Customer</p>
          <p className="text-white text-sm mt-2">{shipping?.name || shipping?.full_name || 'Customer'}</p>
          <p className="text-xs text-white/55 mt-1">{shipping?.phone_number || 'No phone'}</p>
          <p className="text-xs text-white/55">{shipping?.city || 'N/A'}{shipping?.province ? `, ${shipping.province}` : ''}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Payout</p>
          <p className="text-white text-sm mt-2">Total: {formatCurrency(order.total)}</p>
          <p className="text-xs text-white/55 mt-1">Commission: {formatCurrency(financials.commission)}</p>
          <p className="text-xs text-white/55">Seller payout: {formatCurrency(financials.seller_payout)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
        <p className="text-xs uppercase tracking-widest text-primary font-black mb-3">Update Status</p>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            disabled={transitions.length === 0}
          >
            {transitions.length === 0 ? (
              <option value={order.status}>No transition available</option>
            ) : (
              transitions.map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
              ))
            )}
          </select>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Status note (optional)"
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
          />

          <button
            onClick={() => void handleStatusUpdate()}
            disabled={isUpdating || transitions.length === 0}
            className="rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 hover:bg-primary/90 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-bold text-white flex items-center gap-2 mb-3"><User size={14} className="text-primary" /> Customer Details</p>
          <p className="text-sm text-white">{shipping?.name || shipping?.full_name || 'Customer'}</p>
          <p className="text-xs text-white/60 mt-1">{shipping?.phone_number || 'No phone'}</p>
          <p className="text-xs text-white/60">{shipping?.email || 'No email'}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-bold text-white flex items-center gap-2 mb-3"><MapPin size={14} className="text-primary" /> Shipping Address</p>
          <p className="text-sm text-white">{shipping?.address_line1 || 'Address unavailable'}</p>
          {shipping?.address_line2 && <p className="text-xs text-white/60">{shipping.address_line2}</p>}
          <p className="text-xs text-white/60 mt-1">{shipping?.city || ''}{shipping?.province ? `, ${shipping.province}` : ''} {shipping?.postal_code || ''}</p>
          <p className="text-xs text-white/60">{shipping?.country || ''}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-xs font-bold text-white flex items-center gap-2 mb-3"><Package size={14} className="text-primary" /> Order Items ({order.order_items?.length || 0})</p>
        <div className="space-y-3">
          {(order.order_items || []).map((item: any, idx) => (
            <div key={`${order.id}-${item.product_id}-${item.variant_id}-${idx}`} className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex gap-3">
                <img src={getItemImage(item)} alt={getItemTitle(item)} className="h-16 w-16 rounded-md object-cover border border-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{getItemTitle(item)}</p>
                  <p className="text-xs text-primary mt-0.5">Variant: {item.variant_label || item.variant_id || 'N/A'}</p>
                  {item.variant_options && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(item.variant_options).map(([key, value]) => (
                        <span key={key} className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/80">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-white">Qty: {item.quantity || 0}</p>
                  <p className="text-[11px] text-neutral-400">{formatCurrency(item.line_total ?? item.total_price ?? 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-white/45 flex items-center gap-2">
        <Truck size={13} className="text-primary" />
        Seller order lifecycle: pending to confirmed to packed to handed_to_rider
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;
