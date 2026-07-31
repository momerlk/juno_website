import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { ArrowLeft, Calendar, CreditCard, MapPin, Package, Truck, User } from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { uploadPrivateFile } from '../../api/shared';
import { Order } from '../../constants/orders';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  packed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  handed_to_rider: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  at_warehouse: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  out_for_delivery: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  delivery_attempted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  returned: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const formatCurrency = (value?: number) => `Rs ${(value ?? 0).toLocaleString()}`;

const getAllowedTransitions = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return ['confirmed', 'cancelled'];
  if (normalized === 'confirmed') return ['cancelled'];
  if (normalized === 'packed') return ['handed_to_rider', 'cancelled'];
  return [];
};

const getItemImage = (item: any) => item?.product_image || item?.image || item?.product?.image || 'https://via.placeholder.com/120x120?text=No+Image';
const getItemTitle = (item: any) => item?.product_name || item?.title || item?.product_title || item?.product_id || 'Product';
const safeTrackingLabel = (status?: string) => ['pending', 'confirmed', 'packed', 'handed_to_rider', 'at_warehouse', 'out_for_delivery', 'delivery_attempted', 'picked_up', 'travelling', 'attempted', 'delivered', 'returned'].includes(status || '') ? String(status).replace(/_/g, ' ') : 'Delivery update received';

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
  const [itemPhotos, setItemPhotos] = useState<Record<string, string>>({});
  const [parcelPhoto, setParcelPhoto] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!seller?.token || !orderId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.Seller.GetOrderByID(seller.token, orderId);
      if (!response.ok || !response.body) {
        throw new Error((response.body as any)?.message || 'Failed to fetch order details');
      }
      const fetched = response.body as Order;
      setOrder(fetched);
      setItemPhotos(Object.fromEntries((fetched.packing_evidence?.item_photos || []).map((photo) => [photo.order_item_id, photo.url])));
      setParcelPhoto(fetched.packing_evidence?.packed_parcel_photo_url || '');
      const transitions = getAllowedTransitions(fetched.status);
      setSelectedStatus(transitions[0] || fetched.status);
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
        status: selectedStatus as 'confirmed' | 'handed_to_rider' | 'cancelled',
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

  const uploadEvidence = async (file: File | undefined, key: string) => {
    if (!file || !seller?.token) return;
    setUploadingEvidence(key);
    setError(null);
    try {
      const objectName = await uploadPrivateFile(file, {
        folder: 'orders',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxBytes: 10 * 1024 * 1024,
      }, seller.token);
      if (key === 'parcel') setParcelPhoto(objectName);
      else setItemPhotos((current) => ({ ...current, [key]: objectName }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload packing photo');
    } finally {
      setUploadingEvidence(null);
    }
  };

  const markPacked = async () => {
    if (!seller?.token || !order?.id) return;
    const items = order.order_items || [];
    if (order.status !== 'confirmed' || !parcelPhoto || items.some((item) => !item.id || !itemPhotos[item.id])) return;
    setIsUpdating(true);
    setError(null);
    try {
      const response = await api.Seller.submitPackingEvidence(seller.token, order.id, {
        item_photos: items.map((item) => ({ order_item_id: item.id!, url: itemPhotos[item.id!] })),
        packed_parcel_photo_url: parcelPhoto,
      });
      if (!response.ok) throw new Error((response.body as any)?.message || 'Could not mark order packed');
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark order packed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Order not found</h2>
        <button onClick={() => navigate(`${prefix}/dashboard/orders`)} className="mt-4 text-primary font-bold">Go back to orders</button>
      </div>
    );
  }

  const shipping = order.shipping_address as any;
  const financials = (order as any).financials || {};
  const orderItems = order.order_items || [];
  const allPackingPhotosReady = orderItems.length > 0 && orderItems.every((item) => item.id && itemPhotos[item.id]) && Boolean(parcelPhoto);
  const booking = order.delivery_booking;
  const status = String(order.status || 'pending');
  const packingLocked = order.status !== 'confirmed' || Boolean(order.packing_evidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${prefix}/dashboard/orders`)}
            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-neutral-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">Order</h2>
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusColors[status] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'}`}>
                {status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-1">{order.order_number || order.id}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Created</p>
          <p className="text-sm font-bold text-white">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      {error && <Banner status="error" title={error} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding={4}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <User size={16} className="text-primary" /> Customer Details
              </h3>
              <div className="space-y-1 text-sm text-neutral-300">
                <p className="text-white font-bold">{shipping?.name || shipping?.full_name || 'Customer'}</p>
                <p>Phone: {shipping?.phone_number || 'N/A'}</p>
                <p>Email: {shipping?.email || 'N/A'}</p>
                <p className="pt-2 text-white/80 flex items-center gap-2"><MapPin size={14} className="text-primary" /> Shipping Address</p>
                <p>{shipping?.address_line1 || 'N/A'}</p>
                {shipping?.address_line2 ? <p>{shipping.address_line2}</p> : null}
                <p>{shipping?.city || 'N/A'}{shipping?.province ? `, ${shipping.province}` : ''}{shipping?.postal_code ? ` ${shipping.postal_code}` : ''}</p>
                <p>{shipping?.country || 'Pakistan'}</p>
              </div>
            </Card>

            <Card padding={4}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-primary" /> Order Metrics
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-neutral-300">Subtotal: <span className="text-white">{formatCurrency(financials.subtotal)}</span></p>
                <p className="text-neutral-300">Shipping: <span className="text-white">{formatCurrency(financials.shipping_fee)}</span></p>
                <p className="text-neutral-300">Total: <span className="text-white font-black">{formatCurrency(order.total)}</span></p>
                <p className="text-neutral-300">Commission: <span className="text-white">{formatCurrency(financials.commission)}</span></p>
                <p className="text-neutral-300">Seller payout: <span className="text-emerald-400">{formatCurrency(financials.seller_payout)}</span></p>
                <p className="text-neutral-300">Items: <span className="text-white">{orderItems.length}</span></p>
              </div>
            </Card>
          </div>

          <Card padding={4}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" /> Product + Variant + Packing Photos
            </h3>

            <div className="space-y-4">
              {orderItems.map((item: any, idx) => (
                <div key={`${order.id}-${item.product_id}-${item.variant_id}-${idx}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex gap-4">
                    <img
                      src={getItemImage(item)}
                      alt={getItemTitle(item)}
                      className="h-24 w-24 rounded-xl object-cover border border-white/10"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{getItemTitle(item)}</p>
                      <p className="text-xs text-neutral-400 mt-1 break-all">Product ID: {item.product_id}</p>
                      <p className="text-xs text-neutral-400 break-all">Variant ID: {item.variant_id}</p>
                      {item.variant_label && <p className="text-xs text-primary mt-1">Variant: {item.variant_label}</p>}

                      {item.variant_options && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(item.variant_options).map(([key, value]) => (
                            <span key={key} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/80">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{formatCurrency(item.unit_price)}</p>
                      <p className="text-xs text-neutral-400 mt-1">Ordered: {item.quantity || 0}</p>
                      <p className="text-xs text-neutral-400">Line total: {formatCurrency(item.line_total ?? item.total_price ?? 0)}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Packed Item Photo</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={packingLocked}
                      onChange={(event) => void uploadEvidence(event.target.files?.[0], item.id || '')}
                      className="block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black disabled:opacity-50"
                    />
                    <p className="mt-2 text-xs text-neutral-400">
                      {item.id && itemPhotos[item.id] ? 'Saved privately' : uploadingEvidence === item.id ? 'Uploading…' : item.id ? 'Photo required' : 'Order item ID is missing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {booking && (
            <Card padding={4}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <Truck size={16} className="text-primary" /> DEX Tracking
              </h3>
              <div className="space-y-1 text-xs text-neutral-400">
                <p>Status: <span className="text-white">{safeTrackingLabel(booking.status)}</span></p>
                <p>Tracking number: <span className="text-white">{booking.tracking_number || '-'}</span></p>
                {booking.last_checked_at && <p>Last checked: <span className="text-white">{new Date(booking.last_checked_at).toLocaleString()}</span></p>}
                {booking.tracking_url && <p>Tracking link: <a href={booking.tracking_url} target="_blank" rel="noreferrer" className="text-primary underline">Track parcel</a></p>}
                {booking.tracking_history?.length ? (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    <p className="font-semibold text-white">DEX updates</p>
                    {booking.tracking_history.map((event, index) => (
                      <p key={`${event.status}-${event.occurred_at || index}-${index}`}>
                        <span className="text-white">{safeTrackingLabel(event.status)}</span>
                        {event.location ? ` · ${event.location}` : ''}
                        {event.occurred_at ? ` · ${new Date(event.occurred_at).toLocaleString()}` : ''}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card padding={4}>
            <VStack gap={3}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Truck size={16} className="text-primary" /> Status Controls
              </h3>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={transitions.length === 0}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
              >
                {transitions.length === 0 ? (
                  <option value={order.status}>No transition available</option>
                ) : (
                  transitions.map((transition) => (
                    <option key={transition} value={transition}>{transition.replace(/_/g, ' ')}</option>
                  ))
                )}
              </select>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Status note (optional)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              />

              <Button
                label="Push status"
                variant="primary"
                onClick={() => void handleStatusUpdate()}
                isLoading={isUpdating}
                isDisabled={transitions.length === 0}
                width="100%"
              />

              <p className="text-xs text-neutral-500">
                Seller lifecycle: pending → confirmed → packed → handed to rider. Platform controls stay with Juno operations.
              </p>
            </VStack>
          </Card>

          <Card padding={4}>
            <VStack gap={3}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Package size={16} className="text-primary" /> Packing Evidence
              </h3>
              <p className="text-xs text-neutral-400">
                Upload one photo per item above, then one photo of the sealed parcel with its airway bill.
              </p>

              <label className="text-xs text-neutral-400">
                Packed parcel with airway bill
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={packingLocked}
                  onChange={(event) => void uploadEvidence(event.target.files?.[0], 'parcel')}
                  className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black disabled:opacity-50"
                />
              </label>
              <p className="text-xs text-neutral-500">
                {parcelPhoto ? 'Saved privately' : uploadingEvidence === 'parcel' ? 'Uploading…' : 'Parcel photo required'}
              </p>

              <Button
                label={order.packing_evidence ? 'Packing evidence saved' : 'Mark packed'}
                variant="primary"
                onClick={() => void markPacked()}
                isLoading={isUpdating}
                isDisabled={packingLocked || !allPackingPhotosReady}
                width="100%"
              />

              {order.packing_evidence?.submitted_at && (
                <p className="text-xs text-neutral-500">Submitted {new Date(order.packing_evidence.submitted_at).toLocaleString()}</p>
              )}
            </VStack>
          </Card>

          <Card padding={4}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Timeline Metadata
            </h3>
            <div className="space-y-1 text-xs text-neutral-400">
              <p>Created: <span className="text-white">{new Date(order.created_at).toLocaleString()}</span></p>
              <p>Order status: <span className="text-white">{status}</span></p>
              <p>DEX status: <span className="text-white">{booking?.status ? safeTrackingLabel(booking.status) : 'Not booked'}</span></p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;
