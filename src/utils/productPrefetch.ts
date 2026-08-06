/**
 * The product route is lazy-loaded, so on a cold visit the browser must
 * download and parse that chunk before React can even ask for the product —
 * and the product response is what supplies the LCP image URL. Firing the
 * request from the entry module instead takes that whole wait off the chain.
 */
import { Catalog } from '../api/catalogApi';
import { getLegacyCatalogProductRedirect } from '../hooks/useFunnelAnalytics';
import type { APIResponse, CatalogProduct } from '../api/api';

// Paths under /catalog that are pages, not product ids.
const NON_PRODUCT_SEGMENTS = new Set(['all', 'men', 'women', 'unisex', 'kids']);

let pending: { id: string; promise: Promise<APIResponse<CatalogProduct>> } | null = null;

export const getProductIdFromPath = (pathname: string): string | null => {
    const segment = /^\/catalog\/([^/?#]+)\/?$/.exec(pathname)?.[1];
    if (!segment || NON_PRODUCT_SEGMENTS.has(segment.toLowerCase())) return null;
    const id = decodeURIComponent(segment);
    // A legacy id is about to be redirected, so prefetch what it lands on.
    return getLegacyCatalogProductRedirect(id) ?? id;
};

export const startProductPrefetch = (pathname: string): void => {
    const id = getProductIdFromPath(pathname);
    if (!id) return;
    // Errors are swallowed here and re-discovered by the page's own request.
    pending = { id, promise: Catalog.getProduct(id).catch(() => null as never) };
};

/** Single use: a later visit to the same product goes through the normal client. */
export const takeProductPrefetch = (id: string): Promise<APIResponse<CatalogProduct>> | null => {
    if (pending?.id !== id) return null;
    const { promise } = pending;
    pending = null;
    return promise;
};
