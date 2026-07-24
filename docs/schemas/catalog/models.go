package catalog

import (
	"time"
)

// --- Domain Models ---

// Product represents a complete fashion product with all related information
type Product struct {
	// Unique identifier for the product
	ID string `json:"id" bson:"id"`
	// External identifier from source (e.g., Shopify)
	RawID string `json:"raw_id,omitempty" bson:"raw_id,omitempty"`
	// URL-friendly identifier
	Handle string `json:"handle" bson:"handle"`
	// Product display name
	Title string `json:"title" bson:"title"`
	// Full product description
	Description string `json:"description" bson:"description"`
	// Raw HTML description from upstream sources (e.g., Shopify body_html)
	BodyHTML string `json:"body_html,omitempty" bson:"body_html,omitempty"`
	// Short summary of the product
	ShortDescription string `json:"short_description,omitempty" bson:"short_description,omitempty"`
	// Reference to the seller/brand ID
	SellerID string `json:"seller_id" bson:"seller_id"`
	// Name of the seller/brand
	SellerName string `json:"seller_name" bson:"seller_name"`
	// URL to the seller's logo
	SellerLogo string `json:"seller_logo,omitempty" bson:"seller_logo,omitempty"`
	// City where this brand ships from — used at checkout to classify within-city vs outside-city shipments
	SellerCity string `json:"seller_city,omitempty" bson:"seller_city,omitempty"`
	// List of categories the product belongs to
	Categories []Category `json:"categories" bson:"categories"`
	// Type of product (e.g., Eastern, Western)
	ProductType string `json:"product_type" bson:"product_type"`
	// Target gender (Male, Female, Unisex) — set during enrichment
	Gender string `json:"gender,omitempty" bson:"gender,omitempty"`
	// Seller-supplied enrichment metadata (sizing guide, etc.)
	Enrichment *ProductEnrichment `json:"enrichment,omitempty" bson:"enrichment,omitempty"`
	// Legacy top-level sizing guide (v1 compatibility) — prefer enrichment.sizing_guide
	SizingGuide *SizingGuide `json:"sizing_guide,omitempty" bson:"sizing_guide,omitempty"`
	// Pricing information
	Pricing Pricing `json:"pricing" bson:"pricing"`
	// List of product image URLs
	Images []string `json:"images" bson:"images"`
	// Available product variants (sizes, colors, etc.)
	Variants []Variant `json:"variants" bson:"variants"`
	// Configurable options for the product
	Options []Option `json:"options" bson:"options"`
	// Keywords for search and discovery
	Tags []string `json:"tags" bson:"tags"`
	// Current inventory status
	Inventory Inventory `json:"inventory" bson:"inventory"`
	// Shipping and handling details
	ShippingDetails Shipping `json:"shipping_details" bson:"shipping_details"`
	// Lifecycle status (active, draft, archived)
	Status string `json:"status" bson:"status"`
	// Timestamp when the product was created
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	// Timestamp when the product was last updated
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
	// Timestamp when the product was published
	PublishedAt *time.Time `json:"published_at,omitempty" bson:"published_at,omitempty"`
	// Average user rating
	Rating float64 `json:"rating" bson:"rating"`
	// Total number of reviews
	ReviewCount int `json:"review_count" bson:"review_count"`
	// Flag indicating if the product is trending
	IsTrending bool `json:"is_trending" bson:"is_trending"`
	// Flag indicating if the product is featured
	IsFeatured bool `json:"is_featured" bson:"is_featured"`
	// Admin-managed product badges.
	Badges *ProductBadges `json:"badges,omitempty" bson:"badges,omitempty"`

	// --- v1 compatibility fields ---
	// Collection IDs this product belongs to
	Collections []string `json:"collections,omitempty" bson:"collections,omitempty"`
	// URL to product video
	VideoURL string `json:"video_url,omitempty" bson:"video_url,omitempty"`
	// Whether the product can be customized
	IsCustomizable bool `json:"is_customizable,omitempty" bson:"is_customizable,omitempty"`
	// Whether the product is ready to wear off-the-rack
	IsReadyToWear bool `json:"is_ready_to_wear,omitempty" bson:"is_ready_to_wear,omitempty"`
	// Whether the product is eligible for returns
	ReturnEligibility bool `json:"return_eligibility,omitempty" bson:"return_eligibility,omitempty"`
	// Number of times this product has been viewed
	ViewCount int `json:"view_count,omitempty" bson:"view_count,omitempty"`
	// Number of times this product has been purchased
	PurchaseCount int `json:"purchase_count,omitempty" bson:"purchase_count,omitempty"`
	// Structured V2 metadata. Present when products are read from products_v2.
	Metadata *ProductMetadata `json:"metadata,omitempty" bson:"metadata,omitempty"`
}

