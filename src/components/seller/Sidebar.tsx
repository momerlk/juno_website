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
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-white">Seller Portal</h1>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-neutral-400 hover:text-white">
          <X />
        </button>
      </div>
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul>
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                end={item.href === '/seller/dashboard'}
                onClick={() => isOpen && setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 my-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-neutral-800 flex-shrink-0">
        <div className="flex items-center mb-4">
          <Store size={40} className="mr-3 text-primary" />
          <div>
            <p className="text-white font-semibold">{seller?.user.business_name}</p>
            <p className="text-sm text-neutral-400">Seller</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
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
