package catalog

import "time"

// Juno Catalog Module V2 models
// Owns products, variants, collections, product-level metadata and recommendation signals.

// ---------- Shared enum-style types ----------

type Department string
type ProductGroup string
type ProductType string
type Gender string
type AgeSegment string
type StyleCategory string
type Aesthetic string
type Occasion string
type FitType string
type Silhouette string
type Material string
type ColorFamily string
type Seasonality string
type MetadataSource string
type CollectionType string
type PriceTier string
type ValidationStatus string

const (
	DepartmentApparel     Department = "apparel"
	DepartmentShoes       Department = "shoes"
	DepartmentBags        Department = "bags"
	DepartmentJewelry     Department = "jewelry"
	DepartmentFragrance   Department = "fragrance"
	DepartmentBeauty      Department = "beauty"
	DepartmentAccessories Department = "accessories"
)

const (
	GenderMen    Gender = "men"
	GenderWomen  Gender = "women"
	GenderUnisex Gender = "unisex"
	GenderKids   Gender = "kids"
)

const (
	SourceSellerProvided MetadataSource = "seller_provided"
	SourceAIExtracted    MetadataSource = "ai_extracted"
	SourceAdminCorrected MetadataSource = "admin_corrected"
	SourceSystemDerived  MetadataSource = "system_derived"
)

const (
	ValidationPending     ValidationStatus = "pending"
	ValidationApproved    ValidationStatus = "approved"
	ValidationNeedsReview ValidationStatus = "needs_review"
	ValidationRejected    ValidationStatus = "rejected"
)

// ---------- Product ----------

type ProductV2 struct {
	ID               string `json:"id" bson:"id"`
	RawID            string `json:"raw_id,omitempty" bson:"raw_id,omitempty"`
	Handle           string `json:"handle" bson:"handle"`
	Title            string `json:"title" bson:"title"`
	Description      string `json:"description,omitempty" bson:"description,omitempty"`
	BodyHTML         string `json:"body_html,omitempty" bson:"body_html,omitempty"`
	ShortDescription string `json:"short_description,omitempty" bson:"short_description,omitempty"`

	SellerID   string `json:"seller_id" bson:"seller_id"`
	SellerName string `json:"seller_name" bson:"seller_name"`
	SellerLogo string `json:"seller_logo,omitempty" bson:"seller_logo,omitempty"`
	SellerCity string `json:"seller_city,omitempty" bson:"seller_city,omitempty"`

	// Legacy fields retained during migration. New logic should use Metadata.
	LegacyCategories  []Category `json:"legacy_categories,omitempty" bson:"legacy_categories,omitempty"`
	LegacyProductType string     `json:"legacy_product_type,omitempty" bson:"legacy_product_type,omitempty"`
	LegacyGender      string     `json:"legacy_gender,omitempty" bson:"legacy_gender,omitempty"`
	LegacyTags        []string   `json:"legacy_tags,omitempty" bson:"legacy_tags,omitempty"`

	Metadata        ProductMetadata               `json:"metadata" bson:"metadata"`
	Recommendation  ProductRecommendationMetadata `json:"recommendation" bson:"recommendation"`
	Pricing         PricingV2                     `json:"pricing" bson:"pricing"`
	Media           ProductMedia                  `json:"media" bson:"media"`
	Variants        []VariantV2                   `json:"variants" bson:"variants"`
	Options         []Option                      `json:"options" bson:"options"`
	Inventory       Inventory                     `json:"inventory" bson:"inventory"`
	ShippingDetails Shipping                      `json:"shipping_details" bson:"shipping_details"`
	SizingGuide     *SizingGuideV2                `json:"sizing_guide,omitempty" bson:"sizing_guide,omitempty"`

	Collections       []ProductCollectionRef `json:"collections,omitempty" bson:"collections,omitempty"`
	Status            string                 `json:"status" bson:"status"`
	Rating            float64                `json:"rating" bson:"rating"`
	ReviewCount       int                    `json:"review_count" bson:"review_count"`
	IsTrending        bool                   `json:"is_trending" bson:"is_trending"`
	IsFeatured        bool                   `json:"is_featured" bson:"is_featured"`
	Badges            *ProductBadges         `json:"badges,omitempty" bson:"badges,omitempty"`
	BadgePriority     int                    `json:"-" bson:"badge_priority"`
	IsCustomizable    bool                   `json:"is_customizable,omitempty" bson:"is_customizable,omitempty"`
	IsReadyToWear     bool                   `json:"is_ready_to_wear,omitempty" bson:"is_ready_to_wear,omitempty"`
	ReturnEligibility bool                   `json:"return_eligibility,omitempty" bson:"return_eligibility,omitempty"`
	ViewCount         int                    `json:"view_count,omitempty" bson:"view_count,omitempty"`
	PurchaseCount     int                    `json:"purchase_count,omitempty" bson:"purchase_count,omitempty"`

	CreatedAt   time.Time  `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" bson:"updated_at"`
	PublishedAt *time.Time `json:"published_at,omitempty" bson:"published_at,omitempty"`
}

