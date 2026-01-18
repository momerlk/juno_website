import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Loader, Globe, CreditCard, Store, ShoppingCart, ArrowRight, AlertTriangle, HelpCircle, Package, Image as ImageIcon, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SubscriptionModal from './SubscriptionModal';
import * as api from "../../api/sellerApi";
import { uploadProductCatalogue } from '../../api';
import { Order } from '../../constants/orders';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Product, QueueItem } from '../../constants/types';

const UrgentActionCard: React.FC<{ 
    title: string; 
    description: string; 
    actionText: string; 
    onAction: () => void; 
    type: 'warning' | 'error' | 'info';
    icon?: React.ReactNode;
}> = ({ title, description, actionText, onAction, type, icon }) => (
    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${
        type === 'error' ? 'bg-red-500/10 border-red-500/30' : 
        type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 
        'bg-blue-500/10 border-blue-500/30'
    }`}>
        <div className="flex gap-3">
            <div className={`p-2 rounded-lg h-fit ${
                type === 'error' ? 'bg-red-500/20 text-red-400' : 
                type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-blue-500/20 text-blue-400'
            }`}>
                {icon || <AlertTriangle size={20} />}
            </div>
            <div>
                <h4 className={`font-semibold ${
                    type === 'error' ? 'text-red-400' : 
                    type === 'warning' ? 'text-yellow-400' : 
                    'text-blue-400'
                }`}>{title}</h4>
                <p className="text-sm text-neutral-300 mt-1">{description}</p>
            </div>
        </div>
        <button 
            onClick={onAction}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors w-full sm:w-auto ${
                type === 'error' ? 'bg-red-500 text-white hover:bg-red-600' : 
                type === 'warning' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 
                'bg-blue-500 text-white hover:bg-blue-600'
            }`}
        >
            {actionText}
        </button>
    </div>
);

