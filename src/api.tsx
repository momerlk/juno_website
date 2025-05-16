const urls = {
  testing : "http://localhost:8080/api/v1"
}
const api_url = urls.testing;

export async function uploadFileAndGetUrl(
  eventFile: File, 
  url: string = api_url + '/files/upload'
): Promise<string> {
  const file = eventFile;
  
  if (!file) {
    throw new Error('No file selected');
  }
  
  console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
  
  // Create FormData and append the file
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      } catch (err) {
        if (err instanceof SyntaxError) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        throw err;
      }
    }
    
    const data = await response.json();
    
    if (data.success && data.file && data.file.url) {
      console.log('File uploaded successfully:', data.file.url);
      return data.file.url;
    } else {
      throw new Error('Invalid response format or missing URL');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export async function sellerLogin(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${api_url}/seller/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData: LoginResponse = await response.json();
    return jsonData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export interface LoginResponse {
  token: string;
  user: {
    account_status: string;
    age: number;
    avatar: string;
    billing_addresses: {
      address_line1: string;
      address_line2: string;
      address_type: string;
      city: string;
      country: string;
      id: string;
      instructions: string;
      is_default: boolean;
      latitude: number;
      longitude: number;
      name: string;
      phone_number: string;
      postal_code: string;
      province: string;
    }[];
    cart_id: string;
    created_at: string;
    date_of_birth: string;
    device_info: {
      app_version: string;
      device_id: string;
      device_name: string;
      device_type: string;
      ip_address: string;
      last_used: string;
      os_version: string;
      user_agent: string;
    }[];
    email: string;
    email_verified: boolean;
    gender: string;
    id: string;
    last_login: string;
    location: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
      province: string;
    };
    login_count: number;
    measurement_profile: {
      bust: number;
      height: number;
      hip: number;
      inseam_length: number;
      preferred_fit: string;
      shoe_size: number;
      shoe_size_system: string;
      shoulder: number;
      updated_at: string;
      waist: number;
      weight: number;
    };
    name: string;
    notification_prefs: {
      back_in_stock: boolean;
      email: boolean;
      new_arrivals: boolean;
      order_updates: boolean;
      price_drops: boolean;
      promotions: boolean;
      push_notification: boolean;
      reviews: boolean;
      sms: boolean;
    };
    password_reset_token: string;
    phone_number: string;
    phone_verified: boolean;
    preferences: {
      color_preferences: string[];
      currency_preference: string;
      favorite_brands: string[];
      favorite_categories: string[];
      language_preference: string;
      preferred_sizes: {
        [key: string]: string;
      };
      price_range_max: number;
      price_range_min: number;
      style_preferences: string[];
    };
    profile_completion: number;
    recently_viewed: {
      product_id: string;
      view_count: number;
      viewed_at: string;
    }[];
    referral_code: string;
    referred_by: string;
    registration_source: string;
    role: string;
    shipping_addresses: {
      address_line1: string;
      address_line2: string;
      address_type: string;
      city: string;
      country: string;
      id: string;
      instructions: string;
      is_default: boolean;
      latitude: number;
      longitude: number;
      name: string;
      phone_number: string;
      postal_code: string;
      province: string;
    }[];
    updated_at: string;
    verification_status: string;
    wishlist_ids: string[];
  };
}

interface LoginRequest {
  device_info: {
    app_version: string;
    device_id: string;
    device_name: string;
    device_type: string;
    ip_address: string;
    last_used: string;
    os_version: string;
    user_agent: string;
  };
  email: string;
  password: string;
}