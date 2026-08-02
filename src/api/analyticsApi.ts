import { request } from './core';

export type FunnelEvent = 'page_view' | 'download_page_view' | 'store_visit' | 'app_install' | 'view_item' | 'add_to_cart' | 'begin_checkout';
export type FunnelSubEvent = 'variant_selected' | 'blocked' | 'form_started' | 'form_ready' | 'payment_method_selected' | 'submit_clicked' | 'field_completed' | 'preflight_failed';
export type FunnelSubEventDetail = 'variant_required' | 'out_of_stock' | 'quantity_limit' | 'name' | 'phone' | 'address' | 'city' | 'shipping_estimate' | 'payment_proof';

type FunnelEventProperties = {
    product_id?: string;
    quantity?: number;
    item_count?: number;
    path?: string;
    store?: 'app_store' | 'play_store';
};

const JOURNEY_STORAGE_KEY = 'juno_funnel_journey_id';

export const getFunnelJourneyId = (): string | undefined => {
    try {
        const existing = sessionStorage.getItem(JOURNEY_STORAGE_KEY);
        if (existing) return existing;
        if (!globalThis.crypto?.randomUUID) return undefined;
        const journeyId = globalThis.crypto.randomUUID();
        sessionStorage.setItem(JOURNEY_STORAGE_KEY, journeyId);
        return journeyId;
    } catch {
        return undefined;
    }
};

export namespace Funnel {
    export function track(type: FunnelEvent, properties: FunnelEventProperties = {}, source?: 'app'): void {
        const { product_id, ...eventProperties } = properties;
        void request<{ accepted: boolean }>('/analytics/events', 'POST', {
            type,
            source,
            journey_id: getFunnelJourneyId(),
            product_id,
            properties: Object.keys(eventProperties).length ? eventProperties : undefined,
        }, undefined, true, 30000, true).catch(() => undefined);
    }

    export function trackSubEvent(type: FunnelEvent, subEvent: FunnelSubEvent, detail?: FunnelSubEventDetail, properties: FunnelEventProperties = {}, source?: 'app'): void {
        const { product_id, ...eventProperties } = properties;
        void request<{ accepted: boolean }>('/analytics/events', 'POST', {
            type,
            source,
            journey_id: getFunnelJourneyId(),
            sub_event: subEvent,
            detail,
            product_id,
            properties: Object.keys(eventProperties).length ? eventProperties : undefined,
        }, undefined, true, 30000, true).catch(() => undefined);
    }
}
