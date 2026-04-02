/**
 * Analytics API (Probe)
 * 
 * Handles platform analytics, event ingestion, and admin dashboards.
 * 
 * @module Analytics
 */

import { request, APIResponse } from "./core";
import type {
    TimeRangeParams,
    ComparisonParams,
    PlatformOverviewResponse,
    UserAnalyticsResponse,
    RetentionMetrics,
    CommerceAnalyticsResponse,
    FunnelAnalytics,
    CategoryMetric,
    RealTimeResponse,
    ProbeEvent,
    TopProduct,
    ProductDeepDiveResponse,
    SearchAnalyticsResponse,
    OperationalAnalyticsResponse,
    SellerOperationsResponse,
    FeedbackAnalyticsResponse,
    LogisticsAnalyticsResponse,
} from "./api.types";

// ============================================================================
// Probe Client (Public Event Ingestion)
// ============================================================================

export namespace Probe {
    const BASE_PATH = '/probe';

    export interface ProbeDevice {
        device_id?: string;
        platform?: string;
        app_version?: string;
        os_version?: string;
        locale?: string;
    }

    export interface ProbeEventContext {
        screen_name?: string;
        referrer?: string;
        source?: string;
        user_agent?: string;
        ip_address?: string;
    }

    export interface ProbeEventInput {
        type: string;
        product_id?: string;
        category_id?: string;
        timestamp?: string;
        properties?: Record<string, any>;
        context?: ProbeEventContext;
    }

    export interface IngestEventsRequest {
        session_id: string;
        user_id?: string;
        device?: ProbeDevice;
        events: ProbeEventInput[];
    }

    export interface SessionHeartbeatRequest {
        session_id: string;
        user_id?: string;
        device?: ProbeDevice;
        timestamp?: string;
        screen_name?: string;
        page_count?: number;
        metadata?: Record<string, any>;
    }

    /**
     * Ingest client events (public endpoint)
     * 
     * Accepts a batched event payload from mobile or web clients.
     * Server validates event types, enriches user_agent/ip_address,
     * and bulk inserts into probe_events table.
     */
    export async function ingestEvents(payload: IngestEventsRequest): Promise<APIResponse<{ accepted: number }>> {
        return request(`${BASE_PATH}/events/ingest`, 'POST', payload, undefined, true);
    }

    /**
     * Send session heartbeat (public endpoint)
     * 
     * Refreshes an active session's last-seen timestamp and optional metadata.
     */
    export async function heartbeat(payload: SessionHeartbeatRequest): Promise<APIResponse<{ session_id: string; last_seen_at: string }>> {
        return request(`${BASE_PATH}/sessions/heartbeat`, 'POST', payload, undefined, true);
    }
}

// ============================================================================
// Admin Analytics
// ============================================================================

export namespace Analytics {
    const BASE_PATH = '/admin/probe';

    function buildTimeRangeParams(params?: TimeRangeParams & ComparisonParams): string {
        const searchParams = new URLSearchParams();
        if (params?.start_time) searchParams.append('start_time', params.start_time);
        if (params?.end_time) searchParams.append('end_time', params.end_time);
        if (params?.granularity) searchParams.append('granularity', params.granularity);
        if (params?.compare === 'previous_period') searchParams.append('compare', 'previous_period');
        return searchParams.toString() ? `?${searchParams.toString()}` : '';
    }

