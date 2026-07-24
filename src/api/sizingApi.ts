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
