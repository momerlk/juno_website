import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ArrowRight, ChevronDown, ChevronUp, XCircle, Download, MoreVertical, Package, Calendar, User, DollarSign } from 'lucide-react';
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
        if (isPacked && canUpdate) return <button onClick={() => onBookDelivery(order.id!)} className="btn-primary btn-sm"><Truck size={16} className="mr-2"/> Book Delivery</button>;
        if (!isPacked && canUpdate && nextStatus) return <button onClick={() => onUpdateStatus(order.id!, order.status)} className="btn-secondary btn-sm"><ArrowRight size={16} className="mr-2"/> Mark as {nextStatus}</button>;
        return null;
    };

    return (
        <motion.div layout className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg overflow-hidden">
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-grow">
                        <div className="flex items-center gap-4 mb-2">
                            <p className="font-bold text-white text-lg">{order.order_number}</p>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-400">
                            <span className="flex items-center"><Calendar size={14} className="mr-1.5"/>{new Date(order.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center"><User size={14} className="mr-1.5"/>{order.shipping_address?.name}</span>
                            <span className="flex items-center">Rs. {order.total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {primaryAction()}
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-2 rounded-md hover:bg-neutral-700/50"><MoreVertical size={20}/></button>
                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg z-10"
                                    >
                                        {canUpdate && <button onClick={() => onCancelOrder(order.id!)} className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-neutral-800"><XCircle size={14} className="mr-2"/> Cancel Order</button>}
                                        {['confirmed', 'packed', 'booked'].includes(order.status.toLowerCase()) && <button onClick={() => onDownloadBill(order.id!)} className="flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"><Download size={14} className="mr-2"/> Download Bill</button>}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button className="p-2 rounded-md hover:bg-neutral-700/50"><ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}/></button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-neutral-800">
                        <div className="p-4 bg-black/20">
                            <p className="text-md font-semibold text-white mb-2">Order Items ({order.order_items?.length})</p>
                            <div className="space-y-3">
                            {order.order_items?.map((item) => {
                                const product = productDetails[item.product_id];
                                return (
                                <div key={item.id} className="flex items-center">
                                    {loadingProducts.has(item.product_id) ? <div className="w-16 h-16 rounded-md bg-neutral-800 animate-pulse mr-4"/> : <img src={product?.images[0]} alt={product?.title} className="w-16 h-16 rounded-md object-cover mr-4" />}
                                    <div className="flex-grow">
                                        <p className="text-sm font-semibold text-white">{product?.title || 'Loading...'}</p>
                                        <p className="text-xs text-neutral-400">Qty: {item.quantity} | Price: Rs. {item.unit_price}</p>
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
      
      <div className="mb-6 border-b border-neutral-700">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-2">
          {allOrderStatuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${selectedStatus === status ? 'bg-primary text-white' : 'text-neutral-400 hover:bg-neutral-700/50'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-center text-neutral-400">Refreshing orders...</p>}
        {!isLoading && filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/50 backdrop-blur-sm border border-dashed border-neutral-700 rounded-lg">
            <Package size={48} className="mx-auto text-neutral-600"/>
            <h3 className="mt-4 text-xl font-semibold text-white">No orders with status "{selectedStatus}"</h3>
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
