import { request } from './core';

export type FunnelEvent = 'page_view' | 'view_item' | 'add_to_cart' | 'begin_checkout';

type FunnelEventProperties = {
    product_id?: string;
    quantity?: number;
    item_count?: number;
    path?: string;
};

export namespace Funnel {
    export function track(type: FunnelEvent, properties: FunnelEventProperties = {}): void {
        const { product_id, ...eventProperties } = properties;
        void request<{ accepted: boolean }>('/analytics/events', 'POST', {
            type,
            product_id,
            properties: Object.keys(eventProperties).length ? eventProperties : undefined,
        }, undefined, true).catch(() => undefined);
    }
}
