import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Store,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { AdminCommerce, GetProductById, getAllSellers } from '../../api/adminApi';
import type { Order, ParentOrder } from '../../api/api.types';
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
  item: Order['order_items'][number];
  product?: Product;
}> = ({ item, product }) => {
  const variant = product?.variants?.find((v) => String(v.id) === String(item.variant_id));
  const image =
    variant?.images?.[0] ||
    item.product_image ||
    product?.images?.[0] ||
    'https://via.placeholder.com/120x120?text=No+Image';

  const remainingInventory = getAvailableInventory(variant, product);

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
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const [warehouseLat, setWarehouseLat] = useState('');
  const [warehouseLng, setWarehouseLng] = useState('');
  const [warehouseCity, setWarehouseCity] = useState('');
  const [warehouseLabel, setWarehouseLabel] = useState('');
  const [newEta, setNewEta] = useState('');

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
      const [orderRes, sellersRes] = await Promise.all([
        AdminCommerce.getParentOrder(orderId),
        getAllSellers(),
      ]);

      if (!orderRes.ok) {
        throw new Error((orderRes.body as any)?.message || 'Failed to fetch order detail');
      }

      const payload = orderRes.body as { parent: ParentOrder; children: Order[] };
      setParent(payload.parent);
      setChildren(payload.children ?? []);

      const firstChild = payload.children?.[0];
      setSelectedChildId(firstChild?.id || '');
      setNewStatus(firstChild?.status || payload.parent.rollup_status || payload.parent.status || 'pending');

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedChildId) return;
    await runUpdate(
      () => AdminCommerce.updateOrderStatus(selectedChildId, newStatus, statusNote || undefined),
      'Order status updated.'
    );
    setStatusNote('');
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

  const handleCancelParent = async () => {
    if (!parent) return;
    if (!window.confirm('Cancel this parent order and all child orders?')) return;
    await runUpdate(
      () => AdminCommerce.cancelParentOrder(parent.id, cancelReason || undefined),
      'Parent order cancelled.'
    );
    setCancelReason('');
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
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">Parent Order</h2>
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

      {error && <div className="bg-red-900/20 text-red-400 border border-red-700 rounded-lg text-center p-4">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-primary" /> Order Metrics
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-neutral-300">Payment Method: <span className="text-white">{(parent.payment_method || '').replace(/_/g, ' ')}</span></p>
                <p className="text-neutral-300">Subtotal: <span className="text-white">{formatCurrency(parent.subtotal)}</span></p>
                <p className="text-neutral-300">Shipping: <span className="text-white">{formatCurrency(parent.shipping_fee)}</span></p>
                <p className="text-neutral-300">Total: <span className="text-white font-black">{formatCurrency(parent.total_amount)}</span></p>
                <p className="text-neutral-300">Child Orders: <span className="text-white">{children.length}</span></p>
                <p className="text-neutral-300">Customer Type: <span className="text-white">{parent.customer_type}</span></p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Store size={16} className="text-primary" /> Seller Pickup Location + Child Financials
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {children.map((child) => (
                <SellerLocationCard key={child.id} child={child} seller={sellerMap.get(child.seller_id)} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" /> Product + Variant + Inventory Details
            </h3>

            <div className="space-y-4">
              {children.flatMap((child) =>
                (child.order_items || []).map((item, idx) => (
                  <ProductLineItem
                    key={`${child.id}-${item.product_id}-${item.variant_id}-${idx}`}
                    item={item}
                    product={products[item.product_id]}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
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
              <option value="">Select child order</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>{(child.seller_name || child.seller_id) + ' • ' + child.id.slice(0, 8)}</option>
              ))}
            </select>

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Status note (optional)"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating || !selectedChildId}
              className="w-full rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 hover:bg-primary/90 disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Push Status'}
            </button>

            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <input value={warehouseLat} onChange={(e) => setWarehouseLat(e.target.value)} placeholder="Lat" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={warehouseLng} onChange={(e) => setWarehouseLng(e.target.value)} placeholder="Lng" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={warehouseCity} onChange={(e) => setWarehouseCity(e.target.value)} placeholder="City" className="col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={warehouseLabel} onChange={(e) => setWarehouseLabel(e.target.value)} placeholder="Label" className="col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
              <button
                onClick={handleSetWarehouse}
                disabled={isUpdating || !selectedChildId || !warehouseLat || !warehouseLng}
                className="col-span-2 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 hover:bg-white/10 disabled:opacity-50"
              >
                Set Warehouse Anchor
              </button>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <input
                type="datetime-local"
                value={newEta}
                onChange={(e) => setNewEta(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={handleUpdateEta}
                disabled={isUpdating || !selectedChildId || !newEta}
                className="w-full rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 hover:bg-white/10 disabled:opacity-50"
              >
                Update ETA
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <XCircle size={16} className="text-red-400" /> Cancel Parent Order
            </h3>
            <input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
            />
            <button
              onClick={handleCancelParent}
              disabled={isUpdating}
              className="w-full rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 hover:bg-red-500 disabled:opacity-50"
            >
              {isUpdating ? 'Processing...' : 'Cancel Parent'}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Timeline Metadata
            </h3>
            <div className="space-y-1 text-xs text-neutral-400">
              <p>Created: <span className="text-white">{new Date(parent.created_at).toLocaleString()}</span></p>
              <p>Rollup Status: <span className="text-white">{rollupStatus}</span></p>
              <p>Total Child Orders: <span className="text-white">{children.length}</span></p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;
