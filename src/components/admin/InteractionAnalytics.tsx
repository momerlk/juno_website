import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, ThumbsUp, ThumbsDown, ShoppingCart, Percent } from 'lucide-react';
import { adminGetAllInteractions, GetAllOrders } from '../../api/adminApi';

const InteractionAnalytics: React.FC = () => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [interactionsResponse, ordersResponse] = await Promise.all([
          adminGetAllInteractions(),
          GetAllOrders(),
        ]);

        if (interactionsResponse.ok) {
          setInteractions(interactionsResponse.body);
        }
        if (ordersResponse.ok) {
          setOrders(ordersResponse.body);
        }

      } catch (error) {
        console.error("Failed to fetch interaction data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const analytics = React.useMemo(() => {
    if (interactions.length === 0) return null;

    const totalInteractions = interactions.length;
    const likes = interactions.filter(i => i.action_type === 'like').length;
    const dislikes = interactions.filter(i => i.action_type === 'dislike').length;
    const addToCarts = interactions.filter(i => i.action_type === 'add_to_cart').length;
    
    const purchasedProductIds = new Set();
    orders.forEach(order => {
        order.order_items.forEach((item: any) => {
            purchasedProductIds.add(item.product_id);
        });
    });

    const abandonedCarts = interactions.filter(i => i.action_type === 'add_to_cart' && !purchasedProductIds.has(i.product_id)).length;
    const cartAbandonmentRate = addToCarts > 0 ? (abandonedCarts / addToCarts) * 100 : 0;

    return {
      totalInteractions,
      likes,
      dislikes,
      likePercentage: (likes / totalInteractions) * 100,
      dislikePercentage: (dislikes / totalInteractions) * 100,
      cartAbandonmentRate,
    };
  }, [interactions, orders]);

  if (isLoading) {
    return <div className="text-center p-8 text-neutral-400">Loading interaction analytics...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-6">
        <div className="p-2 bg-primary/20 rounded-lg mr-3">
            <BarChart2 size={24} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white">Overall Interaction Analytics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                <BarChart2 size={20} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Total Swipes</h3>
          </div>
          <p className="text-4xl font-bold text-white">{analytics?.totalInteractions}</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                    <ThumbsUp size={20} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Likes</h3>
            </div>
            <span className="text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">{analytics?.likePercentage.toFixed(1)}%</span>
          </div>
          <p className="text-4xl font-bold text-white">{analytics?.likes}</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
                <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                    <ThumbsDown size={20} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dislikes</h3>
            </div>
            <span className="text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded">{analytics?.dislikePercentage.toFixed(1)}%</span>
          </div>
          <p className="text-4xl font-bold text-white">{analytics?.dislikes}</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                <ShoppingCart size={20} className="text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Cart Abandonment</h3>
          </div>
          <p className="text-4xl font-bold text-white">{analytics?.cartAbandonmentRate.toFixed(1)}%</p>
          <p className="text-sm text-neutral-400 mt-2">Rate of items added to cart but not purchased.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InteractionAnalytics;
