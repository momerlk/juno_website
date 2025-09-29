import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Truck } from 'lucide-react';
import { GetAllOrders, getAllUsers, getAllSellers, getAllInvites, getAllDeliveryBookings } from '../../api/adminApi';
import { Order } from '../../constants/orders';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsData {
  totalRevenue: number;
  gmv: number;
  ambassadorPayout: number;
  brandPayout: number;
  totalUsers: number;
  totalSellers: number;
  totalDeliveryBookings: number;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedLabel = new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return (
      <div className="bg-background-light/80 backdrop-blur-sm p-4 rounded-lg border border-neutral-700 shadow-lg">
        <p className="label text-base text-white font-bold mb-2">{formattedLabel}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} className="flex items-center justify-between text-sm">
            <p style={{ color: pld.stroke }}>{`${pld.name}:`}</p>
            <p className="ml-4 font-mono font-bold" style={{ color: pld.stroke }}>{pld.value}</p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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
            return data.reduce((acc, item) => {
              const date = new Date(item[dateKey]).toISOString().split('T')[0];
              acc[date] = (acc[date] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
          };

          const ordersByDay = processDataForChart(orders, 'created_at');
          const usersByDay = processDataForChart(users, 'created_at');

          const allDates = [...new Set([...Object.keys(ordersByDay), ...Object.keys(usersByDay)])];
          allDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

          const combinedData = allDates.map(date => ({
            date,
            orders: ordersByDay[date] || 0,
            users: usersByDay[date] || 0,
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
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
            <XAxis 
              dataKey="date"
              stroke="#a3a3a3"
              tickFormatter={(dateStr) => {
                const date = new Date(dateStr);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis stroke="#a3a3a3" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="orders" name="Orders" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOrders)" />
            <Area type="monotone" dataKey="users" name="Users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default PlatformStats;