// ProductBadges stores optional admin-managed badges. Additional optional badge
// fields can be added here over time without changing the public product shape.
type ProductBadges struct {
	MarketingCampaign bool `json:"marketing_campaign,omitempty" bson:"marketing_campaign,omitempty"`
	BestSeller        bool `json:"best_seller,omitempty" bson:"best_seller,omitempty"`
	Thrifted          bool `json:"thrifted,omitempty" bson:"thrifted,omitempty"`
}

const (
	ProductStatusQueue    = "queue"
	ProductStatusActive   = "active"
	ProductStatusRejected = "rejected"
	ProductStatusDraft    = "draft"
	ProductStatusArchived = "archived"
)

// ProductEnrichment contains seller-supplied metadata for product enrichment.
// Mirrors the seller module's Enrichment struct but lives inside catalog.Product
// so that enrichment data survives promotion from the queue into the catalog.
type ProductEnrichment struct {
	// Targeted product type (e.g., Eastern, Western)
	ProductType string `json:"product_type,omitempty" bson:"product_type,omitempty"`
	// Target gender (Male, Female, Unisex)
	Gender string `json:"gender,omitempty" bson:"gender,omitempty"`
	// Category-specific sizing information
	SizingGuide map[string]interface{} `json:"sizing_guide,omitempty" bson:"sizing_guide,omitempty"`
}

// SizingGuide represents the legacy top-level sizing guide (v1 compatibility).
// Prefer using ProductEnrichment.SizingGuide for new implementations.
type SizingGuide struct {
	// Size chart mapping size names to measurements
	SizeChart map[string]map[string]float64 `json:"size_chart,omitempty" bson:"size_chart,omitempty"`
	// Public URL returned by the media upload endpoint for an image-based chart.
	ImageURL string `json:"image_url,omitempty" bson:"image_url,omitempty"`
	// A seller/admin supplied HTML table. Only table markup is accepted.
	HTMLTable string `json:"html_table,omitempty" bson:"html_table,omitempty"`
	// Human-readable size & fit description
	SizeFit string `json:"size_fit,omitempty" bson:"size_fit,omitempty"`
	// Measurement unit (e.g., "inches", "cm")
	MeasurementUnit string `json:"measurement_unit,omitempty" bson:"measurement_unit,omitempty"`
}

// Category represents a product category
type Category struct {
	// Unique identifier for the category
	ID string `json:"id" bson:"id"`
	// Category display name
	Name string `json:"name" bson:"name"`
	// URL-friendly identifier
	Slug string `json:"slug" bson:"slug"`
}

