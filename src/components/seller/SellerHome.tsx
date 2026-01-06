import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Loader, Upload, CreditCard, Store, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SubscriptionModal from './SubscriptionModal';
import * as api from "../../api/sellerApi";
import { uploadProductCatalogue } from '../../api';
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';

const SellerHome: React.FC = () => {
  const { seller } = useSellerAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!seller?.token) return;
      setIsLoadingOrders(true);
      try {
        const response = await api.Seller.GetOrders(seller.token);
        if (response.ok && response.body) {
          const sortedOrders = (response.body as Order[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentOrders(sortedOrders.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch recent orders", error);
      }
      setIsLoadingOrders(false);
    };
    fetchRecentOrders();
  }, [seller?.token]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      setSelectedFile(file);
      try{
        setUploading(true);
        await uploadProductCatalogue(seller!.token, file);
        setUploading(false);
      }catch(error){
        alert("failed to upload product catalogue, error = " + error);
      }

      console.log('File selected:', file.name);
    }
  };

  const handleSubscriptionUpdate = async (plan: any, paymentDetails: any) => {
    console.log('Processing subscription:', { plan, paymentDetails });
    setIsSubscriptionModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary/20 rounded-lg mr-3">
                 <Store size={24} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white">Business Info</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-neutral-400">Name</span>
                <span className="text-white font-semibold">{seller?.user.business_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-neutral-400">Email</span>
                <span className="text-white font-semibold">{seller?.user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-400">Subscription</span>
                <span className={`font-semibold px-2 py-1 rounded-full text-xs ${seller?.user.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                  {seller?.user.status || 'Inactive'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg mr-3">
                <Upload size={24} className="text-secondary" />
              </div>
              <h2 className="text-xl font-semibold text-white">Upload Data</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-4">Upload your Shopify product catalog in JSON format.</p>
            <label className="w-full flex flex-col items-center px-4 py-8 bg-white/5 rounded-xl border-2 border-dashed border-white/10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group">
              {uploading ? <Loader size={32} className="text-primary mb-2 animate-spin" /> : <Upload size={32} className="text-neutral-400 mb-2 group-hover:text-primary transition-colors" />}
              <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                {uploading ? 'Uploading...' : selectedFile ? selectedFile.name : 'Choose a file'}
              </span>
              <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card">
            <div className="flex items-center mb-4">
               <div className="p-2 bg-accent/20 rounded-lg mr-3">
                 <CreditCard size={24} className="text-accent" />
               </div>
              <h2 className="text-xl font-semibold text-white">Subscription</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-6 min-h-[40px]">
              {seller?.user.status === 'active' ? 'Your subscription is active and renews automatically.' : 'Activate your subscription to unlock all features and start selling.'}
            </p>
            <button onClick={() => setIsSubscriptionModalOpen(true)} className="w-full glass-button bg-primary/20 hover:bg-primary/30 text-primary border-primary/30">
              {seller?.user.status === 'active' ? 'Manage Subscription' : 'Subscribe Now'}
            </button>
          </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 glass-card">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
                <div className="p-2 bg-primary/20 rounded-lg mr-3">
                  <ShoppingCart size={24} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
            </div>
            <Link to="/seller/dashboard/orders" className="flex items-center text-sm text-primary hover:text-primary-light transition-colors">
                View All <ArrowRight size={16} className="ml-1" />
            </Link>
        </div>
        <div className="space-y-3">
            {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                   <Loader className="animate-spin mb-2" />
                   <p>Loading orders...</p>
                </div>
            ) : recentOrders.length === 0 ? (
                <p className="text-neutral-400 text-center py-12">No recent orders found.</p>
            ) : (
                recentOrders.map(order => (
                    <div key={order.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300">
                        <div>
                            <p className="font-semibold text-white truncate text-sm">#{order.order_number}</p>
                            <p className="text-xs text-neutral-400">{order.shipping_address?.name}</p>
                        </div>
                        <div className="hidden sm:block">
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="text-right sm:text-left">
                            <p className="font-semibold text-white text-sm">Rs. {order.total.toLocaleString()}</p>
                            <p className="text-xs text-neutral-400">{order.order_items?.length} items</p>
                        </div>
                        <div className="text-right text-xs text-neutral-500 hidden sm:block">
                            {new Date(order.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))
            )}
        </div>
      </motion.div>

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscriptionUpdate}
        currentPlan={seller?.user.status === 'active' ? { id: 'standard', name: 'Standard', price: 4999, billingPeriod: 'monthly', features: ['Unlimited products', 'Advanced analytics', 'Priority support'] } : undefined}
      />
    </>
  );
};

export default SellerHome;