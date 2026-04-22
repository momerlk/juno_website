/**
 * Juno API v2 - Main Export Barrel
 * 
 * Re-exports all API modules for convenient importing.
 * 
 * @example
 * // Import specific modules
 * import { Analytics, Probe } from './api';
 * import { Catalog, AdminCatalog } from './api';
 * import { Commerce, GuestCommerce } from './api';
 * 
 * @example
 * // Import types
 * import type { Campaign, ProductStrategy } from './api';
 * 
 * @example
 * // Import core utilities
 * import { request, API_BASE_URL, setAuthToken } from './api';
 */

// Core exports
export {
    API_BASE_URL,
    RECSYSTEM_BASE_URL,
    request,
    setAuthToken,
    getAuthToken,
    createEvent,
    type APIResponse,
    type APIError,
} from "./core";

// Error handling exports
export {
    ErrorCode,
    STATUS_TO_ERROR_CODE,
    isAPIError,
    isValidationError,
    isAuthError,
    isNotFoundError,
    isConflictError,
    isServerError,
    getUserFriendlyMessage,
    getErrorToastConfig,
    handleAPIResponse,
    retryRequest,
    extractFieldErrors,
} from "./errorHandling";

// Shared utilities
export {
    getDeviceInfo,
    uploadFileAndGetUrl,
    COMPRESSION_PRESETS,
    type CompressionOptions,
} from "./shared";

// Type exports
export type {
    // Shared types
    PaginationParams,
    TimeRangeParams,
    ComparisonParams,
    GraphDataPoint,
    QueryComparison,
    
    // Analytics types
    PlatformOverviewResponse,
    UserAnalyticsResponse,
    CommerceAnalyticsResponse,
    FunnelAnalytics,
    RealTimeResponse,
    ProbeEvent,
    RetentionMetrics,
    SearchAnalyticsResponse,
    CategoryMetric,
    OperationalAnalyticsResponse,
    SellerOperationsResponse,
    FeedbackAnalyticsResponse,
    LogisticsAnalyticsResponse,
    TopProduct,
    ProductDeepDiveResponse,
    
    // Catalog types
    CatalogProduct,
    ProductPricing,
    ProductVariant,
    ProductOption,
    ProductCategory,
    FilterOptions,
    ProductFilterRequest,
    Collection,
    Drop,
    CreateDropRequest,
    UpdateDropRequest,
    BrandStorefront,
    TrendingSearch,
    GenderOverview,
    GenderOverviewProduct,
    GenderBrand,
    
    // Campaign types
    Campaign,
    CampaignMetrics,
    CreateCampaignRequest,
    UpdateCampaignRequest,
    ChangeCampaignStatusRequest,
    CampaignPersona,
    ProductStrategy,
    LandingConfig,
    BudgetConfig,
    LandingTargetResponse,
    
    // Commerce types
    Cart,
    CartItem,
    GiftDetails,
    GuestCart,
    GuestCartResponse,
    GuestCheckoutDetails,
    ParentOrder,
    CheckoutRequest,
    GuestCheckoutRequest,
    GuestOrderLookupRequest,
    ShippingEstimateResponse,
    ShippingEstimateBreakdown,
    GeoPoint,
    TrackingMilestone,
    TrackingAnchors,
    OrderTracking,
    Order,
    DeliveryPartner,
    DeliveryOption,
    FareEstimateRequest,
    AddressPoint,
    DeliveryBooking,
    BookDeliveryRequest,
    UpdateBookingStatusRequest,
    BookingTrackingEvent,
    TrackingInfo,
    BookingListResponse,
    
    // Tournament types
    Tournament,
    CreateTournamentRequest,
    Leaderboard,
    RankingEntry,
    
    // Shopify types
    ShopifyConnectionStatus,
    ShopifySyncResponse,
    ShopifyCollectionSyncResponse,
} from "./api.types";

// Analytics module
export { Analytics, Probe } from "./analyticsApi";

// Catalog module
export { Catalog, AdminCatalog } from "./catalogApi";

// Campaigns module
export { Campaigns } from "./campaignsApi";

// Commerce module
export { Commerce, GuestCommerce } from "./commerceApi";

// Logistics module
export { Logistics } from "./logisticsApi";

// Events module
export { Events } from "./eventsApi";

// Shopify module
export { Shopify } from "./shopifyApi";

// Extended seller API
export { SellerAPI } from "./sellerApi.types";

// Extended admin API
export { AdminAPI } from "./adminApi.types";
