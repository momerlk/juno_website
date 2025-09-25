import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye } from 'lucide-react';
import { GetAllOrders, GetOrderById } from '../../api/adminApi';
import { Order } from '../../constants/orders';
import OrderDetailModal from './OrderDetailModal';

const ManageOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await GetAllOrders();
        if (response.ok) {
          setOrders(response.body);
        } else {
          setError(response.body as any || 'Failed to fetch orders');
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
        const response = await GetAllOrders();
        if (response.ok) {
          setOrders(response.body);
        }
        return;
    }
    setIsLoading(true);
    try {
        const response = await GetOrderById(searchTerm);
        if(response.ok) {
            setOrders([response.body]);
        }
        else{
            setOrders([]);
        }
    } catch (error) {
        console.error('Failed to fetch order:', error);
        setOrders([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-background rounded-lg p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Manage Orders</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-background-light border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={handleSearch} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400' >
            <Search size={20} />
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 text-center p-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="p-4 text-sm font-semibold text-neutral-400">Order Number</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Customer</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Total</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Status</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Date</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center p-8 text-neutral-400">Loading orders...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-neutral-400">No orders found.</td></tr>
            ) : (
              filteredOrders.map(order => (
                order && order.id &&
                <tr key={order.id} className="border-b border-neutral-800 hover:bg-background-light">
                  <td className="p-4 text-white font-mono text-xs">{order.order_number}</td>
                  <td className="p-4 text-neutral-300">{order.shipping_address?.name}</td>
                  <td className="p-4 text-white font-medium">Rs {order.total}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button onClick={() => handleViewOrder(order)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full">
                        <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedOrder && <OrderDetailModal order={selectedOrder} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </motion.div>
  );
};

export default ManageOrders;
