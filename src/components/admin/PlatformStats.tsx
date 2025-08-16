import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, BarChart } from 'lucide-react';
import { getAnalyticsSummary } from '../../api/adminApi';

const PlatformStats: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const summary = await getAnalyticsSummary();
        setStats(summary);
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = [
    { name: 'Total Revenue', value: stats ? `${stats.totalRevenue?.toFixed(2)}` : 'N/A', icon: DollarSign, color: 'text-accent' },
    { name: 'Active Customers', value: stats ? stats.activeCustomers : 'N/A', icon: Users, color: 'text-primary' },
    { name: 'Total Sellers', value: 'N/A', icon: ShoppingBag, color: 'text-secondary' },
    { name: 'Pending Approvals', value: 'N/A', icon: BarChart, color: 'text-yellow-500' },
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
