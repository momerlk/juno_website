import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PublicCampaigns } from '../../api/campaignsApi';
import CampaignLayout from './CampaignLayout';
import ProductCard from '../catalog/ProductCard';
import { RefreshCw, AlertCircle } from 'lucide-react';

const CampaignLandingPage: React.FC = () => {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono uppercase tracking-widest text-white/40">Loading Campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            {error || 'Campaign Unavailable'}
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            Go to Juno
          </button>
        </div>
      </div>
    );
  }

  return (
    <CampaignLayout campaign={data.campaign}>
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        {data.products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl font-mono uppercase tracking-[0.2em] text-white/30">
              No products in this campaign yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {data.products.map((product: any, index: number) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index}
                // We'll modify ProductCard to accept this 'to' prop
                to={`/${campaignSlug}/${product.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </CampaignLayout>
  );
};

export default CampaignLandingPage;
