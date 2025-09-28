import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Gift, Map, Truck, BarChart2, Bell } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Sellers', href: '/admin/sellers', icon: Users },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Invites', href: '/admin/invites', icon: Gift },
  { name: 'Locations', href: '/admin/locations', icon: Map },
  { name: 'Delivery', href: '/admin/delivery', icon: Truck },
  { name: 'Interactions', href: '/admin/interactions', icon: BarChart2 },
  { name: 'Product Performance', href: '/admin/product-performance', icon: BarChart2 },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
];

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-64 bg-neutral-900/50 border-r border-neutral-800 backdrop-blur-md">
      <div className="flex items-center justify-center h-16 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-white">Juno Admin</h1>
      </div>
      <nav className="flex-grow p-4">
        <ul>
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
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
    </div>
  );
};

export default Sidebar;