// Collection represents a curated group of products for performance marketing
type Collection struct {
	ID          string   `json:"id" bson:"id"`
	Title       string   `json:"title" bson:"title"`
	Slug        string   `json:"slug" bson:"slug"` // URL-safe, unique
	Description string   `json:"description" bson:"description"`
	ImageURL    string   `json:"image_url" bson:"image_url"`     // hero/banner image
	ProductIDs  []string `json:"product_ids" bson:"product_ids"` // ordered list
	Tags        []string `json:"tags" bson:"tags"`
	Source      string   `json:"source" bson:"source"` // "manual" | "campaign" | "shopify"
	CampaignID  string   `json:"campaign_id,omitempty" bson:"campaign_id,omitempty"`
	IsActive    bool     `json:"is_active" bson:"is_active"`
	Priority    int      `json:"priority" bson:"priority"` // display ordering

	// Shopify sync fields
	ShopifyID          string     `json:"shopify_id,omitempty" bson:"shopify_id,omitempty"`               // Shopify collection GID
	ShopifySellerID    string     `json:"shopify_seller_id,omitempty" bson:"shopify_seller_id,omitempty"` // which seller's Shopify store
	ShopifySyncEnabled bool       `json:"shopify_sync_enabled" bson:"shopify_sync_enabled"`
	LastSyncedAt       *time.Time `json:"last_synced_at,omitempty" bson:"last_synced_at,omitempty"`

	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type CollectionUpsertResult string

const (
	CollectionUpsertCreated CollectionUpsertResult = "created"
	CollectionUpsertUpdated CollectionUpsertResult = "updated"
)

// Drop represents a time-bounded, event-driven product release
type Drop struct {
	ID               string      `json:"id" bson:"id"`
	Title            string      `json:"title" bson:"title"`
	Slug             string      `json:"slug" bson:"slug"` // URL-safe, unique
	Description      string      `json:"description" bson:"description"`
	ShortDescription string      `json:"short_description,omitempty" bson:"short_description,omitempty"` // for cards/previews
	ImageURL         string      `json:"image_url" bson:"image_url"`                                     // hero image
	BannerURL        string      `json:"banner_url,omitempty" bson:"banner_url,omitempty"`
	Tags             []string    `json:"tags" bson:"tags"`
	SellerID         string      `json:"seller_id" bson:"seller_id"`     // drops are per-brand
	SellerName       string      `json:"seller_name" bson:"seller_name"` // denormalized
	ProductIDs       []string    `json:"product_ids" bson:"product_ids"`
	MaxQuantity      *int        `json:"max_quantity_per_product,omitempty" bson:"max_quantity_per_product,omitempty"` // optional per-product cap
	Status           DropStatus  `json:"status" bson:"status"`
	AnnounceAt       *time.Time  `json:"announce_at,omitempty" bson:"announce_at,omitempty"` // when the drop becomes visible (teaser)
	LaunchAt         time.Time   `json:"launch_at" bson:"launch_at"`                         // when products become purchasable
	EndAt            *time.Time  `json:"end_at,omitempty" bson:"end_at,omitempty"`           // optional end time (nil = until sold out)
	ReminderCount    int         `json:"reminder_count" bson:"reminder_count"`               // how many users set reminders
	ViewCount        int         `json:"view_count" bson:"view_count"`
	CampaignID       string      `json:"campaign_id,omitempty" bson:"campaign_id,omitempty"`
	Metrics          DropMetrics `json:"metrics" bson:"metrics"`
	CreatedBy        string      `json:"created_by" bson:"created_by"`
	CreatedAt        time.Time   `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at" bson:"updated_at"`
}

type DropStatus string

const (
	DropStatusDraft     DropStatus = "draft"     // being prepared, not visible
	DropStatusAnnounced DropStatus = "announced" // visible as teaser, not purchasable
	DropStatusLive      DropStatus = "live"      // products are purchasable
	DropStatusSoldOut   DropStatus = "sold_out"  // all inventory depleted
	DropStatusEnded     DropStatus = "ended"     // past end_at or manually closed
	DropStatusArchived  DropStatus = "archived"  // soft-deleted
)

type DropMetrics struct {
	TotalRevenue    float64 `json:"total_revenue" bson:"total_revenue"`
	OrderCount      int     `json:"order_count" bson:"order_count"`
	UnitsSold       int     `json:"units_sold" bson:"units_sold"`
	UniqueVisitors  int     `json:"unique_visitors" bson:"unique_visitors"`
	ConversionRate  float64 `json:"conversion_rate" bson:"conversion_rate"`
	AvgOrderValue   float64 `json:"avg_order_value" bson:"avg_order_value"`
	SellThroughRate float64 `json:"sell_through_rate" bson:"sell_through_rate"`
	TimeToSellOut   *int    `json:"time_to_sell_out,omitempty" bson:"time_to_sell_out,omitempty"` // seconds from launch to sold_out
}

// DropReminder tracks user interest in an upcoming drop
type DropReminder struct {
	ID        string    `json:"id" bson:"id"`
	DropID    string    `json:"drop_id" bson:"drop_id"`
	UserID    string    `json:"user_id" bson:"user_id"`             // authenticated app user
	GuestID   string    `json:"guest_id,omitempty" bson:"guest_id"` // or guest with push token
	Email     string    `json:"email,omitempty" bson:"email"`       // for guest email reminders
	Channel   string    `json:"channel" bson:"channel"`             // "push" | "email" | "sms"
	ExpoToken string    `json:"expo_token,omitempty" bson:"expo_token,omitempty"`
	Notified  bool      `json:"notified" bson:"notified"` // whether reminder was sent
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
}

type StorefrontBrand struct {
	ID               string `json:"id" bson:"id"`
	Name             string `json:"name" bson:"name"`
	BusinessName     string `json:"business_name,omitempty" bson:"business_name,omitempty"`
	Description      string `json:"description,omitempty" bson:"description,omitempty"`
	ShortDescription string `json:"short_description,omitempty" bson:"short_description,omitempty"`
	LogoURL          string `json:"logo_url,omitempty" bson:"logo_url,omitempty"`
	BannerURL        string `json:"banner_url,omitempty" bson:"banner_url,omitempty"`
	Website          string `json:"website,omitempty" bson:"website,omitempty"`
	Status           string `json:"status,omitempty" bson:"status,omitempty"`
}

type BrandStorefrontResponse struct {
	Brand            StorefrontBrand `json:"brand"`
	FeaturedProducts []Product       `json:"featured_products"`
	Collections      []Collection    `json:"collections"`
	Drops            []Drop          `json:"drops"`
	ProductCount     int             `json:"product_count"`
	AverageRating    float64         `json:"average_rating"`
}

// Pricing contains product pricing information
type Pricing struct {
	// Current selling price
	Price float64 `json:"price" bson:"price"`
	// Original price before discount
	CompareAtPrice float64 `json:"compare_at_price,omitempty" bson:"compare_at_price,omitempty"`
	// Currency code (e.g., PKR)
	Currency string `json:"currency" bson:"currency"`
	// Flag indicating if the product is on sale
	Discounted bool `json:"discounted" bson:"discounted"`
	// Type of discount (e.g., "fixed", "percentage")
	DiscountType string `json:"discount_type,omitempty" bson:"discount_type,omitempty"`
	// Percentage of discount
	DiscountValue float64 `json:"discount_value,omitempty" bson:"discount_value,omitempty"`
	// Price after applying discount
	DiscountedPrice float64 `json:"discounted_price,omitempty" bson:"discounted_price,omitempty"`
	// Raw price from Shopify or seller portal — base used for commission calculation
	BrandPrice float64 `json:"brand_price,omitempty" bson:"brand_price,omitempty"`
	// Set by seller: true = brand already embedded the Rs.99 shipping buffer into their listed price
	ShippingIncluded bool `json:"shipping_included" bson:"shipping_included"`
	// Juno's commission rate applied to the effective brand price (constant: 0.175)
	CommissionRate float64 `json:"commission_rate,omitempty" bson:"commission_rate,omitempty"`
	// Amount transferred to the brand after deducting commission from effective brand price
	SellerPayout float64 `json:"seller_payout,omitempty" bson:"seller_payout,omitempty"`
	// Seller's own purchase/production cost — entered manually, used only for profit calculation
	CostPrice float64 `json:"cost_price,omitempty" bson:"cost_price,omitempty"`
}

// Variant represents a specific version of a product (e.g., Size: M, Color: Red)
type Variant struct {
	// Unique identifier for the variant
	ID string `json:"id" bson:"id"`
	// Stock Keeping Unit
	SKU string `json:"sku" bson:"sku"`
	// Variant title
	Title string `json:"title" bson:"title"`
	// Map of option names to values (e.g., {"Size": "M"})
	Options map[string]string `json:"options" bson:"options"`
	// Specific price for this variant
	Price float64 `json:"price" bson:"price"`
	// Raw brand price for this variant before the display markup is applied
	BrandPrice float64 `json:"brand_price,omitempty" bson:"brand_price,omitempty"`
	// Availability flag
	Available bool `json:"available" bson:"available"`
	// Image shown when this variant is selected (typically a colour-specific product image).
	ImageURL string `json:"image_url,omitempty" bson:"image_url,omitempty"`
	// CSS hex swatch for this variant's Color/Colour option, generated during metadata processing.
	ColorHex string `json:"color_hex,omitempty" bson:"color_hex,omitempty"`

	// --- v1 compatibility fields ---
	// Variant inventory details
	Inventory *VariantInventory `json:"inventory,omitempty" bson:"inventory,omitempty"`
	// Display order position
	Position int `json:"position,omitempty" bson:"position,omitempty"`
	// Whether this is the default variant
	IsDefault bool `json:"is_default,omitempty" bson:"is_default,omitempty"`
}

// VariantInventory represents inventory details for a specific variant (v1 compatibility)
type VariantInventory struct {
	Quantity            int    `json:"quantity,omitempty" bson:"quantity,omitempty"`
	AllowOutOfStock     bool   `json:"allow_out_of_stock,omitempty" bson:"allow_out_of_stock,omitempty"`
	LowStockThreshold   int    `json:"low_stock_threshold,omitempty" bson:"low_stock_threshold,omitempty"`
	TrackInventory      bool   `json:"track_inventory,omitempty" bson:"track_inventory,omitempty"`
	InStock             bool   `json:"in_stock,omitempty" bson:"in_stock,omitempty"`
	InventoryPolicy     string `json:"inventory_policy,omitempty" bson:"inventory_policy,omitempty"`
	InventoryManagement string `json:"inventory_management,omitempty" bson:"inventory_management,omitempty"`
	SKU                 string `json:"sku,omitempty" bson:"sku,omitempty"`
	ReservedQuantity    int    `json:"reserved_quantity,omitempty" bson:"reserved_quantity,omitempty"`
	CommittedQuantity   int    `json:"committed_quantity,omitempty" bson:"committed_quantity,omitempty"`
	AvailableQuantity   int    `json:"available_quantity,omitempty" bson:"available_quantity,omitempty"`
}

// Option represents a product attribute that can have multiple values
type Option struct {
	// Name of the option (e.g., Size, Color)
	Name string `json:"name" bson:"name"`
	// List of available values for this option
	Values []string `json:"values" bson:"values"`
	// Whether this option is required
	Required bool `json:"required,omitempty" bson:"required,omitempty"`
}

// Inventory represents stock information
type Inventory struct {
	// Flag indicating if the product is in stock
	InStock bool `json:"in_stock" bson:"in_stock"`
	// Number of units available
	AvailableQuantity int `json:"available_quantity" bson:"available_quantity"`

	// --- v1 compatibility fields ---
	Quantity            int    `json:"quantity,omitempty" bson:"quantity,omitempty"`
	AllowOutOfStock     bool   `json:"allow_out_of_stock,omitempty" bson:"allow_out_of_stock,omitempty"`
	LowStockThreshold   int    `json:"low_stock_threshold,omitempty" bson:"low_stock_threshold,omitempty"`
	TrackInventory      bool   `json:"track_inventory,omitempty" bson:"track_inventory,omitempty"`
	InventoryPolicy     string `json:"inventory_policy,omitempty" bson:"inventory_policy,omitempty"`
	InventoryManagement string `json:"inventory_management,omitempty" bson:"inventory_management,omitempty"`
	ReservedQuantity    int    `json:"reserved_quantity,omitempty" bson:"reserved_quantity,omitempty"`
	CommittedQuantity   int    `json:"committed_quantity,omitempty" bson:"committed_quantity,omitempty"`
}

// Shipping represents shipping constraints
type Shipping struct {
	// Flag indicating if shipping is free
	FreeShipping bool `json:"free_shipping" bson:"free_shipping"`

	// --- v1 compatibility fields ---
	Weight           float64  `json:"weight,omitempty" bson:"weight,omitempty"`
	WeightUnit       string   `json:"weight_unit,omitempty" bson:"weight_unit,omitempty"`
	ShippingClass    string   `json:"shipping_class,omitempty" bson:"shipping_class,omitempty"`
	ShippingZones    []string `json:"shipping_zones,omitempty" bson:"shipping_zones,omitempty"`
	HandlingTime     int      `json:"handling_time,omitempty" bson:"handling_time,omitempty"`
	RequiresShipping bool     `json:"requires_shipping,omitempty" bson:"requires_shipping,omitempty"`
	ShippingMethods  []string `json:"shipping_methods,omitempty" bson:"shipping_methods,omitempty"`
}

// --- DTOs ---

// ProductFilter defines the criteria for querying products
type ProductFilter struct {
	CategoryID   string   `json:"category_id"`
	SellerID     string   `json:"seller_id"`
	SellerIDs    []string `json:"seller_ids"`
	SellerNames  []string `json:"seller_names"`
	MinPrice     string   `json:"min_price"`
	MaxPrice     string   `json:"max_price"`
	Sort         string   `json:"sort"`
	Order        string   `json:"order"`
	Page         string   `json:"page"`
	Limit        string   `json:"limit"`
	Cursor       string   `json:"cursor"`
	Status       string   `json:"status"`
	Keyword      string   `json:"keyword"`
	InStock      *bool    `json:"in_stock,omitempty"`
	Sizes        []string `json:"sizes"`
	Colors       []string `json:"colors"`
	Materials    []string `json:"materials"`
	ProductTypes []string `json:"product_types"`
	Occasions    []string `json:"occasions"`
	Tags         []string `json:"tags"`

	Departments      []string `json:"departments"`
	ProductGroups    []string `json:"product_groups"`
	Genders          []string `json:"genders"`
	ProductSubTypes  []string `json:"product_sub_types"`
	AgeSegments      []string `json:"age_segments"`
	StyleCategories  []string `json:"style_categories"`
	Aesthetics       []string `json:"aesthetics"`
	ColorFamilies    []string `json:"color_families"`
	Fits             []string `json:"fits"`
	Seasonality      []string `json:"seasonality"`
	SleeveLengths    []string `json:"sleeve_lengths"`
	Necklines        []string `json:"necklines"`
	Patterns         []string `json:"patterns"`
	WorkDetails      []string `json:"work_details"`
	PakistaniWear    []string `json:"pakistani_wear"`
	PakistaniPieces  []string `json:"pakistani_pieces"`
	BrandPriceTiers  []string `json:"brand_price_tiers"`
	CollectionIDs    []string `json:"collection_ids"`
	ValidationStatus []string `json:"validation_status"`

	// Admin-only toggle to include products from non-active sellers.
	IncludeInactiveSellers bool `json:"include_inactive_sellers,omitempty"`
}

// ProductPage is the internal result used by product listing and search endpoints.
// Products remain the response data array; Pagination is emitted as response metadata.
type ProductPage struct {
	Products   []Product         `json:"products"`
	Pagination ProductPagination `json:"pagination"`
}

// ProductPagination describes forward-only cursor pagination.
// Page is populated for legacy page-number requests and omitted for cursor requests.
type ProductPagination struct {
	Limit      int    `json:"limit"`
	Returned   int    `json:"returned"`
	Total      int    `json:"total"`
	Page       int    `json:"page,omitempty"`
	HasMore    bool   `json:"has_more"`
	NextCursor string `json:"next_cursor,omitempty"`
}

// ProductFiltersResponse contains all available filter options for the frontend
type ProductFiltersResponse struct {
	Sizes        []string     `json:"sizes"`
	PriceRanges  []PriceRange `json:"price_ranges"`
	Categories   []Category   `json:"categories"`
	Colors       []string     `json:"colors"`
	Brands       []Brand      `json:"brands"`
	Materials    []string     `json:"materials"`
	Occasions    []string     `json:"occasions"`
	ProductTypes []string     `json:"product_types"`

	Departments      []string `json:"departments,omitempty"`
	ProductGroups    []string `json:"product_groups,omitempty"`
	Genders          []string `json:"genders,omitempty"`
	ProductSubTypes  []string `json:"product_sub_types,omitempty"`
	AgeSegments      []string `json:"age_segments,omitempty"`
	StyleCategories  []string `json:"style_categories,omitempty"`
	Aesthetics       []string `json:"aesthetics,omitempty"`
	ColorFamilies    []string `json:"color_families,omitempty"`
	Fits             []string `json:"fits,omitempty"`
	Seasonality      []string `json:"seasonality,omitempty"`
	SleeveLengths    []string `json:"sleeve_lengths,omitempty"`
	Necklines        []string `json:"necklines,omitempty"`
	Patterns         []string `json:"patterns,omitempty"`
	WorkDetails      []string `json:"work_details,omitempty"`
	PakistaniWear    []string `json:"pakistani_wear,omitempty"`
	PakistaniPieces  []string `json:"pakistani_pieces,omitempty"`
	BrandPriceTiers  []string `json:"brand_price_tiers,omitempty"`
	ValidationStatus []string `json:"validation_status,omitempty"`
}

type FacetValueCount struct {
	Value string `json:"value" bson:"value"`
	Count int    `json:"count" bson:"count"`
}

type CategoryFacet struct {
	ID    string `json:"id" bson:"id"`
	Name  string `json:"name" bson:"name"`
	Slug  string `json:"slug,omitempty" bson:"slug,omitempty"`
	Count int    `json:"count" bson:"count"`
}

type BrandFacet struct {
	ID    string `json:"id" bson:"id"`
	Name  string `json:"name" bson:"name"`
	Count int    `json:"count" bson:"count"`
}

type CatalogFacetsResponse struct {
	PriceRange       *PriceRange       `json:"price_range,omitempty"`
	Categories       []CategoryFacet   `json:"categories,omitempty"`
	Brands           []BrandFacet      `json:"brands,omitempty"`
	Sizes            []FacetValueCount `json:"sizes,omitempty"`
	Colors           []FacetValueCount `json:"colors,omitempty"`
	Materials        []FacetValueCount `json:"materials,omitempty"`
	Occasions        []FacetValueCount `json:"occasions,omitempty"`
	ProductTypes     []FacetValueCount `json:"product_types,omitempty"`
	Departments      []FacetValueCount `json:"departments,omitempty"`
	ProductGroups    []FacetValueCount `json:"product_groups,omitempty"`
	Genders          []FacetValueCount `json:"genders,omitempty"`
	ProductSubTypes  []FacetValueCount `json:"product_sub_types,omitempty"`
	AgeSegments      []FacetValueCount `json:"age_segments,omitempty"`
	StyleCategories  []FacetValueCount `json:"style_categories,omitempty"`
	Aesthetics       []FacetValueCount `json:"aesthetics,omitempty"`
	ColorFamilies    []FacetValueCount `json:"color_families,omitempty"`
	Fits             []FacetValueCount `json:"fits,omitempty"`
	Seasonality      []FacetValueCount `json:"seasonality,omitempty"`
	SleeveLengths    []FacetValueCount `json:"sleeve_lengths,omitempty"`
	Necklines        []FacetValueCount `json:"necklines,omitempty"`
	Patterns         []FacetValueCount `json:"patterns,omitempty"`
	WorkDetails      []FacetValueCount `json:"work_details,omitempty"`
	PakistaniWear    []FacetValueCount `json:"pakistani_wear,omitempty"`
	PakistaniPieces  []FacetValueCount `json:"pakistani_pieces,omitempty"`
	BrandPriceTiers  []FacetValueCount `json:"brand_price_tiers,omitempty"`
	ValidationStatus []FacetValueCount `json:"validation_status,omitempty"`
}

type CatalogHierarchyTypeNode struct {
	ProductType  string `json:"product_type"`
	ProductCount int    `json:"product_count"`
}

type CatalogHierarchyGroupNode struct {
	ProductGroup string                     `json:"product_group"`
	ProductCount int                        `json:"product_count"`
	Types        []CatalogHierarchyTypeNode `json:"types"`
}

type CatalogHierarchyDepartmentNode struct {
	Department   string                      `json:"department"`
	ProductCount int                         `json:"product_count"`
	Groups       []CatalogHierarchyGroupNode `json:"groups"`
}

type CatalogHierarchyResponse struct {
	Departments []CatalogHierarchyDepartmentNode `json:"departments"`
}

// PriceRange represents a min/max price boundary
type PriceRange struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
}

