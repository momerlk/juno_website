import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Loader, Upload, CreditCard, LogOut, Store } from 'lucide-react';
import JunoStudioAccounts from './JunoStudioAccounts';
import SubscriptionModal from './SubscriptionModal';
import * as api from '../../api';
import JunoStudioDownloads from './JunoStudioDownloads';

const SellerDashboard: React.FC = () => {
  const { seller, logout } = useSellerAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try{
        setUploading(true);
        await api.uploadProductCatalogue(seller!.token, file);
        setUploading(false);
      }catch(error){
        alert("failed to upload product catalogue, error = " + error);
      }

      console.log('File selected:', file.name);
    }
  };


  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleSubscription = () => {
    setIsSubscriptionModalOpen(true);
  };

  const handleSubscriptionUpdate = async (plan : any, paymentDetails : any) => {
    try {
      // TODO: Implement actual subscription API call with payment processing
      console.log('Processing subscription:', {
        plan,
        cardNumber: paymentDetails.cardNumber.slice(-4), // Only log last 4 digits
        expiryDate: paymentDetails.expiryDate,
        name: paymentDetails.name
      });
    } catch (error) {
      console.error('Subscription update failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Seller Dashboard</h1>
          <button
            onClick={logout}
            className="flex items-center text-neutral-400 hover:text-white"
          >
            <LogOut size={20} className="mr-2" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-background rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Store size={24} className="text-primary mr-2" />
              <h2 className="text-xl font-semibold">Business Info</h2>
            </div>
            <div className="space-y-2">
              <p className="text-neutral-400">Business Name: <span className="text-white">{seller?.user.business_name}</span></p>
              <p className="text-neutral-400">Email: <span className="text-white">{seller?.user.email}</span></p>
              <p className="text-neutral-400">Subscription: <span className={`${seller?.user.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                {seller?.user.status}
              </span></p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-background rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <Upload size={24} className="text-secondary mr-2" />
              <h2 className="text-xl font-semibold">Upload Data</h2>
            </div>
            <div className="space-y-4">
              <p className="text-neutral-400">Upload your shopify product catalog in JSON format</p>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-background-light rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                  {uploading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-primary"
                    >
                      <Loader size={24} className="mb-2" />
                    </motion.div>
                  ) : (
                    <Upload size={24} className="text-neutral-400 mb-2" />
                  )}
                  <span className="text-sm text-neutral-400">
                    {uploading ? 'Uploading...' : selectedFile ? selectedFile.name : 'Choose a file'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-background rounded-lg p-6"
          >
            <div className="flex items-center mb-4">
              <CreditCard size={24} className="text-accent mr-2" />
              <h2 className="text-xl font-semibold">Subscription</h2>
            </div>
            <div className="space-y-4">
              <p className="text-neutral-400">
                {seller?.user.status === 'active'
                  ? 'Your subscription is active'
                  : 'Activate your subscription to start selling'}
              </p>
              <button
                onClick={handleSubscription}
                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {seller?.user.status === 'active' ? 'Manage Subscription' : 'Subscribe Now'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-background rounded-lg p-6"
        >
          <div className="flex items-center mb-4">
            <BarChart size={24} className="text-success mr-2" />
            <h2 className="text-xl font-semibold">Analytics Overview</h2>
          </div>
          <div className="text-center py-12">
            <p className="text-neutral-400">Analytics dashboard coming soon</p>
          </div>
        </motion.div> */}
        <JunoStudioDownloads />

        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onSubscribe={handleSubscriptionUpdate}
          currentPlan={seller?.user.status === 'active' ? {
            id: 'standard',
            name: 'Standard',
            price: 4999,
            billingPeriod: 'monthly',
            features: [
              'Unlimited products',
              'Advanced analytics',
              'Priority support',
              'Multiple user accounts',
              'API access',
              'Custom integrations'
            ]
          } : undefined}
        />
      </div>
    </div>
  );
};

export default SellerDashboard;