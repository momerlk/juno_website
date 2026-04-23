import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, Eye, RefreshCw, Search, ShoppingCart, Truck } from 'lucide-react';
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
  if (normalized === 'confirmed') return ['packed', 'cancelled'];
  if (normalized === 'packed') return ['handed_to_rider', 'cancelled'];
  return [];
};

const toLabel = (value: string) => value.replace(/_/g, ' ');

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
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');

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
        status: selectedStatus as 'confirmed' | 'packed' | 'handed_to_rider' | 'cancelled',
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <ShoppingCart size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Order Management</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])}
                className="bg-white/5 border border-white/10 text-neutral-300 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold outline-none"
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {toLabel(status)}
                  </option>
                ))}
              </select>
              <span className="text-[10px] uppercase tracking-wider font-bold rounded-full px-3 py-1 bg-white/5 text-neutral-300 border border-white/10">
                {orders.length} orders
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full lg:w-auto gap-2">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer, phone, order id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10 pr-4 py-2 w-full text-sm text-white"
            />
          </div>
          <button
            onClick={() => void fetchOrders()}
            className="px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-200 text-sm font-bold">Pending orders require immediate action</p>
                <p className="text-yellow-300/80 text-xs mt-1">
                  {pendingOrders.length} pending order(s) are pinned at the top until confirmed or cancelled.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-red-900/20 text-red-400 border border-red-700 rounded-lg text-center p-4 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr className="text-neutral-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Order</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Items</th>
              <th className="p-4 font-medium">Financials</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="text-sm font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center p-20 text-neutral-400 animate-pulse font-mono">
                  Loading seller orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-20 text-neutral-500 italic">No orders found.</td>
              </tr>
            ) : (
              filteredOrders.flatMap((order) => {
                const isExpanded = expandedOrderId === order.id;
                const isStatusPanelOpen = statusPanelOrderId === order.id;
                const detail = (order.id && orderDetailsById[order.id]) || order;
                const transitions = getAllowedTransitions(order.status);
                const items = detail.order_items || [];
                const financials = (detail as any).financials || {};

                const rows: React.ReactNode[] = [
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors align-top">
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-mono text-xs">#{order.order_number || order.id}</span>
                        <span className="text-neutral-500 font-mono text-[10px]">ID: {order.id}</span>
                        <span className="text-xs text-neutral-300">{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="p-4 text-neutral-300">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-white">{order.shipping_address?.name || (order.shipping_address as any)?.full_name || 'Customer'}</span>
                        <span className="text-xs text-neutral-500">{order.shipping_address?.phone_number || 'No phone'}</span>
                        <span className="text-xs text-neutral-500">
                          {order.shipping_address?.city || 'N/A'}{order.shipping_address?.province ? `, ${order.shipping_address.province}` : ''}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-neutral-300">
                      <div className="flex flex-col gap-1">
                        <span className="text-white">{items.length} item(s)</span>
                        <span className="text-xs text-neutral-500">Qty: {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                      </div>
                    </td>

                    <td className="p-4 text-neutral-300">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-white">Total: {formatCurrency(order.total)}</span>
                        <span className="text-xs text-neutral-500">Commission: {formatCurrency(financials.commission)}</span>
                        <span className="text-xs text-neutral-500">Payout: {formatCurrency(financials.seller_payout)}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <OrderStatusBadge status={order.status} />
                        <span className={`inline-flex w-fit px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[order.status] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'}`}>
                          {toLabel(order.status).toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => navigate(`${prefix}/dashboard/orders/${order.id}`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold"
                        >
                          <Eye size={12} /> View
                        </button>

                        <button
                          onClick={() => { void handleToggleItems(order); }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold"
                        >
                          <ChevronDown size={12} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                          Order Items
                        </button>

                        <button
                          onClick={() => openStatusPanel(order)}
                          disabled={transitions.length === 0}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-[10px] uppercase tracking-wider font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Truck size={12} /> Update Status
                        </button>
                      </div>
                    </td>
                  </tr>,
                ];

                if (isExpanded) {
                  const isDetailsLoading = expandedLoadingOrderId === order.id;
                  rows.push(
                    <tr key={`${order.id}-items`} className="border-b border-white/5 bg-black/20">
                      <td colSpan={6} className="p-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <h4 className="text-xs uppercase tracking-widest text-white/70 font-black mb-3">Order Items</h4>
                          {isDetailsLoading ? (
                            <p className="text-xs text-neutral-400 animate-pulse">Loading order item details...</p>
                          ) : items.length > 0 ? (
                            <div className="space-y-3">
                              {items.map((item: any, idx) => (
                                <div key={`${order.id}-${item.product_id}-${item.variant_id}-${idx}`} className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                                  <div className="flex gap-2.5">
                                    <img
                                      src={getItemImage(item)}
                                      alt={getItemTitle(item)}
                                      className="h-14 w-14 rounded-md object-cover border border-white/10"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-white truncate">{getItemTitle(item)}</p>
                                      <p className="text-[11px] text-primary mt-0.5">Variant: {item.variant_label || item.variant_id || 'N/A'}</p>
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
                          ) : (
                            <p className="text-xs text-neutral-400">No order items available.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (isStatusPanelOpen) {
                  rows.push(
                    <tr key={`${order.id}-status-panel`} className="border-b border-white/5 bg-black/20">
                      <td colSpan={6} className="p-4">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                          <h4 className="text-xs uppercase tracking-widest text-primary font-black mb-3">Inline Status Update</h4>
                          <div className="grid gap-3 lg:grid-cols-3">
                            <select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
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
                              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                            />

                            <button
                              onClick={() => void handleStatusUpdate(order)}
                              disabled={isUpdating || transitions.length === 0}
                              className="rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isUpdating ? 'Updating...' : 'Apply'}
                            </button>
                          </div>
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
    </motion.div>
  );
};

export default ManageOrders;