// Brand represents a seller entity in the context of filtering
type Brand struct {
	ID           string `json:"id" bson:"id"`
	Name         string `json:"name" bson:"name"`
	ProductCount int    `json:"product_count,omitempty" bson:"product_count,omitempty"`
}

// SearchTerm represents a keyword and its search frequency
type SearchTerm struct {
	Term  string `json:"term"`
	Count int    `json:"count"`
}

// CreateCollectionRequest defines the schema for creating a new collection
type CreateCollectionRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Slug        string   `json:"slug"`
	ImageURL    string   `json:"image_url"`
	ProductIDs  []string `json:"product_ids"`
	Tags        []string `json:"tags"`
	IsActive    bool     `json:"is_active"`
	Priority    int      `json:"priority"`
}

// UpdateCollectionRequest defines the schema for updating an existing collection
type UpdateCollectionRequest struct {
	Title       *string   `json:"title,omitempty"`
	Description *string   `json:"description,omitempty"`
	Slug        *string   `json:"slug,omitempty"`
	ImageURL    *string   `json:"image_url,omitempty"`
	ProductIDs  *[]string `json:"product_ids,omitempty"`
	Tags        *[]string `json:"tags,omitempty"`
	IsActive    *bool     `json:"is_active,omitempty"`
	Priority    *int      `json:"priority,omitempty"`
}

