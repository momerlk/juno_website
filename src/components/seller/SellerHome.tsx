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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Store size={24} className="text-primary mr-3" />
              <h2 className="text-xl font-semibold">Business Info</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-neutral-400">Name: <span className="text-white font-semibold">{seller?.user.business_name}</span></p>
              <p className="text-neutral-400">Email: <span className="text-white font-semibold">{seller?.user.email}</span></p>
              <p className="text-neutral-400">Subscription: <span className={`font-semibold ${seller?.user.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                {seller?.user.status}
              </span></p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Upload size={24} className="text-secondary mr-3" />
              <h2 className="text-xl font-semibold">Upload Data</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-4">Upload your Shopify product catalog in JSON format.</p>
            <label className="w-full flex flex-col items-center px-4 py-6 bg-black/20 rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary transition-colors">
              {uploading ? <Loader size={24} className="text-primary mb-2 animate-spin" /> : <Upload size={24} className="text-neutral-400 mb-2" />}
              <span className="text-sm text-neutral-300">
                {uploading ? 'Uploading...' : selectedFile ? selectedFile.name : 'Choose a file'}
              </span>
              <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CreditCard size={24} className="text-accent mr-3" />
              <h2 className="text-xl font-semibold">Subscription</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              {seller?.user.status === 'active' ? 'Your subscription is active.' : 'Activate your subscription to start selling.'}
            </p>
            <button onClick={() => setIsSubscriptionModalOpen(true)} className="w-full btn-primary">
              {seller?.user.status === 'active' ? 'Manage Subscription' : 'Subscribe Now'}
            </button>
          </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-6 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
                <ShoppingCart size={24} className="text-primary mr-3" />
                <h2 className="text-xl font-semibold">Recent Orders</h2>
            </div>
            <Link to="/seller/dashboard/orders" className="flex items-center text-sm text-primary hover:underline">
                View All <ArrowRight size={16} className="ml-1" />
            </Link>
        </div>
        <div className="space-y-3">
            {isLoadingOrders ? (
                <p className="text-neutral-400 text-center py-8">Loading orders...</p>
            ) : recentOrders.length === 0 ? (
                <p className="text-neutral-400 text-center py-8">No recent orders found.</p>
            ) : (
                recentOrders.map(order => (
                    <div key={order.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center p-3 bg-black/20 rounded-md">
                        <div>
                            <p className="font-semibold text-white truncate">#{order.order_number}</p>
                            <p className="text-xs text-neutral-400">{order.shipping_address?.name}</p>
                        </div>
                        <div className="hidden sm:block">
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="text-right sm:text-left">
                            <p className="font-semibold text-white">Rs. {order.total.toLocaleString()}</p>
                            <p className="text-xs text-neutral-400">{order.order_items?.length} items</p>
                        </div>
                        <div className="text-right text-xs text-neutral-500 hidden sm:block">
                            {new Date(order.created_at).toLocaleString()}
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