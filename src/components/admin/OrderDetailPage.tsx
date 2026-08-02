import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import {
  ArrowLeft,
  Ban,
  Calendar,
  Copy,
  CreditCard,
  MapPin,
  Package,
  Printer,
  Store,
  Truck,
  User,
} from 'lucide-react';
import { AdminCommerce, AdminPortal, GetProductById } from '../../api/adminApi';
import { uploadFileAndGetUrl } from '../../api/shared';
import type { AddressReview, DeliveryBooking, Order, ParentOrder } from '../../api/api.types';
import type { Product, Variant } from '../../constants/types';
import type { Seller } from '../../constants/seller';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'handed_to_rider',
  'at_warehouse',
  'out_for_delivery',
  'delivery_attempted',
  'delivered',
  'cancelled',
  'returned',
] as const;

const DEX_ROW_COLUMNS = [
  'Order number', 'Sender address', "Recipient's name", 'Recipient phone number', 'Province', 'District', 'Wards', 'Specific address', "Product's name", 'Unit price', 'Quantity', 'Weight', 'Length', 'Width', 'Height', 'COD', 'COD amount collected on behalf', 'Fail delivery storage', 'Delivery note',
] as const;

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
const ADDRESS_FIELDS = ['house_or_building', 'area', 'city', 'province', 'postal_code'];
const normalizeAddressReview = (review?: AddressReview | null): AddressReview | null => review ? {
  ...review,
  missing_fields: Array.isArray(review.missing_fields) ? review.missing_fields : [],
  format_status: review.format_status || 'manual_review',
  customer_message: review.customer_message || '',
  customer_confirmed: Boolean(review.customer_confirmed),
} : null;

const parentFromChild = (child: Order): ParentOrder => ({
  id: child.id,
  user_id: child.user_id,
  customer_type: child.user_id?.startsWith('guest:') ? 'guest' : 'user',
  customer_name: child.customer_name,
  customer_phone: child.customer_phone,
  customer_email: child.customer_email,
  total_amount: child.total ?? child.financials?.total ?? 0,
  shipping_fee: child.financials?.shipping_fee ?? 0,
  subtotal: child.financials?.subtotal ?? 0,
  status: child.status || 'pending',
  rollup_status: child.status || 'pending',
  payment_method: child.payment_method || 'cod',
  shipping_address: child.shipping_address,
  child_order_ids: [child.id],
  child_summaries: [{
    order_id: child.id,
    seller_id: child.seller_id,
    seller_name: child.seller_name || child.seller_id,
    item_count: child.order_items?.length ?? 0,
    total: child.total ?? child.financials?.total ?? 0,
    status: child.status || 'pending',
  }],
  created_at: child.created_at,
});

const getAvailableInventory = (variant?: Variant, product?: Product): number | null => {
  const variantInv = variant?.inventory;
  const productInv = product?.inventory;

  const value =
    variantInv?.available_quantity ??
    variantInv?.quantity ??
    productInv?.available_quantity ??
    productInv?.quantity;

  return typeof value === 'number' ? value : null;
};

