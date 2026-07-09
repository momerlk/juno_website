// Barrel re-export — import from src/api/* for domain-specific APIs.
export { API_BASE_URL as api_url, createEvent } from './api/core';
export { uploadFileAndGetUrl, COMPRESSION_PRESETS } from './api/shared';
export type { CompressionOptions } from './api/shared';
