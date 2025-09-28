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
      className="bg-background rounded-lg p-6 mt-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Manage Users</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background-light border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-background-light border border-neutral-700 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="not-verified">Not Verified</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-neutral-400">Loading users...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="p-4 text-sm font-semibold text-neutral-400">Name</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Phone Number</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Status</th>
                <th className="p-4 text-sm font-semibold text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-neutral-800 hover:bg-background-light">
                  <td className="p-4 text-white font-medium">{user.name}</td>
                  <td className="p-4 text-neutral-300">{user.phone_number}</td>
                  <td className="p-4">
                    {user.email_verified || user.phone_verified ? (
                      <span className="flex items-center text-green-400">
                        <CheckCircle size={18} className="mr-2" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center text-yellow-400">
                        <XCircle size={18} className="mr-2" />
                        Not Verified
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleViewDetails(user)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background-light rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-4">{selectedUser.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Personal Details</h3>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phone_number}</p>
                <p><strong>Age:</strong> {selectedUser.age}</p>
                <p><strong>Gender:</strong> {selectedUser.gender}</p>
                <p><strong>Date of Birth:</strong> {selectedUser.date_of_birth}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Account Details</h3>
                <p><strong>Status:</strong> {selectedUser.account_status}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Verification:</strong> {selectedUser.verification_status}</p>
                <p><strong>Phone Verified:</strong> {selectedUser.phone_verified ? 'Yes' : 'No'}</p>
                <p><strong>Email Verified:</strong> {selectedUser.email_verified ? 'Yes' : 'No'}</p>
                <p><strong>Profile Completion:</strong> {selectedUser.profile_completion}%</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Location</h3>
                <p><strong>City:</strong> {selectedUser.location?.city}</p>
                <p><strong>Province:</strong> {selectedUser.location?.province}</p>
                <p><strong>Country:</strong> {selectedUser.location?.country}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Referral</h3>
                <p><strong>Referral Code:</strong> {selectedUser.referral_code}</p>
                <p><strong>Referred By:</strong> {selectedUser.referred_by}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Activity</h3>
                <p><strong>Last Login:</strong> {selectedUser.last_login}</p>
                <p><strong>Login Count:</strong> {selectedUser.login_count}</p>
                <p><strong>Registration Source:</strong> {selectedUser.registration_source}</p>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="mt-6 px-4 py-2 bg-primary text-white rounded-md">Close</button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageUsers;
