import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  User,
  X,
  LogOut,
  Store,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { useSellerQueue } from '../../contexts/SellerQueueContext';

export const navigation = [
  { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard, subtitle: 'Build something delightful.', focus: 'Lead with story, not admin.' },
  { name: 'Inventory', href: '/seller/dashboard/inventory', icon: Package, subtitle: 'Add products fast and make quality feel easy.', focus: 'Keep listing friction brutally low.' },
  { name: 'Orders', href: '/seller/dashboard/orders', icon: ShoppingCart, subtitle: 'Fulfill quickly and keep trust compounding.', focus: 'Every delivery shapes brand loyalty.' },
  { name: 'Analytics', href: '/seller/dashboard/analytics', icon: BarChart2, subtitle: 'Read the signals behind saves, visits, and demand.', focus: 'Think like Instagram insights, not spreadsheets.' },
  { name: 'Profile', href: '/seller/dashboard/profile', icon: User, subtitle: 'Sharpen the way your label presents itself.', focus: 'Your store page should feel editorial, not generic.' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { seller, logout } = useSellerAuth();
  const { pendingCount: queuePendingCount } = useSellerQueue();
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';
  const metrics = seller?.user?.seller_metrics;
  const productCount = metrics?.product_count ?? metrics?.total_orders ?? 0;
  const orderCount = metrics?.order_count ?? metrics?.total_orders ?? 0;
  const completedOrders = metrics?.completed_orders ?? 0;
  const revenue = metrics?.revenue_generated ?? metrics?.total_sales ?? 0;
  const verificationState = seller?.user?.verified ? 'Verified' : seller?.user?.status ?? 'Pending';

  const getNavSnapshot = (name: string) => {
    switch (name) {
      case 'Dashboard':
        return {
          stat: seller?.user?.business_name || 'Studio',
          note: verificationState,
        };
      case 'Inventory':
        return {
          stat: `${productCount}`,
          note: 'Products',
        };
      case 'Orders':
        return {
          stat: `${orderCount}`,
          note: completedOrders > 0 ? `${completedOrders} done` : 'Urgent',
        };
      case 'Analytics':
        return {
          stat: revenue > 0 ? `Rs ${Math.round(revenue).toLocaleString()}` : 'Preview',
          note: revenue > 0 ? 'Revenue' : 'Signals',
        };
      case 'Profile':
        return {
          stat: verificationState,
          note: seller?.user?.location?.city || 'Profile',
        };
      default:
        return {
          stat: '',
          note: '',
        };
    }
  };

  const navItems = navigation.map(item => ({
    ...item,
    href: item.href.replace('/seller', prefix),
    snapshot: getNavSnapshot(item.name),
  }));

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(10,10,10,0.95),rgba(5,5,5,0.94))]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/juno_logos/icon+text_white.png" alt="Juno Studio" className="h-8" />
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-white/60 transition-colors hover:text-white md:hidden">
            <X size={16} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/25">Core Flows</div>
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === `${prefix}/dashboard`}
                onClick={() => isOpen && setIsOpen(false)}
                className={({ isActive }) =>
                  `group block rounded-[1.35rem] p-3 transition-all duration-300 ${
                    isActive
                      ? 'bg-[linear-gradient(135deg,rgba(255,24,24,0.16),rgba(255,255,255,0.05))] shadow-[0_12px_36px_rgba(255,24,24,0.10)]'
                      : 'bg-white/[0.02] hover:bg-white/[0.05]'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-2xl p-2.5 ${isActive ? 'bg-primary/15 text-primary' : 'bg-black/28 text-white/55 group-hover:text-white'}`}>
                      <item.icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black uppercase tracking-[0.04em] text-white">{item.name}</span>
                            {isActive && <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Live</span>}
                            {item.name === 'Inventory' && queuePendingCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.18em] text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                {queuePendingCount} in queue
                              </span>
                            )}
                          </div>
                        </div>
                        {item.snapshot.stat && (
                          <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${isActive ? 'bg-black/30 text-white/78' : 'bg-white/[0.05] text-white/50'}`}>
                            {item.snapshot.stat}
                          </div>
                        )}
                      </div>
                      {item.snapshot.note && (
                        <p className="mt-3 text-[11px] text-white/34">
                          {item.snapshot.note}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5">
              <Store size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.04em] text-white">{seller?.user?.business_name}</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Brand Account</p>
            </div>
          </div>
          <a
            href="https://wa.me/923158972405"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center justify-between rounded-2xl bg-black/35 px-4 py-3 text-sm font-semibold text-white/72 transition-colors hover:text-primary"
          >
            <span className="flex items-center gap-2">
              <MessageCircle size={15} />
              Support
            </span>
            <ArrowUpRight size={14} />
          </a>
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

  return (
    <>
      <div className="hidden md:flex md:h-[100dvh] md:w-80 md:flex-col md:sticky md:top-0">
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
