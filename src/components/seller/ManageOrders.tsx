import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, Eye, RefreshCw, Search, ShoppingCart, X } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import * as api from '../../api/sellerApi';
import { Catalog } from '../../api/catalogApi';
import { uploadPrivateFile } from '../../api/shared';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';

const STATUS_FILTERS = [
  'all',
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

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PackingDraft = { itemPhotos: Record<string, string>; parcelPhoto: string };

const statusClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'delivered':
    case 'fulfilled':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'pending':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'cancelled':
    case 'returned':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'out_for_delivery':
    case 'handed_to_rider':
    case 'at_warehouse':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    default:
      return 'border-white/20 bg-white/5 text-neutral-300';
  }
};

const toLabel = (value: string) => value.replace(/_/g, ' ');

const dateOnly = (value?: string) => value ? new Date(value).toLocaleDateString('en-PK') : '-';

const getItemImage = (item: any) => item?.product_image || item?.variant_image_url || item?.variant_image || item?.image || item?.product?.image || 'https://via.placeholder.com/80x80?text=No+Image';

const getItemTitle = (item: any) => item?.product_name || item?.title || item?.product_title || item?.product_id || 'Product';

const hydrateMissingItemSnapshots = async (order: Order): Promise<Order> => {
  const items = order.order_items || [];
  const productIds = [...new Set(items
    .filter((item: any) => item.product_id && (!item.product_name || !item.product_image))
    .map((item) => item.product_id))];
  if (!productIds.length) return order;

  const products = await Promise.all(productIds.map(async (id) => {
    const response = await Catalog.getProduct(id).catch(() => null);
    return response?.ok && response.body ? [id, response.body] as const : null;
  }));
  const productById = Object.fromEntries(products.filter((product): product is readonly [string, NonNullable<typeof product>[1]] => Boolean(product)));

  return {
    ...order,
    order_items: items.map((item: any) => {
      const product = productById[item.product_id];
      const variant = product?.variants.find((entry) => String(entry.id) === String(item.variant_id));
      return product ? {
        ...item,
        product_name: item.product_name || product.title,
        product_image: item.product_image || variant?.image_url || product.images?.[0],
        variant_label: item.variant_label || variant?.title,
      } : item;
    }),
  };
};

