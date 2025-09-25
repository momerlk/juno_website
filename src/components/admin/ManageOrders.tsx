import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Package, User, Calendar, Tag, Hash } from 'lucide-react';
import { GetAllOrders, GetOrderById, getAllSellers } from '../../api/adminApi';
import { Order, OrderStatus, PaymentStatus } from '../../constants/orders';
import { Seller } from '../../constants/seller';
import OrderDetailModal from './OrderDetailModal';

const statusColors: { [key in OrderStatus]: string } = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  packed: 'bg-indigo-500/20 text-indigo-400',
  booked: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  returned: 'bg-orange-500/20 text-orange-400',
  refunded: 'bg-gray-500/20 text-gray-400',
  fulfilled: 'bg-teal-500/20 text-teal-400',
};

const paymentStatusColors: { [key in PaymentStatus]: string } = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  paid: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  refunded: 'bg-gray-500/20 text-gray-400',
};


const ManageOrders: React.FC = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [ordersResponse, sellersResponse] = await Promise.all([
          GetAllOrders(),
          getAllSellers()
        ]);

        if (ordersResponse.ok) {
          const sortedOrders = ordersResponse.body.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setAllOrders(sortedOrders);
          setFilteredOrders(sortedOrders);
        } else {
          setError(ordersResponse.body as any || 'Failed to fetch orders');
        }

        if (sellersResponse.ok) {
          setSellers(sellersResponse.body);
        } else {
          console.warn('Failed to fetch sellers:', sellersResponse.body);
        }

      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const sellerMap = useMemo(() => {
    return new Map(sellers.map(seller => [seller.id, seller]));
  }, [sellers]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrders(allOrders);
    } else {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const filtered = allOrders.filter(order =>
        order.order_number.toLowerCase().includes(lowercasedSearchTerm) ||
        order.shipping_address?.name?.toLowerCase().includes(lowercasedSearchTerm) ||
        sellerMap.get(order.seller_id)?.business_name.toLowerCase().includes(lowercasedSearchTerm)
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, allOrders, sellerMap]);


  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-background rounded-lg p-4 sm:p-6 mt-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Manage Orders</h2>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by Order #, Customer, Seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-light border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400' >
            <Search size={20} />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-900/20 text-red-400 border border-red-700 rounded-lg text-center p-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className='border-b-2 border-neutral-800'>
            <tr >
              <th className="p-4 text-sm font-semibold text-neutral-400">Order</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Customer</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Seller</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Total</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Order Status</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Payment</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Items</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center p-8 text-neutral-400">Loading orders...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={8} className="text-center p-8 text-neutral-400">No orders found.</td></tr>
            ) : (
              filteredOrders.map(order => {
                const seller = sellerMap.get(order.seller_id);
                return (
                  order && order.id &&
                  <tr key={order.id} className="border-b border-neutral-800 hover:bg-background-light transition-colors">
                    <td className="p-4 text-white">
                      <div className='flex flex-col'>
                        <span className='font-mono text-xs'>{order.order_number}</span>
                        <span className='text-xs text-neutral-400 flex items-center gap-1'><Calendar size={12}/> {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300">
                      <div className='flex flex-col'>
                        <span className='font-medium text-white flex items-center gap-1.5'><User size={14}/> {order.shipping_address?.name}</span>
                        <span className='text-xs text-neutral-400'>{order.shipping_address?.city}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300">
                      <div className='flex items-center gap-2'>
                        {seller?.logo_url && <img src={seller.logo_url} alt={seller.business_name} className='w-8 h-8 rounded-full object-cover'/>}
                        <span className='font-medium text-white'>{seller?.business_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white font-medium">
                      <div className='flex flex-col'>
                        <span className='font-bold'>Rs {order.total.toLocaleString()}</span>
                        <span className='text-xs text-neutral-400'>{order.payment_method.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.payment_status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-300 text-center font-bold">{order.order_items?.length || 0}</td>
                    <td className="p-4">
                      <button onClick={() => handleViewOrder(order)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors">
                          <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {selectedOrder && <OrderDetailModal order={selectedOrder} sellers={sellers} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </motion.div>
  );
};

export default ManageOrders;

