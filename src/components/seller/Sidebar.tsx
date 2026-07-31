import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, FileText, LayoutDashboard, LogOut, MessageCircle, Package, ShoppingCart, Store, User } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { VStack } from '@astryxdesign/core/VStack';
import { useSellerAuth } from '../../contexts/SellerAuthContext';

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, subtitle: 'Your daily brand overview.' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package, subtitle: 'Products, drafts, and stock.' },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, subtitle: 'Fulfillment for your customers.' },
  { name: 'Order processing guide', href: '/dashboard/order-processing', icon: BookOpen, subtitle: 'Visual packing workflow.' },
  { name: 'Statements', href: '/dashboard/statements', icon: FileText, subtitle: 'Payouts and settlement history.' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, subtitle: 'Demand and audience signals.' },
  { name: 'Profile', href: '/dashboard/profile', icon: User, subtitle: 'Your brand storefront.' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setIsOpen, isCollapsed, onToggleCollapse }) => {
  const { seller, logout } = useSellerAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const root = pathname.startsWith('/studio') ? '/studio' : '/seller';
  const isVerified = Boolean(seller?.user?.verified);

  return (
    <SideNav
      header={<SideNavHeading heading="Juno Studio" superheading="Seller portal" subheading="Run your brand" headingHref={`${root}/dashboard`} icon={<NavIcon icon={<Store size={16} />} />} headerEndContent={<StatusDot variant={isVerified ? 'success' : 'warning'} label={isVerified ? 'Verified brand' : 'Verification pending'} tooltip={isVerified ? 'Verified brand' : 'Verification pending'} />} />}
      collapsible={{ isCollapsed, onCollapsedChange: onToggleCollapse }}
      resizable={{ defaultWidth: 280, minWidth: 220, maxWidth: 340, autoSaveId: 'juno-studio-sidebar' }}
      footer={<VStack gap={2}><Divider /><SideNavSection title="Brand account"><SideNavItem label={seller?.user?.business_name || 'Your brand'} icon={Store} isDisabled /></SideNavSection><Button label="WhatsApp support" variant="ghost" size="sm" icon={<MessageCircle size={14} />} onClick={() => window.open('https://wa.me/923158972405', '_blank', 'noopener,noreferrer')} /><Button label="Sign out" variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={logout} /></VStack>}
    >
      <SideNavSection title="Workspace">
        {navigation.map((item) => {
          const href = `${root}${item.href}`;
          return <SideNavItem key={item.name} href={href} label={item.name} icon={item.icon} isSelected={pathname === href || (item.href !== '/dashboard' && pathname.startsWith(`${href}/`))} onClick={(event) => { event.preventDefault(); navigate(href); setIsOpen(false); }} />;
        })}
      </SideNavSection>
    </SideNav>
  );
};

export default Sidebar;