// UpdateProductRequest defines the schema for admin partial product updates.
type UpdateProductRequest struct {
	Handle            *string            `json:"handle,omitempty"`
	Title             *string            `json:"title,omitempty"`
	Description       *string            `json:"description,omitempty"`
	ShortDescription  *string            `json:"short_description,omitempty"`
	SellerName        *string            `json:"seller_name,omitempty"`
	SellerLogo        *string            `json:"seller_logo,omitempty"`
	SellerCity        *string            `json:"seller_city,omitempty"`
	Categories        *[]Category        `json:"categories,omitempty"`
	ProductType       *string            `json:"product_type,omitempty"`
	Gender            *string            `json:"gender,omitempty"`
	Enrichment        *ProductEnrichment `json:"enrichment,omitempty"`
	SizingGuide       *SizingGuide       `json:"sizing_guide,omitempty"`
	Pricing           *Pricing           `json:"pricing,omitempty"`
	Images            *[]string          `json:"images,omitempty"`
	Variants          *[]Variant         `json:"variants,omitempty"`
	Options           *[]Option          `json:"options,omitempty"`
	Tags              *[]string          `json:"tags,omitempty"`
	Inventory         *Inventory         `json:"inventory,omitempty"`
	ShippingDetails   *Shipping          `json:"shipping_details,omitempty"`
	Status            *string            `json:"status,omitempty"`
	PublishedAt       *time.Time         `json:"published_at,omitempty"`
	Rating            *float64           `json:"rating,omitempty"`
	ReviewCount       *int               `json:"review_count,omitempty"`
	IsTrending        *bool              `json:"is_trending,omitempty"`
	IsFeatured        *bool              `json:"is_featured,omitempty"`
	Badges            *ProductBadges     `json:"badges,omitempty"`
	Collections       *[]string          `json:"collections,omitempty"`
	VideoURL          *string            `json:"video_url,omitempty"`
	IsCustomizable    *bool              `json:"is_customizable,omitempty"`
	IsReadyToWear     *bool              `json:"is_ready_to_wear,omitempty"`
	ReturnEligibility *bool              `json:"return_eligibility,omitempty"`
	ViewCount         *int               `json:"view_count,omitempty"`
	PurchaseCount     *int               `json:"purchase_count,omitempty"`
}

