import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Globe, Loader, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import * as api from '../../api/sellerApi';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

interface ShopifyScrapeProps {
  onScrapeComplete?: (count: number) => void;
}

const ShopifyScrape: React.FC<ShopifyScrapeProps> = ({ onScrapeComplete }) => {
  const { seller } = useSellerAuth();
  const [shopUrl, setShopUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const normalizeShopUrl = (input: string): string => {
    let url = input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    // Remove any trailing paths like /admin or /products
    url = url.split('/')[0];
    return url;
  };

  const startPolling = () => {
    setIsSyncing(true);

    pollingInterval.current = setInterval(async () => {
      if (!seller?.token) return;

      try {
        const res = await api.Shopify.GetStatus(seller.token);
        if (!res.ok || !res.body) return;

        const { scrape_status, scrape_count } = res.body;
        const count = scrape_count ?? 0;

        if (scrape_status === 'completed') {
          stopPolling();
          setSyncCount(count);
          setMessage({
            type: 'success',
            text: `Imported ${count} product${count !== 1 ? 's' : ''}. They're now in your draft queue for review.`,
          });
          onScrapeComplete?.(count);
        } else if (scrape_status === 'failed') {
          stopPolling();
          setMessage({
            type: 'error',
            text: 'Sync failed. Check that the store is publicly accessible and has published products.',
          });
        } else {
          setSyncCount(count);
          setMessage({
            type: 'info',
            text: count > 0
              ? `Sync in progress... Imported ${count} product${count !== 1 ? 's' : ''} so far.`
              : 'Sync in progress... Fetching your products.',
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const handleScrape = async () => {
    if (!seller?.token) return;
    
    const normalizedUrl = normalizeShopUrl(shopUrl);
    if (!normalizedUrl) {
      setMessage({ type: 'error', text: 'Please enter a valid Shopify store URL.' });
      return;
    }

    setIsScraping(true);
    setMessage(null);
    setSyncCount(0);

    try {
      const res = await api.Shopify.Scrape(seller.token, normalizedUrl);
      
      if (res.status === 202) {
        // Async scrape started
        setMessage({ 
          type: 'info', 
          text: 'Shopify sync started! We\'re fetching your products in the background. They will appear in your draft queue shortly.' 
        });
        setShopUrl('');
        startPolling();
      } else if (res.ok && res.body) {
        // Legacy synchronous behavior (if any)
        const count = (res.body as any).count || 0;
        setMessage({ 
          type: 'success', 
          text: `Successfully scraped ${count} product${count !== 1 ? 's' : ''}. They're now in your draft queue for review.` 
        });
        setShopUrl('');
        onScrapeComplete?.(count);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Scraping failed. Make sure the store is publicly accessible and has published products.' 
        });
      }
    } catch (error) {
      console.error('Scrape error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScraping && !isSyncing) {
      handleScrape();
    }
  };

  return (
    <motion.div
      {...fadeUp}
      transition={{ duration: 0.45 }}
      className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
        <Globe size={12} />
        Quick Product Import
      </div>

      <div className="mt-5">
        <div className="rounded-[1.3rem] border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/20 p-2">
              <Zap size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No OAuth Required</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">
                Just enter your Shopify store URL and we'll import all your published products instantly. 
                No app installation or permissions needed.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mt-4 rounded-[1.2rem] border p-4 ${
            message.type === 'success' 
              ? 'border-emerald-400/20 bg-emerald-500/10' 
              : message.type === 'info'
                ? 'border-blue-400/20 bg-blue-500/10'
                : 'border-red-400/20 bg-red-500/10'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'info' && <RefreshCw size={14} className="animate-spin text-blue-300" />}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-emerald-300' : message.type === 'info' ? 'text-blue-300' : 'text-red-300'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/25">
              https://
            </span>
            <input
              type="text"
              placeholder="your-store.myshopify.com or yourbrand.com"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isScraping || isSyncing}
              className="w-full rounded-[1.2rem] border border-white/10 bg-black/30 py-4 pl-[5.5rem] pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/18 focus:border-primary/35 disabled:opacity-50"
            />
          </div>
          
          <button
            onClick={handleScrape}
            disabled={isScraping || isSyncing || !shopUrl.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-4 text-sm font-black uppercase tracking-[0.07em] text-white disabled:opacity-45"
          >
            {isScraping || isSyncing ? (
              <>
                <Loader size={15} className="animate-spin" />
                {isSyncing ? 'Syncing Products...' : 'Starting Scrape...'}
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Import Products
              </>
            )}
          </button>
        </div>

        <div className="mt-6 rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold text-white/70">How it works:</p>
          <ul className="mt-2 space-y-2 text-xs text-white/50">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">1.</span>
              <span>We fetch all published products from your public Shopify store</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">2.</span>
              <span>Products are added to your draft queue for review before going live</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">3.</span>
              <span>Pricing is auto-calculated with Juno's standard markup</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-[1.2rem] border border-amber-400/20 bg-amber-500/10 p-4">
          <p className="text-xs text-amber-300">
            <strong>Note:</strong> Your store must be publicly accessible (not password-protected). 
            If you're using Shopify's password page, disable it temporarily before scraping.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopifyScrape;

