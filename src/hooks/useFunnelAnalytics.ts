import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Funnel } from '../api/analyticsApi';

export function useFunnelPageView(): void {
    const location = useLocation();

    useEffect(() => {
        Funnel.track('page_view', { path: location.pathname });
    }, [location.pathname]);
}

export function useTrackProductView(productId?: string): void {
    useEffect(() => {
        if (productId) Funnel.track('view_item', { product_id: productId });
    }, [productId]);
}
