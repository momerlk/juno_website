import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';

const ShopifySuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/studio/dashboard', { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Shopify Connected</h1>
          {shop && (
            <p className="text-sm font-mono text-emerald-400">{shop}</p>
          )}
          <p className="text-sm text-neutral-400">
            Your store is now linked to Juno. You can sync your products from the dashboard.
          </p>
        </div>

        <button
          onClick={() => navigate('/studio/dashboard', { replace: true })}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          Go to Dashboard <ArrowRight size={16} />
        </button>

        <p className="text-xs text-neutral-600">Redirecting automatically in 5 seconds…</p>
      </motion.div>
    </section>
  );
};

export default ShopifySuccess;
