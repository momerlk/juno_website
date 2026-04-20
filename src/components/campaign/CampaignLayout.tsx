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
  hideBanner?: boolean;
}

const CampaignLayout: React.FC<CampaignLayoutProps> = ({ campaign, children, onSearch, hideBanner }) => {
  const heroImage = campaign.slug === 'argos' || campaign.slug === 'argos-campaign' 
    ? '/argos.jpg' 
    : campaign.landing?.hero_image_url;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-x-hidden">
      <CatalogNavbar homeHref={`/${campaign.slug}-campaign`} onSearch={onSearch} />

      {/* Hero Section - Container constrained, reduced height, softened corners */}
      {!hideBanner && campaign.landing && (
        <section className="container mx-auto max-w-7xl px-4 md:px-6 pt-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <div className="relative min-h-[280px] md:min-h-[360px] w-full">
              <img 
                src={heroImage} 
                alt={campaign.name} 
                className="absolute inset-0 w-full h-full object-cover object-center" 
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_42%,rgba(0,0,0,0.1)_100%)]" />
              
              <div className="relative flex min-h-[280px] items-end px-5 py-7 md:min-h-[360px] md:px-8 md:py-10">
                <div className="max-w-2xl">
                  <h1 className="uppercase leading-[0.86] text-white" 
                      style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(2.5rem, 4vw, 4rem)', letterSpacing: '-0.05em' }}>
                    {campaign.landing.headline || campaign.name}
                    {campaign.landing.subheadline && (
                      <span className="mt-2 block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic font-normal tracking-[-0.03em]"
                        style={{ fontFamily: 'Instrument Serif, serif', textTransform: 'none' }}>
                        {campaign.landing.subheadline}
                      </span>
                    )}
                  </h1>
                </div>
              </div>
            </div>
          </div>
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
