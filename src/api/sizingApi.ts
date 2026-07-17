/** Customer-safe normalized size charts and deterministic fit recommendations. */
import { request, type APIResponse } from './core';
import type { ProductSizing, SizeRecommendation, SizeRecommendationRequest, SizingQuestionnaire } from './api.types';

export namespace Sizing {
    const BASE_PATH = '/sizing';

    export async function getProductSizing(productId: string): Promise<APIResponse<ProductSizing>> {
        return request(`${BASE_PATH}/products/${productId}`, 'GET', undefined, undefined, true);
    }

    export async function getQuestionnaire(productId: string): Promise<APIResponse<SizingQuestionnaire>> {
        return request(`${BASE_PATH}/products/${productId}/quiz`, 'GET', undefined, undefined, true);
    }

    export async function recommend(
        productId: string,
        payload: SizeRecommendationRequest
    ): Promise<APIResponse<SizeRecommendation>> {
        return request(`${BASE_PATH}/products/${productId}/recommend`, 'POST', payload, undefined, true);
    }
}
