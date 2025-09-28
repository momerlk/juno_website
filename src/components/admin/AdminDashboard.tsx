import React, { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { LogOut, UserCircle } from 'lucide-react';
import PlatformStats from './PlatformStats';
import ManageSellers from './ManageSellers';
import ManageInvites from './ManageInvites';
import ManageNotifications from './ManageNotifications';
import ManageOrders from './ManageOrders';
import ManageUsers from './ManageUsers';
import LocationMap from './LocationMap';
import DeliveryCoverage from './DeliveryCoverage';

const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('orders');

  const tabs = [
    { id: 'orders', label: 'Manage Orders' },
    { id: 'sellers', label: 'Manage Sellers' },
    { id: 'users', label: 'Manage Users' },
    { id: 'invites', label: 'Manage Invites' },
    { id: 'locations', label: 'Location Map' },
    { id: 'delivery-coverage', label: 'Delivery Coverage' },
    { id: 'notifications', label: 'Broadcast Notifications' },
  ];

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
          
          <div className="mt-8">
            <div className="border-b border-neutral-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-2">
            {activeTab === 'orders' && <ManageOrders />}
            {activeTab === 'sellers' && <ManageSellers />}
            {activeTab === 'users' && <ManageUsers />}
            {activeTab === 'invites' && <ManageInvites />}
            {activeTab === 'locations' && <LocationMap />}
            {activeTab === 'delivery-coverage' && <DeliveryCoverage />}
            {activeTab === 'notifications' && <ManageNotifications />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
