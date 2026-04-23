import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useGuestCart } from '../../contexts/GuestCartContext';

const CartStockLimitToast: React.FC = () => {
  const { stockLimitNotice } = useGuestCart();

  return (
    <AnimatePresence>
      {stockLimitNotice && (
        <motion.div
          key={stockLimitNotice.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 z-[120] w-[min(92vw,430px)] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="rounded-2xl border border-amber-400/30 bg-black/90 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-100">
              <AlertTriangle size={16} className="text-amber-300" />
              {stockLimitNotice.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartStockLimitToast;
