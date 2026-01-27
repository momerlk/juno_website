import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Users, Percent, Route } from 'lucide-react';
import { getAllUsers, getAllSellers } from '../../api/adminApi';

// Haversine formula to calculate distance between two lat/lng points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

const INSTANT_DELIVERY_RADIUS = 10; // in km
const DELIVERY_COST_FIXED = 130;
const DELIVERY_COST_PER_KM = 13.8;

const DeliveryCoverage: React.FC = () => {
  const [coverageStats, setCoverageStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateCoverage = async () => {
      setIsLoading(true);
      try {
        const [usersResponse, sellersResponse] = await Promise.all([getAllUsers(), getAllSellers()]);

        if (usersResponse.ok && sellersResponse.ok) {
          const users = usersResponse.body.filter((u: any) => u.location && u.location.latitude && u.location.longitude);
          const sellers = sellersResponse.body.filter((s: any) => s.location && s.location.latitude && s.location.longitude);

          let coveredUsers = 0;
          let totalDistance = 0;

          users.forEach((user: any) => {
            let nearestSellerDistance = Infinity;

            sellers.forEach((seller: any) => {
              const distance = getDistance(
                user.location.latitude,
                user.location.longitude,
                seller.location.latitude,
                seller.location.longitude
              );

              if (distance < nearestSellerDistance) {
                nearestSellerDistance = distance;
              }
            });

            if (nearestSellerDistance <= INSTANT_DELIVERY_RADIUS) {
              coveredUsers++;
              totalDistance += nearestSellerDistance;
            }
          });

          const coveragePercentage = (coveredUsers / users.length) * 100;
          const averageDistance = coveredUsers > 0 ? totalDistance / coveredUsers : 0;
          const averageCost = coveredUsers > 0 ? DELIVERY_COST_FIXED + (averageDistance * DELIVERY_COST_PER_KM) : 0;

          setCoverageStats({
            coveredUsers,
            totalUsers: users.length,
            coveragePercentage,
            averageDistance,
            averageCost,
          });
        }
      } catch (error) {
        console.error('Failed to calculate delivery coverage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateCoverage();
  }, []);

  const displayStats = [
    { name: 'Covered Users', value: coverageStats ? `${coverageStats.coveredUsers} / ${coverageStats.totalUsers}` : 'N/A', icon: Users, color: 'text-primary', bg: 'bg-primary/20' },
    { name: 'Coverage Percentage', value: coverageStats ? `${coverageStats.coveragePercentage.toFixed(2)}%` : 'N/A', icon: Percent, color: 'text-green-400', bg: 'bg-green-500/20' },
    { name: 'Average Distance', value: coverageStats ? `${coverageStats.averageDistance.toFixed(2)} km` : 'N/A', icon: Route, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { name: 'Average Cost', value: coverageStats ? `Rs ${coverageStats.averageCost.toFixed(2)}` : 'N/A', icon: Truck, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  ];

  if (isLoading) {
    return <div className="glass-panel p-6 text-center text-neutral-400">Calculating coverage...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex items-center mb-6">
        <div className="p-2 bg-primary/20 rounded-lg mr-3">
            <Truck size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-white">Instant Delivery Coverage</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => (
          <div key={index} className="glass-card flex items-center">
            <div className={`p-3 rounded-xl mr-4 ${stat.bg}`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-sm text-neutral-400">{stat.name}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default DeliveryCoverage;
