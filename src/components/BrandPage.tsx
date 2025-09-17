import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Gift, Copy, Check, ArrowRight } from 'lucide-react';
import { getAllSellers, getInvitesByOwner, generateInviteForOwner } from '../api/adminApi';
import * as sellerApi from '../api/sellerApi';
import { Product } from '../constants/types';

interface Seller {
  id: string;
  business_name: string;
  email: string;
  description: string;
  logo_url: string;
  banner_url: string;
}

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

const ProductCard = ({ product }: { product: Product }) => (
  <motion.div className="card card-hover overflow-hidden bg-background-light border-neutral-800">
    <div className="relative h-80 w-full overflow-hidden group">
      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="font-bold text-white text-lg truncate">{product.title}</h3>
      </div>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-center">
        <p className="text-primary font-bold text-xl">Rs. {product.pricing.price.toLocaleString()}</p>
        <a href={`/product/${product.id}`} className="btn btn-outline btn-sm text-xs px-3 py-1.5">
          View Product
        </a>
      </div>
    </div>
  </motion.div>
);

const BrandPage: React.FC = () => {
  const { brandName } = useParams<{ brandName: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBrandData = async () => {
      if (!brandName) {
        setError('No brand name provided.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const allSellers: Seller[] = await getAllSellers();
        const uBrandName = brandName.toLowerCase().replace(/-/g, ' ');
        const foundSeller = allSellers.find(s => s.business_name.toLowerCase() === uBrandName);
        
        if (!foundSeller) {
          setError('Brand not found.');
          setIsLoading(false);
          return;
        }
        setSeller(foundSeller);
        setError(null);

        const invitePromise = getInvitesByOwner(foundSeller.business_name).catch(() => null);
        const productsPromise = sellerApi.Products.GetProducts(100).catch(() => null);

        const [inviteResult, productResponse] = await Promise.all([invitePromise, productsPromise]);

        if (inviteResult && inviteResult.length > 0) {
          setInvite(inviteResult[0]);
        } else {
          const newInvite = await generateInviteForOwner(foundSeller.business_name).catch(() => null);
          if (newInvite) setInvite(newInvite);
        }

        if (productResponse && productResponse.ok && Array.isArray(productResponse.body)) {
          const brandProducts = productResponse.body
            .filter((p: Product) => p.seller_name.toLowerCase() === foundSeller.business_name.toLowerCase())
            .slice(0, 3);
          setProducts(brandProducts);
        }

      } catch (err) {
        setError('Failed to load brand information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandData();
  }, [brandName]);

  const handleCopy = () => {
    if (invite?.code) {
      navigator.clipboard.writeText(invite.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadUrl = 'https://juno.com.pk/download';
  const qrCodeApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=256x256&bgcolor=0A0A0A&color=ffffff&data=';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white text-center p-4">
        <div>
          <h2 className="text-3xl font-bold text-error mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  return (
    <div className="bg-background-dark text-white">
      <motion.section 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="relative h-[60vh] min-h-[500px] flex items-center justify-center text-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={seller.banner_url} 
            alt={`${seller.business_name} banner`} 
            className="w-full h-full object-cover scale-110 blur-sm"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 p-4">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            src={seller.logo_url} 
            alt={`${seller.business_name} logo`} 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto mb-6 border-4 border-background-light shadow-2xl"
          />
          <h1 className="text-5xl md:text-7xl font-extrabold gradient-text">{seller.business_name}</h1>
          <p className="text-neutral-300 mt-4 max-w-2xl mx-auto text-lg md:text-xl">{seller.description}</p>
        </div>
      </motion.section>

      <div className="py-16 md:py-24">
        <div className="container mx-auto">

          {products.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-16 md:mb-24"
            >
              <h2 className="text-4xl font-bold text-center mb-12"><span className="gradient-text">From the Collection</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </motion.section>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="max-w-sm mx-auto card p-8 text-center"
            style={{marginBottom : "50px"}}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Download the App</h2>
            <div className="p-2 bg-white rounded-lg inline-block mb-4">
              <img src={`${qrCodeApiBase}${encodeURIComponent(downloadUrl)}`} alt="Juno App QR Code" width="200" height="200" />
            </div>
            <a href="/download" className="btn btn-primary w-full group">
              Download Now <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1"/>
            </a>
          </motion.div>

          {invite && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto card p-8 text-center mb-16 md:mb-24"
            >
              <Gift size={32} className="mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Your Exclusive Invite</h2>
              <p className="text-neutral-400 mb-6">Use this code to get exclusive access to Juno.</p>
              <div className="inline-flex items-center bg-background-dark p-4 rounded-lg border-2 border-dashed border-primary">
                <span className="text-4xl font-bold text-primary tracking-widest mr-4">{invite.code}</span>
                <button onClick={handleCopy} className="p-3 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                  {copied ? <Check className="text-success" size={24} /> : <Copy className="text-neutral-400" size={24} />}
                </button>
              </div>
              <p className="text-sm text-neutral-500 mt-4">Signups with this code: <span className="font-bold text-white">{invite.signups}</span></p>
            </motion.div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default BrandPage;
