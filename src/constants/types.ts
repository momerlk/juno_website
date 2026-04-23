export interface Product {
  _id ?: any;
  id: string;

  handle: string;
  title: string;
  description: string;
  short_description?: string;
  body_html?: string;

  seller_id: string;
  seller_name: string;
  seller_logo? : string;

  categories: Category[];
  product_type: string;

  pricing: Pricing;

  images: string[];

  variants: Variant[];
  options: Option[];

  tags: string[];

  inventory: any;
  shipping_details: Shipping;

  status: string;
  created_at: any;
  updated_at: any;
  published_at?: any;

  collections: string[];
  attributes?: Attribute[];
  sizing_guide?: any;

  season?: string;
  occasion?: string[];
  style_tags?: string[];

  care_instructions?: string;
  rating: number;
  review_count: number;
  reviews?: string[];

  is_customizable: boolean;
  customization_options?: CustomizationOption[];

  is_ready_to_wear: boolean;

  seller_city?: string; // City where this brand ships from
  wash_care?: string;
  return_eligibility: boolean;

  video_url?: string;

  view_count: number;
  purchase_count: number;
  is_trending: boolean;
  is_featured: boolean;
}

export interface Inventory {
  quantity: number;
  allow_out_of_stock: boolean;
  restock_date?: string; // Use '?' for optional properties
  low_stock_threshold: number;
  track_inventory: boolean;
  in_stock: boolean;
  inventory_policy: 'deny' | 'continue'; // Use union types for specific string values
  inventory_management: 'shopify' | 'manual'; // Use union types for specific string values
  sku?: string;
  barcode?: string;
  location_id?: string;
  reserved_quantity: number;
  committed_quantity: number;
  available_quantity: number;
}

export interface Variant {
  id: string;
  sku: string;
  title: string;

  options: Record<string, string>;
  price: number;
  compare_at_price?: number;

  weight?: number;
  dimensions?: Dimensions;
  images?: string[];
  inventory: any;

  position: number;
  is_default: boolean;
  available: boolean;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}


export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

export interface Option {
  name: string;
  values: string[];
  required: boolean;
}
// New Shipping Interface based on GoLang model
export interface Shipping {
  weight: number;
  weight_unit: string; // kg, grams, lb
  dimensions?: Dimensions;
  shipping_class: string; // Standard, Express, Free
  free_shipping: boolean;
  shipping_zones: string[];
  handling_time: number; // in days
  requires_shipping: boolean;
  shipping_methods: string[];
  shipping_rates?: Record<string, number>;
}

export interface Pricing {
  price: number;
  compare_at_price?: number;
  currency: string;
  discounted: boolean;
  discount_type?: string;
  discount_value?: number;
  discounted_price?: number;
  // Additional pricing fields from catalog API
  brand_price?: number; // Raw brand/seller price before shipping buffer
  shipping_included?: boolean; // True if brand embedded Rs.99 shipping buffer
  commission_rate?: number; // Juno's commission rate (0.175 = 17.5%)
  seller_payout?: number; // Amount transferred to brand after commission
  cost_price?: number; // Seller's purchase/production cost
}

export interface Attribute {
  name: string;
  value: string;
  visible: boolean;
  variant: boolean;
}

export interface SizingGuide {
  size_chart: Record<string, Record<string, number>>;
  size_conversion?: Record<string, string>;
  size_fit: string;
  measurement_unit: string;
}

export interface CustomizationOption {
  name: string;
  options: string[];
  additional_price?: number;
  required: boolean;
}

export type QueueStatus = 'queued' | 'validation_pending' | 'enrichment_pending' | 'ready' | 'failed' | 'synced' | 'embedding_pending' | 'promoted';

export interface QueueItem {
  id: string;
  product: Product;
  status: QueueStatus;
  errors: string[];
  created_at: string;
  updated_at: string;
}
