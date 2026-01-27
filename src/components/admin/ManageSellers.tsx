import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, MoreVertical, Eye, LogIn, Store } from 'lucide-react';
import { adminGetAllSellers, approveSeller, updateSeller, getSellerDetails } from '../../api/adminApi';
import { Auth as SellerAuth } from '../../api/sellerApi';
import { Seller } from '../../constants/seller';

const ManageSellers: React.FC = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

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

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleViewDetails = async (seller: Seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
    try {
      const response = await getSellerDetails(seller.id!);
      if (response.ok) {
        setSelectedSeller(response.body);
      }
    } catch (error) {
      console.error('Failed to fetch seller details:', error);
    }
  };

  const handleLoginAsSeller = async (seller: Seller) => {
    if (!seller.email) {
      alert("Seller does not have an email address.");
      return;
    }
    
    if (window.confirm(`Login to seller portal for ${seller.business_name}?`)) {
      try {
        const response = await SellerAuth.Login(seller.email, "JunoPakistan12#");
        
        if (response.ok) {
          localStorage.setItem('seller', JSON.stringify(response.body));
          if (response.body.token) {
             localStorage.setItem('token', response.body.token);
          }
          window.open('/seller/dashboard', '_blank');
        } else {
          alert(`Login failed: ${response.body?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Login as seller error:", error);
        alert("Failed to login as seller.");
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (window.confirm("Are you sure you want to approve this seller?")) {
        try {
            const response = await approveSeller(id);
            if (response.ok) {
                alert("Seller approved successfully!");
                fetchSellers();
            } else {
                alert("Failed to approve seller.");
            }
        } catch (error) {
            console.error("Error approving seller:", error);
        }
    }
  };

  const handleReject = async (id: string) => {
      if (window.confirm("Are you sure you want to reject this seller?")) {
          try {
              const response = await updateSeller(id, { status: 'rejected' });
              if (response.ok) {
                  alert("Seller rejected.");
                  fetchSellers();
              } else {
                  alert("Failed to reject seller.");
              }
          } catch (error) {
              console.error("Error rejecting seller:", error);
          }
      }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Store size={24} className="text-primary"/> Manage Sellers
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 pr-4 py-2 w-64 text-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
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
              <tr><td colSpan={5} className="text-center p-8 text-neutral-400">{searchTerm ? 'No sellers found matching your search.' : 'No sellers found.'}</td></tr>
            ) : (
              filteredSellers.map(seller => (
                <tr key={seller.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{seller.business_name}</td>
                  <td className="p-4 text-neutral-300">{seller.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                      seller.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      seller.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {seller.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300">{new Date(seller.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleLoginAsSeller(seller)} className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors" title="Login as Seller"><LogIn size={18} /></button>
                      <button onClick={() => handleViewDetails(seller)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"><Eye size={18} /></button>
                      {seller.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(seller.id!)} className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} /></button>
                          <button onClick={() => handleReject(seller.id!)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                        </>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white">{selectedSeller.business_name}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white"><XCircle size={24}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Location</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Address:</span> <span className="text-white">{selectedSeller.location?.address}</span></p>
                    <p><span className="text-neutral-400">City:</span> <span className="text-white">{selectedSeller.location?.city}</span></p>
                    <p><span className="text-neutral-400">Country:</span> <span className="text-white">{selectedSeller.location?.country}</span></p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Contact</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Phone:</span> <span className="text-white">{selectedSeller.contact?.phone_number}</span></p>
                    <p><span className="text-neutral-400">Person:</span> <span className="text-white">{selectedSeller.contact?.contact_person_name}</span></p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Bank Details</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Bank:</span> <span className="text-white">{selectedSeller.bank_details?.bank_name}</span></p>
                    <p><span className="text-neutral-400">Account:</span> <span className="text-white">{selectedSeller.bank_details?.account_title}</span></p>
                    <p><span className="text-neutral-400">Number:</span> <span className="text-white font-mono">{selectedSeller.bank_details?.account_number}</span></p>
                    <p><span className="text-neutral-400">IBAN:</span> <span className="text-white font-mono">{selectedSeller.bank_details?.iban}</span></p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Business Details</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Legal Name:</span> <span className="text-white">{selectedSeller.legal_name}</span></p>
                    <p><span className="text-neutral-400">Type:</span> <span className="text-white">{selectedSeller.business_details?.business_type}</span></p>
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">KYC Documents</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-2">CNIC Front</p>
                    <img src={selectedSeller.kyc_documents?.cnic_front} alt="CNIC Front" className="w-full h-48 object-cover rounded-lg border border-white/10" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-2">CNIC Back</p>
                    <img src={selectedSeller.kyc_documents?.cnic_back} alt="CNIC Back" className="w-full h-48 object-cover rounded-lg border border-white/10" />
                  </div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Seller Metrics</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Rating:</span> <span className="text-yellow-400 font-bold">{selectedSeller.seller_metrics?.rating || 'N/A'}</span></p>
                    <p><span className="text-neutral-400">Total Sales:</span> <span className="text-white">{selectedSeller.seller_metrics?.total_sales || 0}</span></p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Shipping Settings</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Self Shipping:</span> <span className={selectedSeller.shipping_settings?.self_shipping ? "text-green-400" : "text-neutral-500"}>{selectedSeller.shipping_settings?.self_shipping ? 'Yes' : 'No'}</span></p>
                    <p><span className="text-neutral-400">Platform Shipping:</span> <span className={selectedSeller.shipping_settings?.platform_shipping ? "text-green-400" : "text-neutral-500"}>{selectedSeller.shipping_settings?.platform_shipping ? 'Yes' : 'No'}</span></p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
                 {selectedSeller.status === 'pending' && (
                    <>
                        <button onClick={() => { handleApprove(selectedSeller.id!); setIsModalOpen(false); }} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">Approve Seller</button>
                        <button onClick={() => { handleReject(selectedSeller.id!); setIsModalOpen(false); }} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">Reject Seller</button>
                    </>
                 )}
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageSellers;
