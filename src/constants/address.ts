export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string; // The Go struct uses ",omitempty"
  city: string;
  province: string;
  postal_code: string;
  country: string;
  latitude?: number; // The Go struct uses ",omitempty"
  longitude?: number; // The Go struct uses ",omitempty"
  isDefault: boolean;
  address_type: string; // home, office, other
  instructions?: string; // The Go struct uses ",omitempty"
  createdAt: string; // Use string for Date objects, then parse them if needed
  updatedAt: string; // Use string for Date objects, then parse them if needed
}