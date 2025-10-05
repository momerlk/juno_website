import React, { useState, useEffect } from 'react';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';
import { motion } from 'framer-motion';
import { Gift, Users, LogOut, Copy, Check, Trophy, DollarSign, Crown, UserPlus } from 'lucide-react';




interface InviteData {
  owner: string;
  code: string;
  signups: number;
  users : string[];
}

// types/UserPublicProfile.ts
export interface UserPublicProfile {
  id: string;
  avatar: string;
  name: string;
  phone_number: string;
  age: number;
  gender: string;
  date_of_birth: string; // ISO string
  location: {
    latitude: number;
    longitude: number;
  };
  preferences: {
    language_preference: string;
    currency_preference: string;
  };
  profile_completion: number;
  account_status: "active" | "inactive" | "suspended";
  role: "user" | "admin" | "seller";
  verification_status: "verified" | "unverified" | "pending";
  phone_verified: boolean;
  email_verified: boolean;
  login_count: number;
  notification_prefs: {
    email: boolean;
    sms: boolean;
    push_notification: boolean;
    order_updates: boolean;
    promotions: boolean;
    new_arrivals: boolean;
    price_drops: boolean;
    back_in_stock: boolean;
    reviews: boolean;
  };
  created_at: string; // ISO string
  updated_at: string; // ISO string
}


const API_BASE = "https://junoapi-710509977105.asia-south2.run.app/api/v1";

