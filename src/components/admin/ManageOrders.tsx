import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { AdminPortal } from '../../api/adminApi';

type OrderView = 'all' | 'open' | 'pending' | 'confirmed' | 'packed' | 'delivery' | 'exceptions' | 'closed' | 'carts';

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

const PAGE_SIZE = 30;

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['orders', 'rows', 'items', 'data', 'carts']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};

const money = (value?: number) => `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const dateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const orderTotal = (order: any) => order.total ?? order.total_amount ?? order.order_total ?? order.grand_total ?? 0;

const orderStatus = (order: any) => String(order.status || order.rollup_status || 'pending').toLowerCase();

const statusClass = (status: string) => {
  if (['delivered'].includes(status)) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (['cancelled', 'returned'].includes(status)) return 'border-red-500/30 bg-red-500/10 text-red-300';
  if (['delivery_attempted'].includes(status)) return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  if (['packed', 'handed_to_rider', 'at_warehouse', 'out_for_delivery'].includes(status)) return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
  return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
};

const viewMatches = (order: any, view: OrderView) => {
  const status = orderStatus(order);
  if (view === 'all') return true;
  if (view === 'open') return !['delivered', 'cancelled', 'returned'].includes(status);
  if (view === 'delivery') return ['handed_to_rider', 'at_warehouse', 'out_for_delivery'].includes(status);
  if (view === 'exceptions') return ['delivery_attempted', 'cancelled', 'returned'].includes(status);
  if (view === 'closed') return ['delivered', 'cancelled', 'returned'].includes(status);
  return status === view;
};

const getOrderId = (order: any) => String(order.id || order.order_id || '');

const ManageOrders: React.FC = () => {
  const [view, setView] = useState<OrderView>('open');
  const [orders, setOrders] = useState<any[]>([]);
  const [carts, setCarts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [customerDraft, setCustomerDraft] = useState<Record<string, string>>({});
  const [bulkStatus, setBulkStatus] = useState<(typeof ORDER_STATUSES)[number]>('confirmed');
  const [cancelReason, setCancelReason] = useState('Ops cancellation');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, cartsRes] = await Promise.all([
        AdminPortal.listOrders(),
        AdminPortal.listCarts(),
      ]);

      if (!ordersRes.ok) throw new Error((ordersRes.body as any)?.message || 'Failed to load orders');
      if (cartsRes.ok) setCarts(asArray(cartsRes.body));

      setOrders(asArray(ordersRes.body).sort((a, b) => Date.parse(b.created_at || '') - Date.parse(a.created_at || '')));
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected order loading error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [view, query]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!viewMatches(order, view)) return false;
      if (!q) return true;
      const searchable = [
        order.id,
        order.order_id,
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.seller_name,
        order.seller_id,
        order.shipping_address?.city,
        orderStatus(order),
      ].join(' ').toLowerCase();
      return searchable.includes(q);
    });
  }, [orders, query, view]);

  const filteredCarts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return carts;
    return carts.filter((cart) => JSON.stringify(cart).toLowerCase().includes(q));
  }, [carts, query]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pageRows = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleIds = pageRows.map(getOrderId).filter(Boolean);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const metrics = useMemo(() => {
    const open = orders.filter((o) => viewMatches(o, 'open'));
    const exceptions = orders.filter((o) => viewMatches(o, 'exceptions'));
    return {
      open: open.length,
      exceptions: exceptions.length,
      gmv: orders.reduce((sum, order) => sum + Number(orderTotal(order) || 0), 0),
      carts: carts.length,
    };
  }, [carts.length, orders]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return prev.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const applyBulkStatus = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.bulkUpdateOrders({
        updates: selectedIds.map((order_id) => ({ order_id, status: bulkStatus })),
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to update selected orders');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update selected orders');
    } finally {
      setSaving(false);
    }
  };

  const cancelSelected = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.bulkCancelOrders({ order_ids: selectedIds, reason: cancelReason || 'Cancelled by admin' });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to cancel selected orders');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel selected orders');
    } finally {
      setSaving(false);
    }
  };

  const openCustomerEditor = (order: any) => {
    setSelectedOrder(order);
    setCustomerDraft({
      name: order.customer_name || '',
      email: order.customer_email || '',
      phone: order.customer_phone || '',
      address_line1: order.shipping_address?.address_line1 || order.shipping_address?.address || '',
      address_line2: order.shipping_address?.address_line2 || '',
      city: order.shipping_address?.city || '',
    });
  };

  const saveCustomer = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.updateOrderCustomer(getOrderId(selectedOrder), customerDraft);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to update customer details');
      setSelectedOrder(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer details');
    } finally {
      setSaving(false);
    }
  };

  const cancelSingleOrder = async (order: any) => {
    const orderId = getOrderId(order);
    if (!orderId) return;
    const reason = window.prompt(`Cancel order ${order.order_number || orderId} with reason:`, cancelReason || 'Cancelled by admin');
    if (!reason) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.cancelOrder(orderId, reason);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to cancel order');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setSaving(false);
    }
  };

  const views: Array<{ id: OrderView; label: string; count?: number }> = [
    { id: 'open', label: 'Open', count: metrics.open },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'packed', label: 'Packed' },
    { id: 'delivery', label: 'In delivery' },
    { id: 'exceptions', label: 'Exceptions', count: metrics.exceptions },
    { id: 'closed', label: 'Closed' },
    { id: 'all', label: 'All' },
    { id: 'carts', label: 'Carts', count: metrics.carts },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-[#111]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-white">Orders</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-400">Admin order desk for status batches, single-order cancellation, carts, and customer repair.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void load()} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-4">
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Open orders</p><p className="mt-1 text-lg font-semibold text-white">{metrics.open}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Exceptions</p><p className="mt-1 text-lg font-semibold text-amber-300">{metrics.exceptions}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Total GMV in view</p><p className="mt-1 text-lg font-semibold text-white">{money(metrics.gmv)}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Active carts</p><p className="mt-1 text-lg font-semibold text-white">{metrics.carts}</p></div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/10 px-3 py-2">
          {views.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === tab.id ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}
            >
              {tab.label}{typeof tab.count === 'number' ? ` ${tab.count}` : ''}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, phone, seller, city"
              className="w-full rounded-md border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/60"
            />
          </div>

          {view !== 'carts' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-400">{selectedIds.length} selected</span>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as any)} className="rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs text-white">
                {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
              <button disabled={saving || selectedIds.length === 0} onClick={() => void applyBulkStatus()} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40">
                <CheckSquare size={14} /> Apply status
              </button>
              <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-44 rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs text-white" />
              <button disabled={saving || selectedIds.length === 0} onClick={() => void cancelSelected()} className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40">
                <Trash2 size={14} /> Cancel
              </button>
            </div>
          )}
        </div>

        {error && <div className="border-b border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <div className="overflow-x-auto">
          {view === 'carts' ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                <tr><th className="p-3">Cart</th><th className="p-3">Owner</th><th className="p-3">Items</th><th className="p-3">Value</th><th className="p-3">Updated</th></tr>
              </thead>
              <tbody>
                {filteredCarts.map((cart, index) => (
                  <tr key={cart.id || index} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="p-3 font-mono text-xs text-white">{cart.id || cart.guest_cart_id || '-'}</td>
                    <td className="p-3 text-neutral-300">{cart.user_id || cart.guest_cart_id || 'Guest'}</td>
                    <td className="p-3 text-neutral-300">{cart.items?.length || cart.item_count || 0}</td>
                    <td className="p-3 text-white">{money(cart.total_value || cart.total)}</td>
                    <td className="p-3 text-neutral-400">{dateTime(cart.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="w-10 p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="accent-[#f43f5e]" /></th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-10 text-center text-neutral-400">Loading orders...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={9} className="p-10 text-center text-neutral-500">No orders match this view.</td></tr>
                ) : pageRows.map((order) => {
                  const id = getOrderId(order);
                  const status = orderStatus(order);
                  return (
                    <tr key={id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-3"><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelected(id)} className="accent-[#f43f5e]" /></td>
                      <td className="p-3">
                        <p className="font-mono text-xs text-white">{order.order_number || id}</p>
                        <p className="mt-0.5 max-w-[180px] truncate font-mono text-[11px] text-neutral-500">{id}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-white">{order.customer_name || 'Guest customer'}</p>
                        <p className="text-xs text-neutral-500">{order.customer_phone || order.customer_email || '-'}</p>
                      </td>
                      <td className="p-3 text-neutral-300">{order.seller_name || order.seller_id || '-'}</td>
                      <td className="p-3"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(status)}`}>{status.replace(/_/g, ' ')}</span></td>
                      <td className="p-3 text-right font-medium text-white">{money(orderTotal(order))}</td>
                      <td className="p-3 text-neutral-300">{order.shipping_address?.city || order.city || '-'}</td>
                      <td className="p-3 text-neutral-400">{dateTime(order.created_at)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/orders/${id}`} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="View order"><Eye size={14} /></Link>
                          <button onClick={() => openCustomerEditor(order)} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="Edit customer"><Edit3 size={14} /></button>
                          {!['cancelled', 'delivered', 'returned'].includes(status) ? (
                            <button onClick={() => void cancelSingleOrder(order)} className="rounded-md border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10" title="Cancel order">
                              <Ban size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {view !== 'carts' && (
          <div className="flex items-center justify-between border-t border-white/10 p-3 text-xs text-neutral-400">
            <span>{filteredOrders.length} orders • page {page} of {pageCount}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-white/10 p-2 hover:bg-white/10 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded-md border border-white/10 p-2 hover:bg-white/10 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button className="flex-1" onClick={() => setSelectedOrder(null)} aria-label="Close drawer" />
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Customer repair</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{selectedOrder.order_number || getOrderId(selectedOrder)}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"><X size={16} /></button>
            </div>

            <div className="grid gap-3">
              {[
                ['name', 'Name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['address_line1', 'Address line 1'],
                ['address_line2', 'Address line 2'],
                ['city', 'City'],
              ].map(([key, label]) => (
                <label key={key} className="text-xs text-neutral-400">
                  {label}
                  <input
                    value={customerDraft[key] || ''}
                    onChange={(e) => setCustomerDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSelectedOrder(null)} className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Close</button>
              <button disabled={saving} onClick={() => void saveCustomer()} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50">Save changes</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
