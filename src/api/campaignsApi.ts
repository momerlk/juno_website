/**
 * Campaigns API
 * 
 * Performance marketing campaign management and lifecycle.
 * Admin-only module for campaign CRUD, status transitions,
 * and landing page resolution.
 * 
 * @module Campaigns
 */

import { request, APIResponse } from "./core";
import type {
    Campaign,
    CampaignMetrics,
    CreateCampaignRequest,
    UpdateCampaignRequest,
    ChangeCampaignStatusRequest,
    LandingTargetResponse,
    MetaInputsRequest,
    PublicCampaignResponse,
    PublicCampaignProductResponse,
} from "./api.types";

// ============================================================================
// Campaigns API
// ============================================================================

export namespace Campaigns {
    const BASE_PATH = '/admin/campaigns';

    function getAdminToken(): string | undefined {
        return localStorage.getItem('admin_token') ?? undefined;
    }

    /**
     * Create campaign
     * 
     * Creates a new performance marketing campaign with product strategy
     * and landing configuration. All campaigns start in 'draft' status.
     * 
     * Required fields:
     * - name, slug, channel, type
     * - product_strategy (method required)
     * - landing_type
     * - utm_source, utm_medium, utm_campaign
     * - start_date
     */
    export async function createCampaign(campaign: CreateCampaignRequest): Promise<APIResponse<Campaign>> {
        return request(BASE_PATH, 'POST', campaign, getAdminToken());
    }

    /**
     * List campaigns
     * 
     * Get paginated list of all campaigns with optional status filter.
     * 
     * Query parameters:
     * - status: draft | active | paused | completed | archived
     * - limit: results per page (default: 10)
     * - offset: pagination offset (default: 0)
     */
    export async function listCampaigns(params?: { status?: string; limit?: number; offset?: number }): Promise<APIResponse<Campaign[]>> {
        const qp = params && Object.keys(params).length ? `?${new URLSearchParams(params as any).toString()}` : '';
        return request(`${BASE_PATH}${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get campaign
     * 
     * Retrieve complete campaign details including metrics.
     */
    export async function getCampaign(id: string): Promise<APIResponse<Campaign>> {
        return request(`${BASE_PATH}/${id}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Update campaign
     * 
     * Update campaign details. Only allowed for draft or paused status campaigns.
     * PATCH-like semantics via PUT - only provided fields are changed.
     */
    export async function updateCampaign(id: string, campaign: UpdateCampaignRequest): Promise<APIResponse<Campaign>> {
        return request(`${BASE_PATH}/${id}`, 'PUT', campaign, getAdminToken());
    }

    /**
     * Change campaign status
     * 
     * Transition campaign through valid status lifecycle.
     * 
     * Valid transitions:
     * - draft → active, archived
     * - active → paused, completed, archived
     * - paused → active, completed, archived
     * - completed → archived
     * - archived → (no transitions)
     */
    export async function changeCampaignStatus(id: string, status: Campaign['status']): Promise<APIResponse<Campaign>> {
        return request(`${BASE_PATH}/${id}/status`, 'PATCH', { status }, getAdminToken());
    }

    /**
     * Archive campaign
     * 
     * Soft-delete campaign by setting status to archived.
     */
    export async function archiveCampaign(id: string): Promise<APIResponse<void>> {
        return request(`${BASE_PATH}/${id}`, 'DELETE', undefined, getAdminToken());
    }

    /**
     * Get campaign metrics
     * 
     * Retrieve real-time performance metrics for a campaign.
     * Includes impressions, clicks, visitors, conversions, revenue,
     * AOV, conversion rate, ROAS, and more.
     */
    export async function getCampaignMetrics(id: string): Promise<APIResponse<CampaignMetrics>> {
        return request(`${BASE_PATH}/${id}/metrics`, 'GET', undefined, getAdminToken());
    }

    /**
     * Resolve campaign landing target
     * 
     * Validate and resolve campaign landing page configuration.
     * Returns the target resource IDs and layout type for frontend rendering.
     */
    export async function resolveLandingTarget(id: string): Promise<APIResponse<LandingTargetResponse>> {
        return request(`${BASE_PATH}/${id}/landing`, 'GET', undefined, getAdminToken());
    }

    export async function updateMetaInputs(id: string, data: MetaInputsRequest): Promise<APIResponse<Campaign>> {
        return request(`${BASE_PATH}/${id}/meta-inputs`, 'PATCH', data, getAdminToken());
    }
}

export namespace PublicCampaigns {
    const BASE_PATH = '/campaigns/slug';

    export async function getPublicCampaign(slug: string): Promise<APIResponse<PublicCampaignResponse>> {
        return request(`${BASE_PATH}/${slug}`, 'GET');
    }

    export async function getPublicCampaignProduct(slug: string, productId: string): Promise<APIResponse<PublicCampaignProductResponse>> {
        return request(`${BASE_PATH}/${slug}/products/${productId}`, 'GET');
    }
}
