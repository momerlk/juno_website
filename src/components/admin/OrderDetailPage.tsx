import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    X, ShoppingCart, User, MapPin, Hash, Calendar, 
    CreditCard, Truck, Package, DollarSign, Percent, 
    FileText, Send, Warehouse, Clock, CheckCircle, 
    Plus, Info, ArrowLeft 
} from 'lucide-react';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../../constants/orders';
import { Seller } from '../../constants/seller';
import { Product } from '../../constants/types';
import { GetProductById, AdminAPI, GetOrderById, getAllSellers } from '../../api/adminApi';

const statusColors: { [key in OrderStatus]: string } = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  packed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  handed_to_rider: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  at_warehouse: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  out_for_delivery: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  delivery_attempted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  returned: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  fulfilled: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

const paymentStatusColors: { [key in PaymentStatus]: string } = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const safeFormat = (val: number | undefined | null) => 
  (val !== undefined && val !== null) ? val.toLocaleString() : '0';

const OrderItemCard: React.FC<{ item: OrderItem }> = ({ item }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!item.product_id) return;
      setIsLoading(true);
      try {
        const res = await GetProductById(item.product_id);
        if (res.ok) setProduct(res.body);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [item.product_id]);

  const variant = product?.variants.find(v => v.id === item.variant_id);

  if (isLoading) {
    return <div className="flex items-center bg-white/5 p-4 rounded-xl border border-white/5 animate-pulse"><div className="w-16 h-16 bg-white/10 rounded-md"></div><div className="ml-4 flex-grow space-y-2"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-3 bg-white/10 rounded w-1/2"></div></div></div>;
  }

  if (!product) {
    return (
        <div className="flex items-center bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="w-16 h-16 bg-white/10 rounded-md flex items-center justify-center">
                <Package size={24} className="text-neutral-500" />
            </div>
            <div className="flex-grow ml-4">
                <p className="text-white font-semibold">Product not found</p>
                <p className="text-neutral-400 text-sm font-mono">ID: {item.product_id}</p>
            </div>
            <div className="text-right">
                <p className="text-white font-bold">Qty: {item.quantity}</p>
                <p className="text-neutral-300 text-sm">Rs {safeFormat(item.unit_price)}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-start bg-white/5 p-4 rounded-xl border border-white/5">
      <img src={product.images[0]} alt={product.title} className="w-20 h-24 object-cover rounded-lg border border-white/10" />
      <div className="flex-grow ml-4">
        <p className="text-white font-bold text-lg">{product.title}</p>
        <p className="text-neutral-400 text-sm">{product.short_description}</p>
        <div className="text-sm text-neutral-300 mt-2 font-mono">
          <p>SKU: {variant?.sku || 'N/A'}</p>
          {variant?.options && Object.entries(variant.options).map(([key, value]) => (
            <p key={key}><span className="capitalize">{key}:</span> {value}</p>
          ))}
        </div>
      </div>
      <div className="text-right ml-4 flex-shrink-0">
        <p className="text-white font-bold text-lg">Rs {safeFormat(item.total_price)}</p>
        <p className="text-neutral-400 text-sm">Qty: {item.quantity}</p>
        <p className="text-neutral-400 text-sm">@ Rs {safeFormat(item.unit_price)}</p>
      </div>
    </div>
  );
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [statusNote, setStatusNote] = useState('');
  
  const [milestoneLabel, setMilestoneLabel] = useState('');
  const [milestoneNote, setMilestoneNote] = useState('');
  const [milestoneCity, setMilestoneCity] = useState('');
  
  const [warehouseCity, setWarehouseCity] = useState('');
  const [warehouseLabel, setWarehouseLabel] = useState('');
  const [warehouseLat, setWarehouseLat] = useState('');
  const [warehouseLng, setWarehouseLng] = useState('');
  
  const [newEta, setNewEta] = useState('');

  const fetchData = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
        const [orderRes, sellersRes] = await Promise.all([
            GetOrderById(orderId),
            getAllSellers()
        ]);

        if (orderRes.ok) {
            setOrder(orderRes.body);
            setNewStatus(orderRes.body.status);
        }
        if (sellersRes.ok) {
            setSellers(sellersRes.body);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const res = await AdminAPI.updateOrderStatus(order.id!, newStatus, statusNote);
      if (res.ok) {
        setOrder({ ...order, status: newStatus });
        setStatusNote('');
        alert('Status updated successfully');
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!order || !milestoneLabel) return;
    setIsUpdating(true);
    try {
      const res = await AdminAPI.appendOrderMilestone(order.id!, {
        label: milestoneLabel,
        note: milestoneNote,
        location: milestoneCity ? { city: milestoneCity } : undefined
      });
      if (res.ok) {
        setMilestoneLabel('');
        setMilestoneNote('');
        setMilestoneCity('');
        alert('Milestone added');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetWarehouse = async () => {
    if (!order || !warehouseLat || !warehouseLng) return;
    setIsUpdating(true);
    try {
      const res = await AdminAPI.setOrderWarehouseAnchor(order.id!, {
        lat: parseFloat(warehouseLat),
        lng: parseFloat(warehouseLng),
        city: warehouseCity,
        label: warehouseLabel
      });
      if (res.ok) alert('Warehouse anchor set');
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEta = async () => {
    if (!order || !newEta) return;
    setIsUpdating(true);
    try {
      const res = await AdminAPI.updateOrderETA(order.id!, new Date(newEta).toISOString());
      if (res.ok) alert('ETA updated');
    } catch (err) {
      alert('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const seller = order ? sellers.find(s => s.id === order.seller_id) : null;

  const renderAddress = (address: any, title: string) => (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 h-full">
      <h4 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><MapPin size={20}/>{title}</h4>
      <div className="space-y-1 text-sm">
          <p className="text-white font-bold">{address?.name}</p>
          <p className="text-neutral-300">{address?.address_line1}</p>
          {address?.address_line2 && <p className="text-neutral-300">{address.address_line2}</p>}
          <p className="text-neutral-300 font-medium">{address?.city}, {address?.province} {address?.postal_code}</p>
          <p className="text-neutral-400 text-xs uppercase tracking-widest mt-1">{address?.country}</p>
          {address?.phone_number && (
            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-1">Phone Number</p>
                <p className="text-white font-mono">{address.phone_number}</p>
            </div>
          )}
      </div>
    </div>
  );

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
            <button onClick={() => navigate('/admin/orders')} className="mt-4 text-primary font-bold">Go back to orders</button>
        </div>
    );
  }

  return (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8 pb-20"
    >
        {/* Navigation Header */}
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
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">{order.order_number}</h2>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusColors[order.status] || 'bg-neutral-500/10'}`}>
                            {order.status}
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono mt-1">ID: {order.id}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right hidden md:block mr-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Order Date</p>
                    <p className="text-sm font-bold text-white">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20">
                    <ShoppingCart size={24} className="text-primary" />
                </div>
            </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Order Summary & Items */}
            <div className="lg:col-span-2 space-y-8">
                {/* Financial Summary */}
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            <FileText size={22} className="text-primary"/> Financial Summary
                        </h3>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Subtotal</p>
                                <p className="text-lg font-bold text-white">Rs {safeFormat(order.subtotal)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Shipping</p>
                                <p className="text-lg font-bold text-white">Rs {safeFormat(order.shipping_cost)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Discount</p>
                                <p className="text-lg font-bold text-red-400">- Rs {safeFormat(order.discount)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Tax</p>
                                <p className="text-lg font-bold text-white">Rs {safeFormat(order.tax)}</p>
                            </div>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Payment Method</p>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={16} className="text-primary"/>
                                    <span className="text-sm font-bold text-white uppercase tracking-tight">{(order.payment_method || '').replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Amount</p>
                                <p className="text-5xl font-black text-white tracking-tighter">Rs {safeFormat(order.total)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            <Package size={22} className="text-primary"/> Order Items
                        </h3>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-neutral-400 uppercase tracking-widest border border-white/5">
                            {order.order_items?.length || 0} Products
                        </span>
                    </div>
                    <div className="p-8 space-y-4">
                        {order.order_items?.map(item => (
                            <OrderItemCard key={item.id || item.product_id} item={item} />
                        ))}
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {renderAddress(order.shipping_address, 'Shipping Address')}
                    {renderAddress(order.billing_address, 'Billing Address')}
                </div>
            </div>

            {/* Right Column: Seller & Admin Controls */}
            <div className="space-y-8">
                {/* Seller Info */}
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3 mb-8">
                        <User size={22} className="text-primary"/> Seller Details
                    </h3>
                    {seller ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <img src={seller.logo_url} alt="" className="w-16 h-16 rounded-3xl object-cover border-2 border-white/10 p-0.5 shadow-xl bg-black" />
                                <div>
                                    <p className="text-lg font-black uppercase tracking-tight text-white leading-tight">{seller.business_name}</p>
                                    <p className="text-xs text-primary font-bold mt-0.5">Verified Brand</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Support Email</p>
                                    <p className="text-sm font-medium text-white">{seller.contact.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Business Phone</p>
                                    <p className="text-sm font-mono text-white">{seller.contact.phone_number}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Seller data unavailable</p>
                        </div>
                    )}
                </div>

                {/* NEW Admin Controls (Interactive Tracking) */}
                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-10">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3 mb-1">
                            <Truck size={22} className="text-primary"/> Logistics
                        </h3>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Interactive Management</p>
                    </div>

                    {/* Status Update */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                            <Send size={12}/> Update Status
                        </p>
                        <select 
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors appearance-none font-bold"
                        >
                            <option value="pending">Pending Acceptance</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="packed">Packed & Ready</option>
                            <option value="handed_to_rider">Handed to Rider</option>
                            <option value="at_warehouse">At Warehouse</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered Successfully</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input 
                            type="text"
                            placeholder="Status Note (e.g. 'Delayed due to rain')"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                        />
                        <button 
                            onClick={handleUpdateStatus}
                            disabled={isUpdating}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-3.5 rounded-2xl text-xs transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isUpdating ? 'Syncing...' : 'Push Status Update'}
                        </button>
                    </div>

                    {/* Milestone */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                            <Clock size={12}/> Append Milestone
                        </p>
                        <input 
                            type="text"
                            placeholder="Label (e.g. 'Sorting Center')"
                            value={milestoneLabel}
                            onChange={(e) => setMilestoneLabel(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                        />
                        <button 
                            onClick={handleAddMilestone}
                            disabled={isUpdating || !milestoneLabel}
                            className="w-full border border-white/10 hover:bg-white/5 text-white font-black uppercase tracking-widest py-3.5 rounded-2xl text-xs transition-all disabled:opacity-50"
                        >
                            Add Granular Update
                        </button>
                    </div>

                    {/* ETA */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                            <Calendar size={12}/> Delivery ETA
                        </p>
                        <input 
                            type="datetime-local"
                            value={newEta}
                            onChange={(e) => setNewEta(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors text-white"
                        />
                        <button 
                            onClick={handleUpdateEta}
                            disabled={isUpdating || !newEta}
                            className="w-full border border-white/10 hover:bg-white/5 text-white font-black uppercase tracking-widest py-3.5 rounded-2xl text-xs transition-all disabled:opacity-50"
                        >
                            Set Manual ETA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
  );
};

export default OrderDetailPage;
