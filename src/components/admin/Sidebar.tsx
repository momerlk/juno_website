import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, BarChart2, Bell, X, LogOut, Package, TrendingUp, Settings, 
  Search, ShieldCheck, Globe, Zap, Megaphone, Users2, Database, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const navigation = [
  // Insights (Probe Engine)
  { 
    group: 'Insights',
    items: [
      { name: 'Probe Overview', href: '/admin', icon: LayoutDashboard, subtitle: 'Platform KPIs & Trends', focus: 'Lead with data, not intuition.' },
      { name: 'Real-time', href: '/admin/probe/real-time', icon: Zap, subtitle: 'Live event stream & activity', focus: 'Watch the platform breathe.' },
      { name: 'Commerce', href: '/admin/probe/commerce', icon: BarChart2, subtitle: 'Sales & Funnel Analytics', focus: 'Track every rupee and conversion.' },
      { name: 'User Growth', href: '/admin/probe/users', icon: Users2, subtitle: 'Acquisition & Retention', focus: 'Measure the viral coefficient.' },
    ]
  },
  // Operations
  {
    group: 'Operations',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, subtitle: 'Platform-wide fulfillment', focus: 'Ensure every child order ships.' },
      { name: 'Sellers', href: '/admin/sellers', icon: ShieldCheck, subtitle: 'Onboarding & Moderation', focus: 'Keep the brand quality high.' },
      { name: 'Products', href: '/admin/products', icon: Package, subtitle: 'Moderation Queue', focus: 'Review every single listing.' },
      { name: 'Users', href: '/admin/users', icon: Users, subtitle: 'Identity & Access', focus: 'Manage the platform citizens.' },
    ]
  },
  // Catalog
  {
    group: 'Catalog',
    items: [
      { name: 'Collections', href: '/admin/catalog/collections', icon: Layers, subtitle: 'Discovery & Curation', focus: 'Shape the platform aesthetic.' },
      { name: 'Drops', href: '/admin/catalog/drops', icon: Globe, subtitle: 'Exclusive release management', focus: 'Build hype and scarcity.' },
    ]
  },
  // Marketing & Programs
  {
    group: 'Marketing',
    items: [
      { name: 'Campaigns', href: '/admin/campaigns', icon: Megaphone, subtitle: 'Acquisition Strategies', focus: 'Growth through precision.' },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell, subtitle: 'Platform Broadcasts', focus: 'Direct line to every user.' },
      { name: 'Ambassador', href: '/admin/ambassador-tasks', icon: Users2, subtitle: 'Campus & Affiliate tasks', focus: 'Scale through humans.' },
    ]
  },
  // System
  {
    group: 'System',
    items: [
      { name: 'Infrastructure', href: '/admin/system', icon: Settings, subtitle: 'Global System Tools', focus: 'Keep the engines running.' },
      { name: 'API Status', href: '/admin/api-status', icon: Database, subtitle: 'Health & Error logs', focus: 'Monitor service reliability.' },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { admin, logout } = useAdminAuth();

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(5,5,5,0.97))] border-r border-white/5">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/juno_logos/icon+text_white.png" alt="Juno Admin" className="h-8" />
            <div className="rounded-full bg-primary/20 px-2 py-0.5 border border-primary/30">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary">Admin</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-white/60 transition-colors hover:text-white md:hidden">
            <X size={16} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-8 scrollbar-hide">
        {navigation.map((group) => (
          <div key={group.group}>
            <div className="mb-3 px-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/25">{group.group}</div>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/admin'}
                    onClick={() => isOpen && setIsOpen(false)}
                    className={({ isActive }) =>
                      `group block rounded-[1.35rem] p-3 transition-all duration-300 ${
                        isActive
                          ? 'bg-[linear-gradient(135deg,rgba(255,24,24,0.12),rgba(255,255,255,0.05))] shadow-[0_12px_36px_rgba(255,24,24,0.08)] border border-white/5'
                          : 'bg-white/[0.01] hover:bg-white/[0.04] border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-2xl p-2.5 ${isActive ? 'bg-primary/15 text-primary' : 'bg-black/28 text-white/40 group-hover:text-white'}`}>
                          <item.icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black uppercase tracking-[0.04em] text-white">{item.name}</span>
                            {isActive && <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-primary">View</span>}
                          </div>
                          <p className="mt-1 text-[11px] text-white/30 truncate group-hover:text-white/50 transition-colors">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{admin?.name?.[0] || 'A'}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.04em] text-white">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">{admin?.role || 'Administrator'}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-red-500/25 hover:text-red-400"
          >
            <LogOut size={15} />
            Logout
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
      <div className="hidden md:flex md:h-[100dvh] md:w-80 md:flex-col md:sticky md:top-0 flex-shrink-0">
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
