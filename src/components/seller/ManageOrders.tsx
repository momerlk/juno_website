import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, Eye, RefreshCw, Search, ShoppingCart, Truck } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import * as api from '../../api/sellerApi';
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

const formatCurrency = (value?: number) => `Rs ${(value ?? 0).toLocaleString()}`;

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

const getAllowedTransitions = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return ['confirmed', 'cancelled'];
  if (normalized === 'confirmed') return ['cancelled'];
  if (normalized === 'packed') return ['handed_to_rider', 'cancelled'];
  return [];
};

const toLabel = (value: string) => value.replace(/_/g, ' ');

const dateOnly = (value?: string) => value ? new Date(value).toLocaleDateString('en-PK') : '-';

const getItemImage = (item: any) => item?.product_image || item?.image || item?.product?.image || 'https://via.placeholder.com/80x80?text=No+Image';

const getItemTitle = (item: any) => item?.product_name || item?.title || item?.product_title || item?.product_id || 'Product';

const ManageOrders: React.FC = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedLoadingOrderId, setExpandedLoadingOrderId] = useState<string | null>(null);
  const [orderDetailsById, setOrderDetailsById] = useState<Record<string, Order>>({});

  const [statusPanelOrderId, setStatusPanelOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('confirmed');
  const [statusNote, setStatusNote] = useState('');

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
      gmv: filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0),
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

  const openStatusPanel = (order: Order) => {
    const transitions = getAllowedTransitions(order.status);
    setStatusPanelOrderId((prev) => (prev === order.id ? null : order.id || null));
    setSelectedStatus(transitions[0] || String(order.status || 'pending'));
    setStatusNote('');
  };

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
      const detailRes = await api.Seller.GetOrderByID(seller!.token, order.id);
      if (detailRes.ok && detailRes.body) {
        setOrderDetailsById((prev) => ({ ...prev, [order.id!]: detailRes.body as Order }));
      }
    } finally {
      setExpandedLoadingOrderId((prev) => (prev === order.id ? null : prev));
    }
  };

  const handleStatusUpdate = async (order: Order) => {
    if (!order.id || !seller?.token) return;

    setIsUpdating(true);
    setError(null);
    try {
      const response = await api.Seller.UpdateOrderStatus(seller.token, order.id, {
        status: selectedStatus as 'confirmed' | 'handed_to_rider' | 'cancelled',
        note: statusNote || undefined,
      });

      if (!response.ok) {
        throw new Error((response.body as any)?.message || 'Failed to update status');
      }

      setStatusPanelOrderId(null);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
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
              Your fulfillment desk for confirming, packing, and handing orders to the rider.
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

        <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-4">
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Open orders</p>
            <p className="mt-1 text-lg font-semibold text-white">{metrics.open}</p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Needs action</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">{metrics.pending}</p>
          </div>
          <div className="bg-[#111] p-3">
            <p className="text-neutral-500">Total value in view</p>
            <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(metrics.gmv)}</p>
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
              {pendingOrders.length} pending order(s) are pinned at the top until confirmed or cancelled.
            </span>
          </div>
        )}

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Juno status</th>
                <th className="p-3">DEX shipping</th>
                <th className="p-3 text-right">Financials</th>
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
                  const isStatusPanelOpen = statusPanelOrderId === order.id;
                  const detail = (order.id && orderDetailsById[order.id]) || order;
                  const transitions = getAllowedTransitions(order.status);
                  const items = detail.order_items || [];
                  const financials = (detail as any).financials || {};
                  const booking = detail.delivery_booking;
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
                        {dexStatus ? (
                          <span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(dexStatus)}`}>
                            {toLabel(dexStatus)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">Not booked</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <p className="font-medium text-white">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-neutral-500">Commission {formatCurrency(financials.commission)}</p>
                        <p className="text-xs text-neutral-500">Payout {formatCurrency(financials.seller_payout)}</p>
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
                          <button
                            onClick={() => openStatusPanel(order)}
                            disabled={transitions.length === 0}
                            className="rounded-md border border-primary/30 p-2 text-primary hover:bg-primary/10 disabled:opacity-40"
                            title="Update status"
                          >
                            <Truck size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>,
                  ];

                  if (isExpanded) {
                    const isDetailsLoading = expandedLoadingOrderId === order.id;
                    rows.push(
                      <tr key={`${order.id}-items`} className="border-b border-white/5 bg-black/20">
                        <td colSpan={8} className="p-3">
                          <p className="mb-3 text-xs uppercase tracking-wide text-neutral-500">Order items</p>
                          {isDetailsLoading ? (
                            <p className="text-xs text-neutral-400">Loading order item details...</p>
                          ) : items.length > 0 ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              {items.map((item: any, idx) => (
                                <div key={`${order.id}-${item.product_id}-${item.variant_id}-${idx}`} className="flex gap-3 rounded-md border border-white/10 bg-black/30 p-3">
                                  <img
                                    src={getItemImage(item)}
                                    alt={getItemTitle(item)}
                                    className="h-14 w-14 rounded-md border border-white/10 object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white">{getItemTitle(item)}</p>
                                    <p className="mt-0.5 text-[11px] text-primary">Variant: {item.variant_label || item.variant_id || 'N/A'}</p>
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
                                    <p className="text-[11px] text-white">Qty: {item.quantity || 0}</p>
                                    <p className="text-[11px] text-neutral-400">{formatCurrency(item.line_total ?? item.total_price ?? 0)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-neutral-400">No order items available.</p>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  if (isStatusPanelOpen) {
                    rows.push(
                      <tr key={`${order.id}-status-panel`} className="border-b border-white/5 bg-black/20">
                        <td colSpan={8} className="p-3">
                          <p className="mb-3 text-xs uppercase tracking-wide text-neutral-500">Inline status update</p>
                          <div className="grid gap-2 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]">
                            <select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
                            >
                              {transitions.length === 0 ? (
                                <option value={order.status}>No transition available</option>
                              ) : (
                                transitions.map((status) => (
                                  <option key={status} value={status}>{toLabel(status)}</option>
                                ))
                              )}
                            </select>

                            <input
                              value={statusNote}
                              onChange={(e) => setStatusNote(e.target.value)}
                              placeholder="Status note (optional)"
                              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
                            />

                            <Button
                              label="Push status"
                              variant="primary"
                              size="sm"
                              onClick={() => void handleStatusUpdate(order)}
                              isLoading={isUpdating}
                              isDisabled={transitions.length === 0}
                            />
                          </div>
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
    </div>
  );
};

export default ManageOrders;
