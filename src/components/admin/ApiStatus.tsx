import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import * as adminApi from '../../api/adminApi';

const ApiStatus: React.FC = () => {
  const [results, setResults] = useState<Record<string, { status: string; ok: boolean; time: number; error?: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  const endpointsToCheck = [
    { name: 'Get All Users', fn: adminApi.getAllUsers },
    { name: 'Get All Sellers', fn: adminApi.adminGetAllSellers },
    { name: 'Get All Orders', fn: adminApi.GetAllOrders },
    { name: 'Get All Invites', fn: adminApi.getAllInvites },
    { name: 'Get Delivery Bookings', fn: adminApi.getAllDeliveryBookings },
    { name: 'Get Interactions', fn: adminApi.adminGetAllInteractions },
    { name: 'Get Sales Funnel', fn: adminApi.getSalesFunnel },
    { name: 'Get Analytics Events', fn: adminApi.getAnalyticsEvents },
    { name: 'Get Chapter Forms', fn: adminApi.getChapterForms },
    { name: 'Get Notification Tokens', fn: adminApi.getNotificationTokens },
    { name: 'Get System Health', fn: adminApi.getSystemHealth },
    { name: 'Get Products', fn: adminApi.getAllProducts },
    { name: 'Get Product Queue', fn: adminApi.getProductQueue },
    { name: 'Get Embeddings', fn: adminApi.getEmbeddings },
    { name: 'Get Parent Orders', fn: adminApi.getParentOrders },
    { name: 'Get All Carts', fn: adminApi.getAllCarts },
    { name: 'Get Waitlist', fn: adminApi.getWaitlist },
    { name: 'Get All OTPs', fn: adminApi.getAllOTPs },
  ];

  const runTests = async () => {
    setIsLoading(true);
    const newResults: any = {};

    for (const endpoint of endpointsToCheck) {
      const start = performance.now();
      try {
        const response = await endpoint.fn();
        const end = performance.now();
        newResults[endpoint.name] = {
          status: response.status.toString(),
          ok: response.ok,
          time: Math.round(end - start),
          error: response.ok ? undefined : JSON.stringify(response.body),
          dataPreview: response.ok ? JSON.stringify(response.body).substring(0, 100) + '...' : undefined
        };
      } catch (error: any) {
        const end = performance.now();
        newResults[endpoint.name] = {
          status: 'Error',
          ok: false,
          time: Math.round(end - start),
          error: error.message || 'Unknown error'
        };
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center">
            <div className="p-2 bg-primary/20 rounded-lg mr-3">
                <Server size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-white">API System Status</h2>
        </div>
        <button 
            onClick={runTests} 
            disabled={isLoading}
            className="flex items-center px-4 py-2 glass-button bg-white/5 hover:bg-white/10 text-white rounded-lg disabled:opacity-50"
        >
            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {endpointsToCheck.map((endpoint) => {
            const result = results[endpoint.name];
            if (!result) return (
                <div key={endpoint.name} className="glass-card bg-white/5 p-4 flex items-center justify-between animate-pulse">
                    <span className="text-neutral-400">{endpoint.name}</span>
                    <span className="text-neutral-600">Waiting...</span>
                </div>
            );

            return (
                <div key={endpoint.name} className={`glass-card p-4 border ${result.ok ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white">{endpoint.name}</span>
                        {result.ok ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
                    </div>
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Status:</span>
                            <span className={result.ok ? 'text-green-400' : 'text-red-400'}>{result.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-400">Latency:</span>
                            <span className="text-neutral-300">{result.time}ms</span>
                        </div>
                        {result.error && (
                            <div className="mt-2 p-2 bg-black/20 rounded text-red-300 break-all">
                                {result.error}
                            </div>
                        )}
                         {result.dataPreview && (
                            <div className="mt-2 p-2 bg-black/20 rounded text-neutral-400 break-all font-mono text-[10px]">
                                {result.dataPreview}
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </motion.div>
  );
};

export default ApiStatus;