// Enums for status and methods
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "booked"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded"
  | "fulfilled";

export type PaymentMethod =
  | "cash_on_delivery"
  | "credit_card"
  | "easypaisa"
  | "jazzcash"
  | "bank_transfer";

export type DeliveryMethod = "standard" | "express" | "same_day";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";



// Order Item
export interface OrderItem {
  id?: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku: string;
  size?: string;
  color?: string;
  discount: number;
  status: string;
  is_returned: boolean;
  return_reason?: string;
  created_at: string;
  updated_at: string;
}

// Tracking Event
interface TrackingEvent {
  id?: string;
  tracking_info_id: string;
  status: string;
  location?: string;
  description?: string;
  timestamp: string;
  created_at: string;
}

// Tracking Info
interface TrackingInfo {
  id?: string;
  order_id: string;
  order_item_id?: string;
  tracking_number?: string;
  courier_name: string;
  courier_website?: string;
  courier_phone?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  shipped_at?: string;
  current_status?: string;
  current_location?: string;
  latitude?: number;
  longitude?: number;
  tracking_events?: TrackingEvent[];
  created_at: string;
  updated_at: string;
}

// Address (Assumed structure, adjust as needed)
interface Address {
  id: string;
  user_id: string;
  name? : string;
  address_line1: string;
  address_line2?: string;
  phone_number? : string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Order History
export interface OrderHistory {
  id?: string;
  order_id: string;
  status_from?: OrderStatus;
  status_to: OrderStatus;
  note?: string;
  changed_by: string;
  changed_by_name?: string;
  created_at: string;
}

// Order
export interface Order {
  id?: string;
  user_id: string;
  seller_id: string;
  order_number: string;
  order_items?: OrderItem[];
  shipping_address_id: string;
  shipping_address?: Address;
  billing_address_id: string;
  billing_address?: Address;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_method: DeliveryMethod;
  delivery_partner?: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  tax: number;
  total: number;
  coupon_code?: string;
  notes?: string;
  is_gift: boolean;
  gift_message?: string;
  require_signature: boolean;
  tracking_info?: TrackingInfo[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type OrdersByStatus = {
  [status in OrderStatus]?: Order[];
};

export interface NestedOrderMap {
  [key: string]: OrdersByStatus;
}