export interface Seller {
  id?: string;
  business_name: string;
  legal_name: string;
  description: string;
  short_description?: string;
  logo_url: string;
  banner_url: string;
  banner_mobile_url?: string;
  contact: SellerContact;
  location: SellerLocation;
  business_details: BusinessDetails;
  kyc_documents: KYCDocuments;
  bank_details: BankDetails;
  seller_metrics: SellerMetrics;
  shipping_settings: ShippingSettings;
  return_policy: string;
  categories: string[];
  commission_settings: CommissionSettings;
  tags?: string[];
  featured: boolean;
  verified: boolean;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  last_login?: string;
  last_login_device?: DeviceInfo;
  email: string;
  password: string;
}

export interface SellerContact {
  email: string;
  phone_number: string; // Must be Pakistan format (+92)
  alternate_phone_number?: string;
  whatsapp?: string;
  contact_person_name: string;
  support_email?: string;
  business_hours?: string;
}

export interface SellerLocation {
  address: string;
  city: string;
  state: string; // Province in Pakistan context
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  pickup_available: boolean;
  pickup_hours?: string;
  store_directions?: string;
}

export interface BusinessDetails {
  business_type: 'sole_proprietorship' | 'partnership' | 'corporation';
  founded_year?: number;
  number_of_employees?: string;
  business_category: string;
  business_subcategory?: string;
}

export interface KYCDocuments {
  cnic_front: string; // Pakistan ID card front
  cnic_back: string; // Pakistan ID card back
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  verification_notes?: string;
}

export interface BankDetails {
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  branch_code?: string;
  branch_address?: string;
  swift_code?: string;
  payment_method: string; // bank_transfer, jazzcash, easypaisa, etc.
  payment_threshold: number;
  payment_schedule: 'weekly' | 'biweekly' | 'monthly';
}

export interface SellerMetrics {
  rating: number;
  review_count: number;
  order_count: number;
  product_count: number;
  total_sales: number;
  fulfillment_rate: number;
  cancellation_rate: number;
  return_rate: number;
  average_response_time: number; // in minutes
  joined_since: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_rating: number;
  total_reviews: number;
  revenue_generated: number;
}

export interface ShippingSettings {
  self_shipping: boolean;
  platform_shipping: boolean;
  shipping_profiles?: ShippingProfile[];
  default_handling_time: number; // in days
  free_shipping_threshold?: number;
}

export interface ShippingProfile {
  profile_name: string;
  regions: string[];
  shipping_rates: ShippingRate[];
}

export interface ShippingRate {
  delivery_method: string;
  rate: number;
  estimated_days: number;
}

export interface CommissionSettings {
  commission_type: 'percentage' | 'fixed';
  commission_rate: number;
}

// Assuming DeviceInfo is a separate type not provided in the Go code
export interface DeviceInfo {
  // Add relevant fields for device information here
  // For example:
  device_type?: string;
  os?: string;
  browser?: string;
  ip_address?: string;
}