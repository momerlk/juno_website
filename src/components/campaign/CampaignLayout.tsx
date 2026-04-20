import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGuestCart } from '../../contexts/GuestCartContext';

interface CampaignLayoutProps {
  campaign: {
    name: string;
    slug: string;
    landing?: {
      hero_image_url?: string;
      headline?: string;
      subheadline?: string;
    };
  };
  children: React.ReactNode;
}

const CampaignLayout: React.FC<CampaignLayoutProps> = ({ campaign, children }) => {
  const { itemCount, setCartOpen } = useGuestCart();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Isolated Campaign Header */}
      <header className="sticky top-0 z-50 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex justify-between items-center">
          <a href={`/${campaign.slug}-campaign`} className="flex items-center">
            <img
              src="/juno_logos/icon+text_white.png"
              alt="Juno Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </a>

          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-full border border-white/10 p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-white"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      {campaign.landing && (
        <section className="relative w-full overflow-hidden">
          {campaign.landing.hero_image_url ? (
            <div className="relative h-[40vh] md:h-[60vh] w-full">
              <img
                src={campaign.landing.hero_image_url}
                alt={campaign.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-7xl font-black uppercase tracking-tight text-white mb-4"
                >
                  {campaign.landing.headline || campaign.name}
                </motion.h1>
                {campaign.landing.subheadline && (
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-2xl text-white/80 max-w-2xl font-medium"
                  >
                    {campaign.landing.subheadline}
                  </motion.p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 md:py-32 bg-neutral-900 flex flex-col items-center justify-center text-center p-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-7xl font-black uppercase tracking-tight text-white mb-4"
              >
                {campaign.landing?.headline || campaign.name}
              </motion.h1>
              {campaign.landing?.subheadline && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-2xl text-white/80 max-w-2xl font-medium"
                >
                  {campaign.landing.subheadline}
                </motion.p>
              )}
            </div>
          )}
        </section>
      )}

      <main className="flex-grow">
        {children}
      </main>

      {/* Isolated Campaign Footer */}
      <footer className="bg-black border-t border-white/5 py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <img
              src="/juno_logos/text_white.png"
              alt="Juno Logo"
              className="h-6 w-auto opacity-40"
            />
            
            <div className="flex flex-wrap justify-center gap-6 text-xs font-mono uppercase tracking-widest text-white/40">
              <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</a>
              <a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="mailto:hello@juno.com.pk" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              © 2026 JUNO PLATFORM. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampaignLayout;
