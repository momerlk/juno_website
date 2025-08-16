import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, DollarSign, BarChart } from 'lucide-react';

const PlatformStats: React.FC = () => {
  // In a real app, these stats would come from an API
  const stats = [
    { name: 'Total Users', value: '1,234', icon: Users, color: 'text-primary' },
    { name: 'Total Sellers', value: '56', icon: ShoppingBag, color: 'text-secondary' },
    { name: 'Total Revenue', value: '$45,678', icon: DollarSign, color: 'text-accent' },
    { name: 'Pending Approvals', value: '8', icon: BarChart, color: 'text-yellow-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-background rounded-lg p-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-white">Platform Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
