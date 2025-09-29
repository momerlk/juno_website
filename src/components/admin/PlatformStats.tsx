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
  const [ordersChartData, setOrdersChartData] = useState<any[]>([]);
  const [usersChartData, setUsersChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
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

          setAllOrders(orders);
          setAllUsers(users);

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
        }
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const now = new Date();
    const getFilteredData = (data: any[], dateKey: string) => {
      if (timePeriod === 'all') return data;
      let days: number;
      switch (timePeriod) {
        case '1d': days = 1; break;
        case '1w': days = 7; break;
        case '2w': days = 14; break;
        case '1m': days = 30; break;
        case '2m': days = 60; break;
        default: days = Infinity;
      }
      const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
      return data.filter(item => new Date(item[dateKey]).getTime() >= cutoff);
    };

    const processDataForChart = (data: any[], dateKey: string) => {
      const countsByDay = data.reduce((acc, item) => {
        const date = new Date(item[dateKey]).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const allDates = Object.keys(countsByDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      if (allDates.length === 0) {
        return [];
      }

      const chartData = [];
      let currentDate = new Date(allDates[0]);
      const lastDate = new Date(allDates[allDates.length - 1]);

      while (currentDate <= lastDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        chartData.push({
          date: dateStr,
          count: countsByDay[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return chartData;
    };

    const filteredOrders = getFilteredData(allOrders, 'created_at');
    const filteredUsers = getFilteredData(allUsers, 'created_at');

    setOrdersChartData(processDataForChart(filteredOrders, 'created_at'));
    setUsersChartData(processDataForChart(filteredUsers, 'created_at'));

  }, [timePeriod, allOrders, allUsers]);

  const displayStats = [
    { name: 'Gross Merchandise Value', value: stats ? `Rs ${stats.gmv?.toFixed(2)}` : 'N/A', icon: DollarSign, color: 'text-accent' },
    { name: 'Total Revenue', value: stats ? `Rs ${stats.totalRevenue?.toFixed(2)}` : 'N/A', icon: DollarSign, color: 'text-accent' },
    { name: 'Campus Ambassador Payout', value: stats ? `Rs ${stats.ambassadorPayout?.toFixed(2)}` : 'N/A', icon: Users, color: 'text-primary' },
    { name: 'Brand Payout', value: stats ? `Rs ${stats.brandPayout?.toFixed(2)}` : 'N/A', icon: ShoppingBag, color: 'text-secondary' },
    { name: 'Total Users', value: stats ? stats.totalUsers : 'N/A', icon: Users, color: 'text-primary' },
    { name: 'Total Sellers', value: stats ? stats.totalSellers : 'N/A', icon: ShoppingBag, color: 'text-secondary' },
    { name: 'Total Delivery Bookings', value: stats ? stats.totalDeliveryBookings : 'N/A', icon: Truck, color: 'text-yellow-500' },
  ];

  const timePeriods = [
    { key: '1d', label: '1D' },
    { key: '1w', label: '1W' },
    { key: '2w', label: '2W' },
    { key: '1m', label: '1M' },
    { key: '2m', label: '2M' },
    { key: 'all', label: 'All' },
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Performance</h2>
          <div className="flex items-center space-x-2 bg-background-light p-1 rounded-lg">
            {timePeriods.map(period => (
              <button
                key={period.key}
                onClick={() => setTimePeriod(period.key)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timePeriod === period.key
                    ? 'bg-primary text-white'
                    : 'text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Daily Orders</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ordersChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                <XAxis 
                  dataKey="date"
                  stroke="#a3a3a3"
                  tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#a3a3a3" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Orders" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Daily User Signups</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usersChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                <XAxis 
                  dataKey="date"
                  stroke="#a3a3a3"
                  tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#a3a3a3" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="User Signups" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlatformStats;
