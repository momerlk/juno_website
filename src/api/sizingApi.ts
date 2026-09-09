/** Customer-safe normalized size charts and deterministic fit recommendations. */
import { API_BASE_URL, request, type APIResponse } from './core';
import { getFunnelJourneyId } from './analyticsApi';
import type { ProductSizing, SizeRecommendation, SizeRecommendationRequest, SizingQuiz } from './api.types';

const BASE_PATH = '/sizing';

export const Sizing = {
    async getProductSizing(productId: string): Promise<APIResponse<ProductSizing>> {
        return request(`${BASE_PATH}/products/${productId}`, 'GET', undefined, undefined, true);
    },

    async getQuestionnaire(productId: string): Promise<APIResponse<SizingQuiz>> {
        return request(`${BASE_PATH}/products/${productId}/quiz`, 'GET', undefined, undefined, true);
    },

    async recordProgress(productId: string, stepId: string, stepIndex: number): Promise<void> {
        const journeyId = getFunnelJourneyId();
        if (!journeyId) return;
        await fetch(`${API_BASE_URL}${BASE_PATH}/products/${encodeURIComponent(productId)}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Juno-Journey-Id': journeyId },
            body: JSON.stringify({ step_id: stepId, step_index: stepIndex }),
            keepalive: true,
        });
    },

    async recommend(
        productId: string,
        payload: SizeRecommendationRequest
    ): Promise<APIResponse<SizeRecommendation>> {
        return request(`${BASE_PATH}/products/${productId}/recommend`, 'POST', payload, undefined, true);
    },
};

export const SharedSizeQuiz = {
    async get(token: string): Promise<APIResponse<{ product_id: string; quantity: number; quiz: SizingQuiz }>> {
        return request(`/size-quiz/${encodeURIComponent(token)}`, 'GET', undefined, undefined, true);
    },
    async complete(token: string, answers: Record<string, string>): Promise<APIResponse<{ id: string; order_number?: string }>> {
        return request(`/size-quiz/${encodeURIComponent(token)}/complete`, 'POST', { answers }, undefined, true);
    },
};