export async function fetchUserPublicProfile(userId: string): Promise<UserPublicProfile> {
  const response = await fetch(`${API_BASE}/users/public-profile?user_id=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  const data: UserPublicProfile = await response.json();
  return data;
}

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: string | number, subtitle?: string, colorClass: string }> = ({ icon, title, value, subtitle, colorClass }) => (
    <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 flex items-center space-x-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-neutral-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
    </div>
);

const ProgressBar: React.FC<{ value: number, kpi: number }> = ({ value, kpi }) => {
    const percentage = Math.min((value / kpi) * 100, 100);
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-white">{value} / {kpi} Signups</span>
                <span className="text-sm font-bold text-secondary">{percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-neutral-800 rounded-full h-2.5">
                <motion.div
                    className="bg-gradient-to-r from-secondary to-primary h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                />
            </div>
        </div>
    );
};


const AmbassadorDashboard: React.FC = () => {
  const { ambassador, logout, fetchInviteData, generateInviteCode, fetchAllInvites} = useAmbassadorAuth();
  const [inviteData, setInviteData] = useState<Array<InviteData> | null>(null);
  const [leaderboard, setLeaderboard] = useState<InviteData[]>([]);
  const [signedUpUsers, setSignedUpUsers] = useState<UserPublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllSignups, setShowAllSignups] = useState(false);

  const SIGNUP_KPI = 100;

  useEffect(() => {
    const getData = async () => {
      if (ambassador) {
        setIsLoading(true);
        const invitePromise = fetchInviteData();
        const leaderboardPromise = fetchAllInvites();

        const [inviteResult, leaderboardResult] = await Promise.all([invitePromise, leaderboardPromise]);

        setInviteData(inviteResult);
        if (leaderboardResult) {
          const sorted = [...leaderboardResult].sort((a, b) => b.signups - a.signups);
          setLeaderboard(sorted);
        }
        setIsLoading(false);
      }
    };
    getData();
  }, [ambassador, fetchInviteData, fetchAllInvites]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (inviteData && inviteData.length > 0 && inviteData[0].users && inviteData[0].users.length > 0) {
        setIsLoadingUsers(true);
        try {
          const userPromises = inviteData[0].users.map(userId => fetchUserPublicProfile(userId));
          const userProfiles = await Promise.all(userPromises);
          const sortedUsers = userProfiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setSignedUpUsers(sortedUsers);
        } catch (error) {
          console.error("Failed to fetch signed up users:", error);
        } finally {
          setIsLoadingUsers(false);
        }
      } else {
        setSignedUpUsers([]);
      }
    };
    fetchUsers();
  }, [inviteData]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    const data = await generateInviteCode();
    if (data) {
      setInviteData([data]);
       const updatedLeaderboard = await fetchAllInvites();
      if (updatedLeaderboard) {
        const sorted = [...updatedLeaderboard].sort((a, b) => b.signups - a.signups);
        setLeaderboard(sorted);
      }
    } else {
      alert('Failed to generate invite code.');
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (inviteData !== null && inviteData.length > 0) {
        const invite = inviteData[0]; // Assuming we only have one invite code
      navigator.clipboard.writeText(invite.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAmbassadorName = (email: string) => {
    if (!email) return 'Anonymous';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const rank = leaderboard.findIndex(i => i.owner === ambassador?.email) + 1;
  
  let signupsToNextRank = null;
  if (rank > 1 && inviteData && leaderboard[rank - 2]) {
      const currentUserSignups = inviteData[0].signups;
      const nextRankSignups = leaderboard[rank - 2].signups;
      signupsToNextRank = nextRankSignups - currentUserSignups + 1;
  }

  return (
    <div className="min-h-screen bg-background-dark">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white">Ambassador Dashboard</h1>
                    <p className="text-neutral-400">Welcome back, <span className="font-bold text-primary">{formatAmbassadorName(ambassador?.email || '')}</span></p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/80 px-4 py-2 rounded-lg transition-colors"
                >
                    <LogOut size={18} className="mr-2" />
                    Sign Out
                </button>
            </header>

            <main>
                {isLoading ? (
                    <div className="flex justify-center items-center p-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {!inviteData || inviteData.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-12 border border-primary/20"
                            >
                                <UserPlus size={48} className="mx-auto text-primary mb-4" />
                                <h2 className="text-3xl font-bold text-white mb-2">Become a Juno Ambassador</h2>
                                <p className="text-neutral-400 mb-6 max-w-md mx-auto">Generate your unique invite code to start earning rewards and climb the leaderboard.</p>
                                <button
                                    onClick={handleGenerateCode}
                                    disabled={isGenerating}
                                    className="btn btn-primary text-lg px-8 py-3"
                                >
                                    {isGenerating ? 'Generating...' : 'Generate My Code'}
                                </button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-8">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white text-center shadow-2xl shadow-primary/20">
                                        <h3 className="font-semibold mb-2">Your Invite Code</h3>
                                        <div className="flex items-center justify-center bg-white/10 p-3 rounded-lg border-2 border-dashed border-white/30">
                                            <span className="text-4xl font-black tracking-widest mr-4">{inviteData[0].code}</span>
                                            <button onClick={handleCopy} className="p-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors">
                                                {copied ? <Check size={24} /> : <Copy size={24} />}
                                            </button>
                                        </div>
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                                        <h3 className="font-semibold text-white mb-4">Your Progress</h3>
                                        <ProgressBar value={inviteData[0].signups} kpi={SIGNUP_KPI} />
                                    </motion.div>

                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                        <StatCard 
                                            icon={<Trophy size={28} className="text-black"/>}
                                            title="Your Rank"
                                            value={rank > 0 ? `#${rank}` : 'N/A'}
                                            subtitle={rank > 1 && signupsToNextRank !== null ? `${signupsToNextRank} to rank #${rank - 1}` : (rank === 1 ? 'You are #1! 🎉' : '')}
                                            colorClass="from-yellow-400 to-amber-500"
                                        />
                                    </motion.div>
                                    
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                        <StatCard 
                                            icon={<DollarSign size={28} className="text-black"/>}
                                            title="Your Income"
                                            value="Rs. 0"
                                            subtitle="15% Commission"
                                            colorClass="from-green-400 to-emerald-500"
                                        />
                                    </motion.div>
                                </div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                                    <h2 className="flex items-center text-2xl font-bold text-white mb-4">
                                        <Crown size={24} className="mr-3 text-yellow-400" />
                                        Leaderboard
                                    </h2>
                                    <div className="overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800 pr-2">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-neutral-700 sticky top-0 bg-neutral-900/50 backdrop-blur-sm">
                                                    <th className="p-4 text-neutral-400 font-semibold text-sm">Rank</th>
                                                    <th className="p-4 text-neutral-400 font-semibold text-sm">Ambassador</th>
                                                    <th className="p-4 text-neutral-400 font-semibold text-sm">Invite Code</th>
                                                    <th className="p-4 text-neutral-400 font-semibold text-sm text-right">Signups</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard.map((entry, index) => (
                                                    <tr key={entry.code} className={`border-b border-neutral-800 ${entry.owner === ambassador?.email ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
                                                        <td className="p-4 text-white font-bold text-lg">
                                                            <div className="flex items-center">
                                                                {index + 1}
                                                                {index === 0 && <Trophy size={16} className="ml-2 text-yellow-400" />}
                                                                {index === 1 && <Trophy size={16} className="ml-2 text-gray-400" />}
                                                                {index === 2 && <Trophy size={16} className="ml-2 text-yellow-600" />}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-white">{formatAmbassadorName(entry.owner)}</td>
                                                        <td className="p-4 text-primary font-mono">{entry.code}</td>
                                                        <td className="p-4 text-white font-semibold text-right">{entry.signups}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>

                                {inviteData && inviteData.length > 0 && inviteData[0].users.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="flex items-center text-2xl font-bold text-white">
                                                <Users size={24} className="mr-3 text-accent" />
                                                Recent Signups
                                            </h2>
                                            {signedUpUsers.length > 4 && (
                                                <button onClick={() => setShowAllSignups(!showAllSignups)} className="text-sm text-primary hover:underline">
                                                    {showAllSignups ? 'Show Less' : `Show All (${signedUpUsers.length})`}
                                                </button>
                                            )}
                                        </div>
                                        {isLoadingUsers ? (
                                            <div className="flex justify-center items-center p-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {(showAllSignups ? signedUpUsers : signedUpUsers.slice(0, 4)).map((user, index) => (
                                                    <motion.div
                                                        key={user.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700 hover:bg-neutral-700/50 transition-colors flex flex-col justify-between text-center"
                                                    >
                                                        <div>
                                                            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-neutral-600" />
                                                            <p className="font-bold text-white truncate">{user.name}</p>
                                                            <p className="text-sm text-neutral-400">{user.phone_number}</p>
                                                            <p className="text-xs text-neutral-500 mt-1">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="mt-4 space-y-3">
                                                            <div>
                                                                {user.verification_status === 'verified' ? (
                                                                    <span className="text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full text-white" style={{ backgroundColor: '#0082fb' }}>
                                                                        Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full text-red-100 bg-red-800">
                                                                        Unverified
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="w-full">
                                                                <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                                                                    <span>Profile</span>
                                                                    <span>{user.verification_status === 'verified' ? 100 : 70}%</span>
                                                                </div>
                                                                <div className="w-full bg-neutral-700 rounded-full h-1.5">
                                                                    <div 
                                                                        className={`h-1.5 rounded-full ${user.verification_status === 'verified' ? 'bg-blue-800' : 'bg-yellow-400'}`}
                                                                        style={{ width: `${user.verification_status === 'verified' ? 100 : 70}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    </div>
  );
};

export default AmbassadorDashboard;