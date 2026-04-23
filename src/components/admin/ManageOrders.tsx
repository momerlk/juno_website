import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Eye, RefreshCw, Search, ShoppingCart, Truck } from 'lucide-react';
import { AdminCommerce, getAllCarts } from '../../api/adminApi';
import type { Order, ParentOrder } from '../../api/api.types';

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

const ManageOrders: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'carts'>('orders');
  const [orders, setOrders] = useState<ParentOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [carts, setCarts] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [offset, setOffset] = useState(0);

  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [expandedLoadingParentId, setExpandedLoadingParentId] = useState<string | null>(null);
  const [childDetailsByParent, setChildDetailsByParent] = useState<Record<string, Order[]>>({});
  const [statusPanelParentId, setStatusPanelParentId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [statusNote, setStatusNote] = useState('');

  const PAGE_SIZE = 20;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'orders') {
        const res = await AdminCommerce.listParentOrders({
          status: statusFilter,
          limit: PAGE_SIZE,
          offset,
        });

        if (!res.ok) {
          throw new Error((res.body as any)?.message || 'Failed to fetch parent orders');
        }

        const payload = res.body as { orders?: ParentOrder[]; total?: number };
        setOrders((payload.orders ?? []).slice().sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        setTotalOrders(payload.total ?? 0);
      } else {
        const res = await getAllCarts();
        if (!res.ok) {
          throw new Error((res.body as any)?.message || 'Failed to fetch carts');
        }

        const rows = Array.isArray(res.body) ? res.body : [];
        setCarts(rows.slice().sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, offset]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const q = searchTerm.toLowerCase();
    return orders.filter((order) => {
      const childSellers = order.child_summaries?.map((child) => child.seller_name || '').join(' ') || '';
      return [
        order.id,
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.status,
        order.rollup_status,
        childSellers,
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [orders, searchTerm]);

  const filteredCarts = useMemo(() => {
    if (!searchTerm.trim()) return carts;
    const q = searchTerm.toLowerCase();
    return carts.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [carts, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const pageIndex = Math.floor(offset / PAGE_SIZE) + 1;

  const openStatusPanel = (order: ParentOrder) => {
    setStatusPanelParentId((prev) => (prev === order.id ? null : order.id));
    const firstChild = order.child_summaries?.[0];
    setSelectedChildId(firstChild?.order_id || '');
    setSelectedStatus(firstChild?.status || order.rollup_status || order.status || 'pending');
    setStatusNote('');
  };

  const handleToggleChildren = async (order: ParentOrder) => {
    if (expandedParentId === order.id) {
      setExpandedParentId(null);
      return;
    }

    setExpandedParentId(order.id);

    if (childDetailsByParent[order.id]) return;

    setExpandedLoadingParentId(order.id);
    try {
      const detailRes = await AdminCommerce.getParentOrder(order.id);
      if (detailRes.ok && (detailRes.body as any)?.children) {
        const detail = detailRes.body as { children: Order[] };
        setChildDetailsByParent((prev) => ({ ...prev, [order.id]: detail.children || [] }));
      }
    } finally {
      setExpandedLoadingParentId((prev) => (prev === order.id ? null : prev));
    }
  };

  const handleInlineStatusUpdate = async (parentId: string) => {
    if (!selectedChildId) {
      setError('Please select a child order first.');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      const res = await AdminCommerce.updateOrderStatus(selectedChildId, selectedStatus, statusNote || undefined);
      if (!res.ok) {
        throw new Error((res.body as any)?.message || 'Failed to update status');
      }

      setStatusPanelParentId(null);
      setStatusNote('');
      await fetchData();
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
      transition={{ duration: 0.5 }}
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
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setOffset(0);
                }}
                className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full transition-all ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
              >
                Parent Orders
              </button>
              <button
                onClick={() => {
                  setActiveTab('carts');
                  setOffset(0);
                }}
                className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full transition-all ${activeTab === 'carts' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
              >
                Active Carts
              </button>

              {activeTab === 'orders' && (
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number]);
                    setOffset(0);
                  }}
                  className="bg-white/5 border border-white/10 text-neutral-300 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold outline-none"
                >
                  {STATUS_FILTERS.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full lg:w-auto gap-2">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer, phone, email, order id, seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10 pr-4 py-2 w-full text-sm text-white"
            />
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/20 text-red-400 border border-red-700 rounded-lg text-center p-4 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr className="text-neutral-400 text-xs uppercase tracking-wider">
              {activeTab === 'orders' ? (
                <>
                  <th className="p-4 font-medium">Parent Order</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Financials</th>
                  <th className="p-4 font-medium">Rollup Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </>
              ) : (
                <>
                  <th className="p-4 font-medium">User ID</th>
                  <th className="p-4 font-medium">Items Count</th>
                  <th className="p-4 font-medium">Total Value</th>
                  <th className="p-4 font-medium">Last Updated</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="text-sm font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={activeTab === 'orders' ? 5 : 4} className="text-center p-20 text-neutral-400 animate-pulse font-mono">
                  Querying transaction logs...
                </td>
              </tr>
            ) : activeTab === 'orders' ? (
              filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-20 text-neutral-500 italic">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.flatMap((order) => {
                  const status = order.rollup_status || order.status || 'pending';
                  const isExpanded = expandedParentId === order.id;
                  const isStatusPanelOpen = statusPanelParentId === order.id;
                  const childCount = order.child_order_ids?.length || 0;

                  const rows: React.ReactNode[] = [
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors align-top">
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-neutral-500 font-mono text-[10px]">ID: {order.id}</span>
                          <span className="text-white font-mono text-xs">Date: {new Date(order.created_at).toLocaleString()}</span>
                          <span className="text-[10px] text-neutral-400">{childCount} child order(s)</span>
                          {(order.child_order_ids?.length ?? 0) > 0 && (
                            <span className="text-[10px] text-neutral-400 break-all">
                              Child Order #s: {order.child_order_ids.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-neutral-300">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-white">{order.customer_name || 'Guest Customer'}</span>
                          <span className="text-xs text-neutral-500">{order.customer_phone || 'No phone'}</span>
                          <span className="text-xs text-neutral-500">{order.customer_email || 'No email'}</span>
                          <span className="text-xs text-neutral-500">
                            {order.shipping_address?.city || 'N/A'}{order.shipping_address?.province ? `, ${order.shipping_address.province}` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-neutral-300">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-white">Total: {formatCurrency(order.total_amount)}</span>
                          <span className="text-xs text-neutral-500">Subtotal: {formatCurrency(order.subtotal)}</span>
                          <span className="text-xs text-neutral-500">Shipping: {formatCurrency(order.shipping_fee)}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[status] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'}`}>
                          {status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold"
                          >
                            <Eye size={12} /> View
                          </button>

                          <button
                            onClick={() => { void handleToggleChildren(order); }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold"
                          >
                            <ChevronDown size={12} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            Child Orders
                          </button>

                          <button
                            onClick={() => openStatusPanel(order)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-[10px] uppercase tracking-wider font-bold"
                          >
                            <Truck size={12} /> Update Status
                          </button>
                        </div>
                      </td>
                    </tr>,
                  ];

                  if (isExpanded) {
                    const detailedChildren = childDetailsByParent[order.id] || [];
                    const isDetailsLoading = expandedLoadingParentId === order.id;
                    rows.push(
                      <tr key={`${order.id}-children`} className="border-b border-white/5 bg-black/20">
                        <td colSpan={5} className="p-4">
                          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <h4 className="text-xs uppercase tracking-widest text-white/70 font-black mb-3">Child Orders Snapshot</h4>
                            {isDetailsLoading ? (
                              <p className="text-xs text-neutral-400 animate-pulse">Loading child order details...</p>
                            ) : detailedChildren.length > 0 ? (
                              <div className="space-y-3">
                                {detailedChildren.map((child) => (
                                  <div key={child.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="text-[10px] font-mono text-white break-all">Order # {child.id}</p>
                                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[child.status] || 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20'}`}>
                                        {child.status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-neutral-300 mt-1">{child.seller_name || child.seller_id}</p>
                                    <p className="text-[11px] text-neutral-400 mt-1">
                                      Items: <span className="text-white">{child.order_items?.length || 0}</span> • Total: <span className="text-white">{formatCurrency(child.total)}</span>
                                    </p>

                                    <div className="mt-3 space-y-2">
                                      {(child.order_items || []).map((item, idx) => (
                                        <div key={`${child.id}-${item.product_id}-${item.variant_id}-${idx}`} className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                                          <div className="flex gap-2.5">
                                            <img
                                              src={item.product_image || 'https://via.placeholder.com/80x80?text=No+Image'}
                                              alt={item.product_name || 'Product'}
                                              className="h-14 w-14 rounded-md object-cover border border-white/10"
                                            />
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-bold text-white truncate">{item.product_name || item.product_id}</p>
                                              <p className="text-[11px] text-primary mt-0.5">Variant: {item.variant_label || item.variant_id}</p>
                                              {item.variant_options && (
                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                  {Object.entries(item.variant_options).map(([key, value]) => (
                                                    <span key={key} className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/80">
                                                      {key}: {value}
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <p className="text-[11px] text-white">Qty: {item.quantity}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-400">No detailed child data available.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (isStatusPanelOpen) {
                    rows.push(
                      <tr key={`${order.id}-status-panel`} className="border-b border-white/5 bg-black/20">
                        <td colSpan={5} className="p-4">
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <h4 className="text-xs uppercase tracking-widest text-primary font-black mb-3">Inline Status Update</h4>
                            <div className="grid gap-3 lg:grid-cols-4">
                              <select
                                value={selectedChildId}
                                onChange={(e) => {
                                  const childId = e.target.value;
                                  setSelectedChildId(childId);
                                  const child = order.child_summaries?.find((x) => x.order_id === childId);
                                  if (child?.status) setSelectedStatus(child.status);
                                }}
                                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="">Select child order</option>
                                {(order.child_summaries || []).map((child) => (
                                  <option key={child.order_id} value={child.order_id}>
                                    {(child.seller_name || child.seller_id) + ' • ' + child.order_id.slice(0, 8)}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                                ))}
                              </select>

                              <input
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                placeholder="Status note (optional)"
                                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                              />

                              <button
                                onClick={() => handleInlineStatusUpdate(order.id)}
                                disabled={isUpdating || !selectedChildId}
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
              )
            ) : filteredCarts.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-20 text-neutral-500 italic">No carts found.</td>
              </tr>
            ) : (
              filteredCarts.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono text-xs">
                  <td className="p-4 text-white font-sans">{item.user_id}</td>
                  <td className="p-4 text-neutral-300">{item.items?.length || 0} items</td>
                  <td className="p-4 text-white font-bold">Rs {item.total_value?.toLocaleString() || 0}</td>
                  <td className="p-4 text-neutral-500">{new Date(item.updated_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeTab === 'orders' && totalOrders > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-neutral-500">Page {pageIndex} of {totalPages} • {totalOrders} total</p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset((prev) => (prev + PAGE_SIZE < totalOrders ? prev + PAGE_SIZE : prev))}
              disabled={offset + PAGE_SIZE >= totalOrders}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageOrders;
