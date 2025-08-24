import React, { useState, useEffect } from 'react';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';
import { motion } from 'framer-motion';
import { Gift, Users, LogOut, Copy, Check, Trophy, DollarSign } from 'lucide-react';




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
          setSignedUpUsers(userProfiles);
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
    if (!email) return '';
    return email.split('@')[0];
  };

  const rank = leaderboard.findIndex(i => i.owner === ambassador?.email) + 1;
  const signupProgress = inviteData ? (inviteData[0].signups / SIGNUP_KPI) * 100 : 0;

  let signupsToNextRank = null;
  if (rank > 1 && inviteData && leaderboard[rank - 2]) {
      const currentUserSignups = inviteData[0].signups;
      const nextRankSignups = leaderboard[rank - 2].signups;
      signupsToNextRank = nextRankSignups - currentUserSignups + 1;
  }

  return (
    <div className="min-h-screen bg-background-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Ambassador Dashboard</h1>
            <p className="text-neutral-400">Welcome, {ambassador?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center text-neutral-400 hover:text-white"
          >
            <LogOut size={20} className="mr-2" />
            Sign Out
          </button>
        </header>

        <main>
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {inviteData ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-background rounded-lg p-8"
                >
                  <h2 className="text-2xl font-semibold text-white mb-2">Your Stats</h2>
                  <p className="text-neutral-400 mb-6">Track your progress and rewards.</p>
                  
                  <div className="flex items-center justify-center bg-background-light p-4 rounded-lg border-2 border-dashed border-primary mb-6">
                    <span className="text-3xl font-bold text-primary tracking-widest mr-4">{inviteData[0].code}</span>
                    <button onClick={handleCopy} className="p-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30">
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-background-light p-6 rounded-lg flex items-start">
                      <Gift size={32} className="text-secondary mr-4 flex-shrink-0" />
                      <div className="w-full">
                        <p className="text-neutral-400 text-sm">Total Signups</p>
                        <p className="text-2xl font-bold text-white">
                          {inviteData[0].signups}
                          <span className="text-lg text-neutral-400"> / {SIGNUP_KPI}</span>
                        </p>
                        <div className="w-full bg-neutral-700 mt-2 h-2 rounded-full">
                          <motion.div
                            className="bg-secondary h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${signupProgress > 100 ? 100 : signupProgress}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-background-light p-6 rounded-lg flex items-start">
                      <Users size={32} className="text-accent mr-4 flex-shrink-0" />
                      <div className="w-full">
                        <p className="text-neutral-400 text-sm">Your Rank</p>
                        <p className="text-2xl font-bold text-white">{rank > 0 ? rank : 'N/A'}</p>
                        {rank > 1 && signupsToNextRank !== null && (
                            <p className="text-xs text-neutral-400 mt-1">
                                <span className="font-bold text-white">{signupsToNextRank}</span> more to rank #{rank - 1}
                            </p>
                        )}
                        {rank === 1 && (
                            <p className="text-xs text-green-400 mt-1">You are #1! 🎉</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-background-light p-6 rounded-lg flex items-start">
                      <DollarSign size={32} className="text-green-500 mr-4 flex-shrink-0" />
                      <div className="w-full">
                        <p className="text-neutral-400 text-sm">Revenue Generated for Juno</p>
                        <p className="text-2xl font-bold text-white">Rs. 0</p>
                      </div>
                    </div>
                    <div className="bg-background-light p-6 rounded-lg flex items-start">
                      <DollarSign size={32} className="text-blue-500 mr-4 flex-shrink-0" />
                      <div className="w-full">
                        <p className="text-neutral-400 text-sm">Your Income (15% Commission)</p>
                        <p className="text-2xl font-bold text-white">Rs. 0</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center bg-background rounded-lg p-12"
                >
                  <h2 className="text-2xl font-semibold text-white mb-2">No Invite Code Found</h2>
                  <p className="text-neutral-400 mb-6">Generate your unique invite code to get started.</p>
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate My Code'}
                  </button>
                </motion.div>
              )}

              {inviteData && inviteData.length > 0 && inviteData[0].users.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 bg-background rounded-lg p-8"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="flex items-center text-2xl font-semibold text-white">
                      <Users size={24} className="mr-3 text-accent" />
                      Recent Signups
                    </h2>
                    {signedUpUsers.length > 2 && (
                        <button 
                            onClick={() => setShowAllSignups(!showAllSignups)} 
                            className="text-sm text-primary hover:underline"
                        >
                            {showAllSignups ? 'Show Less' : `Show All (${signedUpUsers.length})`}
                        </button>
                    )}
                  </div>
                  {isLoadingUsers ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-neutral-700">
                            <th className="p-4 text-neutral-400 font-semibold">User</th>
                            <th className="p-4 text-neutral-400 font-semibold">Phone Number</th>
                            <th className="p-4 text-neutral-400 font-semibold">Joined At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllSignups ? signedUpUsers : signedUpUsers.slice(0, 2)).map((user) => (
                            <tr key={user.id} className="border-b border-neutral-800 hover:bg-white/5">
                              <td className="p-4 text-white">
                                <div className="flex items-center">
                                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-4 object-cover" />
                                  <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-neutral-400">{user.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-white">{user.phone_number}</td>
                              <td className="p-4 text-white">{new Date(user.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
              
              {leaderboard.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 bg-background rounded-lg p-8"
                >
                  <h2 className="flex items-center text-2xl font-semibold text-white mb-4">
                    <Trophy size={24} className="mr-3 text-yellow-400" />
                    Leaderboard
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-neutral-700">
                          <th className="p-4 text-neutral-400 font-semibold">Rank</th>
                          <th className="p-4 text-neutral-400 font-semibold">Ambassador</th>
                          <th className="p-4 text-neutral-400 font-semibold text-right">Signups</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => (
                          <tr 
                            key={entry.code} 
                            className={`border-b border-neutral-800 ${entry.owner === ambassador?.email ? 'bg-primary/10' : 'hover:bg-white/5'}`}
                          >
                            <td className="p-4 text-white font-bold text-lg">
                                <div className="flex items-center">
                                    {index + 1}
                                    {index === 0 && <Trophy size={16} className="ml-2 text-yellow-400" />}
                                    {index === 1 && <Trophy size={16} className="ml-2 text-gray-400" />}
                                    {index === 2 && <Trophy size={16} className="ml-2 text-yellow-600" />}
                                </div>
                            </td>
                            <td className="p-4 text-white">{formatAmbassadorName(entry.owner)}</td>
                            <td className="p-4 text-white font-semibold text-right">{entry.signups}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AmbassadorDashboard;


