import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Truck } from 'lucide-react';
import { GetAllOrders, getAllUsers, getAllSellers, getAllDeliveryBookings } from '../../api/adminApi';
import { Order } from '../../constants/orders';

interface StatsData {
  totalRevenue: number;
  gmv: number;
  ambassadorPayout: number;
  brandPayout: number;
  totalUsers: number;
  totalSellers: number;
  totalDeliveryBookings: number;
}

const PlatformStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersResponse, usersResponse, sellersResponse, bookingsResponse] = await Promise.all([
          GetAllOrders(),
          getAllUsers(),
          getAllSellers(),
          getAllDeliveryBookings(),
        ]);

        if (ordersResponse.ok && usersResponse.ok && sellersResponse.ok && bookingsResponse.ok) {
          const orders: Order[] = ordersResponse.body;
          const totalRevenue = orders.reduce((acc, order) => acc + (order.subtotal * 0.125) + order.shipping_cost, 0);
          const gmv = orders.reduce((acc, order) => acc + order.total, 0);
          const ambassadorPayout = totalRevenue * 0.15;
          const brandPayout = orders.reduce((acc, order) => acc + (order.subtotal * 0.875), 0);
          
          setStats({
            totalRevenue,
            gmv,
            ambassadorPayout,
            brandPayout,
            totalUsers: usersResponse.body.length,
            totalSellers: sellersResponse.body.length,
            totalDeliveryBookings: bookingsResponse.body.length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = [
    { name: 'Gross Merchandise Value', value: stats ? `Rs ${stats.gmv?.toFixed(2)}` : 'N/A', icon: DollarSign, color: 'text-accent' },
    { name: 'Total Revenue', value: stats ? `Rs ${stats.totalRevenue?.toFixed(2)}` : 'N/A', icon: DollarSign, color: 'text-accent' },
    { name: 'Campus Ambassador Payout', value: stats ? `Rs ${stats.ambassadorPayout?.toFixed(2)}` : 'N/A', icon: Users, color: 'text-primary' },
    { name: 'Brand Payout', value: stats ? `Rs ${stats.brandPayout?.toFixed(2)}` : 'N/A', icon: ShoppingBag, color: 'text-secondary' },
    { name: 'Total Users', value: stats ? stats.totalUsers : 'N/A', icon: Users, color: 'text-primary' },
    { name: 'Total Sellers', value: stats ? stats.totalSellers : 'N/A', icon: ShoppingBag, color: 'text-secondary' },
    { name: 'Total Delivery Bookings', value: stats ? stats.totalDeliveryBookings : 'N/A', icon: Truck, color: 'text-yellow-500' },
  ];

  if (isLoading) {
    return <div className="bg-background rounded-lg p-6 text-center">Loading stats...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-background rounded-lg p-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-white">Platform Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => (
          <div key={index} className="bg-background-light p-4 rounded-lg">
            <div className="flex items-center">
              <stat.icon size={24} className={`${stat.color} mr-3`} />
              <div>
                <p className="text-sm text-neutral-400">{stat.name}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PlatformStats;