type ProductMetadata struct {
	Department     Department   `json:"department" bson:"department"`
	ProductGroup   ProductGroup `json:"product_group" bson:"product_group"`
	ProductType    ProductType  `json:"product_type" bson:"product_type"`
	ProductSubType string       `json:"product_sub_type,omitempty" bson:"product_sub_type,omitempty"`
	Gender         Gender       `json:"gender" bson:"gender"`
	AgeSegments    []AgeSegment `json:"age_segments,omitempty" bson:"age_segments,omitempty"`

	StyleCategories []StyleCategory `json:"style_categories" bson:"style_categories"`
	Aesthetics      []Aesthetic     `json:"aesthetics,omitempty" bson:"aesthetics,omitempty"`
	Occasions       []Occasion      `json:"occasions,omitempty" bson:"occasions,omitempty"`
	Seasonality     []Seasonality   `json:"seasonality,omitempty" bson:"seasonality,omitempty"`

	Fit          FitType    `json:"fit,omitempty" bson:"fit,omitempty"`
	Silhouette   Silhouette `json:"silhouette,omitempty" bson:"silhouette,omitempty"`
	Length       string     `json:"length,omitempty" bson:"length,omitempty"`
	Rise         string     `json:"rise,omitempty" bson:"rise,omitempty"`
	SleeveLength string     `json:"sleeve_length,omitempty" bson:"sleeve_length,omitempty"`
	Neckline     string     `json:"neckline,omitempty" bson:"neckline,omitempty"`
	ClosureType  string     `json:"closure_type,omitempty" bson:"closure_type,omitempty"`
	Waistband    string     `json:"waistband,omitempty" bson:"waistband,omitempty"`

	Materials       []Material    `json:"materials,omitempty" bson:"materials,omitempty"`
	FabricWeightGSM *int          `json:"fabric_weight_gsm,omitempty" bson:"fabric_weight_gsm,omitempty"`
	FabricFinish    []string      `json:"fabric_finish,omitempty" bson:"fabric_finish,omitempty"`
	Pattern         []string      `json:"pattern,omitempty" bson:"pattern,omitempty"`
	WorkDetails     []string      `json:"work_details,omitempty" bson:"work_details,omitempty"`
	ColorFamilies   []ColorFamily `json:"color_families,omitempty" bson:"color_families,omitempty"`
	PrimaryColor    string        `json:"primary_color,omitempty" bson:"primary_color,omitempty"`

	PakistaniWear  *PakistaniWearMetadata `json:"pakistani_wear,omitempty" bson:"pakistani_wear,omitempty"`
	SearchKeywords []string               `json:"search_keywords,omitempty" bson:"search_keywords,omitempty"`
	NormalizedTags []string               `json:"normalized_tags,omitempty" bson:"normalized_tags,omitempty"`
	ExcludedTags   []string               `json:"excluded_tags,omitempty" bson:"excluded_tags,omitempty"`

	ValidationStatus ValidationStatus `json:"validation_status" bson:"validation_status"`
	ConfidenceScore  float64          `json:"confidence_score" bson:"confidence_score"`
	Source           MetadataSource   `json:"source" bson:"source"`
	ValidatedBy      string           `json:"validated_by,omitempty" bson:"validated_by,omitempty"`
	ValidatedAt      *time.Time       `json:"validated_at,omitempty" bson:"validated_at,omitempty"`
}

