/**
 * Juno API v2 - Main Export Barrel
 * 
 * Re-exports all API modules for convenient importing.
 * 
 * @example
 * // Import specific modules
 * import { Funnel } from './api';
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
    uploadFile,
    uploadFileAndGetUrl,
    COMPRESSION_PRESETS,
    type CompressionOptions,
    type UploadedFile,
} from "./shared";

// Type exports
export type {
    // Shared types
    PaginationParams,
    TimeRangeParams,
    ComparisonParams,
    GraphDataPoint,
    QueryComparison,
    
    // Catalog types
    CatalogProduct,
    ProductPricing,
    ProductVariant,
    ProductOption,
    SizingAvailability,
    SizeChartRow,
    SizeChartSection,
    NormalizedSizeChart,
    SizingQuestion,
    SizingQuiz,
    SizingQuestionnaire,
    ProductSizing,
    SizeRecommendationRequest,
    SizeRecommendation,
    ProductCategory,
    CatalogMetadata,
    FilterOptions,
    CatalogFacetBucket,
    CatalogBrandFacet,
    CatalogFacets,
    CatalogHierarchyTypeNode,
    CatalogHierarchyGroupNode,
    CatalogHierarchyDepartmentNode,
    CatalogHierarchy,
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
    CatalogSort,
    CatalogPagination,
    CatalogQueryParams,
    
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

// Customer funnel analytics
export { Funnel, type FunnelEvent } from "./analyticsApi";

// Catalog module
export { Catalog, AdminCatalog } from "./catalogApi";

// Sizing module
export { Sizing } from "./sizingApi";

// Campaigns module
export { Campaigns } from "./campaignsApi";

// Commerce module
export { Commerce, GuestCommerce } from "./commerceApi";

// Logistics module
export { Logistics } from "./logisticsApi";

// Extended seller API
export { SellerAPI } from "./sellerApi.types";