// CreateDropRequest defines the schema for creating a new drop
type CreateDropRequest struct {
	Title            string     `json:"title" binding:"required"`
	Slug             string     `json:"slug"`
	Description      string     `json:"description"`
	ShortDescription string     `json:"short_description"`
	ImageURL         string     `json:"image_url"`
	BannerURL        string     `json:"banner_url"`
	Tags             []string   `json:"tags"`
	SellerID         string     `json:"seller_id" binding:"required"`
	ProductIDs       []string   `json:"product_ids"`
	MaxQuantity      *int       `json:"max_quantity_per_product"`
	AnnounceAt       *time.Time `json:"announce_at"`
	LaunchAt         time.Time  `json:"launch_at" binding:"required"`
	EndAt            *time.Time `json:"end_at"`
}

// UpdateDropRequest defines the schema for updating an existing drop
type UpdateDropRequest struct {
	Title            *string    `json:"title,omitempty"`
	Slug             *string    `json:"slug,omitempty"`
	Description      *string    `json:"description,omitempty"`
	ShortDescription *string    `json:"short_description,omitempty"`
	ImageURL         *string    `json:"image_url,omitempty"`
	BannerURL        *string    `json:"banner_url,omitempty"`
	Tags             *[]string  `json:"tags,omitempty"`
	ProductIDs       *[]string  `json:"product_ids,omitempty"`
	MaxQuantity      *int       `json:"max_quantity_per_product,omitempty"`
	AnnounceAt       *time.Time `json:"announce_at,omitempty"`
	LaunchAt         *time.Time `json:"launch_at,omitempty"`
	EndAt            *time.Time `json:"end_at,omitempty"`
}

type ChangeDropStatusRequest struct {
	Status DropStatus `json:"status"`
}

// SetReminderRequest defines the schema for setting a drop reminder
type SetReminderRequest struct {
	Channel   string `json:"channel" binding:"required"` // push, email, sms
	Email     string `json:"email,omitempty"`
	GuestID   string `json:"guest_id,omitempty"`
	ExpoToken string `json:"expo_token,omitempty"`
}

// GenderOverviewResponse is the payload returned by GET /catalog/gender/{gender}
type GenderOverviewResponse struct {
	Gender   string    `json:"gender"` // "men" or "women"
	Products []Product `json:"products"`
	Brands   []Brand   `json:"brands"`
	Total    int       `json:"total"`
}