const ManageOrders: React.FC = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedLoadingOrderId, setExpandedLoadingOrderId] = useState<string | null>(null);
  const [orderDetailsById, setOrderDetailsById] = useState<Record<string, Order>>({});
  const [bookingByOrderId, setBookingByOrderId] = useState<Record<string, NonNullable<Order['delivery_booking']> | null>>({});
  const [airwayBillByOrderId, setAirwayBillByOrderId] = useState<Record<string, string>>({});
  const [packingDrafts, setPackingDrafts] = useState<Record<string, PackingDraft>>({});
  const [uploadingEvidence, setUploadingEvidence] = useState<string | null>(null);
  const [submittingPackingOrderId, setSubmittingPackingOrderId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const fetchOrders = async () => {
    if (!seller?.token) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.Seller.GetOrders(seller.token, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
        limit: 100,
        offset: 0,
      });

      if (!response.ok) {
        throw new Error((response.body as any)?.message || 'Failed to fetch orders');
      }

      const rows = Array.isArray(response.body) ? response.body : [];
      rows.sort((a, b) => {
        const aPending = String(a.status).toLowerCase() === 'pending' ? 0 : 1;
        const bPending = String(b.status).toLowerCase() === 'pending' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setOrders(rows);
      setBookingByOrderId({});
      setAirwayBillByOrderId({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller?.token, statusFilter]);

  useEffect(() => {
    if (!seller?.token) return;
    const missingOrderIds = orders.map((order) => order.id).filter((id): id is string => Boolean(id) && !(id in bookingByOrderId));
    if (!missingOrderIds.length) return;

    void Promise.all(missingOrderIds.map(async (id) => {
      const response = await api.Seller.GetOrderBooking(seller.token, id);
      return [id, response.ok && response.body ? response.body : null] as const;
    })).then((bookings) => setBookingByOrderId((current) => ({ ...current, ...Object.fromEntries(bookings) })));
  }, [bookingByOrderId, orders, seller?.token]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setPreviewImage(null);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const pendingOrders = useMemo(
    () => orders.filter((order) => String(order.status).toLowerCase() === 'pending'),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter((order) => {
      const shippingName = order.shipping_address?.name || (order.shipping_address as any)?.full_name || '';
      const shippingPhone = order.shipping_address?.phone_number || '';
      return [
        order.id,
        order.order_number,
        shippingName,
        shippingPhone,
        order.shipping_address?.city,
        order.status,
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [orders, searchTerm]);

  const metrics = useMemo(() => {
    const closed = ['delivered', 'fulfilled', 'cancelled', 'returned'];
    return {
      open: filteredOrders.filter((order) => !closed.includes(String(order.status).toLowerCase())).length,
      pending: pendingOrders.length,
      delivered: filteredOrders.filter((order) => ['delivered', 'fulfilled'].includes(String(order.status).toLowerCase())).length,
    };
  }, [filteredOrders, pendingOrders]);

  const views = useMemo(() => ([
    { id: 'all' as StatusFilter, label: 'All', count: statusFilter === 'all' ? orders.length : undefined },
    { id: 'pending' as StatusFilter, label: 'Pending', count: statusFilter === 'all' ? pendingOrders.length : undefined },
    { id: 'confirmed' as StatusFilter, label: 'Confirmed' },
    { id: 'packed' as StatusFilter, label: 'Packed' },
    { id: 'handed_to_rider' as StatusFilter, label: 'Handed to rider' },
    { id: 'out_for_delivery' as StatusFilter, label: 'Out for delivery' },
    { id: 'delivered' as StatusFilter, label: 'Delivered' },
    { id: 'cancelled' as StatusFilter, label: 'Cancelled' },
    { id: 'returned' as StatusFilter, label: 'Returned' },
  ]), [orders.length, pendingOrders.length, statusFilter]);

  const handleToggleItems = async (order: Order) => {
    if (!order.id) return;
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(order.id);
    if (orderDetailsById[order.id]) return;

    setExpandedLoadingOrderId(order.id);
    try {
      const [detailRes, bookingRes, airwayBillRes] = await Promise.all([
        api.Seller.GetOrderByID(seller!.token, order.id),
        api.Seller.GetOrderBooking(seller!.token, order.id),
        api.Seller.GetOrderAirwayBill(seller!.token, order.id),
      ]);
      if (detailRes.ok && detailRes.body) {
        const detail = await hydrateMissingItemSnapshots(detailRes.body as Order);
        setOrderDetailsById((prev) => ({ ...prev, [order.id!]: detail }));
      }
      setBookingByOrderId((current) => ({ ...current, [order.id!]: bookingRes.ok && bookingRes.body ? bookingRes.body : null }));
      if (airwayBillRes.ok && airwayBillRes.body?.url) setAirwayBillByOrderId((current) => ({ ...current, [order.id!]: airwayBillRes.body!.url }));
    } finally {
      setExpandedLoadingOrderId((prev) => (prev === order.id ? null : prev));
    }
  };

  const uploadEvidence = async (orderId: string, itemId: string | 'parcel', file?: File) => {
    if (!file || !seller?.token) return;
    const uploadKey = `${orderId}:${itemId}`;
    setUploadingEvidence(uploadKey);
    setError(null);
    try {
      const objectName = await uploadPrivateFile(file, {
        folder: 'orders',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxBytes: 10 * 1024 * 1024,
      }, seller.token);
      setPackingDrafts((current) => {
        const draft = current[orderId] || { itemPhotos: {}, parcelPhoto: '' };
        return {
          ...current,
          [orderId]: itemId === 'parcel'
            ? { ...draft, parcelPhoto: objectName }
            : { ...draft, itemPhotos: { ...draft.itemPhotos, [itemId]: objectName } },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload packing photo');
    } finally {
      setUploadingEvidence(null);
    }
  };

  const submitPackingEvidence = async (order: Order, detail: Order, draft: PackingDraft) => {
    if (!seller?.token || !order.id) return;
    const items = detail.order_items || [];
    if (order.status !== 'confirmed' || !draft.parcelPhoto || items.some((item) => !item.id || !draft.itemPhotos[item.id])) return;
    setSubmittingPackingOrderId(order.id);
    setError(null);
    try {
      const response = await api.Seller.submitPackingEvidence(seller.token, order.id, {
        item_photos: items.map((item) => ({ order_item_id: item.id!, url: draft.itemPhotos[item.id!] })),
        packed_parcel_photo_url: draft.parcelPhoto,
      });
      if (!response.ok || !response.body) throw new Error((response.body as any)?.message || 'Could not mark order packed');
      const updated = response.body as Order;
      setOrderDetailsById((current) => ({ ...current, [order.id!]: updated }));
      setOrders((current) => current.map((entry) => entry.id === order.id ? { ...entry, status: updated.status, packing_evidence: updated.packing_evidence } : entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark order packed');
    } finally {
      setSubmittingPackingOrderId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card padding={0}>
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-white">Orders</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Your packing desk. Juno operations confirm the address and book DEX; you upload packing evidence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              label="Refresh"
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => void fetchOrders()}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/10 text-xs">
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Open orders</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.open}</p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Needs action</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">{metrics.pending}</p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Delivered</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.delivered}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/10 px-3 py-2">
          {views.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${statusFilter === tab.id ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}
            >
              {tab.label}
              {typeof tab.count === 'number' ? ` ${tab.count}` : ''}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search order, customer, phone, city"
              className="w-full rounded-md border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/60"
            />
          </div>
          <span className="text-xs text-neutral-400">{filteredOrders.length} orders in view</span>
        </div>

        {pendingOrders.length > 0 && (
          <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              {pendingOrders.length} pending order(s) are with Juno operations for address review. You can pack them once they show as Confirmed.
            </span>
          </div>
        )}

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Juno status</th>
                <th className="p-3">DEX shipping</th>
                <th className="p-3">Packing</th>
                <th className="w-24 p-3">City</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-neutral-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-neutral-500">No orders match this view.</td>
                </tr>
              ) : (
                filteredOrders.flatMap((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const detail = (order.id && orderDetailsById[order.id]) || order;
                  const items = detail.order_items || [];
                  const booking = (order.id && bookingByOrderId[order.id]) ?? detail.delivery_booking;
                  const dexStatus = booking?.status ? String(booking.status).toLowerCase() : '';

                  const rows: React.ReactNode[] = [
                    <tr key={order.id} className="border-b border-white/5 align-top hover:bg-white/[0.03]">
                      <td className="p-3">
                        <p className="font-mono text-xs text-white">{order.order_number || order.id}</p>
                        <p className="mt-1 font-mono text-[10px] text-neutral-500">{order.id}</p>
                      </td>

                      <td className="p-3">
                        <p className="font-medium text-white">
                          {order.shipping_address?.name || (order.shipping_address as any)?.full_name || 'Customer'}
                        </p>
                        <p className="text-xs text-neutral-500">{order.shipping_address?.phone_number || '-'}</p>
                      </td>

                      <td className="p-3">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      <td className="p-3">
                        {booking === undefined ? (
                          <span className="text-xs text-neutral-500">Loading…</span>
                        ) : dexStatus ? (
                          <span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(dexStatus)}`}>
                            {toLabel(dexStatus)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">Not booked</span>
                        )}
                      </td>

                      <td className="p-3">
                        {detail.packing_evidence ? (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">Evidence sent</span>
                        ) : String(order.status).toLowerCase() === 'confirmed' ? (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">Photos needed</span>
                        ) : (
                          <span className="text-xs text-neutral-500">-</span>
                        )}
                      </td>

                      <td className="w-24 max-w-24 truncate p-3 text-neutral-300">
                        {order.shipping_address?.city || '-'}
                      </td>

                      <td className="p-3 text-neutral-400">{dateOnly(order.created_at)}</td>

                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`${prefix}/dashboard/orders/${order.id}`)}
                            className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
                            title="View order"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => { void handleToggleItems(order); }}
                            className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"
                            title="Order items"
                          >
                            <ChevronDown size={14} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                          </button>
                        </div>
                      </td>
                    </tr>,
                  ];

                  if (isExpanded) {
                    const isDetailsLoading = expandedLoadingOrderId === order.id;
                    const savedEvidence = detail.packing_evidence;
                    const draft = packingDrafts[order.id!] || {
                      itemPhotos: Object.fromEntries((savedEvidence?.item_photos || []).map((photo) => [photo.order_item_id, photo.url])),
                      parcelPhoto: savedEvidence?.packed_parcel_photo_url || '',
                    };
                    const packingLocked = order.status !== 'confirmed' || Boolean(savedEvidence);
                    const allPhotosReady = items.length > 0 && items.every((item) => item.id && draft.itemPhotos[item.id]) && Boolean(draft.parcelPhoto);
                    rows.push(
                      <tr key={`${order.id}-items`} className="border-b border-white/5 bg-black/20">
                        <td colSpan={8} className="p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Order items</p>
                            {order.id && airwayBillByOrderId[order.id] ? <a href={airwayBillByOrderId[order.id]} target="_blank" rel="noreferrer" download className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white">Download airway bill</a> : null}
                          </div>
                          {isDetailsLoading ? (
                            <p className="text-xs text-neutral-400">Loading order item details...</p>
                          ) : items.length > 0 ? (
                            <>
                              <div className="grid gap-2 md:grid-cols-2">
                                {items.map((item: any, idx) => (
                                <div key={`${order.id}-${item.product_id}-${item.variant_id}-${idx}`} className="rounded-md border border-white/10 bg-black/30 p-3">
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage({ src: getItemImage(item), alt: getItemTitle(item) })}
                                      className="shrink-0 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                      title="Expand product image"
                                    >
                                      <img
                                        src={getItemImage(item)}
                                        alt={getItemTitle(item)}
                                        className="h-28 w-28 rounded-md border border-white/10 object-cover transition-transform hover:scale-[1.03]"
                                      />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-base font-semibold text-white">{getItemTitle(item)}</p>
                                      <p className="mt-1.5 text-sm font-medium text-primary">Variant: {item.variant_label || item.variant_id || 'N/A'}</p>
                                      {item.variant_options && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {Object.entries(item.variant_options).map(([key, value]) => (
                                            <span key={key} className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-neutral-300">
                                              {key}: {String(value)}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <p className="text-sm font-medium text-white">Qty: {item.quantity || 0}</p>
                                    </div>
                                  </div>
                                  <label className="mt-3 block border-t border-white/10 pt-3 text-[11px] text-neutral-400">
                                    Packed item photo
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      disabled={packingLocked || !item.id}
                                      onChange={(event) => void uploadEvidence(order.id!, item.id, event.target.files?.[0])}
                                      className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black disabled:opacity-50"
                                    />
                                    <span className="mt-1 block text-[10px] text-neutral-500">
                                      {item.id && draft.itemPhotos[item.id] ? 'Saved privately' : uploadingEvidence === `${order.id}:${item.id}` ? 'Uploading…' : item.id ? 'Photo required' : 'Order item ID is missing'}
                                    </span>
                                  </label>
                                </div>
                                ))}
                              </div>
                              <div className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-white/10 bg-black/30 p-3">
                              <label className="min-w-64 flex-1 text-xs font-medium text-white">
                                Packed parcel / QC photo
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  disabled={packingLocked}
                                  onChange={(event) => void uploadEvidence(order.id!, 'parcel', event.target.files?.[0])}
                                  className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black disabled:opacity-50"
                                />
                                <span className="mt-1 block text-[10px] font-normal text-neutral-500">{draft.parcelPhoto ? 'Saved privately' : uploadingEvidence === `${order.id}:parcel` ? 'Uploading…' : 'Parcel photo required'}</span>
                              </label>
                              <Button
                                label={savedEvidence ? 'Packing evidence saved' : 'Mark packed'}
                                variant="primary"
                                size="sm"
                                onClick={() => void submitPackingEvidence(order, detail, draft)}
                                isLoading={submittingPackingOrderId === order.id}
                                isDisabled={packingLocked || !allPhotosReady}
                              />
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-neutral-400">No order items available.</p>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 p-3 text-xs text-neutral-400">
          <span>{filteredOrders.length} orders • {pendingOrders.length} awaiting action</span>
        </div>
      </Card>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.alt}
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img src={previewImage.src} alt={previewImage.alt} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black"
              aria-label="Close image preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