    /**
     * Get platform overview dashboard metrics
     * 
     * Returns top-level admin dashboard metrics including DAU, WAU, MAU,
     * revenue, orders, AOV, conversion rate, and time-series trends.
     * 
     * Supports compare=previous_period for period-over-period comparison.
     */
    export async function getOverview(params?: TimeRangeParams & ComparisonParams): Promise<APIResponse<PlatformOverviewResponse>> {
        return request(`${BASE_PATH}/overview${buildTimeRangeParams(params)}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get user analytics (acquisition, engagement, retention)
     * 
     * Returns acquisition metrics (new users, signup sources, viral coefficient),
     * engagement metrics (sessions, top screens, feature usage), and retention data.
     */
    export async function getUsers(params?: TimeRangeParams & ComparisonParams): Promise<APIResponse<UserAnalyticsResponse>> {
        return request(`${BASE_PATH}/users${buildTimeRangeParams(params)}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get user retention cohorts
     * 
     * Returns cohort-based retention rates, churn rate, stickiness (DAU/MAU),
     * and resurrection rate for previously churned users.
     */
    export async function getUserRetention(params?: TimeRangeParams): Promise<APIResponse<RetentionMetrics>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/users/retention${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get user segments
     * 
     * Returns user base segmentation (new_users, active_shoppers, at_risk, etc.)
     * with counts and percentages.
     */
    export async function getUserSegments(params?: TimeRangeParams): Promise<APIResponse<{ name: string; count: number; pct: number }[]>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/users/segments${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get commerce analytics (revenue, orders, funnel)
     * 
     * Returns revenue metrics, top products, category breakdown,
     * funnel data, and monetization metrics (ARPU, time to first purchase).
     */
    export async function getCommerce(params?: TimeRangeParams & ComparisonParams): Promise<APIResponse<CommerceAnalyticsResponse>> {
        return request(`${BASE_PATH}/commerce${buildTimeRangeParams(params)}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get conversion funnel analytics
     * 
     * Returns core funnel stages: View Product → Add to Cart →
     * Start Checkout → Complete Purchase with drop-off percentages.
     */
    export async function getFunnel(params?: TimeRangeParams): Promise<APIResponse<FunnelAnalytics>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/commerce/funnel${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get category metrics
     * 
     * Returns per-category revenue, orders, views, conversion rate,
     * and growth rate.
     */
    export async function getCategories(params?: TimeRangeParams): Promise<APIResponse<CategoryMetric[]>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/commerce/categories${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get real-time analytics
     * 
     * Returns current activity snapshot: active users, events per minute,
     * active screens, and recent orders/revenue.
     */
    export async function getRealTime(limit?: number): Promise<APIResponse<RealTimeResponse>> {
        const qp = limit ? `?limit=${limit}` : '';
        return request(`${BASE_PATH}/real-time${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get recent real-time events
     * 
     * Returns stream of recent events for live monitoring.
     */
    export async function getRealTimeEvents(limit?: number): Promise<APIResponse<ProbeEvent[]>> {
        const qp = limit ? `?limit=${limit}` : '';
        return request(`${BASE_PATH}/real-time/events${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get top products by revenue
     * 
     * Returns products ranked by revenue or units sold.
     */
    export async function getProducts(params?: TimeRangeParams & { limit?: number }): Promise<APIResponse<TopProduct[]>> {
        let qp = buildTimeRangeParams(params);
        if (params?.limit) {
            qp += qp ? `&limit=${params.limit}` : `?limit=${params.limit}`;
        }
        return request(`${BASE_PATH}/products${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get deep dive metrics for a specific product
     * 
     * Returns comprehensive product metrics: views, cart adds, purchases,
     * conversion rate, cart abandon rate, time on page, return rate.
     */
    export async function getProductDetails(productId: string, params?: TimeRangeParams): Promise<APIResponse<ProductDeepDiveResponse>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/products/${productId}${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get search analytics
     * 
     * Returns top search queries, no-result queries,
     * search-to-purchase rate, and average results per query.
     */
    export async function getSearch(params?: TimeRangeParams): Promise<APIResponse<SearchAnalyticsResponse>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/search${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get operational analytics
     * 
     * Returns total bookings, status breakdown, and
     * average fulfillment time.
     */
    export async function getOperations(params?: TimeRangeParams): Promise<APIResponse<OperationalAnalyticsResponse>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/operations${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get seller operations analytics
     * 
     * Returns seller application metrics: total applications,
     * status breakdown, approval rate.
     */
    export async function getSellerOperations(params?: TimeRangeParams): Promise<APIResponse<SellerOperationsResponse>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/operations/sellers${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get feedback analytics
     * 
     * Returns feedback volume, category breakdown, and status breakdown.
     */
    export async function getFeedback(params?: TimeRangeParams): Promise<APIResponse<FeedbackAnalyticsResponse>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/operations/feedback${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get logistics analytics
     * 
     * Returns logistics metrics: total bookings, status breakdown,
     * and partner breakdown (Trax, Leopards, Call Courier, etc.).
     */
    export async function getLogistics(params?: TimeRangeParams): Promise<APIResponse<LogisticsAnalyticsResponse>> {
        const qp = buildTimeRangeParams(params);
        return request(`${BASE_PATH}/operations/logistics${qp}`, 'GET', undefined, getAdminToken());
    }
}

function getAdminToken(): string | undefined {
    return localStorage.getItem('admin_token') ?? undefined;
}
