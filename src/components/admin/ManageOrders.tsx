import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Package, User, Calendar, Tag, Hash, ShoppingCart, List, CreditCard } from 'lucide-react';
import { GetAllOrders, getParentOrders, getAllCarts, getAllSellers } from '../../api/adminApi';
import { Order, OrderStatus, PaymentStatus } from '../../constants/orders';
import { Seller } from '../../constants/seller';
import OrderDetailModal from './OrderDetailModal';

const statusColors: { [key in OrderStatus]: string } = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  packed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  booked: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  returned: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  fulfilled: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

const ManageOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'parent' | 'carts'>('orders');
  const [data, setData] = useState<any[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sellersRes = await getAllSellers();
      if (sellersRes.ok) setSellers(sellersRes.body);

      let res;
      if (activeTab === 'orders') res = await GetAllOrders();
      else if (activeTab === 'parent') res = await getParentOrders();
      else res = await getAllCarts();

      if (res.ok) {
        const body = Array.isArray(res.body) ? res.body : (res.body?.data || []);
        setData(body);
      } else {
        setError(res.body as any || `Failed to fetch ${activeTab}`);
      }
    } catch (error) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const sellerMap = useMemo(() => new Map(sellers.map(s => [s.id, s])), [sellers]);

  const filteredData = data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-lg">
                <ShoppingCart size={24} className="text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Order Management</h2>
                <div className="flex gap-2 mt-2">
                    {[
                        { id: 'orders', name: 'Seller Orders', icon: List },
                        { id: 'parent', name: 'Parent Transactions', icon: CreditCard },
                        { id: 'carts', name: 'Active Carts', icon: ShoppingCart },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                        >
                            <tab.icon size={12} />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Search record..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 pr-4 py-2 w-full text-sm text-white"
          />
        </div>
      </div>

      {error && <div className="bg-red-900/20 text-red-400 border border-red-700 rounded-lg text-center p-4 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className='border-b border-white/10'>
            <tr className="text-neutral-400 text-xs uppercase tracking-wider">
              {activeTab === 'orders' ? (
                <>
                    <th className="p-4 font-medium">Order</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Seller</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Items</th>
                    <th className="p-4 font-medium">Actions</th>
                </>
              ) : activeTab === 'parent' ? (
                <>
                    <th className="p-4 font-medium">Transaction ID</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Sub-Orders</th>
                    <th className="p-4 font-medium">Date</th>
                </>
              ) : (
                <>
                    <th className="p-4 font-medium">User ID</th>
                    <th className="p-4 font-medium">Items Count</th>
                    <th className="p-4 font-medium">Total Value</th>
                    <th className="p-4 font-medium">Last Updated</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="text-sm font-sans">
            {isLoading ? (
              <tr><td colSpan={8} className="text-center p-20 text-neutral-400 animate-pulse font-mono">Querying transaction logs...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={8} className="text-center p-20 text-neutral-500 italic">No records found.</td></tr>
            ) : (
              filteredData.map(item => {
                if (activeTab === 'orders') {
                    const seller = sellerMap.get(item.seller_id);
                    return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                                <div className='flex flex-col'>
                                    <span className='text-white font-mono text-xs'>{item.order_number}</span>
                                    <span className='text-[10px] text-neutral-500'>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                            </td>
                            <td className="p-4 text-neutral-300">
                                <div className='flex flex-col'>
                                    <span className='font-medium text-white'>{item.shipping_address?.name}</span>
                                    <span className='text-xs text-neutral-500'>{item.shipping_address?.city}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className='flex items-center gap-2'>
                                    {seller?.logo_url && <img src={seller.logo_url} alt="" className='w-6 h-6 rounded-full border border-white/10'/>}
                                    <span className='text-white text-xs truncate max-w-[120px]'>{seller?.business_name || 'N/A'}</span>
                                </div>
                            </td>
                            <td className="p-4 text-white font-bold">Rs {item.total?.toLocaleString()}</td>
                            <td className="p-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[item.status as OrderStatus] || 'bg-neutral-500/10'}`}>
                                    {item.status?.toUpperCase()}
                                </span>
                            </td>
                            <td className="p-4 text-neutral-400 text-center font-bold">{item.order_items?.length || 0}</td>
                            <td className="p-4">
                                <button onClick={() => { setSelectedOrder(item); setIsModalOpen(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                    <Eye size={18} />
                                </button>
                            </td>
                        </tr>
                    );
                } else if (activeTab === 'parent') {
                    return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono text-xs">
                            <td className="p-4 text-primary">{item.id}</td>
                            <td className="p-4 text-white font-sans">{item.user_name || item.user_id}</td>
                            <td className="p-4 text-green-400 font-bold">Rs {item.total_amount?.toLocaleString()}</td>
                            <td className="p-4 text-neutral-400">{item.sub_order_ids?.length || 0} orders</td>
                            <td className="p-4 text-neutral-500">{new Date(item.created_at).toLocaleString()}</td>
                        </tr>
                    );
                } else {
                    return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono text-xs">
                            <td className="p-4 text-white font-sans">{item.user_id}</td>
                            <td className="p-4 text-neutral-300">{item.items?.length || 0} items</td>
                            <td className="p-4 text-white font-bold">Rs {item.total_value?.toLocaleString() || 0}</td>
                            <td className="p-4 text-neutral-500">{new Date(item.updated_at).toLocaleString()}</td>
                        </tr>
                    );
                }
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

