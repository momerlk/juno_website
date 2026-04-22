import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as api from '../api/sellerApi';
import { QueueItem } from '../constants/types';
import { useSellerAuth } from './SellerAuthContext';

interface SellerQueueContextType {
  items: QueueItem[];
  pendingCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SellerQueueContext = createContext<SellerQueueContextType | null>(null);

export const useSellerQueue = () => {
  const ctx = useContext(SellerQueueContext);
  if (!ctx) throw new Error('useSellerQueue must be used within a SellerQueueProvider');
  return ctx;
};

const POLL_INTERVAL_MS = 60000;

export const SellerQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { seller } = useSellerAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!seller?.token) return;
    setIsLoading(true);
    try {
      const res = await api.Seller.Queue.List(seller.token);
      if (res.ok && Array.isArray(res.body)) {
        setItems(res.body);
      }
    } finally {
      setIsLoading(false);
    }
  }, [seller?.token]);

  useEffect(() => {
    if (!seller?.token) {
      setItems([]);
      return;
    }
    refresh();
    pollRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [seller?.token, refresh]);

  const pendingCount = items.filter(item => item.status !== 'promoted').length;

  return (
    <SellerQueueContext.Provider value={{ items, pendingCount, isLoading, refresh }}>
      {children}
    </SellerQueueContext.Provider>
  );
};
