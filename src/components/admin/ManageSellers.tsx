import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, MoreVertical, Eye } from 'lucide-react';
import { adminGetAllSellers, getAllSellers, getSellerDetails } from '../../api/adminApi';
import { Seller } from '../../constants/seller';

const ManageSellers: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);
      try {
        const response = await adminGetAllSellers();
        if (response.ok) {
          setSellers(response.body);
        }
      } catch (error) {
        console.error('Failed to fetch sellers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSellers();
  }, []);

  const handleViewDetails = async (seller: Seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
    try {
      const response = await getSellerDetails(seller.id!); // Changed to seller.id!
      if (response.ok) {
        setSelectedSeller(response.body);
      }
    } catch (error) {
      console.error('Failed to fetch seller details:', error);
    }
  };

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
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewDetails(seller)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full"><Eye size={18} /></button>
                      {seller.status === 'pending' ? (
                        <>
                          <button onClick={() => handleApprove(seller.id!)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-full"><CheckCircle size={18} /></button>
                          <button onClick={() => handleReject(seller.id!)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><XCircle size={18} /></button>
                        </>
                      ) : (
                        <button className="p-2 text-neutral-400 hover:bg-neutral-700/50 rounded-full"><MoreVertical size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background-light rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-4">{selectedSeller.business_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Location</h3>
                <p><strong>Address:</strong> {selectedSeller.location?.address}</p>
                <p><strong>City:</strong> {selectedSeller.location?.city}</p>
                <p><strong>Country:</strong> {selectedSeller.location?.country}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Contact</h3>
                <p><strong>Phone:</strong> {selectedSeller.contact?.phone_number}</p>
                <p><strong>Name:</strong> {selectedSeller.contact?.contact_person_name}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Bank Details</h3>
                <p><strong>Bank Name:</strong> {selectedSeller.bank_details?.bank_name}</p>
                <p><strong>Account Title:</strong> {selectedSeller.bank_details?.account_title}</p>
                <p><strong>Account Number:</strong> {selectedSeller.bank_details?.account_number}</p>
                <p><strong>IBAN:</strong> {selectedSeller.bank_details?.iban}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Business Details</h3>
                <p><strong>Legal Name:</strong> {selectedSeller.legal_name}</p>
                <p><strong>Business Type:</strong> {selectedSeller.business_details?.business_type}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">KYC Documents</h3>
                <div className="flex space-x-4">
                  <div>
                    <p><strong>CNIC Front</strong></p>
                    <img src={selectedSeller.kyc_documents?.cnic_front} alt="CNIC Front" className="w-full h-auto rounded-md" />
                  </div>
                  <div>
                    <p><strong>CNIC Back</strong></p>
                    <img src={selectedSeller.kyc_documents?.cnic_back} alt="CNIC Back" className="w-full h-auto rounded-md" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Seller Metrics</h3>
                <p><strong>Rating:</strong> {selectedSeller.seller_metrics?.rating}</p>
                <p><strong>Total Sales:</strong> {selectedSeller.seller_metrics?.total_sales}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Shipping Settings</h3>
                <p><strong>Self Shipping:</strong> {selectedSeller.shipping_settings?.self_shipping ? 'Yes' : 'No'}</p>
                <p><strong>Platform Shipping:</strong> {selectedSeller.shipping_settings?.platform_shipping ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-md">Close</button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageSellers;
