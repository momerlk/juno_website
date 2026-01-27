import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Tag, Eye, Layers, Clock, AlertCircle } from 'lucide-react';
import { getAllProducts, getProductQueue } from '../../api/adminApi';
import { Product } from '../../constants/types';

const ManageProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'queue'>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'catalog') {
        const res = await getAllProducts();
        setProducts(Array.isArray(res.body) ? res.body : (res.body?.data || []));
      } else {
        const res = await getProductQueue();
        setQueue(Array.isArray(res.body) ? res.body : (res.body?.data || []));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const filteredItems = activeTab === 'catalog' 
    ? products.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : queue.filter(q => q.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || q.status?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Package size={24} className="text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Product Catalog</h2>
                <div className="flex gap-2 mt-1">
                    <button 
                        onClick={() => setActiveTab('catalog')}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${activeTab === 'catalog' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >
                        Active Catalog
                    </button>
                    <button 
                        onClick={() => setActiveTab('queue')}
                        className={`text-xs px-3 py-1 rounded-full transition-all ${activeTab === 'queue' ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >
                        Ingestion Queue
                    </button>
                </div>
            </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 pr-4 py-2 w-full text-sm text-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-neutral-400 animate-pulse">Loading products...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 text-sm">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Inventory</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {activeTab === 'catalog' ? (
                filteredItems.map((product: any) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0]} alt="" className="w-10 h-12 object-cover rounded-lg border border-white/10 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-white font-medium truncate max-w-[200px]">{product.title}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">{product.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300 capitalize">{product.product_type}</td>
                    <td className="p-4 text-white font-bold">Rs {product.pricing?.price?.toLocaleString()}</td>
                    <td className="p-4 text-neutral-300">
                        <span className={product.inventory?.quantity > 0 ? "text-green-400" : "text-red-400"}>
                            {product.inventory?.quantity || 0} in stock
                        </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        product.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {product.status || 'Draft'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><Eye size={18} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={item.product?.images?.[0]} alt="" className="w-10 h-12 object-cover rounded-lg border border-white/10 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-white font-medium truncate max-w-[200px]">{item.product?.title || 'Untitled Ingestion'}</span>
                            <span className="text-[10px] text-neutral-500 flex items-center gap-1"><Clock size={10}/> {new Date(item.updated_at || item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300 capitalize">{item.product?.product_type || 'N/A'}</td>
                    <td className="p-4 text-neutral-400 italic">Source: {item.source || 'Manual'}</td>
                    <td className="p-4 text-neutral-300">
                        {item.errors?.length > 0 ? (
                            <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14}/> {item.errors.length} issues</span>
                        ) : (
                            <span className="text-green-400">Validated</span>
                        )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'ready' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                        item.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                      }`}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Layers size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
              <div className="text-center py-12 text-neutral-500 italic">No items found matching your search.</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ManageProducts;