import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { getAllSellers } from '../../api/adminApi';

interface Seller {
  id: string;
  business_name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  created_at: string;
}

const ManageSellers: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);
      try {
        const fetchedSellers = await getAllSellers();
        setSellers(fetchedSellers.body);
      } catch (error) {
        console.error('Failed to fetch sellers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter(seller =>
    seller.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (id: string) => alert(`Action not available: No endpoint found to approve seller ${id}.`);
  const handleReject = (id: string) => alert(`Action not available: No endpoint found to reject seller ${id}.`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-background rounded-lg p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Manage Sellers</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-background-light border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="p-4 text-sm font-semibold text-neutral-400">Business Name</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Email</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Status</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Registered</th>
              <th className="p-4 text-sm font-semibold text-neutral-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center p-8 text-neutral-400">Loading sellers...</td></tr>
            ) : filteredSellers.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-neutral-400">No sellers found.</td></tr>
            ) : (
              filteredSellers.map(seller => (
                <tr key={seller.id} className="border-b border-neutral-800 hover:bg-background-light">
                  <td className="p-4 text-white font-medium">{seller.business_name}</td>
                  <td className="p-4 text-neutral-300">{seller.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      seller.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      seller.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {seller.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300">{new Date(seller.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    {seller.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <button onClick={() => handleApprove(seller.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-full"><CheckCircle size={18} /></button>
                        <button onClick={() => handleReject(seller.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><XCircle size={18} /></button>
                      </div>
                    ) : (
                      <button className="p-2 text-neutral-400 hover:bg-neutral-700/50 rounded-full"><MoreVertical size={18} /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ManageSellers;
