import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PublicCampaigns } from '../../api/campaignsApi';
import CampaignLayout from './CampaignLayout';
import ProductGrid from '../catalog/gender/ProductGrid';
import { RefreshCw, AlertCircle } from 'lucide-react';

const CampaignLandingPage: React.FC = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!campaignSlug || !campaignSlug.endsWith('-campaign')) {
      navigate('/404', { replace: true });
      return;
    }

    const slug = campaignSlug.replace(/-campaign$/, '');
    
    const fetchCampaign = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await PublicCampaigns.getPublicCampaign(slug);
        if (resp.ok) {
          setData(resp.body);
          const products = resp.body.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            images: p.images,
            seller_name: p.seller_name,
            pricing: p.pricing,
            inventory: p.inventory,
          }));
          setFilteredProducts(products);
        } else {
          setError('This campaign has ended or does not exist.');
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignSlug, navigate]);

  const handleSearch = (query: string) => {
    if (!data) return;
    const products = data.products.map((p: any) => ({
      id: p.id,
      title: p.title,
      images: p.images,
      seller_name: p.seller_name,
      pricing: p.pricing,
      inventory: p.inventory,
    }));

    if (!query) {
      setFilteredProducts(products);
      return;
    }
    const lowerQuery = query.toLowerCase();
    setFilteredProducts(
      products.filter((p: any) => 
        p.title.toLowerCase().includes(lowerQuery) || 
        p.seller_name.toLowerCase().includes(lowerQuery)
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Fetching Edit...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="inline-flex p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {error || 'Campaign Unavailable'}
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 rounded-xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-200 transition-all active:scale-95"
          >
            Return to Juno
          </button>
        </div>
      </div>
    );
  }

  return (
    <CampaignLayout campaign={data.campaign} onSearch={handleSearch}>
      <div className="container mx-auto px-4 py-20 md:py-24 max-w-7xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-1 w-1 bg-primary  animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
              The Collection
            </p>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Featured Pieces
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-32 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-sm font-mono uppercase tracking-[0.3em] text-white/30">
              No products found matching your search.
            </p>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} isLoading={false} basePath={campaignSlug} />
        )}
      </div>
    </CampaignLayout>
  );
};

export default CampaignLandingPage;