type PakistaniWearMetadata struct {
	WearType          string   `json:"wear_type,omitempty" bson:"wear_type,omitempty"` // pret, luxury_pret, formal, semi_formal, bridal, lawn, casual_eastern
	PieceCount        int      `json:"piece_count,omitempty" bson:"piece_count,omitempty"`
	Includes          []string `json:"includes,omitempty" bson:"includes,omitempty"` // kurta, trouser, dupatta, inner, jacket
	DupattaIncluded   bool     `json:"dupatta_included,omitempty" bson:"dupatta_included,omitempty"`
	TrouserIncluded   bool     `json:"trouser_included,omitempty" bson:"trouser_included,omitempty"`
	StitchedState     string   `json:"stitched_state,omitempty" bson:"stitched_state,omitempty"` // stitched, unstitched, made_to_order
	FestiveLevel      string   `json:"festive_level,omitempty" bson:"festive_level,omitempty"`
	ModestyLevel      string   `json:"modesty_level,omitempty" bson:"modesty_level,omitempty"`
	RegionalInfluence []string `json:"regional_influence,omitempty" bson:"regional_influence,omitempty"`
}

type ProductRecommendationMetadata struct {
	// Scalar scores should normally be 0 to 1 unless otherwise documented.
	TrendScore              float64 `json:"trend_score" bson:"trend_score"`
	FashionabilityScore     float64 `json:"fashionability_score" bson:"fashionability_score"`
	TimelessnessScore       float64 `json:"timelessness_score" bson:"timelessness_score"`
	FormalityScore          float64 `json:"formality_score" bson:"formality_score"`
	ModestyScore            float64 `json:"modesty_score" bson:"modesty_score"`
	LoudnessScore           float64 `json:"loudness_score" bson:"loudness_score"`
	MinimalismScore         float64 `json:"minimalism_score" bson:"minimalism_score"`
	LuxuryPerceptionScore   float64 `json:"luxury_perception_score" bson:"luxury_perception_score"`
	YouthAppealScore        float64 `json:"youth_appeal_score" bson:"youth_appeal_score"`
	MaturityScore           float64 `json:"maturity_score" bson:"maturity_score"`
	InstagramAppealScore    float64 `json:"instagram_appeal_score" bson:"instagram_appeal_score"`
	OfficeAppropriateScore  float64 `json:"office_appropriate_score" bson:"office_appropriate_score"`
	WeddingAppropriateScore float64 `json:"wedding_appropriate_score" bson:"wedding_appropriate_score"`
	ComfortScore            float64 `json:"comfort_score" bson:"comfort_score"`
	BreathabilityScore      float64 `json:"breathability_score" bson:"breathability_score"`
	LayerabilityScore       float64 `json:"layerability_score" bson:"layerability_score"`
	VersatilityScore        float64 `json:"versatility_score" bson:"versatility_score"`
	StatementScore          float64 `json:"statement_score" bson:"statement_score"`
	UniquenessScore         float64 `json:"uniqueness_score" bson:"uniqueness_score"`
	CraftsmanshipScore      float64 `json:"craftsmanship_score" bson:"craftsmanship_score"`
	VisualComplexityScore   float64 `json:"visual_complexity_score" bson:"visual_complexity_score"`
	EmbroideryRichnessScore float64 `json:"embroidery_richness_score" bson:"embroidery_richness_score"`

	PricePercentile            float64    `json:"price_percentile" bson:"price_percentile"`
	BrandAffinityVector        []float64  `json:"brand_affinity_vector,omitempty" bson:"brand_affinity_vector,omitempty"`
	ImageEmbedding             []float64  `json:"image_embedding,omitempty" bson:"image_embedding,omitempty"`
	TextEmbedding              []float64  `json:"text_embedding,omitempty" bson:"text_embedding,omitempty"`
	CombinedEmbedding          []float64  `json:"combined_embedding,omitempty" bson:"combined_embedding,omitempty"`
	RecommendationTags         []string   `json:"recommendation_tags,omitempty" bson:"recommendation_tags,omitempty"`
	NegativeRecommendationTags []string   `json:"negative_recommendation_tags,omitempty" bson:"negative_recommendation_tags,omitempty"`
	LastComputedAt             *time.Time `json:"last_computed_at,omitempty" bson:"last_computed_at,omitempty"`
}

