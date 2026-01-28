import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ChevronDown, XCircle, Download, MoreVertical, Package, Calendar, User, DollarSign, MapPin, CreditCard, ShoppingBag, Info, CheckCircle2 } from 'lucide-react';
import { Order, OrderStatus } from '../../constants/orders';
import { Product } from '../../constants/types';

import { OrderStatusBadge } from './OrderStatusBadge';

const OrderCard: React.FC<{
    order: Order;
    productDetails: Record<string, Product>;
    loadingProducts: Set<string>;
    onUpdateStatus: (orderId: string, currentStatus: OrderStatus) => void;
    onCancelOrder: (orderId: string) => void;
    onBookDelivery: (orderId: string) => void;
    onDownloadBill: (orderId: string) => void;
}> = ({ order, productDetails, loadingProducts, onUpdateStatus, onCancelOrder, onBookDelivery, onDownloadBill }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const manualOrderStatusFlow: OrderStatus[] = ['pending', 'confirmed', 'packed'];
    const nextStatus = useMemo(() => {
        const currentIndex = manualOrderStatusFlow.indexOf(order.status.toLowerCase() as OrderStatus);
        if (currentIndex !== -1 && currentIndex < manualOrderStatusFlow.length - 1) {
            return manualOrderStatusFlow[currentIndex + 1];
        }
        return null;
    }, [order.status]);

    const isPacked = order.status.toLowerCase() === 'packed';
    const canUpdate = !['booked', 'shipped', 'delivered', 'cancelled', 'returned'].includes(order.status.toLowerCase());

    const primaryAction = () => {
        if (isPacked && canUpdate) {
            return (
                <button 
                    onClick={(e) => { e.stopPropagation(); onBookDelivery(order.id!); }} 
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 whitespace-nowrap"
                >
                    <Truck size={18} />
                    Book Delivery
                </button>
            );
        }
        
        if (!isPacked && canUpdate && nextStatus) {
            const isConfirming = nextStatus === 'confirmed';
            const bgColor = isConfirming ? 'bg-success' : 'bg-accent';
            const hoverColor = isConfirming ? 'hover:bg-success-light' : 'hover:bg-accent-light';
            const shadowColor = isConfirming ? 'shadow-success/20' : 'shadow-accent/20';
            const shadowHoverColor = isConfirming ? 'hover:shadow-success/40' : 'hover:shadow-accent/40';
            const icon = isConfirming ? <CheckCircle2 size={18} /> : <Package size={18} />;

            return (
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id!, order.status); }} 
                    className={`flex items-center gap-2 px-4 py-2 ${bgColor} ${hoverColor} text-white rounded-xl font-bold transition-all shadow-lg ${shadowColor} ${shadowHoverColor} active:scale-95 whitespace-nowrap`}
                >
                    {icon}
                    Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                </button>
            );
        }
        return null;
    };

    return (
        <motion.div layout className="glass-panel overflow-hidden mb-4">
            <div className="p-6 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-4 mb-3">
                            <p className="font-bold text-white text-lg">#{order.order_number}</p>
                            <OrderStatusBadge status={order.status} />
                            <span className="text-xs text-neutral-500 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">{order.payment_method.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-400">
                            <span className="flex items-center"><Calendar size={14} className="mr-2 text-primary"/>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center"><User size={14} className="mr-2 text-secondary"/>{order.shipping_address?.name}</span>
                            <span className="flex items-center"><MapPin size={14} className="mr-2 text-accent"/>{order.shipping_address?.city}, {order.shipping_address?.province}</span>
                            <span className="flex items-center font-bold text-white bg-white/5 px-2 py-1 rounded-lg"><DollarSign size={14} className="mr-1 text-green-400"/>Rs. {order.total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {primaryAction()}
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-2 rounded-xl hover:bg-white/10 transition-colors border border-white/10"><MoreVertical size={20}/></button>
                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-48 glass p-2 rounded-xl z-20 shadow-2xl border border-white/10"
                                    >
                                        {canUpdate && <button onClick={() => onCancelOrder(order.id!)} className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"><XCircle size={14} className="mr-2"/> Cancel Order</button>}
                                        {['confirmed', 'packed', 'booked'].includes(order.status.toLowerCase()) && <button onClick={() => onDownloadBill(order.id!)} className="flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 rounded-lg transition-colors font-medium"><Download size={14} className="mr-2"/> Download Bill</button>}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button className="p-2 rounded-xl hover:bg-white/10 transition-colors border border-white/10"><ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}/></button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/5">
                        <div className="p-6 bg-black/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white font-semibold mb-2">
                                        <MapPin size={16} className="text-accent" />
                                        <span>Shipping Details</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-2 border border-white/5">
                                        <p className="text-sm text-white font-medium">{order.shipping_address?.name}</p>
                                        <p className="text-sm text-neutral-400 leading-relaxed">
                                            {order.shipping_address?.address_line1}<br />
                                            {order.shipping_address?.address_line2 && <>{order.shipping_address.address_line2}<br /></>}
                                            {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-white font-semibold mb-2">
                                        <Info size={16} className="text-primary" />
                                        <span>Order Summary</span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl space-y-3 border border-white/5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-400 flex items-center gap-2"><CreditCard size={14} /> Payment Method</span>
                                            <span className="text-white font-medium uppercase">{order.payment_method.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-400 flex items-center gap-2"><Truck size={14} /> Delivery Method</span>
                                            <span className="text-white font-medium uppercase">{order.delivery_method}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-400">Payment Status</span>
                                            <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{order.payment_status}</span>
                                        </div>
                                        <div className="border-t border-white/5 pt-2 mt-2 space-y-1">
                                            <div className="flex justify-between text-xs text-neutral-400">
                                                <span>Subtotal</span>
                                                <span>Rs. {order.subtotal?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-neutral-400">
                                                <span>Shipping</span>
                                                <span>Rs. {order.shipping_cost?.toLocaleString()}</span>
                                            </div>
                                            {order.discount > 0 && (
                                                <div className="flex justify-between text-xs text-red-400">
                                                    <span>Discount</span>
                                                    <span>-Rs. {order.discount.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm text-white font-bold mt-2">
                                                <span>Total</span>
                                                <span className="text-green-400">Rs. {order.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                                <ShoppingBag size={18} className="text-secondary" />
                                Order Items ({order.order_items?.length})
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                            {order.order_items?.map((item) => {
                                const product = productDetails[item.product_id];
                                // Ensure strict string comparison for IDs to handle potential type mismatches
                                const variant = product?.variants?.find(v => String(v.id) === String(item.variant_id));
                                
                                return (
                                <div key={item.id} className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                                    {loadingProducts.has(item.product_id) ? <div className="w-16 h-16 rounded-xl bg-white/10 animate-pulse mr-4 flex-shrink-0"/> : <img src={product?.images[0]} alt={product?.title} className="w-16 h-16 rounded-xl object-cover mr-4 shadow-lg group-hover:scale-105 transition-transform flex-shrink-0" />}
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-bold text-white mb-1 truncate">{product?.title || 'Loading...'}</p>
                                        
                                        {/* Variant Title */}
                                        {variant?.title && (
                                            <p className="text-xs text-primary mb-1.5 font-medium">{variant.title}</p>
                                        )}

                                        <div className="flex flex-wrap items-center text-xs text-neutral-400 gap-2 mb-2">
                                            {item.size && <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/5 font-medium">Size: {item.size}</span>}
                                            {item.color && <span className="bg-white/10 px-2 py-0.5 rounded text-white border border-white/5 font-medium">Color: {item.color}</span>}
                                            <span className="bg-white/5 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center text-[10px] text-neutral-500 gap-x-4 gap-y-1 uppercase tracking-wider font-mono">
                                            {/* Item/Variant SKU - Prioritize Variant SKU */}
                                            {(variant?.sku || item.sku) && (
                                                <div className="flex items-center gap-1">
                                                    <span>SKU:</span>
                                                    <span className="text-neutral-300 font-bold">{variant?.sku || item.sku}</span>
                                                </div>
                                            )}
                                            {/* Product SKU */}
                                            {product?.inventory?.sku && (
                                                <div className="flex items-center gap-1">
                                                    <span>Master SKU:</span>
                                                    <span className="text-neutral-300 font-bold">{product.inventory.sku}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4 flex-shrink-0">
                                        <p className="text-sm font-bold text-white">Rs. {item.total_price.toLocaleString()}</p>
                                        <p className="text-xs text-neutral-500 mt-1">@{item.unit_price.toLocaleString()}</p>
                                    </div>
                                </div>
                                )
                            })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ManageOrders: React.FC = () => {
  const { seller } = useSellerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    if (!seller?.token) return;
    setIsLoading(true);
    try {
      const response = await api.Seller.GetOrders(seller.token);
      if (response.ok && response.body) {
        const fetchedOrders = (response.body as Order[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(fetchedOrders);
        const productIds = new Set<string>();
        fetchedOrders.forEach(order => order.order_items?.forEach(item => productIds.add(item.product_id)));
        fetchProductDetails(Array.from(productIds));
      } else {
        setError('Failed to fetch orders.');
      }
    } catch (err) {
      setError('An error occurred while fetching orders.');
    } finally {
      setIsLoading(false);
    }
  }, [seller?.token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const allOrderStatuses: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'packed', 'booked', 'shipped', 'delivered', 'cancelled', 'returned'];

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const manualOrderStatusFlow: OrderStatus[] = ['pending', 'confirmed', 'packed'];
    const currentIndex = manualOrderStatusFlow.indexOf(currentStatus.toLowerCase() as OrderStatus);
    const nextStatus = (currentIndex !== -1 && currentIndex < manualOrderStatusFlow.length - 1) ? manualOrderStatusFlow[currentIndex + 1] : null;

    if (!nextStatus || !seller?.token || !seller.user) return;

    const response = await api.Seller.UpdateOrderStatus(seller.token, orderId, { status: nextStatus, changed_by_id: seller.user.id, changed_by_name: seller.user.business_name });
    if (response.ok) fetchOrders(); else alert('Failed to update order status.');
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!seller?.token || !seller.user || !window.confirm('Are you sure you want to cancel this order?')) return;
    const response = await api.Seller.UpdateOrderStatus(seller.token, orderId, { status: 'cancelled', changed_by_id: seller.user.id, changed_by_name: seller.user.business_name });
    if (response.ok) fetchOrders(); else alert('Failed to cancel order.');
  };

  const handleBookDelivery = async (orderId: string) => {
    if (!seller?.token || !seller.user) return;
    const bookResponse = await api.Seller.bookDelivery(seller.token, orderId);
    if (bookResponse.ok) {
      alert('Delivery booked successfully!');
      await api.Seller.UpdateOrderStatus(seller.token, orderId, { status: 'booked', changed_by_id: seller.user.id, changed_by_name: seller.user.business_name });
      fetchOrders();
    } else {
      alert(`Failed to book delivery: ${bookResponse.body?.message || 'Unknown error'}`);
    }
  };

  const handleDownloadBill = async (orderId: string) => {
    const response = await api.Seller.GetAirwayBill(orderId);
    if (response.ok && response.body) {
      const url = window.URL.createObjectURL(response.body as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `airway-bill-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } else {
      alert(`Try again in a few minutes: ${response.body || 'Unknown error'}`);
    }
  };

  const fetchProductDetails = useCallback(async (productIds: string[]) => {
    const idsToFetch = productIds.filter(id => !productDetails[id] && !loadingProducts.has(id));
    if (idsToFetch.length === 0) return;

    setLoadingProducts(prev => new Set([...prev, ...idsToFetch]));
    const responses = await Promise.all(idsToFetch.map(id => api.Products.GetProductByID(id)));
    
    const newProductDetails: Record<string, Product> = {};
    responses.forEach((response, index) => {
        if (response.ok && response.body) {
            newProductDetails[idsToFetch[index]] = response.body;
        }
    });

    setProductDetails(prev => ({ ...prev, ...newProductDetails }));
    setLoadingProducts(prev => {
        const newSet = new Set(prev);
        idsToFetch.forEach(id => newSet.delete(id));
        return newSet;
    });
  }, [productDetails, loadingProducts]);

  const filteredOrders = useMemo(() => selectedStatus === 'all' ? orders : orders.filter(order => order.status === selectedStatus), [orders, selectedStatus]);

  if (isLoading && !orders.length) return <div className="text-center p-8 text-white">Loading orders...</div>;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Orders</h2>
      </div>
      
      <div className="mb-8">
        <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
          {allOrderStatuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap border ${selectedStatus === status ? 'bg-primary text-white border-primary shadow-glow-primary' : 'bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-center text-neutral-400">Refreshing orders...</p>}
        {!isLoading && filteredOrders.length === 0 ? (
          <div className="text-center py-20 glass-panel border-dashed border-white/20">
            <div className="p-4 bg-white/5 rounded-full inline-block mb-4">
                <Package size={48} className="text-neutral-500"/>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">No orders with status "{selectedStatus}"</h3>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard 
                key={order.id} 
                order={order} 
                productDetails={productDetails}
                loadingProducts={loadingProducts}
                onUpdateStatus={handleUpdateStatus}
                onCancelOrder={handleCancelOrder}
                onBookDelivery={handleBookDelivery}
                onDownloadBill={handleDownloadBill}
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

export default ManageOrders;
