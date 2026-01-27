import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { getAllUsers, getUserDetails } from '../../api/adminApi';
import { User } from '../../constants/user';

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await getAllUsers();
        if (response.ok) {
          const sortedUsers = response.body.sort((a: User, b: User) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setUsers(sortedUsers);
        } else {
          setError('Failed to fetch users.');
        }
      } catch (err) {
        setError('An error occurred while fetching users.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    try {
      const response = await getUserDetails(user.id!);
      if (response.ok) {
        setSelectedUser(response.body);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const filteredUsers = users
    .filter(user => {
      if (filterStatus === 'all') return true;
      return filterStatus === 'verified' ? user.email_verified || user.phone_verified : !(user.email_verified || user.phone_verified);
    })
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-panel p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users size={24} className="text-primary"/> Manage Users
        </h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10 pr-4 py-2 text-white w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass-input py-2 px-3 text-white"
          >
            <option value="all" className="bg-neutral-900">All Statuses</option>
            <option value="verified" className="bg-neutral-900">Verified</option>
            <option value="not-verified" className="bg-neutral-900">Not Verified</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-neutral-400 py-12">Loading users...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-sm font-semibold text-neutral-400">Name</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Phone Number</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Status</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white font-medium">{user.name}</td>
                  <td className="p-4 text-neutral-300">{user.phone_number}</td>
                  <td className="p-4">
                    {user.email_verified || user.phone_verified ? (
                      <span className="flex items-center text-green-400 bg-green-500/10 px-2 py-1 rounded-full w-fit text-xs border border-green-500/20">
                        <CheckCircle size={14} className="mr-1.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full w-fit text-xs border border-yellow-500/20">
                        <XCircle size={14} className="mr-1.5" />
                        Not Verified
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleViewDetails(user)} className="p-2 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">{selectedUser.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Personal Details</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Email:</span> <span className="text-white block">{selectedUser.email}</span></p>
                    <p><span className="text-neutral-400">Phone:</span> <span className="text-white block">{selectedUser.phone_number}</span></p>
                    <p><span className="text-neutral-400">Age:</span> <span className="text-white">{selectedUser.age}</span></p>
                    <p><span className="text-neutral-400">Gender:</span> <span className="text-white">{selectedUser.gender}</span></p>
                    <p><span className="text-neutral-400">DOB:</span> <span className="text-white">{selectedUser.date_of_birth}</span></p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Account Details</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Status:</span> <span className="text-white">{selectedUser.account_status}</span></p>
                    <p><span className="text-neutral-400">Role:</span> <span className="text-white">{selectedUser.role}</span></p>
                    <p><span className="text-neutral-400">Verification:</span> <span className="text-white">{selectedUser.verification_status}</span></p>
                    <p><span className="text-neutral-400">Phone Verified:</span> <span className={selectedUser.phone_verified ? "text-green-400" : "text-red-400"}>{selectedUser.phone_verified ? 'Yes' : 'No'}</span></p>
                    <p><span className="text-neutral-400">Email Verified:</span> <span className={selectedUser.email_verified ? "text-green-400" : "text-red-400"}>{selectedUser.email_verified ? 'Yes' : 'No'}</span></p>
                    <p><span className="text-neutral-400">Profile Completion:</span> <span className="text-white">{selectedUser.profile_completion}%</span></p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Location</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">City:</span> <span className="text-white">{selectedUser.location?.city}</span></p>
                    <p><span className="text-neutral-400">Province:</span> <span className="text-white">{selectedUser.location?.province}</span></p>
                    <p><span className="text-neutral-400">Country:</span> <span className="text-white">{selectedUser.location?.country}</span></p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Referral</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Referral Code:</span> <span className="text-white font-mono">{selectedUser.referral_code}</span></p>
                    <p><span className="text-neutral-400">Referred By:</span> <span className="text-white">{selectedUser.referred_by}</span></p>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-primary mb-3">Activity</h3>
                <div className="space-y-2 text-sm">
                    <p><span className="text-neutral-400">Last Login:</span> <span className="text-white">{selectedUser.last_login}</span></p>
                    <p><span className="text-neutral-400">Login Count:</span> <span className="text-white">{selectedUser.login_count}</span></p>
                    <p><span className="text-neutral-400">Source:</span> <span className="text-white">{selectedUser.registration_source}</span></p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">Close Details</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageUsers;