type PricingV2 struct {
	Price            float64 `json:"price" bson:"price"`
	CompareAtPrice   float64 `json:"compare_at_price,omitempty" bson:"compare_at_price,omitempty"`
	Currency         string  `json:"currency" bson:"currency"`
	Discounted       bool    `json:"discounted" bson:"discounted"`
	DiscountType     string  `json:"discount_type,omitempty" bson:"discount_type,omitempty"`
	DiscountValue    float64 `json:"discount_value,omitempty" bson:"discount_value,omitempty"`
	DiscountedPrice  float64 `json:"discounted_price,omitempty" bson:"discounted_price,omitempty"`
	BrandPrice       float64 `json:"brand_price,omitempty" bson:"brand_price,omitempty"`
	ShippingIncluded bool    `json:"shipping_included" bson:"shipping_included"`
	CommissionRate   float64 `json:"commission_rate,omitempty" bson:"commission_rate,omitempty"`
	SellerPayout     float64 `json:"seller_payout,omitempty" bson:"seller_payout,omitempty"`
	CostPrice        float64 `json:"cost_price,omitempty" bson:"cost_price,omitempty"`

	// Derived ranking values.
	EffectivePrice  float64   `json:"effective_price" bson:"effective_price"`
	PriceTier       PriceTier `json:"price_tier" bson:"price_tier"`
	PricePercentile float64   `json:"price_percentile" bson:"price_percentile"`
	DiscountPercent float64   `json:"discount_percent" bson:"discount_percent"`
}

type ProductMedia struct {
	Images            []string `json:"images" bson:"images"`
	VideoURL          string   `json:"video_url,omitempty" bson:"video_url,omitempty"`
	PrimaryImageIndex int      `json:"primary_image_index,omitempty" bson:"primary_image_index,omitempty"`
	ImageCount        int      `json:"image_count" bson:"image_count"`
	HasModelShot      bool     `json:"has_model_shot,omitempty" bson:"has_model_shot,omitempty"`
	HasFlatLay        bool     `json:"has_flat_lay,omitempty" bson:"has_flat_lay,omitempty"`
	HasSizeChartImage bool     `json:"has_size_chart_image,omitempty" bson:"has_size_chart_image,omitempty"`
}

type VariantV2 struct {
	ID                string            `json:"id" bson:"id"`
	SKU               string            `json:"sku,omitempty" bson:"sku,omitempty"`
	Title             string            `json:"title" bson:"title"`
	Options           map[string]string `json:"options" bson:"options"`
	NormalizedOptions map[string]string `json:"normalized_options,omitempty" bson:"normalized_options,omitempty"`
	Price             float64           `json:"price" bson:"price"`
	BrandPrice        float64           `json:"brand_price,omitempty" bson:"brand_price,omitempty"`
	Available         bool              `json:"available" bson:"available"`
	ImageURL          string            `json:"image_url,omitempty" bson:"image_url,omitempty"`
	ColorHex          string            `json:"color_hex,omitempty" bson:"color_hex,omitempty"`
	Inventory         *VariantInventory `json:"inventory,omitempty" bson:"inventory,omitempty"`
	Position          int               `json:"position,omitempty" bson:"position,omitempty"`
	IsDefault         bool              `json:"is_default,omitempty" bson:"is_default,omitempty"`
}

