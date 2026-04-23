import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, BarChart2, Bell, X, LogOut, Package, Settings,
  ShieldCheck, Globe, Zap, Megaphone, Users2, Database, Layers, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const navigation = [
  {
    group: 'Core',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, subtitle: 'Platform-wide fulfillment' },
      { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone, subtitle: 'Acquisition campaigns' },
      { name: 'Products', href: '/admin/products', icon: Package, subtitle: 'Queue and catalog management' },
      { name: 'Sellers', href: '/admin/sellers', icon: ShieldCheck, subtitle: 'Seller onboarding and moderation' },
    ]
  },
  { 
    group: 'Insights',
    items: [
      { name: 'Probe Overview', href: '/admin', icon: LayoutDashboard, subtitle: 'Platform KPIs and trends' },
      { name: 'Real-time', href: '/admin/probe/real-time', icon: Zap, subtitle: 'Live event stream' },
      { name: 'Commerce', href: '/admin/probe/commerce', icon: BarChart2, subtitle: 'Sales and funnel analytics' },
      { name: 'User Growth', href: '/admin/probe/users', icon: Users2, subtitle: 'Acquisition and retention' },
    ]
  },
  {
    group: 'Catalog',
    items: [
      { name: 'Collections', href: '/admin/catalog/collections', icon: Layers, subtitle: 'Discovery and curation' },
      { name: 'Drops', href: '/admin/catalog/drops', icon: Globe, subtitle: 'Exclusive release management' },
    ]
  },
  {
    group: 'Marketing',
    items: [
      { name: 'Notifications', href: '/admin/notifications', icon: Bell, subtitle: 'Platform broadcasts' },
      { name: 'Ambassador', href: '/admin/ambassador-tasks', icon: Users2, subtitle: 'Campus and affiliate tasks' },
    ]
  },
  {
    group: 'Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users, subtitle: 'Identity and access management' },
    ]
  },
  {
    group: 'System',
    items: [
      { name: 'Infrastructure', href: '/admin/system', icon: Settings, subtitle: 'Global system tools' },
      { name: 'API Status', href: '/admin/api-status', icon: Database, subtitle: 'Health and error logs' },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, onToggleCollapse }) => {
  const { admin, logout } = useAdminAuth();
  const collapsed = isOpen ? false : isCollapsed;

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#0b0b0b]">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/juno_logos/icon+text_white.png" alt="Juno Admin" className="h-7" />
            {!collapsed ? (
              <div className="rounded-md border border-white/15 bg-white/[0.03] px-2 py-0.5">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-300">Admin</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-md border border-white/15 bg-white/[0.03] p-2 text-neutral-300 transition-colors hover:text-white md:inline-flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="rounded-md border border-white/15 bg-white/[0.03] p-2 text-neutral-300 transition-colors hover:text-white md:hidden">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-hide">
        {navigation.map((group) => (
          <div key={group.group}>
            {!collapsed ? (
              <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500">{group.group}</div>
            ) : (
              <div className="mb-2 border-t border-white/10" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/admin'}
                    onClick={() => isOpen && setIsOpen(false)}
                    className={({ isActive }) =>
                      `group block rounded-md border p-2.5 transition-colors ${
                        isActive
                          ? 'border-white/20 bg-white/[0.09]'
                          : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04]'
                      }`
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                        <div className={`rounded-md p-1.5 ${isActive ? 'bg-white/15 text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                          <item.icon size={14} />
                        </div>
                        {!collapsed ? (
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-[12px] font-medium ${isActive ? 'text-white' : 'text-neutral-200'}`}>{item.name}</p>
                            <p className="truncate text-[10px] text-neutral-500 group-hover:text-neutral-400">
                              {item.subtitle}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <div className={`mb-3 flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/[0.05]">
              <span className="text-sm font-semibold text-neutral-100">{admin?.name?.[0] || 'A'}</span>
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{admin?.name || 'Admin'}</p>
                <p className="text-[10px] uppercase tracking-[0.08em] text-neutral-500">{admin?.role || 'Administrator'}</p>
              </div>
            ) : null}
          </div>
          
          <button
            onClick={logout}
            className={`flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-black/30 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-red-400/30 hover:text-red-300 ${collapsed ? 'px-2' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={15} />
            {!collapsed ? 'Logout' : null}
          </button>
        </div>
      </div>
    </div>
  );

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  return (
    <>
      <div className={`hidden md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-shrink-0 md:flex-col ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}>
        {sidebarContent}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-[100dvh] w-[19rem] shadow-2xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            >
              {sidebarContent}
            </motion.div>
            <motion.button
              type="button"
              className="flex-1 bg-black/65"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
