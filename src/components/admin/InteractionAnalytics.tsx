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
    return <div className="text-center p-8">Loading interaction analytics...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-white mb-6">Overall Interaction Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-background-light p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary mb-2">Total Swipes</h3>
          <p className="text-4xl font-bold">{analytics?.totalInteractions}</p>
        </div>
        <div className="bg-background-light p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary mb-2">Likes</h3>
          <p className="text-4xl font-bold">{analytics?.likes}</p>
          <p className="text-lg text-green-500">{analytics?.likePercentage.toFixed(2)}%</p>
        </div>
        <div className="bg-background-light p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary mb-2">Dislikes</h3>
          <p className="text-4xl font-bold">{analytics?.dislikes}</p>
          <p className="text-lg text-red-500">{analytics?.dislikePercentage.toFixed(2)}%</p>
        </div>
        <div className="bg-background-light p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-primary mb-2">Cart Abandonment Rate</h3>
          <p className="text-4xl font-bold">{analytics?.cartAbandonmentRate.toFixed(2)}%</p>
        </div>
      </div>
    </motion.div>
  );
};

export default InteractionAnalytics;
