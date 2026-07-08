import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { navigation } from './Sidebar';
import { Clock3, Menu } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const pageMeta = useMemo(() => {
    const allItems = navigation.flatMap(group => group.items);
    const sortedNav = [...allItems].sort((a, b) => b.href.length - a.href.length);
    const currentRoute = sortedNav.find(item => location.pathname.startsWith(item.href));
    return currentRoute ?? { name: 'Dashboard', subtitle: 'Admin workspace' };
  }, [location.pathname]);

  const todayLabel = useMemo(() => new Intl.DateTimeFormat('en-PK', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date()), []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-white">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
         {/* Decorative background blobs for dashboard area */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
           <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] opacity-50"></div>
           <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-secondary/10 rounded-full blur-[100px] opacity-50"></div>
        </div>

        <header className="z-20 flex items-center justify-between border-b border-white/5 bg-black/20 p-4 backdrop-blur-xl md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-200 hover:text-white transition-colors">
            <Menu />
          </button>
          <h1 className="bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-xl font-bold text-transparent">{pageMeta.name}</h1>
          <div className="w-8" />
        </header>

        <div className="hidden border-b border-white/5 bg-black/10 px-6 py-5 backdrop-blur-xl md:block">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">Juno Admin</p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-white">{pageMeta.name}</h1>
              <p className="mt-2 text-sm text-neutral-400">{pageMeta.subtitle}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/65">
              <span className="inline-flex items-center gap-2">
                <Clock3 size={13} />
                {todayLabel}
              </span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 scrollbar-hide md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
