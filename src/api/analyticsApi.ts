import { request } from './core';

export type FunnelEvent = 'page_view' | 'download_page_view' | 'store_visit' | 'app_install' | 'view_item' | 'add_to_cart' | 'begin_checkout';
type FunnelSubEvents = {
    view_item: 'variant_selected' | 'size_guide_opened' | 'unavailable_shown';
    add_to_cart: 'clicked' | 'blocked';
    begin_checkout: 'form_started' | 'form_ready' | 'submit_clicked' | 'payment_proof_opened' | 'payment_proof_added' | 'payment_method_selected' | 'field_completed' | 'field_invalid' | 'shipping_estimate' | 'preflight_failed';
};
export type FunnelSubEvent = FunnelSubEvents[keyof FunnelSubEvents];
export type FunnelSubEventDetail = 'out_of_stock' | 'variant_unavailable' | 'variant_required' | 'quantity_limit' | 'cod' | 'bank_deposit' | 'name' | 'phone' | 'address' | 'city' | 'requested' | 'ready' | 'failed' | 'shipping_estimate' | 'payment_proof';

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

    export function trackOnce(type: FunnelEvent, properties: FunnelEventProperties = {}, source?: 'app'): void {
        try {
            const key = `${JOURNEY_STORAGE_KEY}:${type}`;
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, '1');
        } catch {
            // Analytics must not interfere when browser storage is unavailable.
        }
        track(type, properties, source);
    }

    export function trackSubEvent<T extends keyof FunnelSubEvents>(type: T, subEvent: FunnelSubEvents[T], detail?: FunnelSubEventDetail, properties: FunnelEventProperties = {}, source?: 'app'): void {
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
