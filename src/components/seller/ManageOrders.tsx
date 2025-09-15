import React, { useState, useEffect, useMemo } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { motion } from 'framer-motion';
import { Truck, ArrowRight, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../constants/orders';
import { Product } from '../../constants/types';

const ManageOrders: React.FC = () => {
  const { seller } = useSellerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const fetchOrders = async () => {
    if (seller?.token) {
      try {
        setIsLoading(true);
        const response = await api.Seller.GetOrders(seller.token);
        if (response.ok && response.body) {
          setOrders(response.body as Order[]);
        } else {
          setError('Failed to fetch orders.');
        }
      } catch (err) {
        setError('An error occurred while fetching orders.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [seller]);

  const manualOrderStatusFlow: OrderStatus[] = ['pending', 'confirmed', 'packed'];
  const allOrderStatuses: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'packed', 'booked', 'shipped', 'delivered', 'cancelled', 'returned'];

  const getNextStatus = (currentStatus: string): OrderStatus | null => {
    const currentIndex = manualOrderStatusFlow.indexOf(currentStatus.toLowerCase() as OrderStatus);
    if (currentIndex !== -1 && currentIndex < manualOrderStatusFlow.length - 1) {
      return manualOrderStatusFlow[currentIndex + 1];
    }
    return null;
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus || !seller?.token || !seller.user) return;

    try {
      const payload: api.Seller.StatusUpdatePayload = {
        status: nextStatus,
        changed_by_id: seller.user.id,
        changed_by_name: seller.user.business_name,
      };
      const response = await api.Seller.UpdateOrderStatus(seller.token, orderId, payload);
      if (response.ok) {
        fetchOrders();
      } else {
        alert('Failed to update order status.');
      }
    } catch (error) {
      alert('An error occurred while updating status.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!seller?.token || !seller.user) return;

    if (window.confirm('Are you sure you want to cancel this order?')) {
        try {
            const payload: api.Seller.StatusUpdatePayload = {
                status: 'cancelled',
                changed_by_id: seller.user.id,
                changed_by_name: seller.user.business_name,
            };
            const response = await api.Seller.UpdateOrderStatus(seller.token, orderId, payload);
            if (response.ok) {
                fetchOrders();
            } else {
                alert('Failed to cancel order.');
            }
        } catch (error) {
            alert('An error occurred while cancelling the order.');
        }
    }
  };

 const handleBookDelivery = async (orderId: string) => {
    if (!seller?.token || !seller.user) return;
    try {
      const bookResponse = await api.Seller.bookDelivery(seller.token, orderId);
      if (bookResponse.ok) {
        alert('Delivery booked successfully!');
        const payload: api.Seller.StatusUpdatePayload = {
          status: 'booked',
          changed_by_id: seller.user.id,
          changed_by_name: seller.user.business_name,
        };
        await api.Seller.UpdateOrderStatus(seller.token, orderId, payload);
        fetchOrders();
      } else {
        alert(`Failed to book delivery: ${bookResponse.body?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('An error occurred while booking delivery.');
    }
  };

  const fetchProductDetails = async (productId: string) => {
    if (productDetails[productId] || loadingProducts.has(productId)) return;

    setLoadingProducts(prev => new Set(prev).add(productId));
    try {
      const response = await api.Products.GetProductByID(productId);
      if (response.ok && response.body) {
        setProductDetails(prev => ({ ...prev, [productId]: response.body }));
      }
    } catch (err) {
      console.error(`Failed to fetch product ${productId}`, err);
    } finally {
      setLoadingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const toggleOrderExpansion = (order: Order) => {
    const newExpandedOrderId = expandedOrderId === order.id ? null : order.id;
    setExpandedOrderId(newExpandedOrderId as string | null);

    if (newExpandedOrderId && order.order_items) {
      order.order_items.forEach(item => {
        fetchProductDetails(item.product_id);
      });
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    const filtered = selectedStatus === 'all'
      ? orders
      : orders.filter(order => order.status === selectedStatus);

    return filtered.sort((a, b) => {
      const aIsBykea = a.delivery_partner === 'Bykea';
      const bIsBykea = b.delivery_partner === 'Bykea';
      if (aIsBykea && !bIsBykea) return -1;
      if (!aIsBykea && bIsBykea) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, selectedStatus]);

  if (isLoading) {
    return <div className="text-center p-8 text-white">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-background rounded-lg p-6 mt-6"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Manage Orders</h2>
      
      <div className="mb-6 border-b border-neutral-700">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {allOrderStatuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${selectedStatus === status ? 'bg-primary text-white' : 'text-neutral-400 hover:bg-neutral-800'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedOrders.length === 0 ? (
          <p className="text-neutral-400 text-center py-8">No orders with status "{selectedStatus}".</p>
        ) : (
          filteredAndSortedOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const nextStatus = getNextStatus(order.status);
            const isPacked = order.status.toLowerCase() === 'packed';
            const canUpdate = !['booked', 'shipped', 'delivered', 'cancelled', 'returned'].includes(order.status.toLowerCase());

            return (
              <motion.div 
                key={order.id} 
                layout
                className="bg-background-light p-4 rounded-lg border border-neutral-700 overflow-hidden"
              >
                <motion.div layout className="flex justify-between items-start">
                  <div className="flex-grow cursor-pointer" onClick={() => toggleOrderExpansion(order)}>
                    <div className="flex items-center">
                      <p className="font-bold text-white mr-4">Order #{order.id?.substring(0, 8)}</p>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    <p className="text-sm text-neutral-400">Customer: {order.shipping_address?.name}</p>
                    <p className="text-sm text-neutral-400">Status: <span className="font-semibold text-primary capitalize">{order.status}</span></p>
                    {order.delivery_partner && <p className="text-sm text-neutral-400">Delivery Partner: <span className="font-semibold">{order.delivery_partner}</span></p>}
                  </div>
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                    {isPacked && canUpdate && (
                      <button
                        onClick={() => handleBookDelivery(order.id!)}
                        className="flex items-center justify-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors whitespace-nowrap"
                      >
                        Book Delivery <Truck size={16} className="ml-2" />
                      </button>
                    )}
                    {!isPacked && canUpdate && nextStatus && (
                      <button
                        onClick={() => handleUpdateStatus(order.id!, order.status)}
                        className="flex items-center justify-center px-3 py-2 text-sm bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition-colors whitespace-nowrap"
                      >
                        Mark as {nextStatus} <ArrowRight size={16} className="ml-2" />
                      </button>
                    )}
                    {canUpdate && (
                        <button
                            onClick={() => handleCancelOrder(order.id!)}
                            className="flex items-center justify-center px-3 py-2 text-sm bg-neutral-800 text-white rounded-md hover:bg-red-700 transition-colors whitespace-nowrap"
                        >
                            Cancel Order <XCircle size={16} className="ml-2" />
                        </button>
                    )}
                    {!canUpdate && order.status !== 'delivered' && (
                       <p className="text-sm text-green-500 text-right">Order in transit.</p>
                    )}
                  </div>
                </motion.div>

                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-neutral-600"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-md font-semibold text-white mb-2">Customer Details</p>
                        <p className="text-sm text-neutral-400">{order.shipping_address?.name}</p>
                        <p className="text-sm text-neutral-400">{order.shipping_address?.phone_number}</p>
                        <p className="text-sm text-neutral-400">{order.shipping_address?.address_line1}, {order.shipping_address?.city}</p>
                      </div>
                      <div>
                        <p className="text-md font-semibold text-white mb-2">Financials</p>
                        <p className="text-sm text-neutral-400">Subtotal: Rs. {order.subtotal}</p>
                        <p className="text-sm text-neutral-400">Shipping: Rs. {order.shipping_cost}</p>
                        <p className="text-sm font-bold text-white">Total: Rs. {order.total}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-md font-semibold text-white mb-2">Order Items ({order.order_items?.length})</p>
                      {order.order_items?.map((item) => {
                        const product = productDetails[item.product_id];
                        return (
                          <div key={item.id} className="flex items-center mb-3 pb-3 border-b border-neutral-700 last:border-b-0 last:pb-0 last:mb-0">
                            {loadingProducts.has(item.product_id) && <div className="w-16 h-16 rounded-md bg-neutral-800 animate-pulse mr-4"/>}
                            {product && <img src={product.images[0]} alt={product.title} className="w-16 h-16 rounded-md object-cover mr-4" />}
                            <div className="flex-grow">
                              <p className="text-sm font-semibold text-white">{product?.title || 'Loading...'}</p>
                              <p className="text-xs text-neutral-400">Qty: {item.quantity} | Price: Rs. {item.unit_price}</p>
                              {(item.size || item.color) && <p className="text-xs text-neutral-400">{item.size}{item.size && item.color && ', '}{item.color}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default ManageOrders;
