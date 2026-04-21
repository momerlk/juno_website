import React from 'react';
import { motion } from 'framer-motion';
import { useGuestCart } from '../../contexts/GuestCartContext';
import CatalogNavbar from '../catalog/CatalogNavbar';

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
  onSearch?: (query: string) => void;
  onQueryChange?: (query: string) => void;
  suggestionsOverride?: any[];
  initialQuery?: string;
  hideBanner?: boolean;
}

const CampaignLayout: React.FC<CampaignLayoutProps> = ({ 
  campaign, 
  children, 
  onSearch, 
  onQueryChange, 
  suggestionsOverride,
  initialQuery,
  hideBanner 
}) => {
  const isArgos = campaign.slug === 'argos' || campaign.slug === 'argos-campaign';
  const heroImage = isArgos ? '/argos.jpg' : campaign.landing?.hero_image_url;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-x-hidden">
      <CatalogNavbar 
        homeHref={`/${campaign.slug}-campaign`} 
        onSearch={onSearch} 
        onQueryChange={onQueryChange}
        suggestionsOverride={suggestionsOverride}
        initialQuery={initialQuery}
      />

      {/* Hero Section */}
      {!hideBanner && (campaign.landing || isArgos) && (
        <section className="container mx-auto max-w-7xl px-4 md:px-6 pt-6 md:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/[0.08] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="relative min-h-[340px] md:min-h-[480px] w-full">
              {/* Hero image — slight zoom on mount */}
              <motion.img
                src={heroImage}
                alt={campaign.name}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />

              {/* Layered vignette — dark bottom for legibility, subtle top sheen */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.45)_75%,rgba(0,0,0,0.92)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(220,10,40,0.18),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,rgba(255,69,133,0.12),transparent_45%)]" />

              {/* Top-left eyebrow */}
              <div className="absolute left-5 top-5 md:left-10 md:top-8 z-10 flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(220,10,40,0.9)] animate-pulse" />
                <p className="font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-[0.36em] text-white/85">
                  Drop · Campaign
                </p>
              </div>

              {/* Top-right badge — on desktop */}
              <div className="absolute right-5 top-5 md:right-10 md:top-8 z-10 hidden sm:block">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/70">
                    Live now
                  </p>
                </div>
              </div>

              {/* Bottom content */}
              <div className="relative flex min-h-[340px] md:min-h-[480px] items-end px-5 py-8 md:px-10 md:py-12">
                <div className="max-w-3xl">
                  {/* Red gradient accent bar */}
                  <div className="mb-4 md:mb-5 h-[3px] w-12 md:w-16 rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_14px_rgba(220,10,40,0.6)]" />

                  <h1
                    className="uppercase leading-[0.82] text-white"
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 900,
                      fontSize: 'clamp(2.6rem, 5.5vw, 5.5rem)',
                      letterSpacing: '-0.055em',
                      textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                    }}
                  >
                    {campaign.landing?.headline || campaign.name}
                  </h1>

                  {/* Subheadline (API-provided) OR Argos tagline */}
                  {campaign.landing?.subheadline ? (
                    <p
                      className="mt-3 md:mt-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic"
                      style={{
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {campaign.landing.subheadline}
                    </p>
                  ) : isArgos ? (
                    <p
                      className="mt-3 md:mt-4 italic text-white/80"
                      style={{
                        fontFamily: 'Instrument Serif, serif',
                        fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)',
                        letterSpacing: '-0.01em',
                        textShadow: '0 2px 20px rgba(0,0,0,0.6)',
                      }}
                    >
                      Favourite city of the goddess Juno.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      <main className="flex-grow">{children}</main>

      <footer className="bg-black border-t border-white/5 py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <img src="/juno_logos/text_white.png" alt="Juno" className="h-6 opacity-30 grayscale" />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/20">© 2026 JUNO PLATFORM.</p>
        </div>
      </footer>
    </div>
  );
};

export default CampaignLayout;
