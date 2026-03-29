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
  BookOpen,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';

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
  const location = useLocation();
  const prefix = location.pathname.startsWith('/studio') ? '/studio' : '/seller';

  const navItems = navigation.map(item => ({
    ...item,
    href: item.href.replace('/seller', prefix),
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

        <div className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.18),transparent_42%),rgba(255,255,255,0.04)] p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/75">Seller OS</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-white">
            Built for indie brands with something to say.
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
            The portal should feel like a creative operating room, not a warehouse dashboard.
          </p>
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
                  `group block rounded-[1.35rem] border p-3 transition-all duration-300 ${
                    isActive
                      ? 'border-primary/30 bg-primary/12 shadow-[0_12px_40px_rgba(255,24,24,0.14)]'
                      : 'border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-2xl border p-2.5 ${isActive ? 'border-primary/30 bg-primary/15 text-primary' : 'border-white/10 bg-black/30 text-white/55 group-hover:text-white'}`}>
                      <item.icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase tracking-[0.04em] text-white">{item.name}</span>
                        {isActive && <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">Live</span>}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">{item.subtitle}</p>
                    </div>
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/25">Seller Education</p>
          <a
            href="https://wa.me/923158972405"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm font-semibold text-white transition-colors hover:border-primary/25 hover:text-primary"
          >
            Founder Support
            <ArrowUpRight size={15} />
          </a>
          <div className="mt-3 space-y-2 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <BookOpen size={13} className="text-primary/80" />
              Product photo standards
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={13} className="text-primary/80" />
              Community wins and weekly tips
            </div>
          </div>
        </div>
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
      <div className="hidden border-r border-white/8 md:flex md:w-80 md:flex-col">
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
              className="w-[19rem] border-r border-white/10 shadow-2xl"
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
