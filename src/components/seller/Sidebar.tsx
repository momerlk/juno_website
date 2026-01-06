import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  User,
  X,
  LogOut,
  Store,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSellerAuth } from '../../contexts/SellerAuthContext';

export const navigation = [
  { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/seller/dashboard/inventory', icon: Package },
  { name: 'Orders', href: '/seller/dashboard/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/seller/dashboard/analytics', icon: BarChart2 },
  { name: 'Profile', href: '/seller/dashboard/profile', icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { seller, logout } = useSellerAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-2xl border-r border-white/5">
      <div className="flex items-center justify-between h-20 flex-shrink-0 px-6 border-b border-white/5">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Seller Portal</h1>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-neutral-400 hover:text-white transition-colors">
          <X />
        </button>
      </div>
      <nav className="flex-grow p-4 overflow-y-auto space-y-1">
        <ul>
          {navigation.map((item) => (
            <li key={item.name} className="mb-2">
              <NavLink
                to={item.href}
                end={item.href === '/seller/dashboard'}
                onClick={() => isOpen && setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-primary/80 backdrop-blur-md shadow-lg shadow-primary/20 text-white border border-white/10'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white hover:border hover:border-white/5 border border-transparent'
                  }`
                }
              >
                <item.icon className={`h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110`} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-white/5 flex-shrink-0 bg-white/5 backdrop-blur-sm m-4 rounded-xl border border-white/5">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-primary/20 rounded-lg mr-3">
             <Store size={24} className="text-primary" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-semibold truncate">{seller?.user.business_name}</p>
            <p className="text-xs text-neutral-400">Seller Account</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  return (
    <>
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-neutral-800">
          {sidebarContent}
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col w-64 bg-background/80 backdrop-blur-md"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {sidebarContent}
            </motion.div>
            <motion.div
              className="flex-1 bg-black/50"
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
