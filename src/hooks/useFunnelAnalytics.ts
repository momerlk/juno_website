import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Funnel } from '../api/analyticsApi';

const LEGACY_CATALOG_PRODUCT_IDS: Record<string, string> = {
    'b3ab7530-1899-4466-b3da-c345ee79669b': '901e4522-18b8-46ad-9bc3-4f7899ec2e9a',
    '50ab1d94-7551-47ab-92db-bf8b518cba97': '9ccb66d0-3b30-4f47-bb49-dc9516e057ea',
};

export const getLegacyCatalogProductRedirect = (productId?: string) => productId ? LEGACY_CATALOG_PRODUCT_IDS[productId] : undefined;

export function useFunnelPageView(): void {
    const location = useLocation();
    const trackedPath = useRef<string>();

    useEffect(() => {
        const [, catalog, productId] = location.pathname.split('/');
        if (catalog !== 'catalog' || getLegacyCatalogProductRedirect(productId) || trackedPath.current === location.pathname) return;
        trackedPath.current = location.pathname;
        Funnel.track('page_view', { path: location.pathname });
    }, [location.pathname]);
}

export function useTrackProductView(productId?: string): void {
    const trackedProductId = useRef<string>();

    useEffect(() => {
        if (!productId || trackedProductId.current === productId) return;
        trackedProductId.current = productId;
        Funnel.track('view_item', { product_id: productId });
    }, [productId]);
}
