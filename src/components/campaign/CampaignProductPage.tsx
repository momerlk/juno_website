import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Star, Truck } from 'lucide-react';
import { PublicCampaigns } from '../../api/campaignsApi';
import { useGuestCart } from '../../contexts/GuestCartContext';
import CampaignLayout from './CampaignLayout';
import { RefreshCw, AlertCircle } from 'lucide-react';

const formatCurrency = (value?: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const CampaignProductPage: React.FC = () => {
  const { campaignSlug, productId } = useParams<{ campaignSlug: string; productId: string }>();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem, setCartOpen } = useGuestCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!campaignSlug || !campaignSlug.endsWith('-campaign') || !productId) {
      navigate('/404', { replace: true });
      return;
    }

    const slug = campaignSlug.replace(/-campaign$/, '');
    
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await PublicCampaigns.getPublicCampaignProduct(slug, productId);
        if (resp.ok) {
          setData(resp.body);
          const product = resp.body.product;
          setSelectedImage(product.images?.[0] || '/juno_app_icon.png');
          setSelectedOptions(
            Object.fromEntries(
              (product.options || []).map((option: any) => [
                option.name,
                option.values?.[0] ?? '',
              ])
            )
          );
        } else {
          setError('Product not found in this campaign.');
        }
      } catch (err) {
        setError('Failed to load product.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [campaignSlug, productId, navigate]);

  const selectedVariant = useMemo(() => {
    if (!data?.product) return undefined;
    const variants = data.product.variants || [];
    return (
      variants.find((variant: any) =>
        Object.entries(selectedOptions).every(
          ([name, value]) => variant.options?.[name] === value
        )
      ) ?? variants[0]
    );
  }, [data, selectedOptions]);

  const handleAddToCart = useCallback(() => {
    if (!data?.product || !selectedVariant || !campaignSlug) return;

    setIsAdding(true);
    const slug = campaignSlug.replace(/-campaign$/, '');
    
    addItem(data.product.id, selectedVariant.id, quantity, selectedVariant.price || data.product.pricing.discounted_price || data.product.pricing.price, {
      seller_name: data.product.seller_name,
      product_title: data.product.title,
      variant_title: selectedVariant.title,
      image_url: data.product.images?.[0] || '/juno_app_icon.png',
      // Attribution
      source: `campaign:${slug}`
    });

    setIsAdding(false);
    window.setTimeout(() => setCartOpen(true), 350);
  }, [data, selectedVariant, quantity, addItem, setCartOpen, campaignSlug]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono uppercase tracking-widest text-white/40">Loading Product...</p>
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
            {error || 'Product Unavailable'}
          </h1>
          <button 
            onClick={() => navigate(`/${campaignSlug}`)}
            className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            Back to Campaign
          </button>
        </div>
      </div>
    );
  }

  const { product, campaign } = data;
  const currentPrice = selectedVariant?.price ?? product.pricing.discounted_price ?? product.pricing.price ?? 0;

  return (
    <CampaignLayout campaign={campaign}>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <button
          onClick={() => navigate(`/${campaignSlug}`)}
          className="mb-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to {campaign.name}
        </button>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-6">
            <div className="aspect-[3/4] overflow-hidden bg-neutral-900 rounded-3xl">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {product.images.map((img: string) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === img ? 'border-primary' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
                {product.seller_name}
              </p>
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight text-white mt-2 leading-[0.9]">
                {product.title}
              </h1>
              <div className="mt-6 flex items-baseline gap-4">
                <span className="text-4xl font-black text-white">
                  {formatCurrency(currentPrice)}
                </span>
                {product.pricing.compare_at_price && (
                  <span className="text-xl text-white/30 line-through">
                    {formatCurrency(product.pricing.compare_at_price)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-lg text-white/70 leading-relaxed max-w-xl">
              {product.description || product.short_description}
            </p>

            {/* Options */}
            {product.options?.map((option: any) => (
              <div key={option.name} className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Select {option.name}
                </p>
                <div className="flex flex-wrap gap-3">
                  {option.values.map((val: string) => (
                    <button
                      key={val}
                      onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                      className={`px-6 py-3 rounded-full border text-sm font-bold transition-all ${
                        selectedOptions[option.name] === val
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Purchase */}
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 p-1">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-10 text-center font-black text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex-grow">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || !product.inventory?.in_stock}
                    className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isAdding ? 'Adding...' : 'Add to Bag'}
                  </button>
                </div>
              </div>
              
              {!product.inventory?.in_stock && (
                <p className="text-center text-red-400 font-bold uppercase tracking-widest text-xs">
                  Currently out of stock
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <Truck size={20} className="text-white/40" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Free Shipping</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                  <Star size={20} className="text-white/40" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Curated Piece</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CampaignLayout>
  );
};

export default CampaignProductPage;
