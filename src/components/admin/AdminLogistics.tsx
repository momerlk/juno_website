import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Truck,
  X,
} from 'lucide-react';
import { AdminFinancials, AdminLogistics as LogisticsAPI, AdminPortal, type LogisticsCarrier } from '../../api/adminApi';

type LogisticsView = 'ready' | 'review' | 'booked' | 'exceptions' | 'exports' | 'config' | 'financials';

const VIEWS: Array<{ id: LogisticsView; label: string }> = [
  { id: 'ready', label: 'Ready' },
  { id: 'review', label: 'Needs review' },
  { id: 'booked', label: 'Booked' },
  { id: 'exceptions', label: 'Pickup aging' },
  { id: 'exports', label: 'Exports' },
  { id: 'config', label: 'Policy' },
  { id: 'financials', label: 'Financials' },
];

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['rows', 'orders', 'items', 'exports', 'data']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};

const money = (value?: number) => `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const dateText = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getOrderId = (order: any) => String(order?.id || order?.order_id || '');
const getOrderNumber = (order: any) => String(order?.order_number || order?.id || order?.order_id || '');
const getOrderStatus = (order: any) => String(order?.status || 'pending').toLowerCase();
const getBookingStatus = (order: any, booking: any) => String(order?.booking_status || order?.booking?.status || booking?.parcel?.booking?.status || booking?.booking_status || '').toLowerCase();

const statusClass = (status: string) => {
  if (['booked', 'exported', 'picked_up', 'delivered'].includes(status)) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (['invalid', 'failed', 'blocked', 'delivery_attempted'].includes(status)) return 'border-red-500/30 bg-red-500/10 text-red-300';
  if (['warning', 'urgent', 'overdue'].includes(status)) return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  return 'border-white/15 bg-white/5 text-neutral-300';
};

const AdminLogistics: React.FC = () => {
  const [view, setView] = useState<LogisticsView>('ready');
  const [carrier, setCarrier] = useState<LogisticsCarrier>('dex');
  const [orders, setOrders] = useState<any[]>([]);
  const [bookingById, setBookingById] = useState<Record<string, any>>({});
  const [agingRows, setAgingRows] = useState<any[]>([]);
  const [exportRows, setExportRows] = useState<any[]>([]);
  const [financialRows, setFinancialRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [locationDraft, setLocationDraft] = useState({ province: '', district: '', ward: '', specific_address: '' });
  const [manualDraft, setManualDraft] = useState({ consignment_number: '', airway_bill_number: '', tracking_url: '' });
  const [overrideDraft, setOverrideDraft] = useState({ dispatch_mode: 'carrier_pickup' as 'carrier_pickup' | 'seller_center_dropoff' | 'manual_override', reason: '', approval_reference: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    const res = await LogisticsAPI.getOperationalConfig();
    if (res.ok) {
      setConfig(res.body);
      setConfigDraft({
        max_strikes_before_suspension: String((res.body as any)?.max_strikes_before_suspension ?? (res.body as any)?.strike_suspension_threshold ?? ''),
        strike_expiry_days: String((res.body as any)?.strike_expiry_days ?? ''),
        dex_pickup_threshold: String((res.body as any)?.dex_pickup_threshold ?? ''),
        sla_hours: String((res.body as any)?.sla_hours ?? (res.body as any)?.dex_seller_center_dropoff_sla_hours ?? ''),
        supported_carriers: Array.isArray((res.body as any)?.supported_carriers) ? (res.body as any).supported_carriers.join(', ') : '',
      });
    }
  };

  const loadOrders = async () => {
    const res = await AdminPortal.listOrders();
    if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to load orders');
    const rows = asArray(res.body)
      .filter((order) => !['cancelled', 'returned'].includes(getOrderStatus(order)))
      .sort((a, b) => Date.parse(b.created_at || '') - Date.parse(a.created_at || ''));

    setOrders(rows);

    const sample = rows.slice(0, 80);
    const bookingEntries = await Promise.all(sample.map(async (order) => {
      const orderId = getOrderId(order);
      const bookingRes = await LogisticsAPI.getOrderBookingData(orderId, carrier);
      return [orderId, bookingRes.ok ? bookingRes.body : { valid: false, blocking_errors: [(bookingRes.body as any)?.message || 'Booking data unavailable'] }] as const;
    }));

    const map: Record<string, any> = {};
    bookingEntries.forEach(([id, booking]) => { map[id] = booking; });
    setBookingById(map);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadConfig();

      if (['ready', 'review', 'booked'].includes(view)) {
        await loadOrders();
      }

      if (view === 'exceptions') {
        const res = await LogisticsAPI.getPickupAging({ carrier });
        if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to load pickup aging');
        setAgingRows(asArray(res.body));
      }

      if (view === 'exports') {
        const res = await LogisticsAPI.getExports({ carrier, page: 1, limit: 100 });
        if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to load exports');
        setExportRows(asArray(res.body));
      }

      if (view === 'financials') {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const to = now.toISOString().slice(0, 10);
        const [summaryRes, ordersRes] = await Promise.all([
          AdminFinancials.getSummary({ from, to, carrier }),
          AdminFinancials.getOrders({ from, to, carrier, page: 1, limit: 100 }),
        ]);
        if (!summaryRes.ok) throw new Error((summaryRes.body as any)?.message || 'Failed to load financial summary');
        if (!ordersRes.ok) throw new Error((ordersRes.body as any)?.message || 'Failed to load financial rows');
        setSummary(summaryRes.body);
        setFinancialRows(asArray(ordersRes.body));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected logistics loading error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, carrier]);

  const classifiedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .map((order) => {
        const id = getOrderId(order);
        const booking = bookingById[id] || {};
        const bookingStatus = getBookingStatus(order, booking);
        const booked = ['booked', 'exported', 'picked_up', 'in_transit', 'delivered'].includes(bookingStatus) || Boolean(order.consignment_number);
        const valid = Boolean(booking.valid);
        return { order, booking, booked, valid, bookingStatus };
      })
      .filter((row) => {
        if (view === 'ready' && (!row.valid || row.booked)) return false;
        if (view === 'review' && (row.valid || row.booked)) return false;
        if (view === 'booked' && !row.booked) return false;
        if (!q) return true;
        return [
          getOrderId(row.order),
          getOrderNumber(row.order),
          row.order.customer_name,
          row.order.customer_phone,
          row.order.seller_name,
          row.order.seller_id,
          row.order.shipping_address?.city,
        ].join(' ').toLowerCase().includes(q);
      });
  }, [bookingById, orders, query, view]);

  const metrics = useMemo(() => {
    const rows = orders.map((order) => {
      const booking = bookingById[getOrderId(order)] || {};
      const bookingStatus = getBookingStatus(order, booking);
      const booked = ['booked', 'exported', 'picked_up', 'in_transit', 'delivered'].includes(bookingStatus) || Boolean(order.consignment_number);
      return { valid: Boolean(booking.valid), booked };
    });
    return {
      ready: rows.filter((row) => row.valid && !row.booked).length,
      review: rows.filter((row) => !row.valid && !row.booked).length,
      booked: rows.filter((row) => row.booked).length,
      aging: agingRows.length,
      exports: exportRows.length,
    };
  }, [agingRows.length, bookingById, exportRows.length, orders]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleVisible = () => {
    const visibleIds = classifiedRows.map(({ order }) => getOrderId(order)).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => allSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
  };

  const createExport = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await LogisticsAPI.createExport({
        carrier,
        order_ids: selectedIds,
        format: 'xlsx',
        require_human_verified_locations: carrier === 'dex',
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Export failed');
      setSelectedIds([]);
      setView('exports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setSaving(false);
    }
  };

  const openOrder = (row: any) => {
    const booking = bookingById[getOrderId(row)] || {};
    const location = booking.location_resolution || booking.parcel?.location_resolution || {};
    setSelectedOrder(row);
    setLocationDraft({
      province: location.province || '',
      district: location.district || '',
      ward: location.ward || '',
      specific_address: location.specific_address || row.shipping_address?.address_line1 || '',
    });
    setManualDraft({ consignment_number: row.consignment_number || '', airway_bill_number: row.airway_bill_number || '', tracking_url: row.tracking_url || '' });
    setOverrideDraft({ dispatch_mode: 'carrier_pickup', reason: '', approval_reference: '' });
  };

  const verifyLocation = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await LogisticsAPI.verifyDexLocation(getOrderId(selectedOrder), { ...locationDraft, apply_as_override: true });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Location verification failed');
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location verification failed');
    } finally {
      setSaving(false);
    }
  };

  const markManualBooking = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await LogisticsAPI.markManualBooking(getOrderId(selectedOrder), {
        carrier,
        consignment_number: manualDraft.consignment_number,
        airway_bill_number: manualDraft.airway_bill_number || undefined,
        tracking_url: manualDraft.tracking_url || undefined,
        booked_at: new Date().toISOString(),
        notes: 'Manual booking from admin logistics',
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Manual booking failed');
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Manual booking failed');
    } finally {
      setSaving(false);
    }
  };

  const applyDispatchOverride = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await LogisticsAPI.dispatchOverride(getOrderId(selectedOrder), overrideDraft);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Dispatch override failed');
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dispatch override failed');
    } finally {
      setSaving(false);
    }
  };

  const recordStrike = async (order: any) => {
    setSaving(true);
    try {
      const res = await LogisticsAPI.createPickupStrike(order.seller_id, {
        order_id: getOrderId(order),
        carrier,
        reason: 'seller_center_dropoff_missed',
        notes: 'Recorded from admin logistics',
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Pickup strike failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pickup strike failed');
    } finally {
      setSaving(false);
    }
  };

  const processAging = async () => {
    setSaving(true);
    try {
      const res = await LogisticsAPI.processPickupAging();
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to process aging');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process aging');
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        max_strikes_before_suspension: Number(configDraft.max_strikes_before_suspension),
        strike_expiry_days: Number(configDraft.strike_expiry_days),
        dex_pickup_threshold: Number(configDraft.dex_pickup_threshold),
        sla_hours: Number(configDraft.sla_hours),
        supported_carriers: configDraft.supported_carriers.split(',').map((x) => x.trim()).filter(Boolean),
      };
      const res = await LogisticsAPI.updateOperationalConfig(payload);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to save operational config');
      await loadConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save operational config');
    } finally {
      setSaving(false);
    }
  };

  const visibleIds = classifiedRows.map(({ order }) => getOrderId(order));
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-[#111]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-white">Logistics</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-400">Carrier booking, export readiness, pickup aging, dispatch overrides, and runtime policy.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={carrier} onChange={(event) => setCarrier(event.target.value as LogisticsCarrier)} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-white">
              <option value="dex">DEX</option>
              <option value="smartlane">Smartlane</option>
            </select>
            <button onClick={() => void load()} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
              <RefreshCw size={14} /> Refresh
            </button>
            {['ready', 'review'].includes(view) && (
              <button disabled={saving || selectedIds.length === 0} onClick={() => void createExport()} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
                <Download size={14} /> Export selected
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-5">
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Ready</p><p className="mt-1 text-lg font-semibold text-emerald-300">{metrics.ready}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Needs review</p><p className="mt-1 text-lg font-semibold text-amber-300">{metrics.review}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Booked</p><p className="mt-1 text-lg font-semibold text-white">{metrics.booked}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Pickup aging</p><p className="mt-1 text-lg font-semibold text-red-300">{metrics.aging}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Exports</p><p className="mt-1 text-lg font-semibold text-white">{metrics.exports}</p></div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/10 px-3 py-2">
          {VIEWS.map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === tab.id ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {['ready', 'review', 'booked'].includes(view) && (
          <div className="flex flex-col gap-3 border-b border-white/10 p-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order, customer, seller, city"
                className="w-full rounded-md border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/60"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">{selectedIds.length} selected</span>
              <button onClick={toggleVisible} className="rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
                {allVisibleSelected ? 'Deselect visible' : 'Select visible'}
              </button>
            </div>
          </div>
        )}

        {error && <div className="border-b border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-neutral-400">Loading logistics workspace...</div>
          ) : ['ready', 'review', 'booked'].includes(view) ? (
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="w-10 p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="accent-[#f43f5e]" /></th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Carrier state</th>
                  <th className="p-3">Errors</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Dispatch</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classifiedRows.length === 0 ? (
                  <tr><td colSpan={9} className="p-10 text-center text-neutral-500">No orders in this logistics view.</td></tr>
                ) : classifiedRows.map(({ order, booking, valid, bookingStatus }) => {
                  const id = getOrderId(order);
                  const errors = asArray(booking.blocking_errors || booking.errors);
                  const dispatch = booking.dispatch || booking.parcel?.dispatch || {};
                  return (
                    <tr key={id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="p-3"><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelected(id)} className="accent-[#f43f5e]" /></td>
                      <td className="p-3"><p className="font-mono text-xs text-white">{getOrderNumber(order)}</p><p className="mt-0.5 max-w-[180px] truncate font-mono text-[11px] text-neutral-500">{id}</p></td>
                      <td className="p-3"><p className="text-white">{order.customer_name || '-'}</p><p className="text-xs text-neutral-500">{order.customer_phone || '-'}</p></td>
                      <td className="p-3 text-neutral-300">{order.seller_name || order.seller_id || '-'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${valid ? statusClass('booked') : statusClass('failed')}`}>
                          {valid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {bookingStatus || (valid ? 'ready' : 'needs review')}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-neutral-400">{errors.length ? errors.slice(0, 2).join(' | ') : '-'}</td>
                      <td className="p-3 text-right font-medium text-white">{money(order.total ?? order.total_amount)}</td>
                      <td className="p-3 text-neutral-300">{dispatch.dispatch_mode || order.dispatch_mode || 'carrier_pickup'}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openOrder(order)} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="Open logistics actions"><Eye size={14} /></button>
                          <Link to={`/admin/logistics/receipt/${id}`} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="Receipt"><FileText size={14} /></Link>
                          <button onClick={() => void recordStrike(order)} className="rounded-md border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10" title="Record strike"><ShieldAlert size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : view === 'exceptions' ? (
            <div>
              <div className="border-b border-white/10 p-3">
                <button disabled={saving} onClick={() => void processAging()} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
                  <ShieldAlert size={14} /> Process aging queue
                </button>
              </div>
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-neutral-500"><tr><th className="p-3">Order</th><th className="p-3">Seller</th><th className="p-3">Dispatch</th><th className="p-3">Days</th><th className="p-3">Urgency</th><th className="p-3">Due</th></tr></thead>
                <tbody>
                  {agingRows.map((row, index) => (
                    <tr key={row.order_id || index} className="border-b border-white/5">
                      <td className="p-3 font-mono text-xs text-white">{row.order_number || row.order_id}</td>
                      <td className="p-3 text-neutral-300">{row.seller_name || row.seller_id}</td>
                      <td className="p-3 text-neutral-300">{row.dispatch_mode || '-'}</td>
                      <td className="p-3 text-white">{row.days_waiting_for_pickup ?? 0}</td>
                      <td className="p-3"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(String(row.pickup_urgency || 'normal').toLowerCase())}`}>{row.pickup_urgency || '-'}</span></td>
                      <td className="p-3 text-neutral-400">{dateText(row.seller_dispatch_due_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view === 'exports' ? (
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500"><tr><th className="p-3">Export</th><th className="p-3">Carrier</th><th className="p-3">Status</th><th className="p-3">Orders</th><th className="p-3">Created</th><th className="p-3">File</th></tr></thead>
              <tbody>
                {exportRows.map((row, index) => (
                  <tr key={row.export_id || row.id || index} className="border-b border-white/5">
                    <td className="p-3 font-mono text-xs text-white">{row.export_id || row.id}</td>
                    <td className="p-3 text-neutral-300">{row.carrier || '-'}</td>
                    <td className="p-3"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(String(row.status || '').toLowerCase())}`}>{row.status || '-'}</span></td>
                    <td className="p-3 text-white">{row.order_count ?? row.count ?? 0}</td>
                    <td className="p-3 text-neutral-400">{dateText(row.created_at)}</td>
                    <td className="p-3">{row.file_url ? <a className="text-primary hover:underline" href={row.file_url} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : view === 'config' ? (
            <div className="max-w-4xl p-4">
              <div className="mb-4 flex items-center gap-2 text-white"><Settings size={16} /><h3 className="font-semibold">Operational policy</h3></div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['max_strikes_before_suspension', 'Max strikes before suspension'],
                  ['strike_expiry_days', 'Strike expiry days'],
                  ['dex_pickup_threshold', 'DEX pickup threshold'],
                  ['sla_hours', 'SLA hours'],
                  ['supported_carriers', 'Supported carriers'],
                ].map(([key, label]) => (
                  <label key={key} className="text-xs text-neutral-400">
                    {label}
                    <input value={configDraft[key] || ''} onChange={(event) => setConfigDraft((prev) => ({ ...prev, [key]: event.target.value }))} className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />
                  </label>
                ))}
              </div>
              <button disabled={saving} onClick={() => void saveConfig()} className="mt-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">Save policy</button>
              {config && <pre className="mt-4 max-h-80 overflow-auto rounded-md border border-white/10 bg-black/30 p-3 text-xs text-neutral-300">{JSON.stringify(config, null, 2)}</pre>}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-5">
                <div className="bg-[#111] p-3"><p className="text-neutral-500">GMV</p><p className="mt-1 font-semibold text-white">{money(summary?.gmv)}</p></div>
                <div className="bg-[#111] p-3"><p className="text-neutral-500">Revenue</p><p className="mt-1 font-semibold text-white">{money(summary?.revenue_generated)}</p></div>
                <div className="bg-[#111] p-3"><p className="text-neutral-500">Courier cost</p><p className="mt-1 font-semibold text-white">{money(summary?.courier_shipping_cost)}</p></div>
                <div className="bg-[#111] p-3"><p className="text-neutral-500">Gross income</p><p className="mt-1 font-semibold text-emerald-300">{money(summary?.gross_income)}</p></div>
                <div className="bg-[#111] p-3"><p className="text-neutral-500">Seller payout</p><p className="mt-1 font-semibold text-white">{money(summary?.seller_payout)}</p></div>
              </div>
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-neutral-500"><tr><th className="p-3">Order</th><th className="p-3">Carrier</th><th className="p-3">Status</th><th className="p-3 text-right">GMV</th><th className="p-3 text-right">Gross income</th><th className="p-3 text-right">Seller payout</th></tr></thead>
                <tbody>
                  {financialRows.map((row, index) => (
                    <tr key={row.order_id || row.order_number || index} className="border-b border-white/5">
                      <td className="p-3 font-mono text-xs text-white">{row.order_number || row.order_id}</td>
                      <td className="p-3 text-neutral-300">{row.carrier || '-'}</td>
                      <td className="p-3 text-neutral-300">{row.booking_status || row.status || '-'}</td>
                      <td className="p-3 text-right text-white">{money(row.gmv || row.order_total)}</td>
                      <td className="p-3 text-right text-emerald-300">{money(row.gross_income)}</td>
                      <td className="p-3 text-right text-white">{money(row.seller_payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button className="flex-1" onClick={() => setSelectedOrder(null)} aria-label="Close drawer" />
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#111] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#111] p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Logistics actions</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{getOrderNumber(selectedOrder)}</h3>
                <p className="text-xs text-neutral-500">{selectedOrder.customer_name} · {selectedOrder.seller_name || selectedOrder.seller_id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"><X size={16} /></button>
            </div>

            <div className="space-y-6 p-5">
              {carrier === 'dex' && (
                <section>
                  <h4 className="mb-3 text-sm font-semibold text-white">DEX location verification</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ['province', 'Province'],
                      ['district', 'District'],
                      ['ward', 'Ward'],
                      ['specific_address', 'Specific address'],
                    ].map(([key, label]) => (
                      <label key={key} className="text-xs text-neutral-400">
                        {label}
                        <input value={(locationDraft as any)[key] || ''} onChange={(event) => setLocationDraft((prev) => ({ ...prev, [key]: event.target.value }))} className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />
                      </label>
                    ))}
                  </div>
                  <button disabled={saving} onClick={() => void verifyLocation()} className="mt-3 rounded-md border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40">Verify location</button>
                </section>
              )}

              <section>
                <h4 className="mb-3 text-sm font-semibold text-white">Manual booking</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <input value={manualDraft.consignment_number} onChange={(event) => setManualDraft((prev) => ({ ...prev, consignment_number: event.target.value }))} placeholder="Consignment number" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                  <input value={manualDraft.airway_bill_number} onChange={(event) => setManualDraft((prev) => ({ ...prev, airway_bill_number: event.target.value }))} placeholder="Airway bill" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                  <input value={manualDraft.tracking_url} onChange={(event) => setManualDraft((prev) => ({ ...prev, tracking_url: event.target.value }))} placeholder="Tracking URL" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                </div>
                <button disabled={saving || !manualDraft.consignment_number} onClick={() => void markManualBooking()} className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">Mark booked</button>
              </section>

              <section>
                <h4 className="mb-3 text-sm font-semibold text-white">Dispatch override</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <select value={overrideDraft.dispatch_mode} onChange={(event) => setOverrideDraft((prev) => ({ ...prev, dispatch_mode: event.target.value as any }))} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
                    <option value="carrier_pickup">carrier_pickup</option>
                    <option value="seller_center_dropoff">seller_center_dropoff</option>
                    <option value="manual_override">manual_override</option>
                  </select>
                  <input value={overrideDraft.reason} onChange={(event) => setOverrideDraft((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Reason" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                  <input value={overrideDraft.approval_reference} onChange={(event) => setOverrideDraft((prev) => ({ ...prev, approval_reference: event.target.value }))} placeholder="Approval reference" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                </div>
                <button disabled={saving || !overrideDraft.reason} onClick={() => void applyDispatchOverride()} className="mt-3 rounded-md border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40">Apply override</button>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminLogistics;
