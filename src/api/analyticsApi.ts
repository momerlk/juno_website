import { API_BASE_URL, request } from './core';

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
// Analytics stays off for localhost by default. Set VITE_ANALYTICS_IN_DEV=true
// in .env.local when intentionally testing the analytics pipeline.
const analyticsEnabled = !import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_IN_DEV === 'true';

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

// Analytics must never compete with the requests a customer is waiting on. Mobile
// browsers allow ~6 concurrent connections per host and these events fire on every
// tap, so a slow analytics response could starve product and checkout fetches for
// up to the 30s default timeout — which reads as a frozen page. sendBeacon is queued
// by the browser outside that pool; fetch is only a fallback, with a short timeout.
const ANALYTICS_ENDPOINT = '/analytics/events';
const ANALYTICS_TIMEOUT_MS = 5000;

const sendAnalyticsEvent = (payload: Record<string, unknown>): void => {
    try {
        if (typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            if (navigator.sendBeacon(`${API_BASE_URL}${ANALYTICS_ENDPOINT}`, blob)) return;
        }
    } catch {
        // Fall through to fetch.
    }
    void request<{ accepted: boolean }>(ANALYTICS_ENDPOINT, 'POST', payload, undefined, true, ANALYTICS_TIMEOUT_MS, true)
        .catch(() => undefined);
};

export namespace Funnel {
    export function track(type: FunnelEvent, properties: FunnelEventProperties = {}, source?: 'app'): void {
        if (!analyticsEnabled) return;
        const { product_id, ...eventProperties } = properties;
        sendAnalyticsEvent({
            type,
            source,
            journey_id: getFunnelJourneyId(),
            product_id,
            properties: Object.keys(eventProperties).length ? eventProperties : undefined,
        });
    }

    export function trackOnce(type: FunnelEvent, properties: FunnelEventProperties = {}, source?: 'app'): void {
        if (!analyticsEnabled) return;
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
        if (!analyticsEnabled) return;
        const { product_id, ...eventProperties } = properties;
        sendAnalyticsEvent({
            type,
            source,
            journey_id: getFunnelJourneyId(),
            sub_event: subEvent,
            detail,
            product_id,
            properties: Object.keys(eventProperties).length ? eventProperties : undefined,
        });
    }
}