type SizingGuideV2 struct {
	SizeChart             map[string]map[string]float64 `json:"size_chart,omitempty" bson:"size_chart,omitempty"`
	ImageURL              string                        `json:"image_url,omitempty" bson:"image_url,omitempty"`
	HTMLTable             string                        `json:"html_table,omitempty" bson:"html_table,omitempty"`
	MeasurementUnit       string                        `json:"measurement_unit,omitempty" bson:"measurement_unit,omitempty"`
	SizeFit               string                        `json:"size_fit,omitempty" bson:"size_fit,omitempty"`
	ModelHeight           string                        `json:"model_height,omitempty" bson:"model_height,omitempty"`
	ModelWearingSize      string                        `json:"model_wearing_size,omitempty" bson:"model_wearing_size,omitempty"`
	RunsSmall             bool                          `json:"runs_small,omitempty" bson:"runs_small,omitempty"`
	RunsLarge             bool                          `json:"runs_large,omitempty" bson:"runs_large,omitempty"`
	StretchLevel          string                        `json:"stretch_level,omitempty" bson:"stretch_level,omitempty"`
	RecommendedSizingNote string                        `json:"recommended_sizing_note,omitempty" bson:"recommended_sizing_note,omitempty"`
	RequiredMeasurements  []string                      `json:"required_measurements,omitempty" bson:"required_measurements,omitempty"`
	CompletenessScore     float64                       `json:"completeness_score" bson:"completeness_score"`
}

type ProductCollectionRef struct {
	ID     string         `json:"id" bson:"id"`
	Slug   string         `json:"slug,omitempty" bson:"slug,omitempty"`
	Title  string         `json:"title,omitempty" bson:"title,omitempty"`
	Type   CollectionType `json:"type" bson:"type"`
	Source MetadataSource `json:"source" bson:"source"`
}

// ---------- Collection V2 ----------

type CollectionV2 struct {
	ID          string           `json:"id" bson:"id"`
	Title       string           `json:"title" bson:"title"`
	Slug        string           `json:"slug" bson:"slug"`
	Description string           `json:"description,omitempty" bson:"description,omitempty"`
	ImageURL    string           `json:"image_url,omitempty" bson:"image_url,omitempty"`
	Type        CollectionType   `json:"type" bson:"type"`
	SellerID    string           `json:"seller_id,omitempty" bson:"seller_id,omitempty"`
	ProductIDs  []string         `json:"product_ids" bson:"product_ids"`
	Rules       *CollectionRules `json:"rules,omitempty" bson:"rules,omitempty"`
	Tags        []string         `json:"tags,omitempty" bson:"tags,omitempty"`
	IsActive    bool             `json:"is_active" bson:"is_active"`
	Priority    int              `json:"priority" bson:"priority"`
	CreatedAt   time.Time        `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at" bson:"updated_at"`
}

type CollectionRules struct {
	Departments     []Department    `json:"departments,omitempty" bson:"departments,omitempty"`
	ProductGroups   []ProductGroup  `json:"product_groups,omitempty" bson:"product_groups,omitempty"`
	ProductTypes    []ProductType   `json:"product_types,omitempty" bson:"product_types,omitempty"`
	Genders         []Gender        `json:"genders,omitempty" bson:"genders,omitempty"`
	StyleCategories []StyleCategory `json:"style_categories,omitempty" bson:"style_categories,omitempty"`
	Aesthetics      []Aesthetic     `json:"aesthetics,omitempty" bson:"aesthetics,omitempty"`
	Occasions       []Occasion      `json:"occasions,omitempty" bson:"occasions,omitempty"`
	MinPrice        *float64        `json:"min_price,omitempty" bson:"min_price,omitempty"`
	MaxPrice        *float64        `json:"max_price,omitempty" bson:"max_price,omitempty"`
	MinTrendScore   *float64        `json:"min_trend_score,omitempty" bson:"min_trend_score,omitempty"`
	OnlyInStock     bool            `json:"only_in_stock,omitempty" bson:"only_in_stock,omitempty"`
}
