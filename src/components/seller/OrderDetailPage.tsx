import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { ArrowLeft, Calendar, ExternalLink, MapPin, MessageCircle, Package, Printer, Truck, User } from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Catalog } from '../../api/catalogApi';
import { uploadPrivateFile } from '../../api/shared';
import { Order } from '../../constants/orders';
import type { CatalogProduct, OrderTracking } from '../../api/api.types';

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

const getCatalogVariant = (item: any, product?: CatalogProduct) => product?.variants.find((variant) => String(variant.id) === String(item?.variant_id));
const getItemImage = (item: any, product?: CatalogProduct) => item?.product_image || item?.variant_image_url || item?.variant_image || item?.image || item?.product?.image || getCatalogVariant(item, product)?.image_url || product?.images?.[0] || 'https://via.placeholder.com/120x120?text=No+Image';
const getItemTitle = (item: any, product?: CatalogProduct) => item?.product_name || item?.title || item?.product_title || product?.title || item?.product_id || 'Product';
const safeTrackingLabel = (status?: string) => ['pending', 'confirmed', 'packed', 'handed_to_rider', 'at_warehouse', 'out_for_delivery', 'delivery_attempted', 'picked_up', 'travelling', 'attempted', 'delivered', 'returned'].includes(status || '') ? String(status).replace(/_/g, ' ') : 'Delivery update received';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams();
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const [order, setOrder] = useState<Order | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Record<string, CatalogProduct>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [airwayBillURL, setAirwayBillURL] = useState('');
  const [docAction, setDocAction] = useState<string | null>(null);
  const [itemPhotos, setItemPhotos] = useState<Record<string, string>>({});
  const [parcelPhoto, setParcelPhoto] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState<string | null>(null);
  const [packingPhotoUrls, setPackingPhotoUrls] = useState<Record<string, string>>({});

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
      const [bookingRes, airwayBillRes, trackingRes] = await Promise.all([
        api.Seller.GetOrderBooking(seller.token, orderId),
        api.Seller.GetOrderAirwayBill(seller.token, orderId),
        api.Seller.GetOrderTracking(seller.token, orderId),
      ]);
      setOrder({ ...fetched, delivery_booking: bookingRes.ok && bookingRes.body ? bookingRes.body : fetched.delivery_booking });
      setAirwayBillURL(airwayBillRes.ok ? airwayBillRes.body?.url || '' : '');
      setItemPhotos(Object.fromEntries((fetched.packing_evidence?.item_photos || []).map((photo) => [photo.order_item_id, photo.url])));
      setParcelPhoto(fetched.packing_evidence?.packed_parcel_photo_url || '');
      setTracking(trackingRes.ok ? (trackingRes.body as OrderTracking) : null);
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

  useEffect(() => {
    const missingProductIDs = [...new Set((order?.order_items || [])
      .filter((item) => item.product_id && (!item.product_name || !item.product_image))
      .map((item) => item.product_id))];
    if (!missingProductIDs.length) return;

    void Promise.all(missingProductIDs.map(async (id) => {
      const response = await Catalog.getProduct(id);
      return response.ok && response.body ? [id, response.body] as const : null;
    })).then((products) => {
      const resolved = products.filter((product): product is readonly [string, CatalogProduct] => Boolean(product));
      if (resolved.length) setCatalogProducts((current) => ({ ...current, ...Object.fromEntries(resolved) }));
    });
  }, [order]);

  useEffect(() => {
    if (!seller?.token || !order?.id || !order.packing_evidence) return;
    let active = true;
    let urls: string[] = [];
    const objects = [...order.packing_evidence.item_photos.map((photo) => photo.url), order.packing_evidence.packed_parcel_photo_url];
    void Promise.all(objects.map(async (objectName) => {
      try {
        return [objectName, await api.Seller.GetOrderPackingPhoto(seller.token, order.id, objectName)] as const;
      } catch {
        return null;
      }
    })).then((photos) => {
      const entries = photos.filter((photo): photo is readonly [string, string] => Boolean(photo));
      urls = entries.map(([, url]) => url);
      if (active) setPackingPhotoUrls(Object.fromEntries(entries));
    });
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [order?.id, order?.packing_evidence, seller?.token]);

  const openReceipt = async () => {
    if (!seller?.token || !order?.id) return;
    const popup = window.open('', '_blank');
    if (!popup) return setError('Allow pop-ups to view the receipt.');
    setDocAction('receipt');
    setError(null);
    try {
      const response = await api.Seller.GetOrderReceipt(seller.token, order.id);
      if (!response.ok) throw new Error((response.body as any)?.message || 'Could not load the receipt');
      popup.document.write((response.body as any).html);
      popup.document.close();
      popup.focus();
      popup.print();
    } catch (err) {
      popup.close();
      setError(err instanceof Error ? err.message : 'Could not load the receipt');
    } finally {
      setDocAction(null);
    }
  };

  const openSupport = async () => {
    if (!seller?.token || !order?.id) return;
    setDocAction('support');
    setError(null);
    try {
      const response = await api.Seller.GetOrderSupportLink(seller.token, order.id);
      if (!response.ok) throw new Error((response.body as any)?.message || 'Could not open support');
      window.open((response.body as any).support_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open support');
    } finally {
      setDocAction(null);
    }
  };

  const resendReceipt = async () => {
    if (!seller?.token || !order?.id) return;
    setDocAction('resend');
    setError(null);
    try {
      const response = await api.Seller.ResendOrderReceipt(seller.token, order.id);
      if (!response.ok) throw new Error((response.body as any)?.message || 'Could not resend the receipt');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the receipt');
    } finally {
      setDocAction(null);
    }
  };

  const downloadPackingPacket = async () => {
    if (!seller?.token || !order?.id) return;
    setDocAction('airway-bill');
    setError(null);
    try {
      const url = URL.createObjectURL(await api.Seller.DownloadOrderAirwayBill(seller.token, order.id));
      const link = document.createElement('a');
      link.href = url;
      link.download = `juno-packing-${order.order_number || order.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download the packing receipt and airway bill');
    } finally {
      setDocAction(null);
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

      {status === 'pending' ? (
        <Banner status="info" title="Waiting on Juno operations" description="This order is in address review. Packing unlocks once it is confirmed." />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="max-w-xl">
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
                      src={getItemImage(item, catalogProducts[item.product_id])}
                      alt={getItemTitle(item, catalogProducts[item.product_id])}
                      className="h-24 w-24 rounded-xl object-cover border border-white/10"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{getItemTitle(item, catalogProducts[item.product_id])}</p>
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
                      <p className="text-xs text-neutral-400">Ordered: {item.quantity || 0}</p>
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
                    {item.id && packingPhotoUrls[itemPhotos[item.id]] ? <img src={packingPhotoUrls[itemPhotos[item.id]]} alt={`Packed ${getItemTitle(item, catalogProducts[item.product_id])}`} className="mt-3 h-28 w-28 rounded-lg border border-white/10 object-cover" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {(tracking?.timeline?.length || booking) ? (
            <Card padding={4}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <Truck size={16} className="text-primary" /> Delivery Tracking
              </h3>
              <div className="space-y-1 text-xs text-neutral-400">
                <p>Current: <span className="text-white">{safeTrackingLabel(tracking?.current_status || order.status)}</span></p>
                {booking?.tracking_number ? <p>DEX tracking: <span className="text-white">{booking.tracking_number}</span></p> : null}
                {airwayBillURL ? <Button label="Download packing receipt + airway bill" size="sm" variant="secondary" onClick={() => void downloadPackingPacket()} isLoading={docAction === 'airway-bill'} /> : null}
                {booking?.tracking_url ? <p>Tracking link: <a href={booking.tracking_url} target="_blank" rel="noreferrer" className="text-primary underline">Track parcel <ExternalLink size={11} className="inline" /></a></p> : null}
                {tracking?.estimated_delivery ? <p>Estimated delivery: <span className="text-white">{new Date(tracking.estimated_delivery).toLocaleDateString('en-PK')}</span></p> : null}
                {booking?.last_checked_at ? <p>Last checked: <span className="text-white">{new Date(booking.last_checked_at).toLocaleString()}</span></p> : null}
              </div>

              {tracking?.timeline?.length ? (
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {tracking.timeline.map((event, index) => (
                    <div key={`${event.status}-${event.occurred_at || index}`} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm text-white">{event.label || safeTrackingLabel(event.status)}</p>
                        <p className="text-xs text-neutral-500">
                          {event.occurred_at ? new Date(event.occurred_at).toLocaleString() : ''}
                          {(event as any).location?.city ? ` · ${(event as any).location.city}` : ''}
                        </p>
                        {(event as any).note ? <p className="mt-1 text-xs text-neutral-400">{(event as any).note}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>

        <div className="space-y-8">
          <Card padding={4}>
            <VStack gap={3}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Truck size={16} className="text-primary" /> Order Stage
              </h3>

              <p className="text-sm text-neutral-300">
                {status === 'pending'
                  ? 'Juno operations are reviewing the delivery address. Wait for Confirmed before packing.'
                  : status === 'confirmed'
                    ? 'Upload one photo per item plus the sealed parcel photo, then mark this order packed.'
                    : status === 'packed'
                      ? 'Packing evidence received. Juno operations arrange the DEX handover.'
                      : 'This order is with the courier. Juno operations update its status from DEX.'}
              </p>

              <p className="text-xs text-neutral-500">
                Confirming, handing over, and cancelling are Juno operations actions. Packing is your only order action.
              </p>

              <Button label="Print processing receipt" icon={<Printer size={14} />} onClick={() => void openReceipt()} isLoading={docAction === 'receipt'} width="100%" />
              <Button label="Resend customer receipt" variant="secondary" icon={<MessageCircle size={14} />} onClick={() => void resendReceipt()} isLoading={docAction === 'resend'} width="100%" />
              <Button label="Contact Juno about this order" icon={<MessageCircle size={14} />} onClick={() => void openSupport()} isLoading={docAction === 'support'} width="100%" />
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
              {packingPhotoUrls[parcelPhoto] ? <img src={packingPhotoUrls[parcelPhoto]} alt="Packed parcel" className="h-40 w-full rounded-lg border border-white/10 object-cover" /> : null}

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
