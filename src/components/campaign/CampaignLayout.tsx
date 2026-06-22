import React, { useEffect } from 'react';
import CatalogNavbar from '../catalog/CatalogNavbar';
import { trackClarityEventWithTags } from '../../utils/clarity';
import EditorialShowcaseBanner from '../shared/editorial/EditorialShowcaseBanner';

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

  useEffect(() => {
    if (hideBanner || (!campaign.landing && !isArgos)) return;
    trackClarityEventWithTags('campaign_banner_view', {
      campaign_slug: campaign.slug,
      campaign_name: campaign.name,
    });
  }, [campaign.slug, campaign.name, !!campaign.landing, hideBanner, isArgos]);

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
        <EditorialShowcaseBanner
          imageUrl={heroImage || '/juno_app_icon.png'}
          eyebrow="Drop · Campaign"
          badgeLabel="Live now"
          title={campaign.landing?.headline || campaign.name}
          subtitle={
            campaign.landing?.subheadline ||
            (isArgos ? 'Favourite city of the goddess Juno.' : undefined)
          }
        />
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
