import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, RadioTower, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar, { navigation } from './Sidebar';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { SellerQueueProvider } from '../../contexts/SellerQueueContext';
import { sendSellerHeartbeat, trackSellerEvent } from './probe';

const SellerDashboardInner: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { seller } = useSellerAuth();

  const currentRoute = useMemo(() => {
    const sortedNav = [...navigation].sort((a, b) => b.href.length - a.href.length);
    return sortedNav.find(item => location.pathname.startsWith(item.href));
  }, [location.pathname]);

  const title = currentRoute?.name ?? 'Dashboard';
  const subtitle = currentRoute?.subtitle ?? 'Run daily seller operations.';
  const approvalStatus = seller?.user?.status ?? 'pending';
  const city = seller?.user?.location?.city || 'Pakistan';
  const founder = seller?.user?.contact?.contact_person_name || 'Founder';
  const shopifyConnected = Boolean(seller?.user?.shopify_connected);

  const topSnapshot = [
    {
      label: 'Brand',
      value: seller?.user?.business_name || 'Indie Label',
      note: `${city} · ${founder}`,
    },
    {
      label: 'Status',
      value: approvalStatus,
      note: 'Account',
    },
    {
      label: 'Shopify',
      value: shopifyConnected ? 'Live' : 'Pending',
      note: shopifyConnected ? 'Sync active' : 'Connect store',
    },
    {
      label: 'Focus',
      value: currentRoute?.name ?? 'Dashboard',
      note: currentRoute?.focus ?? 'Current workspace',
    },
  ];

  useEffect(() => {
    const screenName = title.toLowerCase().replace(/\s+/g, '_');
    trackSellerEvent({
      sellerId: seller?.user?.id,
      type: 'screen.view',
      screenName,
      properties: {
        route: location.pathname,
      },
    });
  }, [location.pathname, seller?.user?.id, title]);

  useEffect(() => {
    const screenName = title.toLowerCase().replace(/\s+/g, '_');
    sendSellerHeartbeat({
      sellerId: seller?.user?.id,
      screenName,
      pageCount: 1,
    });

    const heartbeat = window.setInterval(() => {
      sendSellerHeartbeat({
        sellerId: seller?.user?.id,
        screenName,
        pageCount: 1,
      });
    }, 30000);

    return () => window.clearInterval(heartbeat);
  }, [seller?.user?.id, title]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,119,65,0.10),transparent_26%)]"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '88px 88px' }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.45),rgba(5,5,5,0.92))]" />
      </div>

      <div className="relative z-10 flex h-full">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-black/45 backdrop-blur-2xl md:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <button onClick={() => setSidebarOpen(true)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-white/75 transition-colors hover:text-white">
                <Menu size={18} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Juno Studio</p>
                <h1 className="text-sm font-black uppercase tracking-[0.06em] text-white">{title}</h1>
              </div>
              <div className="w-10" />
            </div>
          </header>

          <main className="relative flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.28)] md:p-6"
            >
              <div className="grid gap-4 lg:grid-cols-[1.65fr_0.75fr]">
                <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.03))]" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-primary/80">
                      <RadioTower size={12} />
                      Seller Portal
                    </p>
                    <motion.span
                      className="inline-flex h-2 w-2 rounded-full bg-primary"
                      animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>

                  <div className="mt-5 max-w-3xl">
                    <h1 className="max-w-2xl text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
                      {title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56 md:text-base">
                      {subtitle}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/62">
                      {city}
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/62">
                      {founder}
                    </div>
                    <div className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-primary">
                      {approvalStatus}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {topSnapshot.map(item => (
                      <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-black/22 p-4">
                        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">{item.label}</p>
                        <p className="mt-3 text-base font-black uppercase tracking-[-0.03em] text-white">{item.value}</p>
                        <p className="mt-2 text-xs leading-relaxed text-white/42">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-black/28 p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">Current Brand</p>
                  <p className="mt-3 text-lg font-black uppercase tracking-[-0.03em] text-white">
                    {seller?.user?.business_name || 'Indie Label'}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/52">
                    {currentRoute?.focus ?? 'Keep actions focused on orders, inventory, and updates.'}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs text-white/45">
                    <ArrowUpRight size={13} className="text-primary" />
                    Complete pending tasks first.
                  </div>
                </div>
              </div>
            </motion.section>

            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

const SellerDashboard: React.FC = () => (
  <SellerQueueProvider>
    <SellerDashboardInner />
  </SellerQueueProvider>
);

export default SellerDashboard;
