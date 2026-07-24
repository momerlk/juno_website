import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Package, Settings, ShieldCheck, ShoppingCart, LogOut } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { VStack } from '@astryxdesign/core/VStack';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export const navigation = [
  { group: 'Operations', items: [
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, subtitle: 'Platform-wide fulfillment desk' },
    { name: 'Sellers', href: '/admin/sellers', icon: ShieldCheck, subtitle: 'Approvals, remediation, and wallet ops' },
    { name: 'Products', href: '/admin/products', icon: Package, subtitle: 'Database-wide catalog control' },
    { name: 'Create Product', href: '/admin/products/create', icon: Package, subtitle: 'Manual creation and store imports' },
    { name: 'Import Products', href: '/admin/products/imports', icon: Package, subtitle: 'Shopify and WooCommerce imports' },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell, subtitle: 'Platform broadcasts' },
  ] },
  { group: 'Management', items: [{ name: 'Invites', href: '/admin/invites', icon: Bell, subtitle: 'Admin invite coordination' }] },
  { group: 'System', items: [{ name: 'Infrastructure', href: '/admin/system', icon: Settings, subtitle: 'Health, waitlist, OTPs, and tooling' }] },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setIsOpen, isCollapsed, onToggleCollapse }) => {
  const { admin, logout } = useAdminAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <SideNav
      header={<SideNavHeading heading="Juno Admin" superheading="Operations" subheading="Marketplace control" headingHref="/admin/orders" icon={<NavIcon icon={<ShieldCheck size={16} />} />} headerEndContent={<StatusDot variant="success" label="System operational" tooltip="System operational" />} />}
      collapsible={{ isCollapsed, onCollapsedChange: onToggleCollapse }}
      resizable={{ defaultWidth: 280, minWidth: 220, maxWidth: 340, autoSaveId: 'juno-admin-sidebar' }}
      footer={<VStack gap={2}><Divider /><SideNavSection title="Session"><SideNavItem label={admin?.name || 'Administrator'} icon={ShieldCheck} isDisabled /></SideNavSection><Button label="Sign out" variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={logout} /></VStack>}
    >
      {navigation.map((group) => (
        <SideNavSection key={group.group} title={group.group}>
          {group.items.map((item) => (
            <SideNavItem
              key={item.href}
              href={item.href}
              label={item.name}
              icon={item.icon}
              isSelected={pathname === item.href || (item.href !== '/admin/orders' && pathname.startsWith(`${item.href}/`))}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.href);
                setIsOpen(false);
              }}
            />
          ))}
        </SideNavSection>
      ))}
    </SideNav>
  );
};

export default Sidebar;
