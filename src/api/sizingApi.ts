/** Customer-safe normalized size charts and deterministic fit recommendations. */
import { request, type APIResponse } from './core';
import type { ProductSizing, SizeRecommendation, SizeRecommendationRequest, SizingQuiz } from './api.types';

const BASE_PATH = '/sizing';

export const Sizing = {
    async getProductSizing(productId: string): Promise<APIResponse<ProductSizing>> {
        return request(`${BASE_PATH}/products/${productId}`, 'GET', undefined, undefined, true);
    },

    async getQuestionnaire(productId: string): Promise<APIResponse<SizingQuiz>> {
        return request(`${BASE_PATH}/products/${productId}/quiz`, 'GET', undefined, undefined, true);
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
