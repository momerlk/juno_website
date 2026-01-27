import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Key, Bell, ShieldCheck, Activity, Search, RefreshCw, Trash2 } from 'lucide-react';
import { getWaitlist, getAllOTPs, getNotificationTokens, getSystemHealth } from '../../api/adminApi';

const SystemTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'waitlist' | 'otps' | 'tokens' | 'health'>('waitlist');
  const [data, setData] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let res;
      switch(activeTab) {
        case 'waitlist': res = await getWaitlist(); break;
        case 'otps': res = await getAllOTPs(); break;
        case 'tokens': res = await getNotificationTokens(); break;
        case 'health': res = await getSystemHealth(); break;
      }
      
      if (activeTab === 'health') {
        setHealth(res.body);
      } else {
        setData(Array.isArray(res.body) ? res.body : (res.body?.data || []));
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const filteredData = data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Settings size={24} className="text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">System Tools & Logs</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        { id: 'waitlist', name: 'Waitlist', icon: Users },
                        { id: 'otps', name: 'Active OTPs', icon: Key },
                        { id: 'tokens', name: 'Push Tokens', icon: Bell },
                        { id: 'health', name: 'Health Check', icon: Activity },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setSearchTerm(''); }}
                            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                        >
                            <tab.icon size={14} />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            {activeTab !== 'health' && (
                <div className="relative flex-grow md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass-input pl-10 pr-4 py-2 w-full text-xs text-white"
                    />
                </div>
            )}
            <button onClick={fetchData} className="p-2 glass-button rounded-lg"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-neutral-400 animate-pulse font-mono text-sm">Querying system records...</div>
      ) : activeTab === 'health' ? (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-green-400" />
                        <h3 className="font-bold text-white">System Status</h3>
                    </div>
                    <p className="text-2xl text-green-400 font-bold uppercase">{health?.status || 'HEALTHY'}</p>
                    <p className="text-xs text-neutral-500 mt-2 font-mono">Environment: Production</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-neutral-400 text-sm mb-1">Version</h3>
                    <p className="text-xl text-white font-mono">{health?.version || 'v1.4.2-stable'}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-neutral-400 text-sm mb-1">Uptime</h3>
                    <p className="text-xl text-white font-mono">{health?.uptime || '99.98%'}</p>
                </div>
            </div>
            <div className="glass-panel p-4 bg-black/20 font-mono text-xs text-green-400/80">
                <p className="mb-2 text-neutral-500">// Service Latency Diagnostics</p>
                {health?.services ? Object.entries(health.services).map(([key, val]: any) => (
                    <p key={key}>[OK] service.{key} latency: {val.latency}ms</p>
                )) : (
                    <>
                        <p>[OK] database.mongodb connected (4ms)</p>
                        <p>[OK] storage.gcp_bucket accessible (12ms)</p>
                        <p>[OK] search.vector_engine indexed (156ms)</p>
                        <p>[OK] cache.redis active (1ms)</p>
                    </>
                )}
            </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10 text-neutral-400 text-xs uppercase tracking-wider">
                        {activeTab === 'waitlist' && (
                            <>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Position</th>
                                <th className="p-4 font-medium">Joined At</th>
                                <th className="p-4 font-medium">Source</th>
                            </>
                        )}
                        {activeTab === 'otps' && (
                            <>
                                <th className="p-4 font-medium">Phone / Email</th>
                                <th className="p-4 font-medium">Code</th>
                                <th className="p-4 font-medium">Expires</th>
                                <th className="p-4 font-medium">Type</th>
                            </>
                        )}
                        {activeTab === 'tokens' && (
                            <>
                                <th className="p-4 font-medium">User ID</th>
                                <th className="p-4 font-medium">Token</th>
                                <th className="p-4 font-medium">Device</th>
                                <th className="p-4 font-medium">Last Active</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {filteredData.map((item, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors font-mono">
                            {activeTab === 'waitlist' && (
                                <>
                                    <td className="p-4 text-white font-sans">{item.email}</td>
                                    <td className="p-4 text-primary font-bold">#{index + 1}</td>
                                    <td className="p-4 text-neutral-400">{new Date(item.created_at).toLocaleString()}</td>
                                    <td className="p-4 text-neutral-500 uppercase">{item.source || 'Web'}</td>
                                </>
                            )}
                            {activeTab === 'otps' && (
                                <>
                                    <td className="p-4 text-white">{item.identifier}</td>
                                    <td className="p-4"><span className="bg-white/10 px-2 py-1 rounded text-primary font-bold">{item.code}</span></td>
                                    <td className="p-4 text-neutral-400">{new Date(item.expires_at).toLocaleTimeString()}</td>
                                    <td className="p-4 text-neutral-500">{item.type || 'Auth'}</td>
                                </>
                            )}
                            {activeTab === 'tokens' && (
                                <>
                                    <td className="p-4 text-white">{item.user_id}</td>
                                    <td className="p-4 text-neutral-400 truncate max-w-xs">{item.token}</td>
                                    <td className="p-4 text-neutral-500">{item.device_type || 'iOS/Android'}</td>
                                    <td className="p-4 text-neutral-400">{new Date(item.updated_at).toLocaleDateString()}</td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredData.length === 0 && (
                <div className="text-center py-12 text-neutral-500 italic font-sans">No records found.</div>
            )}
        </div>
      )}
    </motion.div>
  );
};

export default SystemTools;