import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { navigation } from './Sidebar';
import { Menu } from 'lucide-react';

const SellerDashboard: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const sortedNav = [...navigation].sort((a, b) => b.href.length - a.href.length);
    const currentRoute = sortedNav.find(item => location.pathname.startsWith(item.href));
    return currentRoute ? currentRoute.name : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-background-dark text-white">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-background-dark/50 backdrop-blur-sm border-b border-neutral-800 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-200">
            <Menu />
          </button>
          <h1 className="text-xl font-bold text-white">{getTitle()}</h1>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