const ProductLineItem: React.FC<{
  child: Order;
  item: Order['order_items'][number];
  itemIndex: number;
  product?: Product;
  isSavingVariant: boolean;
  onUpdateVariant: (child: Order, itemIndex: number, nextVariantId: string) => Promise<void>;
}> = ({ child, item, itemIndex, product, isSavingVariant, onUpdateVariant }) => {
  const variant = product?.variants?.find((v) => String(v.id) === String(item.variant_id));
  const image =
    variant?.images?.[0] ||
    item.product_image ||
    product?.images?.[0] ||
    'https://via.placeholder.com/120x120?text=No+Image';

  const remainingInventory = getAvailableInventory(variant, product);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(item.variant_id || '');

  useEffect(() => {
    setSelectedVariantId(item.variant_id || '');
  }, [item.variant_id]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex gap-4">
        <img
          src={image}
          alt={item.product_name || 'Product'}
          className="h-24 w-24 rounded-xl object-cover border border-white/10"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate">{item.product_name || product?.title || item.product_id}</p>
          <p className="text-xs text-neutral-400 mt-1 break-all">Product ID: {item.product_id}</p>
          <p className="text-xs text-neutral-400 break-all">Variant ID: {item.variant_id}</p>

          {(item.variant_label || variant?.title) && (
            <p className="text-xs text-primary mt-1">Variant: {item.variant_label || variant?.title}</p>
          )}

          {item.variant_options && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(item.variant_options).map(([key, value]) => (
                <span key={key} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/80">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-white">{formatCurrency(item.unit_price)}</p>
          <p className="text-xs text-neutral-400 mt-1">Ordered: {item.quantity}</p>
          <p className="text-xs text-neutral-400">Line total: {formatCurrency(item.line_total)}</p>
          <p className="text-xs text-emerald-400 mt-2">
            Remaining inv: {remainingInventory !== null ? remainingInventory : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Manual Variant Correction</p>
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            disabled={isSavingVariant || !product?.variants?.length}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">Select variant</option>
            {(product?.variants || []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.title || v.id}{v.available === false ? ' (Unavailable)' : ''}
              </option>
            ))}
          </select>
          <Button label="Update variant" size="sm" variant="primary" onClick={() => void onUpdateVariant(child, itemIndex, selectedVariantId)} isLoading={isSavingVariant} isDisabled={!selectedVariantId || selectedVariantId === item.variant_id} />
        </div>
      </div>
    </div>
  );
};

const SellerLocationCard: React.FC<{ seller?: Seller; child: Order }> = ({ seller, child }) => {
  const loc = seller?.location;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-sm font-black text-white">{child.seller_name || seller?.business_name || child.seller_id}</p>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[child.status] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'}`}>
          {child.status}
        </span>
      </div>

      <div className="text-xs text-neutral-300 space-y-1">
        <p>Pickup Address: {loc?.address || 'N/A'}</p>
        <p>{loc?.city || 'N/A'}{loc?.state ? `, ${loc.state}` : ''}{loc?.postal_code ? ` ${loc.postal_code}` : ''}</p>
        <p>Coordinates: {typeof loc?.latitude === 'number' ? loc.latitude : 'N/A'}, {typeof loc?.longitude === 'number' ? loc.longitude : 'N/A'}</p>
        <p>Pickup Available: {typeof loc?.pickup_available === 'boolean' ? (loc.pickup_available ? 'Yes' : 'No') : 'N/A'}</p>
      </div>

      {child.financials && (
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
          <p className="text-neutral-400">Subtotal</p><p className="text-white text-right">{formatCurrency(child.financials.subtotal)}</p>
          <p className="text-neutral-400">Shipping</p><p className="text-white text-right">{formatCurrency(child.financials.shipping_fee)}</p>
          <p className="text-neutral-400">Commission</p><p className="text-white text-right">{formatCurrency(child.financials.commission)}</p>
          <p className="text-neutral-400">Seller Payout</p><p className="text-emerald-400 text-right">{formatCurrency(child.financials.seller_payout)}</p>
        </div>
      )}
    </div>
  );
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [parent, setParent] = useState<ParentOrder | null>(null);
  const [children, setChildren] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState<string>('pending');

  const [warehouseLat, setWarehouseLat] = useState('');
  const [warehouseLng, setWarehouseLng] = useState('');
  const [warehouseCity, setWarehouseCity] = useState('');
  const [warehouseLabel, setWarehouseLabel] = useState('');
  const [newEta, setNewEta] = useState('');
  const [updatingVariantKey, setUpdatingVariantKey] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<Record<string, string>>({});
  const [addressReview, setAddressReview] = useState<AddressReview | null>(null);
  const [bookingDraft, setBookingDraft] = useState({ consignment_number: '' });
  const [airwayBillFile, setAirwayBillFile] = useState<File | null>(null);
  const [packingPhotoUrls, setPackingPhotoUrls] = useState<Record<string, string>>({});
  const [previewPackingPhoto, setPreviewPackingPhoto] = useState<{ src: string; alt: string } | null>(null);

  const sellerMap = useMemo(() => new Map(sellers.map((s) => [s.id, s])), [sellers]);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) || null,
    [children, selectedChildId]
  );

  const fetchData = async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [childRes, sellersRes] = await Promise.all([
        AdminPortal.getOrder(orderId),
        AdminPortal.listSellers(),
      ]);

      if (!childRes.ok) {
        throw new Error((childRes.body as any)?.message || 'Failed to fetch order detail');
      }

      const child = childRes.body as Order;
      const payload: { parent: ParentOrder; children: Order[] } = {
        parent: parentFromChild(child),
        children: [child],
      };

      setParent(payload.parent);
      setChildren(payload.children);
      const address = payload.parent.shipping_address || {};
      setDetailsDraft({ payment_method: child.payment_method || 'cod', full_name: payload.parent.customer_name || address.full_name || '', phone_number: payload.parent.customer_phone || address.phone_number || '', email: payload.parent.customer_email || address.email || '', address_line1: address.address_line1 || '', address_line2: address.address_line2 || '', city: address.city || '', province: address.province || '', postal_code: address.postal_code || '', country: address.country || 'Pakistan' });

      const linkedChild = payload.children.find((candidate) => candidate.id === child.id) || payload.children[0];
      setSelectedChildId(linkedChild?.id || '');
      setNewStatus(linkedChild?.status || payload.parent.rollup_status || payload.parent.status || 'pending');
      setAddressReview(normalizeAddressReview(child.address_review));
      const booking = child.delivery_booking;
      setBookingDraft({ consignment_number: booking?.consignment_number || booking?.tracking_number || '' });
      setAirwayBillFile(null);

      if (sellersRes.ok && Array.isArray(sellersRes.body)) {
        setSellers(sellersRes.body as Seller[]);
      }

      const productIds = Array.from(new Set((payload.children ?? []).flatMap((child) =>
        (child.order_items ?? []).map((item) => item.product_id).filter(Boolean)
      )));

      if (productIds.length > 0) {
        const productEntries = await Promise.all(productIds.map(async (productId) => {
          const res = await GetProductById(productId);
          if (res.ok && res.body) {
            return [productId, res.body as Product] as const;
          }
          return null;
        }));

        const nextProducts: Record<string, Product> = {};
        productEntries.forEach((entry) => {
          if (!entry) return;
          nextProducts[entry[0]] = entry[1];
        });

        setProducts(nextProducts);
      } else {
        setProducts({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while loading order detail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (selectedChild?.status) {
      setNewStatus(selectedChild.status);
    }
  }, [selectedChild?.status]);

  useEffect(() => {
    let active = true;
    let urls: string[] = [];
    const photos = children.flatMap((child) => {
      const evidence = child.packing_evidence;
      return evidence ? [...evidence.item_photos, { order_item_id: 'parcel', url: evidence.packed_parcel_photo_url }].map((photo) => ({ childId: child.id, ...photo })) : [];
    });
    if (!photos.length) {
      setPackingPhotoUrls({});
      return;
    }
    void Promise.all(photos.map(async (photo) => {
      try {
        return [`${photo.childId}:${photo.url}`, await AdminCommerce.getPackingPhoto(photo.childId, photo.url)] as const;
      } catch {
        return null;
      }
    })).then((results) => {
      const entries = results.filter((result): result is readonly [string, string] => Boolean(result));
      urls = entries.map(([, url]) => url);
      if (active) setPackingPhotoUrls(Object.fromEntries(entries));
    });
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [children]);

  const runUpdate = async (action: () => Promise<any>, successMessage: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await action();
      if (!res.ok) {
        throw new Error((res.body as any)?.message || 'Operation failed');
      }
      await fetchData();
      alert(successMessage);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedChildId) return;
    setNewStatus(status);
    await runUpdate(
      () => AdminPortal.bulkUpdateOrders({ updates: [{ order_id: selectedChildId, status }] }),
      'Order status updated.'
    );
  };

  const handleCancelSelectedChild = async () => {
    if (!selectedChildId) return;
    if (!window.confirm('Cancel this seller order?')) return;
    await runUpdate(
      () => AdminPortal.cancelOrder(selectedChildId, 'Cancelled by admin'),
      'Seller order cancelled.'
    );
  };

  const handleVerifyPayment = async () => {
    if (!selectedChildId || !window.confirm('Verify this bank-deposit payment?')) return;
    await runUpdate(() => AdminPortal.verifyOrderPayment(selectedChildId), 'Bank-deposit payment verified.');
  };

  const handleSetWarehouse = async () => {
    if (!selectedChildId || !warehouseLat || !warehouseLng) return;
    await runUpdate(
      () => AdminCommerce.setWarehouseAnchor(selectedChildId, {
        lat: Number(warehouseLat),
        lng: Number(warehouseLng),
        city: warehouseCity || undefined,
        label: warehouseLabel || undefined,
      }),
      'Warehouse anchor updated.'
    );
  };

  const handleUpdateEta = async () => {
    if (!selectedChildId || !newEta) return;
    await runUpdate(
      () => AdminCommerce.updateETA(selectedChildId, new Date(newEta).toISOString()),
      'ETA updated.'
    );
  };

  const handleUpdateOrderItemVariant = async (child: Order, itemIndex: number, nextVariantId: string) => {
    const item = child.order_items?.[itemIndex];
    if (!item) {
      setError('Order item not found.');
      return;
    }

    if (!nextVariantId || nextVariantId === item.variant_id) return;

    const product = products[item.product_id];
    if (!product) {
      setError('Product data unavailable for this item. Refresh and try again.');
      return;
    }

    const nextVariant = product.variants?.find((v) => String(v.id) === String(nextVariantId));
    if (!nextVariant) {
      setError('Selected variant not found on product.');
      return;
    }

    const variantKey = `${child.id}:${item.id || itemIndex}`;
    setUpdatingVariantKey(variantKey);
    setError(null);

    try {
      if (!item.id) throw new Error('Order item ID is missing.');
      const res = await AdminPortal.updateOrderItemVariant(child.id, item.id, nextVariant.id);

      if (!res.ok) {
        throw new Error((res.body as any)?.message || 'Failed to update order item variant');
      }

      await fetchData();
      alert('Variant updated and customer/seller notified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order item variant');
    } finally {
      setUpdatingVariantKey(null);
    }
  };

  const printReceipt = async (kind: 'customer' | 'seller') => {
    const id = selectedChildId;
    if (!id) return;
    const res = kind === 'customer' ? await AdminCommerce.getCustomerReceipt(id) : await AdminCommerce.getSellerProcessingReceipt(id);
    if (!res.ok) { setError((res.body as any)?.message || 'Could not generate receipt'); return; }
    const popup = window.open('', '_blank');
    if (!popup) { setError('Allow pop-ups to generate the receipt.'); return; }
    popup.document.write(res.body.html); popup.document.close(); popup.focus(); popup.print();
  };

  const saveOrderDetails = async () => {
    if (!selectedChildId) return;
    if (!detailsDraft.full_name?.trim() || !detailsDraft.phone_number?.trim() || !detailsDraft.address_line1?.trim() || !detailsDraft.city?.trim()) {
      setError('Name, phone, address line 1, and city are required.');
      return;
    }
    if (await runUpdate(() => AdminPortal.updateOrderCustomer(selectedChildId, detailsDraft), 'Order details updated.')) {
      setEditingDetails(false);
    }
  };

  const copyText = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError('Could not copy text. Select and copy it manually.');
    }
  };

  const copyDexBookingRows = async () => {
    if (!selectedChildId) return;
    setError(null);
    try {
      const response = await AdminPortal.getDexBookingData(selectedChildId);
      if (!response.ok) throw new Error((response.body as any)?.message || 'Could not load DEX booking rows');
      const rows = Array.isArray((response.body as any)?.rows) ? (response.body as any).rows : [];
      if (!rows.length) throw new Error('No DEX booking rows are available for this order');
      await navigator.clipboard.writeText(rows.map((row) =>
        DEX_ROW_COLUMNS.map((column) => String(row?.[column] ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t')
      ).join('\n'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not copy DEX booking rows');
    }
  };

  const createAddressPrompt = async () => {
    if (!selectedChildId) return;
    setIsUpdating(true);
    setError(null);
    try {
      const res = await AdminPortal.createAddressPrompt(selectedChildId);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Could not create ChatGPT prompt');
      setAddressReview(normalizeAddressReview(res.body as AddressReview));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create ChatGPT prompt');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveAddressReview = async (confirmed = false) => {
    if (!selectedChildId || !addressReview) return;
    const missingFields = addressReview.missing_fields.filter((field) => ADDRESS_FIELDS.includes(field));
    if (missingFields.length !== addressReview.missing_fields.length) {
      setError(`Missing fields must be one of: ${ADDRESS_FIELDS.join(', ')}`);
      return;
    }
    if (confirmed && (addressReview.format_status !== 'ready' || missingFields.length > 0)) return;

    setIsUpdating(true);
    setError(null);
    try {
      const res = await AdminPortal.updateOrderCustomer(selectedChildId, {
        formatted_address: addressReview.formatted_address,
        district: addressReview.district,
        province: addressReview.province,
        missing_fields: missingFields,
        customer_message: addressReview.customer_message,
        ...(confirmed ? { customer_confirmed: true } : {}),
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Could not save address review');
      setAddressReview(normalizeAddressReview((res.body as any)?.address_review) || addressReview);
      if (confirmed) await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save address review');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveManualDexBooking = async () => {
    if (!selectedChildId || !bookingDraft.consignment_number.trim() || !airwayBillFile) {
      setError('A DEX tracking number and airway-bill file are required.');
      return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      const airway_bill_url = await uploadFileAndGetUrl(airwayBillFile);
      const res = await AdminPortal.saveManualBooking(selectedChildId, {
        consignment_number: bookingDraft.consignment_number.trim(),
        airway_bill_url,
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Could not save DEX booking');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save DEX booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const refreshDexTracking = async () => {
    if (!selectedChildId) return;
    setIsUpdating(true);
    setError(null);
    try {
      const res = await AdminPortal.refreshDexTracking(selectedChildId);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Could not refresh DEX tracking');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh DEX tracking');
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

  if (!parent) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Order not found</h2>
        <button onClick={() => navigate('/admin/orders')} className="mt-4 text-primary font-bold">Go back to orders</button>
      </div>
    );
  }

  const rollupStatus = parent.rollup_status || parent.status;
  const customer = parent.shipping_address;
  const booking: DeliveryBooking | undefined = selectedChild?.delivery_booking;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-neutral-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">Seller Order</h2>
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusColors[rollupStatus] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'}`}>
                {rollupStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-1">{parent.id}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Created</p>
          <p className="text-sm font-bold text-white">{new Date(parent.created_at).toLocaleString()}</p>
        </div>
      </div>

      {error && <Banner status="error" title={error} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding={4}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <User size={16} className="text-primary" /> Full Customer Details
              </h3>
              <div className="space-y-1 text-sm text-neutral-300">
                <p className="text-white font-bold">{parent.customer_name || customer?.full_name || 'Guest Customer'}</p>
                <p>Phone: {parent.customer_phone || customer?.phone_number || 'N/A'}</p>
                <p>Email: {parent.customer_email || customer?.email || 'N/A'}</p>
                <p className="pt-2 text-white/80">Shipping Address</p>
                <p>{customer?.address_line1 || 'N/A'}</p>
                {customer?.address_line2 ? <p>{customer.address_line2}</p> : null}
                <p>{customer?.city || 'N/A'}{customer?.province ? `, ${customer.province}` : ''}{customer?.postal_code ? ` ${customer.postal_code}` : ''}</p>
                <p>{customer?.country || 'Pakistan'}</p>
                <p className="text-xs text-neutral-400 pt-1">
                  Customer coordinates: {typeof customer?.latitude === 'number' ? customer.latitude : 'N/A'}, {typeof customer?.longitude === 'number' ? customer.longitude : 'N/A'}
                </p>
                <Button label="Edit customer, delivery & payment" size="sm" onClick={() => setEditingDetails(true)} />
              </div>
            </Card>

            <Card padding={4}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-primary" /> Order Metrics
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-neutral-300">Payment Method: <span className="text-white">{(parent.payment_method || '').replace(/_/g, ' ')}</span></p>
                {selectedChild?.payment_status && <p className="text-neutral-300">Payment Status: <span className="text-amber-300">{selectedChild.payment_status.replace(/_/g, ' ')}</span></p>}
                {selectedChild?.payment_proof_url && <p><a href={selectedChild.payment_proof_url} target="_blank" rel="noreferrer" className="text-primary underline">Open payment proof</a></p>}
                {selectedChild?.payment_proof_note && <p className="text-xs text-neutral-400">{selectedChild.payment_proof_note}</p>}
                {selectedChild?.payment_method === 'bank_deposit' && selectedChild.payment_status === 'pending_verification' && selectedChild.payment_proof_url && <Button label="Verify payment" size="sm" variant="primary" onClick={() => void handleVerifyPayment()} isLoading={isUpdating} />}
                {selectedChild?.dex_order_number && <p className="text-neutral-300">DEX order no.: <span className="font-mono text-white">{selectedChild.dex_order_number}</span></p>}
                <p className="text-neutral-300">Subtotal: <span className="text-white">{formatCurrency(parent.subtotal)}</span></p>
                {(selectedChild?.financials?.discount_amount ?? 0) > 0 && <p className="text-neutral-300">Bank discount: <span className="text-emerald-300">−{formatCurrency(selectedChild?.financials?.discount_amount)}</span></p>}
                <p className="text-neutral-300">Shipping: <span className="text-white">{formatCurrency(parent.shipping_fee)}</span></p>
                <p className="text-neutral-300">Total: <span className="text-white font-black">{formatCurrency(parent.total_amount)}</span></p>
                <p className="text-neutral-300">Seller order: <span className="text-white">{selectedChild?.order_number || selectedChildId}</span></p>
                <p className="text-neutral-300">Customer Type: <span className="text-white">{parent.customer_type}</span></p>
              </div>
            </Card>
          </div>

          <Card padding={4}>
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Address review</h3>
                <p className="mt-1 text-xs text-neutral-400">Create a prompt, review it in ChatGPT, then paste only the reviewed address data below.</p>
              </div>
              <Button label="Create ChatGPT prompt" size="sm" onClick={() => void createAddressPrompt()} isLoading={isUpdating} isDisabled={!selectedChildId} />
            </div>

            {!addressReview ? (
              <p className="py-6 text-sm text-neutral-400">No address review yet. Create a prompt to begin.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Original address</p><p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{addressReview.original_address || customer?.address_line1 || '-'}</p></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Review status</p><p className="mt-2 text-sm font-semibold text-white">{addressReview.customer_confirmed ? 'Customer confirmed' : addressReview.format_status.replace(/_/g, ' ')}</p>{addressReview.confirmed_at && <p className="mt-1 text-xs text-neutral-400">Confirmed {new Date(addressReview.confirmed_at).toLocaleString()}{addressReview.confirmed_by ? ` by ${addressReview.confirmed_by}` : ''}</p>}</div>
                </div>

                {addressReview.formatter_prompt && <div><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">ChatGPT prompt</p><button onClick={() => void copyText(addressReview.formatter_prompt)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Copy size={13} /> Copy prompt</button></div><textarea readOnly value={addressReview.formatter_prompt} className="h-28 w-full rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/70 outline-none" /></div>}

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs text-neutral-400">Formatted address<textarea value={addressReview.formatted_address || ''} onChange={(event) => setAddressReview((current) => current ? { ...current, formatted_address: event.target.value, format_status: 'ready' } : current)} className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-primary" /></label>
                  <label className="text-xs text-neutral-400">Missing fields (comma separated)<input value={addressReview.missing_fields.join(', ')} onChange={(event) => setAddressReview((current) => current ? { ...current, missing_fields: event.target.value.split(',').map((field) => field.trim()).filter(Boolean), format_status: 'ready' } : current)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary" /><span className="mt-1 block text-[10px] text-neutral-500">{ADDRESS_FIELDS.join(', ')}</span></label>
                </div>
                <div className="grid gap-3 md:grid-cols-2"><label className="text-xs text-neutral-400">District<input value={addressReview.district || ''} onChange={(event) => setAddressReview((current) => current ? { ...current, district: event.target.value, format_status: 'ready' } : current)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary" /></label><label className="text-xs text-neutral-400">Province<input value={addressReview.province || ''} onChange={(event) => setAddressReview((current) => current ? { ...current, province: event.target.value, format_status: 'ready' } : current)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary" /></label></div>
                <div><div className="mb-2 flex items-center justify-between"><p className="text-xs text-neutral-400">Customer message</p><button onClick={() => void copyText(addressReview.customer_message)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Copy size={13} /> Copy message</button></div><textarea value={addressReview.customer_message || ''} onChange={(event) => setAddressReview((current) => current ? { ...current, customer_message: event.target.value, format_status: 'ready' } : current)} className="h-20 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-primary" /></div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"><p className="text-xs text-neutral-400">{addressReview.missing_fields.length ? `${addressReview.missing_fields.length} field(s) still needed` : 'No missing fields'}</p><div className="flex gap-2"><Button label="Save review" size="sm" onClick={() => void saveAddressReview()} isLoading={isUpdating} /><Button label="Customer confirmed address" size="sm" variant="primary" onClick={() => void saveAddressReview(true)} isDisabled={isUpdating || addressReview.customer_confirmed || addressReview.format_status !== 'ready' || addressReview.missing_fields.length > 0} /></div></div>
              </div>
            )}
          </Card>

          <Card padding={4}>
            <VStack gap={3}>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2"><Truck size={16} className="text-primary" /> Manual DEX booking</h3>
              <p className="text-xs text-neutral-400">Enter the DEX tracking number and upload the airway bill.</p>
              <input value={bookingDraft.consignment_number} onChange={(event) => setBookingDraft({ consignment_number: event.target.value })} placeholder="DEX tracking number" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <label className="text-xs text-neutral-400">Airway bill (PDF, JPG or PNG, max 10 MB)<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setAirwayBillFile(event.target.files?.[0] || null)} className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black" /></label>
              <div className="grid grid-cols-2 gap-2"><Button label="Save DEX booking" variant="primary" onClick={() => void saveManualDexBooking()} isLoading={isUpdating} isDisabled={!selectedChildId || !bookingDraft.consignment_number.trim() || !airwayBillFile} width="100%" /><Button label="Copy booking rows" icon={<Copy size={14} />} onClick={() => void copyDexBookingRows()} isDisabled={!selectedChildId} width="100%" /></div>
              {booking && <div className="border-t border-white/10 pt-3 text-xs text-neutral-400"><div className="flex items-center justify-between gap-2"><p>DEX tracking: <span className="text-white">{booking.tracking_number || booking.consignment_number || '-'}</span></p><Button label="Refresh DEX" size="sm" onClick={() => void refreshDexTracking()} isLoading={isUpdating} /></div>{booking.tracking_url && <p className="mt-1">Tracking link: <a href={booking.tracking_url} target="_blank" rel="noreferrer" className="text-primary underline">Track parcel</a></p>}{booking.airway_bill_url && <p className="mt-1">Airway bill: <a href={booking.airway_bill_url} target="_blank" rel="noreferrer" className="text-primary underline">Open airway bill</a></p>}<p className="mt-1">Status: <span className="text-white">{booking.status.replace(/_/g, ' ')}</span></p>{booking.dex_raw_status && <p className="mt-1">DEX status: <span className="text-white">{booking.dex_raw_status}</span></p>}<p className="mt-1">Booked at: {booking.booked_at || booking.booking_time || '-'}</p><p className="mt-1">Last checked: {booking.last_checked_at || '-'}</p>{booking.tracking_history?.length ? <div className="mt-3 space-y-2 border-t border-white/10 pt-3"><p className="font-semibold text-white">DEX updates</p>{booking.tracking_history.map((event, index) => <p key={`${event.status}-${event.occurred_at || index}-${index}`}><span className="text-white">{event.status.replace(/_/g, ' ')}</span>{event.location ? ` · ${event.location}` : ''}{event.occurred_at ? ` · ${new Date(event.occurred_at).toLocaleString()}` : ''}{event.raw_status ? ` (${event.raw_status})` : ''}</p>)}</div> : null}</div>}
            </VStack>
          </Card>

          <Card padding={4}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Store size={16} className="text-primary" /> Seller Pickup Location + Financials
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {children.map((child) => (
                <SellerLocationCard key={child.id} child={child} seller={sellerMap.get(child.seller_id)} />
              ))}
            </div>
          </Card>

          <Card padding={4}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" /> Product + Variant + Inventory Details
            </h3>

            <div className="space-y-4">
              {children.flatMap((child) =>
                (child.order_items || []).map((item, idx) => (
                  <ProductLineItem
                    key={`${child.id}-${item.product_id}-${item.variant_id}-${idx}`}
                    child={child}
                    item={item}
                    itemIndex={idx}
                    product={products[item.product_id]}
                    isSavingVariant={updatingVariantKey === `${child.id}:${item.id || idx}`}
                    onUpdateVariant={handleUpdateOrderItemVariant}
                  />
                ))
              )}
            </div>
          </Card>

          <Card padding={4}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" /> Seller Packing Evidence
            </h3>
            {children.some((child) => child.packing_evidence) ? (
              <div className="space-y-5">
                {children.map((child) => {
                  const evidence = child.packing_evidence;
                  if (!evidence) return null;
                  const photoByItemId = Object.fromEntries(evidence.item_photos.map((photo) => [photo.order_item_id, photo.url]));
                  return (
                    <div key={child.id} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                      <p className="mb-3 text-xs font-semibold text-white">{child.order_number || child.id}</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(child.order_items || []).map((item, index) => {
                          const objectName = photoByItemId[item.id];
                          const url = objectName ? packingPhotoUrls[`${child.id}:${objectName}`] : '';
                          return (
                            <div key={item.id || index} className="rounded-lg border border-white/10 bg-black/20 p-3">
                              <p className="truncate text-xs font-medium text-white">{item.product_name || item.product_id || 'Order item'}</p>
                              {url ? <button type="button" onClick={() => setPreviewPackingPhoto({ src: url, alt: `Packed ${item.product_name || 'order item'}` })} className="mt-3 block w-full rounded-md focus:outline-none focus:ring-2 focus:ring-primary"><img src={url} alt={`Packed ${item.product_name || 'order item'}`} className="h-44 w-full rounded-md object-cover transition-transform hover:scale-[1.02]" /></button> : <p className="mt-3 text-xs text-neutral-500">{objectName ? 'Loading item photo…' : 'No item photo'}</p>}
                            </div>
                          );
                        })}
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <p className="text-xs font-medium text-white">Packed parcel / airway bill</p>
                          {packingPhotoUrls[`${child.id}:${evidence.packed_parcel_photo_url}`] ? <button type="button" onClick={() => setPreviewPackingPhoto({ src: packingPhotoUrls[`${child.id}:${evidence.packed_parcel_photo_url}`], alt: 'Packed parcel with airway bill' })} className="mt-3 block w-full rounded-md focus:outline-none focus:ring-2 focus:ring-primary"><img src={packingPhotoUrls[`${child.id}:${evidence.packed_parcel_photo_url}`]} alt="Packed parcel with airway bill" className="h-44 w-full rounded-md object-cover transition-transform hover:scale-[1.02]" /></button> : <p className="mt-3 text-xs text-neutral-500">Loading parcel photo…</p>}
                        </div>
                      </div>
                      {evidence.submitted_at ? <p className="mt-3 text-xs text-neutral-500">Submitted {new Date(evidence.submitted_at).toLocaleString()}</p> : null}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-neutral-400">The seller has not submitted packing evidence.</p>}
          </Card>
        </div>

        <div className="space-y-8">
          <Card padding={4}>
            <VStack gap={3}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Truck size={16} className="text-primary" /> Status + Tracking Controls
            </h3>

            <select
              value={selectedChildId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedChildId(id);
                const child = children.find((c) => c.id === id);
                if (child?.status) setNewStatus(child.status);
              }}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Select seller order</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>{(child.seller_name || child.seller_id) + ' • ' + child.id.slice(0, 8)}</option>
              ))}
            </select>

            <select
              value={newStatus}
              onChange={(e) => void handleUpdateStatus(e.target.value)}
              disabled={!selectedChildId || isUpdating}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <Button label="Resend order update emails" onClick={() => selectedChildId && void runUpdate(() => AdminCommerce.resendOrderUpdate(selectedChildId), 'Current order update emailed to customer and seller.')} isDisabled={isUpdating || !selectedChildId} width="100%" />

            <Button label="Cancel order" variant="destructive" icon={<Ban size={14} />} onClick={handleCancelSelectedChild} isDisabled={isUpdating || !selectedChildId} width="100%" />

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
              <Button label="Customer receipt" size="sm" icon={<Printer size={13} />} onClick={() => void printReceipt('customer')} isDisabled={!selectedChildId} />
              <Button label="Packing receipt" size="sm" icon={<Printer size={13} />} onClick={() => void printReceipt('seller')} isDisabled={!selectedChildId} />
            </div>

            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <input value={warehouseLat} onChange={(e) => setWarehouseLat(e.target.value)} placeholder="Lat" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={warehouseLng} onChange={(e) => setWarehouseLng(e.target.value)} placeholder="Lng" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={warehouseCity} onChange={(e) => setWarehouseCity(e.target.value)} placeholder="City" className="col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={warehouseLabel} onChange={(e) => setWarehouseLabel(e.target.value)} placeholder="Label" className="col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <Button label="Set warehouse anchor" size="sm" onClick={handleSetWarehouse} isDisabled={isUpdating || !selectedChildId || !warehouseLat || !warehouseLng} />
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <input
                type="datetime-local"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button label="Update ETA" onClick={handleUpdateEta} isDisabled={isUpdating || !selectedChildId || !newEta} width="100%" />
            </div>
            </VStack>
          </Card>

          <Card padding={4}>
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Timeline Metadata
            </h3>
            <div className="space-y-1 text-xs text-neutral-400">
              <p>Created: <span className="text-white">{new Date(parent.created_at).toLocaleString()}</span></p>
              <p>Order Status: <span className="text-white">{rollupStatus}</span></p>
              <p>Seller: <span className="text-white">{selectedChild?.seller_name || selectedChild?.seller_id || '-'}</span></p>
            </div>
          </Card>
        </div>
      </div>

      {editingDetails && (
        <Dialog isOpen onOpenChange={(isOpen) => !isOpen && setEditingDetails(false)} purpose="form" width="640px" maxHeight="90vh">
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={2}>Edit order details</Heading>
              <p className="text-sm text-neutral-400">Updates the customer and delivery address for this seller order.</p>
              {[
                ['full_name', 'Name'], ['phone_number', 'Phone'], ['email', 'Email'], ['address_line1', 'Address line 1'], ['address_line2', 'Address line 2'], ['city', 'City'], ['province', 'Province'], ['postal_code', 'Postal code'], ['country', 'Country'],
              ].map(([key, label]) => (
                <TextInput key={key} label={label} value={detailsDraft[key] || ''} onChange={(value) => setDetailsDraft((current) => ({ ...current, [key]: value }))} isRequired={['full_name', 'phone_number', 'address_line1', 'city'].includes(key)} />
              ))}
              <label className="text-sm text-neutral-300">Payment method<select value={detailsDraft.payment_method || 'cod'} onChange={(event) => setDetailsDraft((current) => ({ ...current, payment_method: event.target.value }))} className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="cod">Cash on delivery</option><option value="bank_deposit">Bank deposit</option></select></label>
              <Button label="Save all order details" variant="primary" onClick={() => void saveOrderDetails()} isLoading={isUpdating} width="100%" />
            </VStack>
          </Card>
        </Dialog>
      )}
      {previewPackingPhoto && (
        <Dialog isOpen onOpenChange={(isOpen) => !isOpen && setPreviewPackingPhoto(null)} purpose="dialog" width="900px" maxHeight="90vh">
          <Card padding={3}>
            <img src={previewPackingPhoto.src} alt={previewPackingPhoto.alt} className="max-h-[80vh] w-full rounded-lg object-contain" />
          </Card>
        </Dialog>
      )}
    </motion.div>
  );
};

export default OrderDetailPage;