const SellerHome: React.FC = () => {
  const { seller } = useSellerAuth();
  const navigate = useNavigate();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Action Items State
  const [queueCount, setQueueCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [hasInvalidProfile, setHasInvalidProfile] = useState(false);
  const [isLoadingActions, setIsLoadingActions] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

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

  useEffect(() => {
      const fetchActionItems = async () => {
          if (!seller?.token) return;
          setIsLoadingActions(true);
          try {
              // 1. Check Queue
              const queueResponse = await api.Seller.Queue.List(seller.token);
              if (queueResponse.ok && queueResponse.body) {
                  const items = queueResponse.body as QueueItem[];
                  // Filter for items that are NOT ready
                  const pending = items.filter(i => i.status !== 'ready').length;
                  setQueueCount(pending);
              }

              // 2. Check Active Products for Stock (Check first 5 pages / ~60 items)
              let allCheckedProducts: Product[] = [];
              for (let i = 1; i <= 5; i++) {
                  const productsResponse = await api.Seller.GetProducts(seller.token, i);
                  if (productsResponse.ok && productsResponse.body) {
                      const pageProducts = productsResponse.body as Product[];
                      if (pageProducts.length === 0) break;
                      allCheckedProducts = [...allCheckedProducts, ...pageProducts];
                  } else {
                      break;
                  }
              }

              const outOfStock = allCheckedProducts.filter(p => {
                  if (p.status !== 'active') return false;
                  
                  // Check if total stock is 0
                  const totalStock = p.variants.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0);
                  if (totalStock === 0) return true;

                  // Check if any specific ACTIVE variant has 0 stock
                  // (Assuming 'available' true implies it's an active variant intended for sale)
                  const hasZeroStockActiveVariant = p.variants.some(v => v.available && (v.inventory?.quantity || 0) === 0);
                  return hasZeroStockActiveVariant;
              }).length;
              
              setOutOfStockCount(outOfStock);

              // 3. Check Profile Images
              const profile = seller.user; // Assuming seller object is up to date or we fetch it
              // We can also fetch fresh profile
              const profileResponse = await api.Auth.GetProfile(seller.token);
              if (profileResponse.ok && profileResponse.body) {
                  const p = profileResponse.body;
                  const isInvalid = (url: string | undefined | null) => 
                      !url || url.includes("juno_media");
                  
                  if (isInvalid(p.logo_url) || isInvalid(p.banner_url)) {
                      setHasInvalidProfile(true);
                  }
              }

          } catch (e) {
              console.error("Failed to fetch action items", e);
          } finally {
              setIsLoadingActions(false);
          }
      };
      fetchActionItems();
  }, [seller?.token, seller?.user]);

  const handleSyncCatalogue = async () => {
    if (!websiteUrl) {
      alert("Please enter a website URL");
      return;
    }
    
    try {
      setUploading(true);
      await uploadProductCatalogue(seller!.token, websiteUrl);
      setUploading(false);
      alert("Catalogue sync started successfully!");
      setWebsiteUrl('');
    } catch(error) {
      setUploading(false);
      alert("Failed to sync catalogue, error = " + error);
    }
  };

  const handleSubscriptionUpdate = async (plan: any, paymentDetails: any) => {
    console.log('Processing subscription:', { plan, paymentDetails });
    setIsSubscriptionModalOpen(false);
  };

  const hasUrgentActions = queueCount > 0 || outOfStockCount > 0 || hasInvalidProfile;

  return (
    <>
      <AnimatePresence>
        {isLoadingActions && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 glass-panel border border-primary/20 flex items-center justify-center space-x-3"
            >
                <Loader className="animate-spin text-primary" size={20} />
                <span className="text-neutral-300 font-medium">Checking for updates and TODOs required by you...</span>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasUrgentActions && !isLoadingActions && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="mb-8"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" />
                        Action Required
                    </h2>
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
                    >
                        <HelpCircle size={20} />
                        <span className="hidden sm:inline">How to resolve issues?</span>
                    </button>
                </div>

                <AnimatePresence>
                    {showHelp && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-6 text-neutral-200"
                        >
                            <h4 className="font-bold text-white mb-2 text-lg">Help & Support Guide</h4>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="font-semibold text-white">1. Pending Queue Items</h5>
                                    <p className="text-sm mt-1">Products uploaded via Shopify or manually are placed in a queue. You <strong>must</strong> set their <strong>Gender</strong>, <strong>Product Type</strong>, and <strong>Sizing Guide</strong>. Once completed and "Ready", click "Publish" to make them live. This ensures our AI recommendation system can properly feature your products.</p>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-white">2. Out of Stock Active Products</h5>
                                    <p className="text-sm mt-1">Active products with 0 stock frustrate customers. Please <strong>deactivate</strong> them or update their inventory quantity immediately.</p>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-white">3. Invalid Profile Images</h5>
                                    <p className="text-sm mt-1">If your logo or banner uses the old "juno_media" storage, it will not load. Please upload new images in your Profile settings.</p>
                                </div>
                                <div className="pt-4 border-t border-primary/20">
                                    <p className="font-bold text-white text-lg flex items-center gap-2">
                                        <Phone size={20} />
                                        Contact Support: <span className="text-primary">+92 315 8972405</span> (WhatsApp)
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-4">
                    {queueCount > 0 && (
                        <UrgentActionCard 
                            type="warning"
                            title={`${queueCount} Products Pending in Queue`}
                            description="These products require classification (Gender, Type) and Sizing Guides before they can be published and processed by our recommendation system."
                            actionText="Process Queue"
                            onAction={() => navigate('/seller/inventory')}
                            icon={<Package size={20} />}
                        />
                    )}
                    {outOfStockCount > 0 && (
                        <UrgentActionCard 
                            type="error"
                            title={`${outOfStockCount} Active Products Out of Stock`}
                            description="Active products with 0 quantity must be deactivated or restocked to avoid customer dissatisfaction."
                            actionText="Manage Inventory"
                            onAction={() => navigate('/seller/inventory')}
                            icon={<AlertTriangle size={20} />}
                        />
                    )}
                    {hasInvalidProfile && (
                        <UrgentActionCard 
                            type="error"
                            title="Profile Images Need Update"
                            description="Your store logo or banner is using an outdated image source. Please upload new images."
                            actionText="Update Profile"
                            onAction={() => navigate('/seller/profile')}
                            icon={<ImageIcon size={20} />}
                        />
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>

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
                <Globe size={24} className="text-secondary" />
              </div>
              <h2 className="text-xl font-semibold text-white">Sync Catalogue</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-4">Enter your website URL to automatically sync your product catalogue.</p>
            <div className="space-y-3">
              <input
                type="url"
                placeholder="https://your-website.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-primary/50"
                disabled={uploading}
              />
              <button 
                onClick={handleSyncCatalogue}
                disabled={uploading}
                className="w-full glass-button bg-secondary/20 hover:bg-secondary/30 text-secondary border-secondary/30 flex justify-center items-center"
              >
                {uploading ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  'Sync Now'
                )}
              </button>
            </div>
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