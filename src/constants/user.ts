export const UnverifiedStatus = "unverified";
export const VerifiedStatus = "verified";
export const ActiveStatus = "active";
export const UnActiveStatus = "unactive";

export interface User {
  id?: string;
  avatar?: string;
  name: string;
  email?: string;
  phone_number: string; // Only +92 format
  password?: string; // omitted in JSON
  password_reset_token?: string;
  age?: number;
  gender?: string;
  date_of_birth?: string; // ISO string format
  location: Location;
  shipping_addresses?: Address[];
  billing_address?: Address[];
  preferences?: UserPreferences;
  profile_completion: number;
  account_status: string; // active, inactive, suspended
  role: string; // customer, admin, staff
  verification_status: string; // verified, unverified
  phone_verified: boolean;
  email_verified: boolean;
  wishlist_ids?: string[];
  recently_viewed?: RecentlyViewed[];
  last_login?: string; // ISO string format
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

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
  country?: string;
}

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

export interface UserPreferences {
  language_preference: string;
  currency_preference: string;
  favorite_categories?: string[];
  favorite_brands?: string[];
  preferred_sizes?: { [category: string]: string }; // category: size
  color_preferences?: string[];
  style_preferences?: string[];
  price_range_min?: number;
  price_range_max?: number;
}

export interface RecentlyViewed {
  product_id: string;
  viewed_at: string;
  view_count: number;
}

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

export interface MeasurementProfile {
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  inseam_length?: number;
  shoe_size?: number;
  shoe_size_system?: string; // EU, US, UK
  preferred_fit?: string; // loose, regular, slim
  updated_at?: string;
}

// Optional: Define DeviceInfo if you have it
export interface DeviceInfo {
  // Add relevant fields here
}
