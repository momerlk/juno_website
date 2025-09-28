import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Truck } from 'lucide-react';
import { GetAllOrders, getAllUsers, getAllSellers, getAllInvites, getAllDeliveryBookings } from '../../api/adminApi';
import { Order } from '../../constants/orders';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersResponse, usersResponse, sellersResponse, bookingsResponse, invitesResponse] = await Promise.all([
          GetAllOrders(),
          getAllUsers(),
          getAllSellers(),
          getAllDeliveryBookings(),
          getAllInvites(),
        ]);

        if (ordersResponse.ok && usersResponse.ok && sellersResponse.ok && bookingsResponse.ok && invitesResponse.ok) {
          const orders: Order[] = ordersResponse.body;
          const users = usersResponse.body;
          const sellers = sellersResponse.body;
          const invites = invitesResponse.body;

          const totalRevenue = orders.reduce((acc, order) => acc + (order.subtotal * 0.125) + order.shipping_cost, 0);
          const gmv = orders.reduce((acc, order) => acc + order.total, 0);
          const ambassadorPayout = totalRevenue * 0.15;
          const brandPayout = orders.reduce((acc, order) => acc + (order.subtotal * 0.875), 0);
          
          setStats({
            totalRevenue,
            gmv,
            ambassadorPayout,
            brandPayout,
            totalUsers: users.length,
            totalSellers: sellers.length,
            totalDeliveryBookings: bookingsResponse.body.length,
          });

          const processDataForChart = (data: any[], dateKey: string) => {
            const countsByDay = data.reduce((acc, item) => {
              const date = new Date(item[dateKey]).toLocaleDateString();
              acc[date] = (acc[date] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            return Object.entries(countsByDay).map(([date, count]) => ({ date, count }));
          };

          const ordersByDay = processDataForChart(orders, 'created_at');
          const usersByDay = processDataForChart(users, 'created_at');
          const sellersByDay = processDataForChart(sellers, 'created_at');
          const invitesByDay = processDataForChart(invites, 'created_at');

          const allDates = [...new Set([...ordersByDay.map(d => d.date), ...usersByDay.map(d => d.date), ...sellersByDay.map(d => d.date), ...invitesByDay.map(d => d.date)])];

          const combinedData = allDates.map(date => ({
            date,
            orders: ordersByDay.find(d => d.date === date)?.count || 0,
            users: usersByDay.find(d => d.date === date)?.count || 0,
            sellers: sellersByDay.find(d => d.date === date)?.count || 0,
            invites: invitesByDay.find(d => d.date === date)?.count || 0,
          }));

          setChartData(combinedData);
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
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Daily Performance</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="date" stroke="#a3a3a3" />
            <YAxis stroke="#a3a3a3" />
            <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040' }} />
            <Legend />
            <Line type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" />
            <Line type="monotone" dataKey="users" stroke="#82ca9d" name="Users" />
            <Line type="monotone" dataKey="sellers" stroke="#ffc658" name="Sellers" />
            <Line type="monotone" dataKey="invites" stroke="#ff7300" name="Invites" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PlatformStats;
