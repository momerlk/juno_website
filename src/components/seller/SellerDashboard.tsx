import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { BarChart, Upload, CreditCard, LogOut, Store } from 'lucide-react';

const SellerDashboard: React.FC = () => {
  const { seller, logout } = useSellerAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // TODO: Implement actual file upload logic
      console.log('File selected:', file.name);
    }
  };

  const handleSubscription = () => {
    // TODO: Implement subscription payment logic
    console.log('Processing subscription payment');
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
              <p className="text-neutral-400">Business Name: <span className="text-white">{seller?.businessName}</span></p>
              <p className="text-neutral-400">Email: <span className="text-white">{seller?.email}</span></p>
              <p className="text-neutral-400">Subscription: <span className={`${seller?.subscriptionStatus === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                {/* {seller?.subscriptionStatus.charAt(0).toUpperCase() + seller?.subscriptionStatus.slice(1)} */}
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
              <p className="text-neutral-400">Upload your product catalog data in CSV format</p>
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-background-light rounded-lg border-2 border-dashed border-neutral-700 cursor-pointer hover:border-primary">
                  <Upload size={24} className="text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-400">
                    {selectedFile ? selectedFile.name : 'Choose a file'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
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
                {seller?.subscriptionStatus === 'active'
                  ? 'Your subscription is active'
                  : 'Activate your subscription to start selling'}
              </p>
              <button
                onClick={handleSubscription}
                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {seller?.subscriptionStatus === 'active' ? 'Manage Subscription' : 'Subscribe Now'}
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div
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
        </motion.div>
      </div>
    </div>
  );
};

export default SellerDashboard;