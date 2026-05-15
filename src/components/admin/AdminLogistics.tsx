import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Download, RefreshCw, ShieldAlert, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminCommerce, AdminFinancials, AdminLogistics as AdminLogisticsAPI, type LogisticsCarrier } from '../../api/adminApi';
import type { Order, ParentOrder } from '../../api/api.types';

type LogisticsTab = 'ready' | 'review' | 'booked' | 'exceptions' | 'exports' | 'financials';

const TABS: Array<{ id: LogisticsTab; label: string }> = [
  { id: 'ready', label: 'Ready To Book' },
  { id: 'review', label: 'Needs Review' },
  { id: 'booked', label: 'Booked' },
  { id: 'exceptions', label: 'Pickup Exceptions' },
  { id: 'exports', label: 'Carrier Exports' },
  { id: 'financials', label: 'Financials' },
];

const formatCurrency = (v?: number) => `Rs ${(v ?? 0).toLocaleString()}`;

const AdminLogistics: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LogisticsTab>('ready');
  const [carrier, setCarrier] = useState<LogisticsCarrier>('dex');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [operationalConfig, setOperationalConfig] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookingByOrderId, setBookingByOrderId] = useState<Record<string, any>>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [agingRows, setAgingRows] = useState<any[]>([]);
  const [exportRows, setExportRows] = useState<any[]>([]);

  const [summary, setSummary] = useState<any>(null);
  const [financialRows, setFinancialRows] = useState<any[]>([]);

  const [verificationDraft, setVerificationDraft] = useState<Record<string, { province: string; district: string; ward: string; specific_address: string }>>({});
  const [manualBookingDraft, setManualBookingDraft] = useState<Record<string, { consignment_number: string; airway_bill_number: string; tracking_url: string }>>({});
  const [dispatchOverrideDraft, setDispatchOverrideDraft] = useState<Record<string, { dispatch_mode: 'carrier_pickup' | 'seller_center_dropoff' | 'manual_override'; reason: string; approval_reference: string }>>({});
  const [printReceiptHtml, setPrintReceiptHtml] = useState<string>('');
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [confirmationMessageByOrderId, setConfirmationMessageByOrderId] = useState<Record<string, string>>({});

  const loadOrdersAndBookingData = async () => {
    const parentRes = await AdminCommerce.listParentOrders({ status: 'all', limit: 20, offset: 0 });
    if (!parentRes.ok) {
      throw new Error((parentRes.body as any)?.message || 'Failed to fetch orders');
    }

    const parents = ((parentRes.body as any)?.orders || []) as ParentOrder[];
    const detailResponses = await Promise.all(parents.map((p) => AdminCommerce.getParentOrder(p.id)));
    const children: Order[] = detailResponses
      .filter((res) => res.ok)
      .flatMap((res) => (((res.body as any)?.children || []) as Order[]));

    setOrders(children);

    const bookingEntries = await Promise.all(
      children.map(async (child) => {
        const res = await AdminLogisticsAPI.getOrderBookingData(child.id, carrier);
        return [child.id, res.ok ? res.body : { valid: false, blocking_errors: [(res.body as any)?.message || 'Booking data unavailable'] }] as const;
      })
    );

    const map: Record<string, any> = {};
    bookingEntries.forEach(([id, data]) => {
      map[id] = data;
    });

    setBookingByOrderId(map);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const configRes = await AdminLogisticsAPI.getOperationalConfig();
      if (configRes.ok) {
        setOperationalConfig(configRes.body);
      }

      if (activeTab === 'ready' || activeTab === 'review' || activeTab === 'booked') {
        await loadOrdersAndBookingData();
      }

      if (activeTab === 'exceptions') {
        const agingRes = await AdminLogisticsAPI.getPickupAging({ carrier });
        if (!agingRes.ok) throw new Error((agingRes.body as any)?.message || 'Failed to fetch pickup aging');
        const rows = Array.isArray(agingRes.body) ? agingRes.body : ((agingRes.body as any)?.rows || []);
        setAgingRows(rows);
      }

      if (activeTab === 'exports') {
        const exRes = await AdminLogisticsAPI.getExports({ carrier, limit: 50, page: 1 });
        if (!exRes.ok) throw new Error((exRes.body as any)?.message || 'Failed to fetch exports');
        const rows = Array.isArray(exRes.body) ? exRes.body : ((exRes.body as any)?.exports || []);
        setExportRows(rows);
      }

      if (activeTab === 'financials') {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        const to = today.toISOString().slice(0, 10);

        const [sumRes, rowsRes] = await Promise.all([
          AdminFinancials.getSummary({ from, to, carrier }),
          AdminFinancials.getOrders({ from, to, carrier, page: 1, limit: 50 }),
        ]);

        if (!sumRes.ok) throw new Error((sumRes.body as any)?.message || 'Failed to fetch financial summary');
        if (!rowsRes.ok) throw new Error((rowsRes.body as any)?.message || 'Failed to fetch financial orders');

        setSummary(sumRes.body);
        setFinancialRows(Array.isArray(rowsRes.body) ? rowsRes.body : ((rowsRes.body as any)?.orders || []));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, carrier]);

  const classifiedOrders = useMemo(() => {
    const rows = orders.map((order) => {
      const booking = bookingByOrderId[order.id] || {};
      const bookingStatus = (order as any)?.booking?.status || booking?.parcel?.booking?.status || '';
      const booked = ['booked', 'picked_up', 'in_transit', 'delivered', 'exported'].includes(String(bookingStatus).toLowerCase()) || Boolean((order as any)?.consignment_number);
      return { order, booking, booked };
    });

    if (activeTab === 'ready') return rows.filter((row) => row.booking?.valid && !row.booked);
    if (activeTab === 'review') return rows.filter((row) => !row.booking?.valid && !row.booked);
    if (activeTab === 'booked') return rows.filter((row) => row.booked);
    return rows;
  }, [activeTab, bookingByOrderId, orders]);

  const toggleSelect = (orderId: string) => {
    setSelectedOrderIds((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]));
  };

  const handleExport = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Select at least one order.');
      return;
    }

    const res = await AdminLogisticsAPI.createExport({
      carrier,
      order_ids: selectedOrderIds,
      format: 'xlsx',
      require_human_verified_locations: carrier === 'dex',
    });

    if (!res.ok) {
      alert((res.body as any)?.message || 'Export failed');
      return;
    }

    alert('Export created successfully.');
    setSelectedOrderIds([]);
    if (activeTab !== 'exports') setActiveTab('exports');
    else void loadData();
  };

  const handleVerifyDexLocation = async (orderId: string) => {
    const d = verificationDraft[orderId];
    if (!d?.province || !d?.district || !d?.specific_address) {
      alert('Province, district, and specific address are required.');
      return;
    }

    const res = await AdminLogisticsAPI.verifyDexLocation(orderId, {
      province: d.province,
      district: d.district,
      ward: d.ward || undefined,
      specific_address: d.specific_address,
      apply_as_override: true,
    });

    if (!res.ok) {
      alert((res.body as any)?.message || 'Location verification failed');
      return;
    }

    alert('DEX location verified.');
    await loadData();
  };

  const handleManualBooking = async (orderId: string) => {
    const d = manualBookingDraft[orderId];
    if (!d?.consignment_number) {
      alert('Consignment number is required.');
      return;
    }

    const res = await AdminLogisticsAPI.markManualBooking(orderId, {
      carrier,
      consignment_number: d.consignment_number,
      airway_bill_number: d.airway_bill_number || undefined,
      tracking_url: d.tracking_url || undefined,
      booked_at: new Date().toISOString(),
      notes: 'Manual booking from admin logistics workspace',
    });

    if (!res.ok) {
      alert((res.body as any)?.message || 'Manual booking failed');
      return;
    }

    alert('Order marked as manually booked.');
    await loadData();
  };

  const handleDispatchOverride = async (orderId: string) => {
    const d = dispatchOverrideDraft[orderId];
    if (!d?.reason || !d?.dispatch_mode) {
      alert('Dispatch mode and reason are required.');
      return;
    }

    const res = await AdminLogisticsAPI.dispatchOverride(orderId, {
      dispatch_mode: d.dispatch_mode,
      reason: d.reason,
      approval_reference: d.approval_reference || undefined,
    });

    if (!res.ok) {
      alert((res.body as any)?.message || 'Dispatch override failed');
      return;
    }

    alert('Dispatch override applied.');
    await loadData();
  };

  const handleResendReceipt = async (orderId: string) => {
    const res = await AdminCommerce.resendOrderReceipt(orderId);
    if (!res.ok) {
      alert((res.body as any)?.message || 'Failed to resend receipt');
      return;
    }
    alert((res.body as any)?.message || 'Receipt resent');
  };

  const handlePrintReceipt = async (order: Order) => {
    setPrintingOrderId(order.id);
    try {
      const res = await AdminCommerce.getOrderReceipt(order.id);
      if (!res.ok) {
        alert((res.body as any)?.message || 'Failed to fetch receipt');
        return;
      }

      const html = String((res.body as any)?.html || '').trim();
      if (!html) {
        alert('Receipt HTML is missing in API response.');
        return;
      }

      const originalTitle = document.title;
      const fileName = order.order_number || `receipt-${order.id}`;
      document.title = fileName;
      setPrintReceiptHtml(html);
      setIsPrintingReceipt(true);

      window.setTimeout(() => window.print(), 80);

      const onAfterPrint = () => {
        setIsPrintingReceipt(false);
        setPrintReceiptHtml('');
        document.title = originalTitle;
        window.removeEventListener('afterprint', onAfterPrint);
      };
      window.addEventListener('afterprint', onAfterPrint);
    } finally {
      setPrintingOrderId(null);
    }
  };

  const handleGenerateConfirmationMessage = (order: Order) => {
    const getOrdinal = (n: number) => {
      const v = n % 100;
      if (v >= 11 && v <= 13) return `${n}th`;
      switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
      }
    };

    const etaDate = order.tracking?.estimated_delivery
      ? new Date(order.tracking.estimated_delivery)
      : new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

    const weekday = etaDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const day = getOrdinal(etaDate.getDate());
    const month = etaDate.toLocaleDateString('en-US', { month: 'long' });
    const year = etaDate.getFullYear();

    const firstItem = order.order_items?.[0];
    const variantText = firstItem?.variant_label
      || Object.values(firstItem?.variant_options || {}).join(' | ')
      || firstItem?.variant_id
      || 'selected variant';

    const primary = `Hi ${order.customer_name || 'there'} thank you for ordering from juno! Your Order number is ${order.order_number || order.id} and you will receive your parcel by ${weekday}, ${day} ${month}, ${year}`;
    const followUp = `Just want to confirm the variant is ${variantText} ?`;
    const combined = `${primary}\n\n${followUp}`;

    setConfirmationMessageByOrderId((prev) => ({ ...prev, [order.id]: combined }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-5 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Truck size={22} className="text-primary" /> Logistics Workspace</h2>
          <p className="text-xs text-neutral-400 mt-1">Smartlane + DEX booking, verification, exports, pickup exceptions, and financial snapshots.</p>
          {operationalConfig && (
            <p className="text-[11px] text-neutral-500 mt-2">
              DEX threshold: <span className="text-white">{operationalConfig.dex_pickup_threshold ?? 5}</span> • Dropoff SLA: <span className="text-white">{operationalConfig.dex_seller_center_dropoff_sla_hours ?? 24}h</span> • Strike threshold: <span className="text-white">{operationalConfig.strike_suspension_threshold ?? 3}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value as LogisticsCarrier)}
            className="bg-white/5 border border-white/10 text-neutral-300 rounded-lg px-3 py-2 text-xs uppercase tracking-wider font-bold"
          >
            <option value="dex">DEX</option>
            <option value="smartlane">Smartlane</option>
          </select>
          <button
            onClick={() => void loadData()}
            className="px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider"
          >
            <RefreshCw size={13} className="inline mr-1" /> Refresh
          </button>
          {(activeTab === 'ready' || activeTab === 'review') && (
            <button
              onClick={() => void handleExport()}
              className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-bold uppercase tracking-wider"
            >
              <Download size={13} className="inline mr-1" /> Export Selected
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-full border transition-colors ${activeTab === tab.id ? 'bg-primary/20 border-primary/30 text-primary' : 'border-white/10 text-neutral-400 hover:bg-white/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-600/40 bg-red-900/20 p-3 text-sm text-red-300">{error}</div>}

      {isLoading ? (
        <div className="py-16 text-center text-neutral-400">Loading logistics data...</div>
      ) : activeTab === 'exceptions' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const res = await AdminLogisticsAPI.processPickupAging();
                if (!res.ok) alert((res.body as any)?.message || 'Failed to process pickup aging');
                else await loadData();
              }}
              className="px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-xs"
            >
              Process Aging Queue
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Dispatch Mode</th>
                  <th className="p-3">Days Waiting</th>
                  <th className="p-3">Urgency</th>
                  <th className="p-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {agingRows.map((row, idx) => (
                  <tr key={`${row.order_id || idx}`} className="border-b border-white/5">
                    <td className="p-3 text-white font-mono">{row.order_number || row.order_id}</td>
                    <td className="p-3">{row.seller_name || row.seller_id}</td>
                    <td className="p-3">{row.dispatch_mode || '-'}</td>
                    <td className="p-3">{row.days_waiting_for_pickup ?? 0}</td>
                    <td className="p-3">{row.pickup_urgency || '-'}</td>
                    <td className="p-3">{row.seller_dispatch_due_at ? new Date(row.seller_dispatch_due_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'exports' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Export ID</th>
                <th className="p-3">Carrier</th>
                <th className="p-3">Status</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Created</th>
                <th className="p-3">File</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.map((row: any) => (
                <tr key={row.export_id || row.id} className="border-b border-white/5">
                  <td className="p-3 text-white font-mono">{row.export_id || row.id}</td>
                  <td className="p-3">{row.carrier || '-'}</td>
                  <td className="p-3">{row.status || '-'}</td>
                  <td className="p-3">{row.order_count ?? row.count ?? 0}</td>
                  <td className="p-3">{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>
                  <td className="p-3">
                    {row.file_url ? (
                      <a href={row.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open</a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'financials' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">GMV</p><p className="text-white font-bold">{formatCurrency(summary?.gmv)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Revenue</p><p className="text-white font-bold">{formatCurrency(summary?.revenue_generated)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Courier Cost</p><p className="text-white font-bold">{formatCurrency(summary?.courier_shipping_cost)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Gross Income</p><p className="text-emerald-300 font-bold">{formatCurrency(summary?.gross_income)}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-[10px] text-neutral-500 uppercase">Seller Payout</p><p className="text-white font-bold">{formatCurrency(summary?.seller_payout)}</p></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-neutral-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Carrier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">GMV</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Courier Cost</th>
                  <th className="p-3">Gross Income</th>
                  <th className="p-3">Seller Payout</th>
                </tr>
              </thead>
              <tbody>
                {financialRows.map((row: any, idx) => (
                  <tr key={row.order_id || row.order_number || idx} className="border-b border-white/5">
                    <td className="p-3 text-white font-mono">{row.order_number || row.order_id}</td>
                    <td className="p-3">{row.carrier || '-'}</td>
                    <td className="p-3">{row.booking_status || row.status || '-'}</td>
                    <td className="p-3">{formatCurrency(row.gmv || row.order_total)}</td>
                    <td className="p-3">{formatCurrency(row.revenue_generated)}</td>
                    <td className="p-3">{formatCurrency(row.courier_shipping_cost)}</td>
                    <td className="p-3">{formatCurrency(row.gross_income)}</td>
                    <td className="p-3">{formatCurrency(row.seller_payout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-neutral-400">Orders shown: <span className="text-white font-bold">{classifiedOrders.length}</span></div>
          <div className="space-y-3">
            {classifiedOrders.map(({ order, booking }) => {
              const blockingErrors = (booking?.blocking_errors || []) as string[];
              const warnings = (booking?.warnings || []) as string[];
              const location = booking?.location_resolution || {};
              const dispatch = booking?.dispatch || {};
              const draft = verificationDraft[order.id] || { province: location?.province || '', district: location?.district || '', ward: location?.ward || '', specific_address: location?.specific_address || '' };
              const manual = manualBookingDraft[order.id] || { consignment_number: '', airway_bill_number: '', tracking_url: '' };
              const override = dispatchOverrideDraft[order.id] || { dispatch_mode: 'carrier_pickup' as const, reason: '', approval_reference: '' };

              return (
                <div key={order.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-white font-mono text-xs">{order.order_number || order.id}</p>
                      <p className="text-xs text-neutral-300">{order.customer_name} • {order.customer_phone} • {order.shipping_address?.city || 'N/A'}</p>
                      <p className="text-xs text-neutral-500">Seller: {order.seller_name || order.seller_id}</p>
                      <p className="text-xs text-neutral-500">Dispatch: {dispatch.dispatch_mode || 'carrier_pickup'} • DEX-ready: {dispatch.dex_ready_parcel_count ?? '-'} / {dispatch.dex_pickup_threshold ?? '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 text-xs text-neutral-300">
                        <input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={() => toggleSelect(order.id)} /> Select
                      </label>
                      {booking?.valid ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-300"><CheckCircle2 size={12} /> Ready</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300"><AlertTriangle size={12} /> Needs Review</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 lg:grid-cols-5 gap-2 text-[11px]">
                    <div className="rounded-md bg-black/20 p-2"><p className="text-neutral-500">Order Total</p><p className="text-white">{formatCurrency(order.total)}</p></div>
                    <div className="rounded-md bg-black/20 p-2"><p className="text-neutral-500">Commission</p><p className="text-white">{formatCurrency(order.financials?.commission)}</p></div>
                    <div className="rounded-md bg-black/20 p-2"><p className="text-neutral-500">Seller Payout</p><p className="text-white">{formatCurrency(order.financials?.seller_payout)}</p></div>
                    <div className="rounded-md bg-black/20 p-2"><p className="text-neutral-500">Courier Cost</p><p className="text-white">{formatCurrency(booking?.parcel?.financials?.courier_cost || booking?.financials?.courier_cost)}</p></div>
                    <div className="rounded-md bg-black/20 p-2"><p className="text-neutral-500">Gross Income</p><p className="text-emerald-300">{formatCurrency(booking?.parcel?.financials?.gross_income || booking?.financials?.gross_income)}</p></div>
                  </div>

                  {blockingErrors.length > 0 && (
                    <div className="mt-3 rounded-md border border-red-500/30 bg-red-900/10 p-2 text-[11px] text-red-300">
                      <p className="font-bold uppercase tracking-wider mb-1">Blocking Errors</p>
                      {blockingErrors.map((e, idx) => <p key={idx}>• {e}</p>)}
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className="mt-2 rounded-md border border-yellow-500/30 bg-yellow-900/10 p-2 text-[11px] text-yellow-300">
                      <p className="font-bold uppercase tracking-wider mb-1">Warnings</p>
                      {warnings.map((w, idx) => <p key={idx}>• {w}</p>)}
                    </div>
                  )}

                  {carrier === 'dex' && (
                    <div className="mt-3 grid gap-2 lg:grid-cols-5">
                      <input value={draft.province} onChange={(e) => setVerificationDraft((prev) => ({ ...prev, [order.id]: { ...draft, province: e.target.value } }))} placeholder="Province" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                      <input value={draft.district} onChange={(e) => setVerificationDraft((prev) => ({ ...prev, [order.id]: { ...draft, district: e.target.value } }))} placeholder="District" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                      <input value={draft.ward} onChange={(e) => setVerificationDraft((prev) => ({ ...prev, [order.id]: { ...draft, ward: e.target.value } }))} placeholder="Ward (optional)" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                      <input value={draft.specific_address} onChange={(e) => setVerificationDraft((prev) => ({ ...prev, [order.id]: { ...draft, specific_address: e.target.value } }))} placeholder="Specific address" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                      <button onClick={() => void handleVerifyDexLocation(order.id)} className="rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs px-3 py-1.5">Verify DEX Location</button>
                    </div>
                  )}

                  <div className="mt-3 grid gap-2 lg:grid-cols-6">
                    <input value={manual.consignment_number} onChange={(e) => setManualBookingDraft((prev) => ({ ...prev, [order.id]: { ...manual, consignment_number: e.target.value } }))} placeholder="Consignment #" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                    <input value={manual.airway_bill_number} onChange={(e) => setManualBookingDraft((prev) => ({ ...prev, [order.id]: { ...manual, airway_bill_number: e.target.value } }))} placeholder="Airway Bill #" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                    <input value={manual.tracking_url} onChange={(e) => setManualBookingDraft((prev) => ({ ...prev, [order.id]: { ...manual, tracking_url: e.target.value } }))} placeholder="Tracking URL" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                    <select value={override.dispatch_mode} onChange={(e) => setDispatchOverrideDraft((prev) => ({ ...prev, [order.id]: { ...override, dispatch_mode: e.target.value as any } }))} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                      <option value="carrier_pickup">carrier_pickup</option>
                      <option value="seller_center_dropoff">seller_center_dropoff</option>
                      <option value="manual_override">manual_override</option>
                    </select>
                    <input value={override.reason} onChange={(e) => setDispatchOverrideDraft((prev) => ({ ...prev, [order.id]: { ...override, reason: e.target.value } }))} placeholder="Override reason" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                    <input value={override.approval_reference} onChange={(e) => setDispatchOverrideDraft((prev) => ({ ...prev, [order.id]: { ...override, approval_reference: e.target.value } }))} placeholder="Approval ref (if below threshold)" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => void handleManualBooking(order.id)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90">Mark Manual Booking</button>
                    <button onClick={() => void handleDispatchOverride(order.id)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10">Apply Dispatch Override</button>
                    <button onClick={() => navigate(`/admin/logistics/receipt/${order.id}`)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10">View Receipt</button>
                    <button onClick={() => void handlePrintReceipt(order)} disabled={printingOrderId === order.id} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50">
                      {printingOrderId === order.id ? 'Preparing Print...' : 'Print Receipt'}
                    </button>
                    <button onClick={() => void handleResendReceipt(order.id)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10">Resend Receipt</button>
                    <button onClick={() => handleGenerateConfirmationMessage(order)} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/80 hover:bg-white/10">
                      Generate Confirmation Msg
                    </button>
                    <button
                      onClick={async () => {
                        const res = await AdminLogisticsAPI.createPickupStrike(order.seller_id, {
                          order_id: order.id,
                          carrier,
                          reason: 'seller_center_dropoff_missed',
                          notes: 'Recorded from admin logistics workspace',
                        });
                        if (!res.ok) alert((res.body as any)?.message || 'Strike action failed');
                        else alert('Pickup strike recorded');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 inline-flex items-center gap-1"
                    >
                      <ShieldAlert size={12} /> Record Strike
                    </button>
                  </div>

                  {confirmationMessageByOrderId[order.id] && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Confirmation Message</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(confirmationMessageByOrderId[order.id]);
                            alert('Confirmation message copied.');
                          }}
                          className="text-xs px-2 py-1 rounded border border-white/10 text-white/80 hover:bg-white/10"
                        >
                          Copy
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={confirmationMessageByOrderId[order.id]}
                        className="w-full min-h-24 bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-neutral-200"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isPrintingReceipt && (
        <>
          <style>{`
            @media print {
              @page { size: A4; margin: 8mm; }
              body * { visibility: hidden !important; }
              #logistics-print-root, #logistics-print-root * { visibility: visible !important; }
              #logistics-print-root {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: #fff !important;
                z-index: 999999 !important;
              }
              #logistics-print-root table { width: 100% !important; max-width: 100% !important; }
              #logistics-print-root img { max-width: 100% !important; height: auto !important; }
            }
          `}</style>
          <div id="logistics-print-root" dangerouslySetInnerHTML={{ __html: printReceiptHtml }} />
        </>
      )}

    </motion.div>
  );
};

export default AdminLogistics;
