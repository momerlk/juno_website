// Constants
export const USER_STATUS = {
  UNVERIFIED: "unverified",
  VERIFIED: "verified",
  ACTIVE: "active",
  INACTIVE: "unactive"
} as const;

// Location interface
export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
  country?: string;
}

// Address interface
export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  address_type: string; // home, office, other
  instructions?: string;
  created_at: string;
  updated_at: string;
}

// User preferences interface
export interface UserPreferences {
  language_preference: string;
  currency_preference: string;
  favorite_categories?: string[];
  favorite_brands?: string[];
  preferred_sizes?: Record<string, string>; // category:size mapping
  color_preferences?: string[];
  style_preferences?: string[];
  price_range_min?: number;
  price_range_max?: number;
}

// Recently viewed interface
export interface RecentlyViewed {
  product_id: string;
  viewed_at: string;
  view_count: number;
}

// Device info interface
export interface DeviceInfo {
  device_id: string;
  device_name: string;
  device_type: string;
  os_version: string;
  app_version: string;
  user_agent: string;
  ip_address: string;
  last_used: string;
}

// Notification preferences interface
export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push_notification: boolean;
  order_updates: boolean;
  promotions: boolean;
  new_arrivals: boolean;
  price_drops: boolean;
  back_in_stock: boolean;
  reviews: boolean;
}

// Measurement profile interface
export interface MeasurementProfile {
  height?: number; // in inches
  weight?: number; // in kg
  bust?: number; // in inches
  waist?: number; // in inches
  hip?: number; // in inches
  shoulder?: number; // in inches
  inseam_length?: number; // in inches
  shoe_size?: number;
  shoe_size_system?: string; // EU, US, UK
  preferred_fit?: string; // loose, regular, slim
  updated_at?: string;
}

// Main User interface
export interface User {
  id: string;
  avatar?: string;
  name: string;
  email?: string;
  phone_number: string; // Only +92 format
  password_reset_token?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string;
  location: Location;
  shipping_addresses?: Address[];
  billing_address?: Address[]; // Note: matches your JSON structure (singular name)
  preferences?: UserPreferences;
  profile_completion: number; // percentage
  account_status: string; // active, inactive, suspended
  role: string; // customer, admin, staff
  verification_status: string; // verified, unverified
  phone_verified: boolean;
  email_verified: boolean;
  wishlist_ids?: string[];
  recently_viewed?: RecentlyViewed[];
  last_login?: string;
  login_count: number;
  device_info?: DeviceInfo[];
  notification_prefs: NotificationPrefs;
  registration_source?: string; // app, web, facebook, google
  referral_code?: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
  measurement_profile?: MeasurementProfile;
}

// Response interface that includes password and user
export interface UserResponse {
  password: string;
  user: User;
}
