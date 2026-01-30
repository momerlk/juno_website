import React, { useState, useEffect, useMemo } from 'react';
import { useAmbassadorAuth } from '../../contexts/AmbassadorAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, LogOut, Trophy, Crown, 
    List, Building, BarChart2, Calendar, DollarSign, User, Target
} from 'lucide-react';
import { getInstituteRanking, getMyTeam, getAmbassadorTasks, getInstituteUsers, getAmbassadorDashboard } from '../../api/chapterApi';

// --- Types ---

interface InstituteUser {
    id: string;
    name: string;
    avatar: string;
    phone_number: string;
    verification_status: string;
    age: number;
    swipe_count: number;
    registered_at: string;
}

interface Task {
    id: string;
    title: string;
    description: string;
    deadline: string;
    status: 'pending' | 'completed' | 'expired';
    reward_points: number;
    target_institute?: string;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    phone_number: string;
}

interface Ranking {
    institute: string;
    count: number;
    rank: number;
}

interface AmbassadorProfile {
    id: string;
    name: string;
    phone: string;
    institute: string;
    year: string;
    gender: string;
    role: string;
    tech_interest: number;
    fashion_interest: number;
    commitment_hours: string;
    motivation: number;
}

// --- Components ---

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

const AmbassadorDashboard: React.FC = () => {
  const { ambassador, logout } = useAmbassadorAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'team' | 'rankings' | 'users'>('dashboard');
  
  // Data
  const [profile, setProfile] = useState<AmbassadorProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [instituteUsers, setInstituteUsers] = useState<InstituteUser[]>([]);
  
  // Loaders
  const [isLoading, setIsLoading] = useState(true);

  // --- Initial Fetch ---
  useEffect(() => {
    const getData = async () => {
      // If we are authenticated (ambassador exists), fetch data
      if (ambassador) {
        setIsLoading(true);
        console.log(`[Dashboard] Fetching initial data...`);
        try {
            const [dashboardData, rankingsData, usersData] = await Promise.all([
                getAmbassadorDashboard(),
                getInstituteRanking(),
                getInstituteUsers()
            ]);
            console.log(`[Dashboard] Dashboard data received:`, dashboardData);
            
            if (dashboardData.ambassador) {
                setProfile(dashboardData.ambassador);
            }
            if (dashboardData.team_mates && Array.isArray(dashboardData.team_mates)) {
                setTeam(dashboardData.team_mates);
            }

            setRankings(Array.isArray(rankingsData) ? rankingsData : []);
            setInstituteUsers(Array.isArray(usersData) ? usersData : []);
        } catch (e) {
            console.error("[Dashboard] Error fetching initial data:", e);
        } finally {
            setIsLoading(false);
        }
      }
    };
    getData();
  }, [ambassador]);

  // --- Tab Fetching ---
  useEffect(() => {
      const fetchTabData = async () => {
          if (!ambassador || activeTab === 'dashboard') return;
          console.log(`[Dashboard] Fetching tab data for: ${activeTab}`);
          try {
              if (activeTab === 'tasks') {
                 const res = await getAmbassadorTasks();
                 console.log(`[Dashboard] Tasks received:`, res);
                 setTasks(Array.isArray(res) ? res : []);
              } else if (activeTab === 'team') {
                 const res = await getMyTeam();
                 console.log(`[Dashboard] Team received:`, res);
                 setTeam(Array.isArray(res) ? res : []);
              } else if (activeTab === 'rankings') {
                 const res = await getInstituteRanking();
                 console.log(`[Dashboard] Rankings received:`, res);
                 setRankings(Array.isArray(res) ? res : []);
              } else if (activeTab === 'users') {
                 const res = await getInstituteUsers();
                 console.log(`[Dashboard] Institute users received:`, res);
                 setInstituteUsers(Array.isArray(res) ? res : []);
              }
          } catch (error) {
              console.error(`[Dashboard] Failed to fetch ${activeTab} data`, error);
          }
      };
      fetchTabData();
  }, [activeTab, ambassador]);


  const formatAmbassadorName = (name: string) => {
    return name || 'Ambassador';
  };

  const weeklySignups = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return instituteUsers.filter(user => {
      const regDate = new Date(user.registered_at);
      return regDate >= startOfWeek;
    }).length;
  }, [instituteUsers]);

  const weeklyTarget = useMemo(() => {
    // Target is proportional to team size.
    // Base target per member is 4 signups/week.
    // Total Size = Team Members (from API) + 1 (Current Ambassador)
    return (team.length + 1) * 4;
  }, [team]);

  // --- Render Sections ---

  const renderDashboard = () => {
      if (!profile) {
          return (
              <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                  <User size={48} className="mx-auto text-neutral-600 mb-4" />
                  <h3 className="text-xl font-bold text-white">Profile Not Found</h3>
                  <p className="text-neutral-400 mt-2">Could not load ambassador details.</p>
              </div>
          );
      }

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white text-center shadow-2xl shadow-primary/20">
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-2 border-white/30">
                        {profile.name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{profile.name}</h3>
                    <p className="text-white/80 font-medium">{profile.institute}</p>
                    <div className="mt-4 inline-block bg-black/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {profile.year || 'Student'}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-4">
                    <StatCard 
                        icon={<Users size={28} className="text-black"/>}
                        title="Institute Signups"
                        value={instituteUsers.length}
                        subtitle="Total Users"
                        colorClass="from-blue-400 to-indigo-500"
                    />
                    <StatCard 
                        icon={<Target size={28} className="text-black"/>}
                        title="Weekly Target"
                        value={`${weeklySignups}/${weeklyTarget}`}
                        subtitle={weeklySignups >= weeklyTarget ? "Target Met! 🎉" : `${weeklyTarget - weeklySignups} more to go`}
                        colorClass={weeklySignups >= weeklyTarget ? "from-green-400 to-emerald-500" : "from-orange-400 to-red-500"}
                    />
                    <StatCard 
                        icon={<Trophy size={28} className="text-black"/>}
                        title="Roles"
                        value={profile.role ? profile.role.split(',').length : 1}
                        subtitle="Active Roles"
                        colorClass="from-yellow-400 to-amber-500"
                    />
                    <StatCard 
                        icon={<DollarSign size={28} className="text-black"/>}
                        title="Commitment"
                        value={`${profile.commitment_hours || 0} hrs`}
                        subtitle="Weekly"
                        colorClass="from-green-400 to-emerald-500"
                    />
                </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
                    <h2 className="flex items-center text-xl font-bold text-white mb-6">
                        <Crown size={24} className="mr-3 text-yellow-400" />
                        Ambassador Profile Details
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Roles</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {profile.role ? profile.role.split(',').map((r, i) => (
                                        <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold border border-primary/20">
                                            {r.trim()}
                                        </span>
                                    )) : <span className="text-white text-sm">Ambassador</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Contact</label>
                                <p className="text-white font-mono mt-1">{profile.phone}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2 block">Interests</label>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-blue-400">Tech Interest</span>
                                            <span className="text-white">{profile.tech_interest}/10</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${(profile.tech_interest || 0) * 10}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-pink-400">Fashion Interest</span>
                                            <span className="text-white">{profile.fashion_interest}/10</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500" style={{ width: `${(profile.fashion_interest || 0) * 10}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Signups Summary */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="flex items-center text-xl font-bold text-white">
                            <Users size={24} className="mr-3 text-blue-400" />
                            Recent Institute Signups
                        </h2>
                        <button onClick={() => setActiveTab('users')} className="text-primary text-sm font-bold hover:underline">View All</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {instituteUsers.slice(0, 4).map((user) => (
                            <div key={user.id} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name} alt="" className="w-12 h-12 rounded-full border border-white/10" />
                                <div className="min-w-0">
                                    <p className="text-white font-bold truncate">{user.name}</p>
                                    <p className="text-xs text-neutral-500">{user.swipe_count} Swipes • {user.verification_status}</p>
                                </div>
                            </div>
                        ))}
                        {instituteUsers.length === 0 && <p className="text-neutral-500 text-center py-4 col-span-2">No signups yet from your institute.</p>}
                    </div>
                </motion.div>

                {/* Institute Rankings Summary */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="flex items-center text-xl font-bold text-white">
                            <Building size={24} className="mr-3 text-secondary" />
                            Institute Rankings
                        </h2>
                        <button onClick={() => setActiveTab('rankings')} className="text-primary text-sm font-bold hover:underline">View All</button>
                    </div>
                    
                    <div className="space-y-4">
                        {rankings.slice(0, 5).map((rank, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        i === 0 ? 'bg-yellow-500 text-black' :
                                        i === 1 ? 'bg-gray-400 text-black' :
                                        i === 2 ? 'bg-amber-700 text-white' :
                                        'bg-white/10 text-white'
                                    }`}>
                                        {i + 1}
                                    </span>
                                    <span className="text-white font-bold">{rank.institute}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-primary font-bold">{rank.count} Members</span>
                                </div>
                            </div>
                        ))}
                        {rankings.length === 0 && <p className="text-neutral-500 text-center py-4">No rankings available.</p>}
                    </div>
                </motion.div>
            </div>
        </div>
      );
  };

  const renderTasks = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-neutral-900/50 rounded-2xl border border-neutral-800">
                  <BarChart2 size={48} className="mx-auto text-neutral-600 mb-4" />
                  <h3 className="text-xl font-bold text-white">No Active Tasks</h3>
                  <p className="text-neutral-400 mt-2">Check back later for new opportunities.</p>
              </div>
          ) : (
              tasks.map((task, i) => (
                <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <DollarSign size={12} /> {task.reward_points} pts
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                task.status === 'completed' ? 'text-green-400 bg-green-500/10' : 
                                task.status === 'expired' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'
                            }`}>
                                {task.status}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{task.title}</h3>
                        <p className="text-neutral-400 text-sm mb-4">{task.description}</p>
                    </div>
                    <div>
                        <div className="flex items-center text-xs text-neutral-500 mb-4">
                            <Calendar size={14} className="mr-2" />
                            Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                        <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-bold border border-white/5">
                            View Details
                        </button>
                    </div>
                </motion.div>
              ))
          )}
      </div>
  );

  const renderTeam = () => (
      <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users size={24} className="text-primary" /> My Team
              </h2>
              <span className="bg-white/5 text-neutral-400 px-3 py-1 rounded-lg text-sm">
                  {team.length} Members
              </span>
          </div>
          
          {team.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No team members found for your institute.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {team.map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-black/20 p-6 rounded-xl border border-white/5 flex items-center gap-4"
                      >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                              {member.name.charAt(0)}
                          </div>
                          <div>
                              <h4 className="font-bold text-white">{member.name}</h4>
                              <p className="text-sm text-primary">{member.role}</p>
                              <p className="text-xs text-neutral-500 mt-1">{member.phone_number}</p>
                          </div>
                      </motion.div>
                  ))}
              </div>
          )}
      </div>
  );

  const renderRankings = () => (
      <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Building size={24} className="text-secondary" /> Institute Rankings
              </h2>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-white/10 text-neutral-400 text-sm uppercase tracking-wider">
                          <th className="p-4">Rank</th>
                          <th className="p-4">Institute</th>
                          <th className="p-4 text-right">Members / Signups</th>
                      </tr>
                  </thead>
                  <tbody>
                      {rankings.map((rank, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                  <div className="flex items-center gap-2">
                                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                          i === 0 ? 'bg-yellow-500 text-black' :
                                          i === 1 ? 'bg-gray-400 text-black' :
                                          i === 2 ? 'bg-amber-700 text-white' :
                                          'bg-white/10 text-white'
                                      }`}>
                                          {i + 1}
                                      </span>
                                  </div>
                              </td>
                              <td className="p-4 text-white font-bold text-lg">{rank.institute}</td>
                              <td className="p-4 text-right">
                                  <span className="text-primary font-bold text-xl">{rank.count}</span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderUsers = () => (
      <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Users size={24} className="text-blue-400" /> Institute Signups
              </h2>
              <span className="bg-white/5 text-neutral-400 px-3 py-1 rounded-lg text-sm">
                  {instituteUsers.length} Registered
              </span>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="border-b border-white/10 text-neutral-400 text-sm uppercase tracking-wider">
                          <th className="p-4">User</th>
                          <th className="p-4 text-center">Age</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Engagement</th>
                          <th className="p-4 text-right">Joined</th>
                      </tr>
                  </thead>
                  <tbody>
                      {instituteUsers.map((user, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                                      <div>
                                          <p className="text-white font-bold">{user.name}</p>
                                          <p className="text-xs text-neutral-500 font-mono">{user.phone_number}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4 text-center text-neutral-300">{user.age || 'N/A'}</td>
                              <td className="p-4 text-center">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.verification_status === 'verified' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                      {user.verification_status}
                                  </span>
                              </td>
                              <td className="p-4 text-center">
                                  <div className="flex flex-col items-center">
                                      <span className="text-primary font-bold">{user.swipe_count}</span>
                                      <span className="text-[10px] text-neutral-500 uppercase">Swipes</span>
                                  </div>
                              </td>
                              <td className="p-4 text-right text-xs text-neutral-500">
                                  {new Date(user.registered_at).toLocaleDateString()}
                              </td>
                          </tr>
                      ))}
                      {instituteUsers.length === 0 && (
                          <tr>
                              <td colSpan={5} className="text-center py-12 text-neutral-500">
                                  No users registered from your institute yet.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-background-dark text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white">Ambassador Portal</h1>
                    <p className="text-neutral-400 mt-1">
                        Welcome, <span className="text-primary font-bold">{formatAmbassadorName(ambassador?.name || '')}</span>
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700/80 px-4 py-2 rounded-lg transition-colors border border-neutral-700"
                >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                </button>
            </header>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
                {([
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
                    { id: 'tasks', label: 'Tasks', icon: List },
                    { id: 'users', label: 'Signups', icon: Users },
                    { id: 'team', label: 'My Team', icon: Users },
                    { id: 'rankings', label: 'Rankings', icon: Trophy },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                            : 'bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        }`}
                    >
                        <tab.icon size={18} className="mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <main className="min-h-[500px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'dashboard' && renderDashboard()}
                            {activeTab === 'tasks' && renderTasks()}
                            {activeTab === 'team' && renderTeam()}
                            {activeTab === 'rankings' && renderRankings()}
                            {activeTab === 'users' && renderUsers()}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    </div>
  );
};

export default AmbassadorDashboard;