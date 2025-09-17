import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, Apple, Download, Gift, Copy, Check } from 'lucide-react';
import { getAllSellers, getInvitesByOwner, generateInviteForOwner } from '../api/adminApi';

interface Seller {
  id: string;
  business_name: string;
  email: string;
  description: string;
  logo_url: string;
  banner_url : string;
}

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

const BrandPage: React.FC = () => {
  const { brandName } = useParams<{ brandName: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [invite, setInvite] = useState<InviteData | null>(null);
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
        
        const foundSeller = allSellers.find(s => s.business_name.toLowerCase() === brandName.toLowerCase());
        if (!foundSeller) {
          alert("brand not found")
          setError('Brand not found.');
          setIsLoading(false);
          return;
        }
        setSeller(foundSeller);
        setError(null)

        const existingInvites = await getInvitesByOwner(foundSeller.business_name);
        if (existingInvites && existingInvites.length > 0) {
          setInvite(existingInvites[0]);
        } else {
          const newInvite = await generateInviteForOwner(foundSeller.business_name);
          setInvite(newInvite);
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
  const qrCodeApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=1c1c1c&color=ffffff&data=';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white text-center">
        <div>
          <h2 className="text-3xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-lg shadow-lg overflow-hidden mt-8 mb-12"
        >
          <img 
            src={seller.banner_url} 
            alt={`${seller.business_name} banner`} 
            className="w-full h-96 object-cover" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <img 
                src={seller.logo_url} 
                alt={`${seller.business_name} logo`} 
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-background-light shadow-md" 
              />
              <h1 className="text-5xl font-bold text-white">{seller.business_name}</h1>
              <p className="text-neutral-200 mt-4 max-w-2xl mx-auto">{seller.description}</p>
          </div>
        </motion.div>

        {invite && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-background rounded-lg p-8 mb-12 text-center"
          >
            <Gift size={32} className="mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Your Exclusive Invite Code</h2>
            <p className="text-neutral-400 mb-6">Use this code to get access to use Juno.</p>
            <div className="inline-flex items-center bg-background-light p-4 rounded-lg border-2 border-dashed border-primary">
              <span className="text-3xl font-bold text-primary tracking-widest mr-4">{invite.code}</span>
              <button onClick={handleCopy} className="p-2 rounded-md hover:bg-neutral-700">
                {copied ? <Check className="text-green-500" /> : <Copy className="text-neutral-400" />}
              </button>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-background rounded-lg p-6"
        >
          <div className="flex items-center mb-6">
            <Smartphone size={24} className="text-primary mr-3" />
            <h2 className="text-xl font-semibold text-white">Download the Juno App</h2>
          </div>
          <div className="grid grid-cols-1 gap-8">
            <div className="flex flex-col items-center bg-background-light p-6 rounded-lg">
              <div className="flex items-center text-white mb-4">
                <Download size={28} className="mr-2" />
                <h3 className="text-2xl font-semibold">Scan to Download</h3>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <img src={`${qrCodeApiBase}${encodeURIComponent(downloadUrl)}`} alt="Juno App QR Code" width="200" height="200" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BrandPage;
