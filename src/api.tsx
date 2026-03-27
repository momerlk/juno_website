// Barrel re-export — import from src/api/sellerApi, userApi, etc. for domain-specific APIs.
export { API_BASE_URL as api_url, createEvent } from './api/core';
export { uploadFileAndGetUrl, COMPRESSION_PRESETS } from './api/shared';
export type { CompressionOptions } from './api/shared';

// Legacy LoginResponse type kept for any existing consumers
export interface LoginResponse {
    token: string;
    user: any;
}
