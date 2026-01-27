import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, Truck, TrendingUp } from 'lucide-react';
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
      <div className="glass-panel p-4 border border-white/10 shadow-xl">
        <p className="label text-base text-white font-bold mb-2">{formattedLabel}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} className="flex items-center justify-between text-sm gap-4">
            <p style={{ color: pld.stroke }}>{`${pld.name}:`}</p>
            <p className="font-mono font-bold text-white">{pld.value}</p>
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
        const [ordersResponse, usersResponse, sellersResponse, bookingsResponse] = await Promise.all([
          GetAllOrders(),
          getAllUsers(),
          adminGetAllSellers(),
          getAllDeliveryBookings(),
        ]);

        const getArray = (resp: any) => {
            if (!resp.ok) return [];
            return Array.isArray(resp.body) ? resp.body : (resp.body?.data || []);
        };

        const orders: Order[] = getArray(ordersResponse);
        const users = getArray(usersResponse);
        const sellers = getArray(sellersResponse);
        const bookings = getArray(bookingsResponse);

        setAllOrders(orders);
        setAllUsers(users);

        const totalRevenue = orders.reduce((acc, order) => acc + (order.subtotal * 0.125) + (order.shipping_cost || 0), 0);
        const gmv = orders.reduce((acc, order) => acc + (order.total || 0), 0);
        const ambassadorPayout = totalRevenue * 0.15;
        const brandPayout = orders.reduce((acc, order) => acc + (order.subtotal * 0.875), 0);
        
        setStats({
          totalRevenue,
          gmv,
          ambassadorPayout,
          brandPayout,
          totalUsers: users.length,
          totalSellers: sellers.length,
          totalDeliveryBookings: bookings.length,
        });
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
    { name: 'Gross Merchandise Value', value: stats ? `Rs ${stats.gmv?.toLocaleString()}` : 'N/A', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    { name: 'Total Revenue', value: stats ? `Rs ${stats.totalRevenue?.toLocaleString()}` : 'N/A', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { name: 'Ambassador Payout', value: stats ? `Rs ${stats.ambassadorPayout?.toLocaleString()}` : 'N/A', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { name: 'Brand Payout', value: stats ? `Rs ${stats.brandPayout?.toLocaleString()}` : 'N/A', icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    { name: 'Total Users', value: stats ? stats.totalUsers : 'N/A', icon: Users, color: 'text-primary', bg: 'bg-primary/20' },
    { name: 'Total Sellers', value: stats ? stats.totalSellers : 'N/A', icon: ShoppingBag, color: 'text-secondary', bg: 'bg-secondary/20' },
    { name: 'Total Delivery Bookings', value: stats ? stats.totalDeliveryBookings : 'N/A', icon: Truck, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
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
    return <div className="glass-panel p-6 text-center text-neutral-400">Loading stats...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold text-white">Platform Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => (
          <div key={index} className="glass-card flex items-center">
            <div className={`p-3 rounded-xl mr-4 ${stat.bg}`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-sm text-neutral-400">{stat.name}</p>
              <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Performance</h2>
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {timePeriods.map(period => (
              <button
                key={period.key}
                onClick={() => setTimePeriod(period.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  timePeriod === period.key
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
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
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                    dataKey="date"
                    stroke="#a3a3a3"
                    tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tick={{fontSize: 12}}
                    />
                    <YAxis stroke="#a3a3a3" tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Orders" stroke="#82ca9d" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Daily User Signups</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usersChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                    dataKey="date"
                    stroke="#a3a3a3"
                    tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    tick={{fontSize: 12}}
                    />
                    <YAxis stroke="#a3a3a3" tick={{fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="User Signups" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlatformStats;
