/**
 * Shared API Types
 */

export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface TimeRangeParams {
    start_time?: string;
    end_time?: string;
    granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface ComparisonParams {
    compare?: 'previous_period';
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface GraphDataPoint {
    x_value: string;
    y_value: number;
}

export interface QueryComparison {
    previous_start: string;
    previous_end: string;
    metrics: Record<string, number>;
}

export interface PlatformOverviewResponse {
    dau: number;
    wau: number;
    mau: number;
    concurrent_users: number;
    new_signups: number;
    revenue: number;
    orders: number;
    aov: number;
    conversion_rate: number;
    cart_abandonment_rate: number;
    avg_session_duration: number;
    bounce_rate: number;
    active_sellers: number;
    active_products: number;
    trends: {
        revenue: GraphDataPoint[];
        users: GraphDataPoint[];
        orders: GraphDataPoint[];
        sessions: GraphDataPoint[];
    };
    comparison?: QueryComparison;
}

export interface UserAnalyticsResponse {
    acquisition: {
        new_users: number;
        new_users_time_series: GraphDataPoint[];
        signup_sources: Record<string, number>;
        invites_sent: number;
        invites_accepted: number;
        viral_coefficient: number;
    };
    engagement: {
        avg_sessions_per_user: number;
        avg_session_duration: number;
        top_screens: { screen_name: string; views: number; avg_time_seconds: number }[];
        screen_flows: { path: string; count: number }[];
        feature_usage: Record<string, number>;
        time_of_day_heatmap: number[][];
        search_metrics: {
            top_queries: { query: string; count: number }[];
            no_result_queries: { query: string; count: number }[];
            search_to_purchase_rate: number;
        };
    };
    retention: {
        cohort_table: { cohort_date: string; size: number; retention: number[] }[];
        churn_rate: number;
        stickiness: number;
        resurrection_rate: number;
    };
    segments: { name: string; count: number; pct: number }[];
    comparison?: QueryComparison;
}

export interface CommerceAnalyticsResponse {
    revenue: number;
    revenue_time_series: GraphDataPoint[];
    orders: number;
    aov: number;
    top_products: { product_id: string; product_name: string; units_sold: number; revenue: number }[];
    category_breakdown: { category: string; revenue: number; orders: number; views: number; conversion_rate: number; growth_rate: number }[];
    funnel: {
        stages: { name: string; count: number; drop_off_pct: number }[];
        overall_conversion: number;
    };
    revenue_by_category: Record<string, number>;
    orders_by_status: Record<string, number>;
    return_rate: number;
    time_to_first_purchase: number;
    arpu: number;
    comparison?: QueryComparison;
}

export interface FunnelAnalytics {
    stages: { name: string; count: number; drop_off_pct: number }[];
    overall_conversion: number;
}

export interface RealTimeResponse {
    active_users_now: number;
    events_per_minute: number;
    recent_events: ProbeEvent[];
    active_screens: Record<string, number>;
    orders_last_hour: number;
    revenue_last_hour: number;
}

export interface ProbeEvent {
    id: string;
    type: string;
    session_id: string;
    user_id?: string;
    seller_id?: string;
    product_id?: string;
    category_id?: string;
    campaign_id?: string;
    timestamp: string;
    server_time: string;
    properties?: Record<string, any>;
    device?: { platform?: string; app_version?: string };
    context?: { screen_name?: string; source?: string; user_agent?: string; ip_address?: string };
}

export interface RetentionMetrics {
    cohorts: { cohort_date: string; size: number; retention: number[] }[];
    churn_rate: number;
    stickiness: number;
    resurrection_rate: number;
}

export interface SearchAnalyticsResponse {
    top_queries: { query: string; count: number; click_through_rate?: number }[];
    no_result_queries: { query: string; count: number }[];
    search_to_purchase_rate: number;
    avg_results_per_query: number;
}

export interface CategoryMetric {
    category: string;
    revenue: number;
    orders: number;
    views: number;
    conversion_rate: number;
    growth_rate: number;
}

export interface OperationalAnalyticsResponse {
    total_bookings: number;
    status_breakdown: Record<string, number>;
    avg_fulfillment_time_hours: number;
}

export interface SellerOperationsResponse {
    total_applications: number;
    status_breakdown: Record<string, number>;
    approval_rate: number;
}

export interface FeedbackAnalyticsResponse {
    total_volume: number;
    category_breakdown: Record<string, number>;
    status_breakdown: Record<string, number>;
}

export interface LogisticsAnalyticsResponse {
    total_bookings: number;
    status_breakdown: Record<string, number>;
    partner_breakdown: Record<string, number>;
}

export interface TopProduct {
    product_id: string;
    product_name: string;
    units_sold: number;
    revenue: number;
    views: number;
    conversion_rate: number;
}

export interface ProductDeepDiveResponse {
    product_id: string;
    product_name: string;
    views: number;
    added_to_cart: number;
    purchases: number;
    revenue: number;
    conversion_rate: number;
    cart_abandon_rate: number;
    avg_time_on_page_seconds: number;
    return_rate: number;
}

// ============================================================================
// Catalog Types
// ============================================================================

export interface ProductPricing {
    price: number;
    compare_at_price?: number;
    currency: string;
    discounted: boolean;
    discount_value?: number;
    discounted_price?: number;
}

export interface ProductVariant {
    id: string;
    sku: string;
    title: string;
    options: Record<string, string>;
    price: number;
    available: boolean;
}

export interface ProductOption {
    name: string;
    values: string[];
}

export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
}

export interface CatalogProduct {
    id: string;
    raw_id: string;
    handle: string;
    title: string;
    description: string;
    short_description?: string;
    seller_id: string;
    seller_name: string;
    seller_logo?: string;
    categories: ProductCategory[];
    product_type: string;
    pricing: ProductPricing;
    images: string[];
    variants: ProductVariant[];
    options: ProductOption[];
    tags: string[];
    inventory: { in_stock: boolean; available_quantity: number };
    shipping_details?: { free_shipping?: boolean; estimated_delivery_days?: number };
    status: 'active' | 'draft' | 'archived';
    created_at: string;
    updated_at: string;
    published_at?: string;
    rating?: number;
    review_count?: number;
    is_trending?: boolean;
    is_featured?: boolean;
}

export interface GenderOverviewProduct {
    id: string;
    title: string;
    seller_name: string;
    seller_logo: string;
    pricing: {
        price: number;
        currency: string;
        discounted: boolean;
        discounted_price: number;
    };
    images: string[];
    tags: string[];
    status: string;
}

export interface GenderBrand {
    id: string;
    name: string;
}

export interface GenderOverview {
    gender: string;
    products: GenderOverviewProduct[];
    brands: GenderBrand[];
    total: number;
}

export interface FilterOptions {
    sizes: string[];
    price_ranges: { min: number; max: number }[];
    categories: ProductCategory[];
    colors: string[];
    brands: { id: string; name: string }[];
    materials: string[];
    occasions: string[];
    product_types: string[];
}

export interface ProductFilterRequest {
    category_id?: string;
    seller_id?: string;
    min_price?: string;
    max_price?: string;
    sort?: string;
    order?: string;
    page?: string;
    limit?: string;
    keyword?: string;
    sizes?: string[];
    colors?: string[];
    materials?: string[];
    product_types?: string[];
    occasions?: string[];
}

export interface Collection {
    id: string;
    title: string;
    slug: string;
    description?: string;
    image_url?: string;
    product_ids: string[];
    tags?: string[];
    is_active: boolean;
    priority?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Drop {
    id: string;
    title: string;
    slug: string;
    seller_id: string;
    status: 'draft' | 'announced' | 'live' | 'sold_out' | 'ended';
    product_ids: string[];
    launch_at?: string;
    end_at?: string;
    reminder_count?: number;
    view_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateDropRequest {
    title: string;
    slug: string;
    seller_id: string;
    product_ids: string[];
    launch_at?: string;
    end_at?: string;
    status?: 'draft' | 'announced' | 'live' | 'sold_out' | 'ended';
}

export interface UpdateDropRequest {
    title?: string;
    slug?: string;
    product_ids?: string[];
    launch_at?: string;
    end_at?: string;
    status?: 'draft' | 'announced' | 'live' | 'sold_out' | 'ended';
}

export interface BrandStorefront {
    brand: {
        id: string;
        name: string;
        business_name: string;
        description?: string;
        logo_url?: string;
        banner_url?: string;
    };
    featured_products: CatalogProduct[];
    collections: Collection[];
    drops: Drop[];
    product_count: number;
    average_rating?: number;
}

export interface TrendingSearch {
    term: string;
    count: number;
}

// ============================================================================
// Campaign Types
// ============================================================================

export interface CampaignPersona {
    gender?: string[];
    age_range?: { min: number; max: number };
    cities?: string[];
    institutes?: string[];
    favorite_categories?: string[];
    favorite_brands?: string[];
    preferred_styles?: string[];
    price_range?: { min: number; max: number };
    min_interactions?: number;
    interaction_types?: string[];
    min_session_count?: number;
    active_in_last_days?: number;
    exclude_user_ids?: string[];
}

export interface ProductStrategy {
    method: 'manual' | 'persona_match' | 'bestsellers' | 'new_arrivals' | 'category' | 'drop';
    manual_product_ids?: string[];
    category_ids?: string[];
    seller_ids?: string[];
    max_products?: number;
    auto_refresh?: boolean;
    refresh_interval?: 'daily' | 'weekly';
}

export interface LandingConfig {
    layout: 'drop_countdown' | 'collection_grid' | 'brand_storefront' | 'single_product' | 'category_browse';
    hero_image_url?: string;
    headline?: string;
    subheadline?: string;
    cta_text?: string;
    color_scheme?: string;
    show_filters?: boolean;
    show_search?: boolean;
    show_countdown?: boolean;
    urgency_copy?: string;
    custom_css?: string;
    metadata?: Record<string, any>;
}

export interface BudgetConfig {
    daily_budget?: number;
    total_budget?: number;
    total_spent?: number;
    currency_code?: string;
    ad_spend_to_date?: number;
    impression_lower?: number;
    impression_upper?: number;
    last_spent_date?: string;
}

export interface MetaInputsRequest {
    ad_spend_to_date: number;
    impressions: number;
    clicks: number;
    impression_lower: number;
    impression_upper: number;
}

export interface PublicCampaignResponse {
    campaign: Campaign;
    products: any[];
    metrics: CampaignMetrics;
}

export interface PublicCampaignProductResponse {
    campaign: Pick<Campaign, 'id' | 'slug' | 'name'>;
    product: any;
}

export interface Campaign {
    id: string;
    name: string;
    slug: string;
    description?: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    channel: 'meta' | 'google' | 'tiktok' | 'email' | 'sms';
    type: 'acquisition' | 'retention' | 'reengagement';
    target_persona?: CampaignPersona;
    product_strategy: ProductStrategy;
    landing_type: 'drop' | 'collection' | 'brand_storefront' | 'custom';
    drop_id?: string;
    collection_id?: string;
    brand_id?: string;
    landing?: LandingConfig;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
    budget?: BudgetConfig;
    start_date: string;
    end_date?: string;
    metrics?: CampaignMetrics;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface CampaignMetrics {
    impressions: number;
    clicks: number;
    unique_visitors: number;
    product_views: number;
    add_to_carts: number;
    checkouts: number;
    orders: number;
    revenue: number;
    aov: number;
    conversion_rate: number;
    cart_abandon_rate: number;
    reminder_signups: number;
    cost_per_click: number;
    roas: number;
    last_updated: string;
}

export interface CreateCampaignRequest {
    name: string;
    slug: string;
    description?: string;
    channel: 'meta' | 'google' | 'tiktok' | 'email' | 'sms';
    type: 'acquisition' | 'retention' | 'reengagement';
    product_strategy: ProductStrategy;
    landing_type: 'drop' | 'collection' | 'brand_storefront' | 'custom';
    drop_id?: string;
    collection_id?: string;
    brand_id?: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
    start_date: string;
    end_date?: string;
    budget?: BudgetConfig;
}

export interface UpdateCampaignRequest {
    name?: string;
    description?: string;
    target_persona?: CampaignPersona;
    product_strategy?: ProductStrategy;
    landing?: LandingConfig;
    utm_content?: string;
    utm_term?: string;
    budget?: BudgetConfig;
    end_date?: string;
}

export interface ChangeCampaignStatusRequest {
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
}

export interface LandingTargetResponse {
    type: 'drop' | 'collection' | 'brand_storefront' | 'custom';
    drop_id?: string;
    collection_id?: string;
    brand_id?: string;
}

// ============================================================================
// Commerce Types
// ============================================================================

export interface CartItem {
    product_id: string;
    variant_id: string;
    quantity: number;
    price: number;
}

export interface GiftDetails {
    is_gift: boolean;
    recipient_name?: string;
    gift_message?: string;
    wrap_gift?: boolean;
}

export interface Cart {
    id: string;
    user_id: string;
    items: CartItem[];
    gift_details?: GiftDetails;
    created_at: string;
    updated_at: string;
}

export interface GuestCheckoutDetails {
    full_name: string;
    phone_number: string;
    email?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    province?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}

export interface GuestCart {
    id: string;
    user_id: string;
    items: CartItem[];
    guest_checkout_details?: GuestCheckoutDetails;
    created_at: string;
    updated_at: string;
}

export interface GuestCartResponse {
    guest_cart_id: string;
    cart: GuestCart;
}

export interface ParentOrder {
    id: string;
    user_id: string;
    customer_type: 'guest' | 'user';
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    total_amount: number;
    shipping_fee: number;
    subtotal: number;
    status: string;
    rollup_status?: string;
    payment_method: string;
    address_id?: string;
    shipping_address?: GuestCheckoutDetails;
    child_order_ids: string[];
    child_summaries?: {
        order_id: string;
        seller_id: string;
        seller_name: string;
        item_count: number;
        total: number;
        status: string;
    }[];
    created_at: string;
}

export interface ShippingEstimateBreakdown {
    seller_id: string;
    seller_name: string;
    seller_city: string;
    quantity: number;
    fee: number;
}

export interface ShippingEstimateResponse {
    subtotal: number;
    shipping_total: number;
    free_shipping_applied: boolean;
    free_shipping_threshold: number;
    currency: string;
    breakdown: ShippingEstimateBreakdown[];
}

export interface CheckoutRequest {
    address_id: string;
    payment_method: string;
}

export interface GuestCheckoutRequest {
    payment_method: string;
}

export interface GuestOrderLookupRequest {
    phone_number?: string;
    email?: string;
}

export interface GeoPoint {
    lat: number;
    lng: number;
    label?: string;
    city?: string;
}

export interface TrackingMilestone {
    status: string;
    label: string;
    note?: string;
    occurred_at: string;
    set_by: string;
    location?: GeoPoint;
}

export interface TrackingAnchors {
    seller: GeoPoint;
    warehouse?: GeoPoint;
    customer: GeoPoint;
}

export interface OrderTracking {
    current_status: string;
    estimated_delivery?: string;
    timeline: TrackingMilestone[];
    anchors: TrackingAnchors;
    polyline?: string;
}

export interface Order {
    id: string;
    parent_order_id: string;
    order_number: string;
    seller_id: string;
    user_id: string;
    seller_name?: string;
    seller_city?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    order_items: {
        id: string;
        product_id: string;
        variant_id: string;
        quantity: number;
        unit_price: number;
        product_name?: string;
        product_image?: string;
        variant_label?: string;
        variant_options?: Record<string, string>;
        line_total?: number;
    }[];
    status: string;
    financials?: {
        subtotal: number;
        shipping_fee: number;
        commission_rate: number;
        commission: number;
        seller_payout: number;
        total: number;
        currency: string;
        free_shipping_applied: boolean;
    };
    shipping_address?: GuestCheckoutDetails;
    tracking?: OrderTracking;
    total: number;
    created_at: string;
}

// ============================================================================
// Logistics Types
// ============================================================================

export type DeliveryPartner = 'Bykea' | 'PostEx';

export interface DeliveryOption {
    name: DeliveryPartner;
    estimated_fare: number;
    estimated_delivery_time: string;
}

export interface FareEstimateRequest {
    seller_id: string;
    customer_latitude: number;
    customer_longitude: number;
}

export interface AddressPoint {
    latitude: number;
    longitude: number;
    address_line: string;
}

export interface DeliveryBooking {
    id: string;
    order_id: string;
    delivery_partner: DeliveryPartner;
    status: string;
    tracking_number: string;
    booking_time: string;
}

export interface BookDeliveryRequest {
    order_id: string;
    delivery_partner: DeliveryPartner;
    pickup_address?: AddressPoint;
    delivery_address: AddressPoint;
}

export interface UpdateBookingStatusRequest {
    status: string;
    location?: string;
    notes?: string;
}

export interface BookingTrackingEvent {
    timestamp: string;
    status: string;
    location?: string;
    notes?: string;
}

export interface TrackingInfo {
    id: string;
    order_id: string;
    delivery_partner: DeliveryPartner;
    status: string;
    tracking_number: string;
    current_location?: string;
    estimated_delivery?: string;
    booking_time: string;
    tracking_history: BookingTrackingEvent[];
}

export interface BookingListResponse {
    bookings: DeliveryBooking[];
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
}

// ============================================================================
// Tournament Types
// ============================================================================

export interface Tournament {
    id: string;
    name: string;
    description?: string;
    rules?: string;
    banner_image_url?: string;
    start_date: string;
    end_date: string;
    registration_fee: number;
    prize?: string;
    status: 'upcoming' | 'active' | 'completed' | 'cancelled';
    max_participants?: number;
    participant_count: number;
    registered_users: string[];
    featured_outfits: string[];
    tags: string[];
    organizer: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTournamentRequest {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    registration_fee?: number;
    prize?: string;
}

export interface RankingEntry {
    outfit_id: string;
    user_id: string;
    rank: number;
    score: number;
}

export interface Leaderboard {
    id: string;
    tournament_id: string;
    rankings: RankingEntry[];
    last_calculated: string;
}

// ============================================================================
// Shopify Types
// ============================================================================

export interface ShopifyConnectionStatus {
    connected: boolean;
    shop?: string;
    scopes?: string;
    installed_at?: string;
    // Connection type: "active" (OAuth-based) or "public" (scrape-based, no access token)
    connection_type?: 'active' | 'public';
    scrape_status?: 'running' | 'completed' | 'failed';
    scrape_count?: number;
    scrape_started_at?: string | null;
    scrape_completed_at?: string | null;
}

export interface ShopifySyncResponse {
    message: string;
    count: number;
}

export interface ShopifyCollectionSyncResponse {
    message: string;
    synced: number;
    created: number;
    updated: number;
    skipped: number;
}
