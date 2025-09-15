import React, { useState, useEffect } from 'react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';
import { Loader, DollarSign, ShoppingCart, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsCard: React.FC<{ title: string, value: string | number, change?: string, icon: React.ReactNode }> = ({ title, value, change, icon }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background p-6 rounded-lg border border-neutral-700"
    >
        <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">{title}</p>
            {icon}
        </div>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
        {change && (
            <p className={`text-sm flex items-center mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {change.startsWith('+') ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                {change}
            </p>
        )}
    </motion.div>
);

const Analytics: React.FC = () => {
    const { seller } = useSellerAuth();
    const token = seller?.token;
    const [salesData, setSalesData] = useState<any>(null);
    const [orderData, setOrderData] = useState<any>(null);
    const [inventoryData, setInventoryData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            setIsLoading(true);
            setError(null);

            // This is a placeholder for date range logic
            // const startTime = new Date();
            // startTime.setDate(startTime.getDate() - 30);

            try {
                const [sales, orders, inventory] = await Promise.all([
                    api.SellerAnalytics.GetSalesAnalytics(token),
                    api.SellerAnalytics.GetOrderAnalytics(token),
                    api.SellerAnalytics.GetInventoryAnalytics(token)
                ]);

                if (sales.ok) setSalesData(sales.body);
                else throw new Error('Failed to fetch sales analytics');

                if (orders.ok) setOrderData(orders.body);
                else throw new Error('Failed to fetch order analytics');

                if (inventory.ok) setInventoryData(inventory.body);
                else throw new Error('Failed to fetch inventory analytics');

            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching analytics.');
            }
            
            setIsLoading(false);
        };
        fetchData();
    }, [token, timeRange]);

    if (isLoading) return <div className="text-center p-8 text-white"><Loader className="animate-spin inline-block mr-2"/> Loading analytics...</div>;
    if (error) return <div className="text-center p-8 text-red-500 flex items-center justify-center"><AlertCircle className="mr-2"/> {error}</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>
                {/* Time range selector can be added here */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnalyticsCard title="Total Revenue" value={`Rs. ${salesData?.total_revenue?.toLocaleString() || 0}`} change={salesData?.revenue_change} icon={<DollarSign className="text-green-500"/>} />
                <AnalyticsCard title="Total Orders" value={orderData?.total_orders || 0} change={orderData?.orders_change} icon={<ShoppingCart className="text-blue-500"/>} />
                <AnalyticsCard title="Avg. Order Value" value={`Rs. ${salesData?.average_order_value?.toLocaleString() || 0}`} change={salesData?.aov_change} icon={<DollarSign className="text-yellow-500"/>} />
                <AnalyticsCard title="Conversion Rate" value={`${orderData?.conversion_rate || 0}%`} change={orderData?.conversion_rate_change} icon={<TrendingUp className="text-indigo-500"/>} />
                <AnalyticsCard title="Products in Stock" value={inventoryData?.total_stock || 0} icon={<Package className="text-orange-500"/>} />
                <AnalyticsCard title="Out of Stock Products" value={inventoryData?.out_of_stock_products || 0} icon={<AlertCircle className="text-red-500"/>} />
            </div>
            <div className="mt-8 text-center text-neutral-500">
                <p>More detailed charts and product-specific analytics coming soon.</p>
            </div>
        </motion.div>
    );
};

export default Analytics;