import { request } from './core';

export type FunnelEvent = 'page_view' | 'download_page_view' | 'store_visit' | 'app_install' | 'view_item' | 'add_to_cart' | 'begin_checkout';

type FunnelEventProperties = {
    product_id?: string;
    quantity?: number;
    item_count?: number;
    path?: string;
    store?: 'app_store' | 'play_store';
};

export namespace Funnel {
    export function track(type: FunnelEvent, properties: FunnelEventProperties = {}, source?: 'app'): void {
        const { product_id, ...eventProperties } = properties;
        void request<{ accepted: boolean }>('/analytics/events', 'POST', {
            type,
            source,
            product_id,
            properties: Object.keys(eventProperties).length ? eventProperties : undefined,
        }, undefined, true, 30000, true).catch(() => undefined);
    }
}
