import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { navigation } from './Sidebar';
import { Menu } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
    const sortedNav = [...navigation].sort((a, b) => b.href.length - a.href.length);
    const currentRoute = sortedNav.find(item => location.pathname.startsWith(item.href));
    return currentRoute ? currentRoute.name : 'Dashboard';
  };

  return (
    <div className="flex h-screen text-white overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
         {/* Decorative background blobs for dashboard area */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
           <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] opacity-50"></div>
           <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-secondary/10 rounded-full blur-[100px] opacity-50"></div>
        </div>

        <header className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-xl border-b border-white/5 md:hidden z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-200 hover:text-white transition-colors">
            <Menu />
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">{getTitle()}</h1>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
