import React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { LogOut, UserCircle } from 'lucide-react';
import PlatformStats from './PlatformStats';
import ManageSellers from './ManageSellers';
import ManageInvites from './ManageInvites';
import ManageNotifications from './ManageNotifications';

const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background-light py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-neutral-400">Welcome back, {admin?.name || 'Admin'}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-white">
              <UserCircle size={24} className="mr-2" />
              Admin
            </span>
            <button
              onClick={logout}
              className="flex items-center text-neutral-400 hover:text-white"
            >
              <LogOut size={20} className="mr-2" />
              Sign Out
            </button>
          </div>
        </header>

        <main>
          <PlatformStats />
          <ManageSellers />
          <ManageInvites />
          <ManageNotifications />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
