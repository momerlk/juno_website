import moment from "moment";
import { Inventory, Product, QueueItem } from "../constants/types";
import { Address } from "../constants/address";
import { NestedOrderMap, Order } from "../constants/orders";
import { Seller as TSeller} from "../constants/seller";
import { request, API_BASE_URL, APIResponse } from "./core";

export { API_BASE_URL as api_url };

export function setState(data: any) {
  if (data && data.token) {
    localStorage.setItem('token', data.token);
  }
}

export type { APIResponse };

export namespace OTP {
    export async function Send(phone_number : string) : Promise<APIResponse<any>> {
        return await request("/auth/send-otp", "POST", { phone_number }, undefined, true);
    }

    export async function Verify(phone_number : string, otp : string) : Promise<APIResponse<any>> {
        return await request("/auth/verify", "POST", { phone_number, otp }, undefined, true);
    }
}

export namespace Auth {
    const getDeviceInfo = async (): Promise<{
        app_version: string;
        device_id: string;
        device_name: string;
        device_type: string;
        last_used: string;
        os_version: string;
        user_agent: string;
    }> => {
        const app_version = "1.0.0"; // Placeholder for web app version
        // Generate or retrieve a unique ID from local storage
        let device_id = localStorage.getItem('device_id');
        if (!device_id) {
            device_id = "unknown"
            localStorage.setItem('device_id', device_id);
        }
        
        const device_name = "Web Browser";
        const device_type = "web";
        
        // Attempt to parse OS from user agent
        const ua = navigator.userAgent;
        let os_version = "unknown";
        if (/Windows NT 10.0/.test(ua)) os_version = "Windows 10/11";
        else if (/Windows NT 6.2/.test(ua)) os_version = "Windows 8";
        else if (/Mac OS X 10_15_7/.test(ua)) os_version = "macOS Catalina";
        else if (/Mac OS X/.test(ua)) os_version = "macOS";
        else if (/Android/.test(ua)) os_version = "Android";
        else if (/Linux/.test(ua)) os_version = "Linux";
        else if (/iPhone|iPad|iPod/.test(ua)) os_version = "iOS";

        const user_agent = navigator.userAgent;
        const last_used = moment().toISOString();

        return {
            app_version,
            device_id,
            device_name,
            device_type,
            last_used,
            os_version,
            user_agent,
        };
    };

    export async function Login(email : string, password : string) : Promise<APIResponse<any>> {
        const device_info = await getDeviceInfo();
        return await request("/seller/auth/login", "POST", { email, password, device_info }, undefined, true);
    }

    export async function GetProfile(token : string) : Promise<APIResponse<TSeller>> {
        return await request("/seller/profile", "GET", undefined, token);
    }
    
}


export namespace Seller {
  export async function GetProducts(token : string, page : number) :      Promise<APIResponse<Product[]>> {
    return await request(`/seller/products?page=${page}`, "GET", undefined, token);
  }

  export async function CreateProduct(token : string, product : Product) : Promise<APIResponse<any>> {
    // Deprecated in favor of Queue.Create, but kept for compatibility if needed (maybe it redirects now?)
    // Or we can alias it to Queue.Create if the backend didn't change the endpoint path but logic.
    // Based on instructions, we should use products_queue.
    return await Queue.Create(token, product);
  }

  export async function UpdateProduct(token : string, product : Product) : Promise<APIResponse<any>> {
    return await request(`/seller/products/${product.id}`, "PUT", product, token);
  }

  export async function DeleteProduct(token : string, productId : string) : Promise<APIResponse<any>>{
    return await request(`/seller/products/${productId}`, "DELETE", undefined, token);
  }

  export interface InventoryUpdate {
    product_id : string;
    variant_id : string;
    quantity_change : string;
    reason : string;
  }
  export async function UpdateInventory(token : string, updates : InventoryUpdate[]){
    return await request("/seller/inventory/bulk-update", "POST", updates, token);
  }

  export async function GetOrders(token : string) : Promise<APIResponse<Order[]>> {
    return await request(`/seller/orders`, "GET", undefined, token);
  }

  export interface StatusUpdatePayload {
    changed_by_id: string;
    changed_by_name: string;
    status: string;
  }
  export async function UpdateOrderStatus(token : string, order_id : string, payload : StatusUpdatePayload) : Promise<APIResponse<any>> {
    return await request(`/seller/orders/${order_id}/status`, "PUT", payload, token);
  }

  export async function GetAirwayBill(order_id: string): Promise<APIResponse<Blob>> {
    const response = await fetch(`${API_BASE_URL}/orders/${order_id}/airway-bill`);

    if (!response.ok) {
        // Handle error...
        return {
            status: response.status,
            ok: false,
            body: {} as any
        }
    }

    const blob = await response.blob();
    return {
      status: response.status,
      ok: true,
      body: blob,
    };
  }

  
  export async function UpdateProfile(token: string, seller: TSeller): Promise<APIResponse<any>> {
    return await request(`/seller/profile`, "PUT", seller, token);
  }

  export async function UpdateProductSizingGuide(token: string, productIds: string[], sizingGuide: any): Promise<APIResponse<any>> {
    return await request("/seller/products/bulk-sizing-guide", "POST", { product_ids: productIds, sizing_guide: sizingGuide }, token);
  }

  export async function bookDelivery(token: string, order_id: string): Promise<APIResponse<any>> {
    return await request(`/delivery/book/${order_id}`, "POST", {}, token);
  }

  export namespace Queue {
      export async function List(token: string): Promise<APIResponse<QueueItem[]>> {
          return await request("/seller/products-queue", "GET", undefined, token);
      }
      export async function Get(token: string, id: string): Promise<APIResponse<QueueItem>> {
          return await request(`/seller/products-queue/${id}`, "GET", undefined, token);
      }
      export async function Create(token: string, product: Product): Promise<APIResponse<any>> {
          // Assuming creating a new item in queue
          return await request("/seller/products-queue", "POST", { product }, token);
      }
      export async function Update(token: string, id: string, data: any): Promise<APIResponse<any>> {
          return await request(`/seller/products-queue/${id}`, "PUT", data, token);
      }
      export async function Promote(token: string, id: string): Promise<APIResponse<any>> {
          return await request(`/seller/products-queue/${id}/promote`, "POST", {}, token);
      }
      export async function Reject(token: string, id: string, reason: string): Promise<APIResponse<any>> {
          return await request(`/seller/products-queue/${id}/reject`, "POST", { reason }, token);
      }
  }
}

export namespace SellerAnalytics {
  export async function GetSalesAnalytics(token: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = "/seller/analytics/sales";
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await request(url, "GET", undefined, token);
  }

  export async function GetOrderAnalytics(token: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = "/seller/analytics/orders";
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await request(url, "GET", undefined, token);
  }

  export async function GetInventoryAnalytics(token: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = "/seller/analytics/inventory";
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await request(url, "GET", undefined, token);
  }

  export async function GetProductAnalytics(token: string, productID: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = `/seller/analytics/product/${productID}`;
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await request(url, "GET", undefined, token);
  }
}


export namespace Users {
    // --- Addresses ---
    export async function AddAddress(token: string, address: any): Promise<APIResponse<any>> {
        return await request("/users/addresses", "POST", address, token);
    }

    export async function UpdateAddress(token: string, id: string, address: any): Promise<APIResponse<any>> {
        return await request(`/users/addresses/${id}`, "PUT", address, token);
    }

    export async function DeleteAddress(token: string, id: string): Promise<APIResponse<any>> {
        return await request(`/users/addresses/${id}`, "DELETE", undefined, token);
    }

    // --- Measurements ---
    export async function UpdateMeasurements(token: string, measurements: any): Promise<APIResponse<any>> {
        return await request("/users/measurements", "PUT", measurements, token);
    }

    // --- Notification Preferences ---
    export async function UpdateNotificationPrefs(token: string, prefs: any): Promise<APIResponse<any>> {
        return await request("/users/notifications", "PUT", prefs, token);
    }

    // --- User Preferences ---
    export async function UpdatePreferences(token: string, prefs: any): Promise<APIResponse<any>> {
        return await request("/users/preferences", "PUT", prefs, token);
    }

    // --- User Profile ---
    export async function GetProfile(token: string): Promise<APIResponse<any>> {
        return await request("/users/profile", "GET", undefined, token);
    }

    export async function UpdateProfile(token: string, user: any): Promise<APIResponse<any>> {
        return await request("/users/profile", "PUT", user, token);
    }
    
    interface Interaction {
      product_id : string;
      rating : number;
      action_type : string;
    }
    export async function PostInteraction(token: string, interaction: Interaction): Promise<APIResponse<any>> {
        return await request("/interactions", "POST", interaction, token);
    }
    export async function GetInteractions(token: string): Promise<APIResponse<any>> {
        return await request("/interactions", "GET", undefined, token);
    }
}






// --- Products Namespace (Newly Implemented) ---
export namespace Products {
    // --- Interfaces for type-safe parameters ---
    export interface SearchParams {
        keyword: string;
        status?: 'active' | 'draft' | 'archived';
        page?: number;
        limit?: number;
    }

    export interface Brand {
      id: string;
      name: string;
    }

    export interface ProductFilter {
      category_id?: string;
      seller_id?: string;
      min_price?: string;
      max_price?: string;
      sort?: string;         // e.g., "price" or "created_at"
      order?: string;        // e.g., "asc" or "desc"
      page?: string;         // page number (could also be number)
      limit?: string;        // items per page (could also be number)
      status?: string;       // e.g., "active", "draft", "archived"
      keyword?: string;

      // Multi-select filters
      sizes?: string[];
      colors?: string[];
      brands?: Brand[];
      categories? : any[];
      materials?: string[];
      product_types?: string[];
      occasions?: string[];
    }

    /**
     * Gets all products in the database
     * @param limit The number of results.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetProducts(limit? : number): Promise<APIResponse<Product[]>> {
        return await request(`/products?limit=${limit}`, "GET", undefined, undefined, true);
    }

    /**
     * Gets all products in the database
     * @param id The id of the product to be returned.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetProductByID(id : string): Promise<APIResponse<Product>> {
        return await request(`/products/${id}`, "GET", undefined, undefined, true);
    }

    /**
     * Searches for products based on a keyword and other criteria.
     * @param token The authorization token.
     * @param params The search parameters.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function SearchProducts(token: string, params: SearchParams): Promise<APIResponse<Product[]>> {
        const query = new URLSearchParams(params as any).toString();
        return await request(`/products/search?${query}`, "GET", undefined, token);
    }

    /**
     * Retrieves all available product filters.
     * @param token The authorization token.
     * @returns A promise resolving to the API response with available filters.
     */
    export async function GetAvailableFilters(token: string): Promise<APIResponse<any>> {
        return await request("/products/filters/available", "GET", undefined, token);
    }

    /**
     * Retrieves products based on a set of filters.
     * @param token The authorization token.
     * @param filters The filter criteria.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetProductsByFilters(token: string, filters: ProductFilter): Promise<APIResponse<any>> {
        return await request(`/products/filter`, "POST", filters, token);
    }


    /**
     * Gets top k(num-products) recommendations for the given user.
     * @param user_id The id of the user.
     * @param num_products The number of products to get.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetRecommendations(user_id : string, num_products : number): Promise<APIResponse<Product[]>> {
      // Re-using core request but changing base URL if needed?
      // For now, I'll keep the custom fetch as it points to a different URL (recsystem).
      // Or I can update core.ts to accept a full URL or baseURL.
      // Keeping it simple for now since it points to `api_urls.recsystem`.
      
      const recUrl = "https://junorecsys-710509977105.asia-south2.run.app"; // Hardcoding or importing if I could
      // Since I removed api_urls local definition, I should import it from core or just use the string.
      // core.ts exports api_urls.
      // Wait, I exported `api_urls` from core? No, I exported `API_BASE_URL` and `api_urls` (locally there).
      // Let's assume I can't access `api_urls.recsystem` easily unless I export it from core.
      
      const requestOptions = {
        method: "GET",
      };

      const resp = await fetch(`https://junorecsys-710509977105.asia-south2.run.app/products?user_id=${user_id}&num_products=${num_products.toString()}`, requestOptions)
      const body = await resp.json();

      return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok? body.products : body.error
      };
    }
}

// --- Orders Namespace (Newly Implemented) ---
export namespace Orders {
    // --- Interfaces for type-safe parameters ---
    export interface CartItem {
        product_id: string;
        variant_id : string;
        seller_id: string;
        quantity: number;
        price: number;
    }


    export interface CreateOrderRequest {
        user_id: string;
        address : Address;
        items: CartItem[];
    }

    export interface UpdateOrderStatusRequest {
        status: string;
        changed_by_id: string;
        changed_by_name: string;
    }

    /**
     * Creates new orders from a list of cart items.
     * @param token The authorization token.
     * @param orderData The data for creating the order.
     * @returns A promise resolving to the API response with an array of created orders.
     */
    export async function CreateOrder(token: string, orderData: CreateOrderRequest): Promise<APIResponse<any>> {
        return await request("/orders", "POST", orderData, token);
    }

    /**
     * Retrieves all orders for a specific user.
     * @param token The authorization token.
     * @param userID The ID of the user.
     * @returns A promise resolving to the API response with the user's orders.
     */
    export async function GetUserOrders(token: string, userID: string): Promise<APIResponse<NestedOrderMap>> {
        return await request(`/users/${userID}/orders`, "GET", undefined, token);
    }

    /**
     * Provides an estimated delivery date for a product.
     * @param token The authorization token.
     * @param productID The ID of the product.
     * @returns A promise resolving to the API response with the estimated delivery date.
     */
    export async function GetEstimatedDeliveryDate(token: string, productID: string): Promise<APIResponse<any>> {
        const query = new URLSearchParams({ productID }).toString();
        return await request(`/orders/estimated-delivery?${query}`, "GET", undefined, token);
    }

    /**
     * Retrieves tracking information for a specific order item.
     * @param token The authorization token.
     * @param orderID The ID of the order.
     * @param orderItemID The ID of the order item.
     * @returns A promise resolving to the API response with tracking information.
     */
    export async function TrackOrderItemLocation(token: string, orderID: string, orderItemID: string): Promise<APIResponse<any>> {
        return await request(`/orders/${orderID}/items/${orderItemID}/tracking`, "GET", undefined, token);
    }

    /**
     * Updates the status of an order.
     * @param token The authorization token.
     * @param orderID The ID of the order to update.
     * @param statusData The new status information.
     * @returns A promise resolving to the API response.
     */
    export async function UpdateOrderStatus(token: string, orderID: string, statusData: UpdateOrderStatusRequest): Promise<APIResponse<any>> {
        return await request(`/orders/${orderID}/status`, "PUT", statusData, token);
    }
}

/*
 * ===========================================================================
 * Cart Namespace
 * ===========================================================================
 */
export namespace Cart {
    /**
     * Retrieves all items currently in the authenticated user's cart.
     */
    export async function GetUserCart(token: string): Promise<APIResponse<any>> {
        return await request("/cart", "GET", undefined, token);
    }

    /**
     * Adds a specified product with a given quantity to the cart.
     */
    export async function AddItemToCart(token: string, item: { product_id: string; quantity: number, variant_id : string}): Promise<APIResponse<any>> {
        return await request("/cart/items", "POST", item, token);
    }

    /**
     * Updates the quantity of a specific product in the cart.
     */
    export async function UpdateItemQuantity(token: string, productID: string, variantID : string, newQuantity: { quantity: number }): Promise<APIResponse<any>> {
        return await request(`/cart/items/${productID}/${variantID}`, "PUT", newQuantity, token);
    }

    /**
     * Removes a specific product from the cart.
     */
    export async function RemoveItemFromCart(token: string, productID: string, variantID : string): Promise<APIResponse<any>> {
        return await request(`/cart/items/${productID}/${variantID}`, "DELETE", undefined, token);
    }

    /**
     * Removes all items from the authenticated user's cart.
     */
    export async function ClearCart(token: string): Promise<APIResponse<any>> {
        return await request("/cart/clear", "DELETE", undefined, token);
    }
}

/*
 * ===========================================================================
 * Addresses Namespace
 * ===========================================================================
 */
export namespace Addresses {
    /**
     * Adds a new address to the authenticated user's profile.
     */
    export async function CreateAddress(token: string, address: any): Promise<APIResponse<any>> {
        return await request("/addresses", "POST", address, token);
    }

    /**
     * Retrieves a list of all addresses for the authenticated user.
     */
    export async function GetAllAddresses(token: string): Promise<APIResponse<Address[]>> {
        return await request("/addresses", "GET", undefined, token);
    }

    /**
     * Retrieves details of a specific address by its ID.
     */
    export async function GetAddress(token: string, addressID: string): Promise<APIResponse<Address>> {
        return await request(`/addresses/${addressID}`, "GET", undefined, token);
    }

    /**
     * Updates details of an existing address by its ID.
     */
    export async function UpdateAddress(token: string, addressID: string, address: any): Promise<APIResponse<any>> {
        return await request(`/addresses/${addressID}`, "PUT", address, token);
    }

    /**
     * Deletes an existing address by its ID.
     */
    export async function DeleteAddress(token: string, addressID: string): Promise<APIResponse<any>> {
        return await request(`/addresses/${addressID}`, "DELETE", undefined, token);
    }

    /**
     * Marks a specific address as the default for the user.
     */
    export async function SetDefaultAddress(token: string, addressID: string): Promise<APIResponse<any>> {
        // This endpoint doesn't require a body, so we pass an empty object.
        return await request(`/addresses/${addressID}/default`, "PUT", {}, token);
    }

    /**
     * Retrieves the default address for the authenticated user.
     */
    export async function GetDefaultAddress(token: string): Promise<APIResponse<Address>> {
        return await request("/addresses/default", "GET", undefined, token);
    }
}

/*
 * ===========================================================================
 * Outfits Namespace
 * ===========================================================================
 */

// Interfaces for Outfit request bodies to ensure type safety
interface CreateOutfitRequest {
    name: string;
    product_ids: string[];
    image_url: string;
}

interface UpdateOutfitRequest {
    name: string;
    product_ids: string[];
    image_url: string;
}

interface RenameOutfitRequest {
    name: string;
}

export namespace Outfits {
    /**
     * Creates a new outfit for the authenticated user.
     */
    export async function CreateOutfit(token: string, outfitData: CreateOutfitRequest): Promise<APIResponse<any>> {
        return await request("/outfits", "POST", outfitData, token);
    }

    /**
     * Retrieves all outfits saved by the authenticated user.
     */
    export async function GetUserOutfits(token: string): Promise<APIResponse<any>> {
        return await request("/outfits", "GET", undefined, token);
    }

    /**
     * Retrieves a specific outfit by its ID.
     */
    export async function GetOutfitById(token: string, outfitId: string): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}`, "GET", undefined, token);
    }

    /**
     * Updates an existing outfit's details (name, product IDs, and/or image URL).
     */
    export async function UpdateOutfit(token: string, outfitId: string, outfitData: UpdateOutfitRequest): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}`, "PUT", outfitData, token);
    }

    /**
     * Deletes an outfit by its ID.
     */
    export async function DeleteOutfit(token: string, outfitId: string): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}`, "DELETE", undefined, token);
    }

    /**
     * Renames an existing outfit.
     */
    export async function RenameOutfit(token: string, outfitId: string, newName: RenameOutfitRequest): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}/rename`, "PATCH", newName, token);
    }
}

/*
 * ===========================================================================
 * Tournaments Namespace
 * ===========================================================================
 */
interface RecordVoteRequest {
    outfit_id: string;
    vote_type: "upvote" | "downvote" | "cart";
    comment?: string;
}

interface AddOutfitRequest {
    outfit_id: string;
}

export namespace Tournaments {
    /**
     * Creates a new tournament. Requires admin privileges.
     */
    export async function CreateTournament(token: string, tournamentData: any): Promise<APIResponse<any>> {
        return await request("/admin/tournaments", "POST", tournamentData, token);
    }

    /**
     * Retrieves a list of all tournaments. (Public)
     */
    export async function GetAllTournaments(): Promise<APIResponse<any>> {
        return await request("/tournaments", "GET", undefined, undefined, true);
    }

    /**
     * Retrieves detailed information for a tournament, including its leaderboard. (Public)
     */
    export async function GetTournamentDetails(tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}`, "GET", undefined, undefined, true);
    }

    /**
     * Retrieves the leaderboard for a specific tournament. (Public)
     */
    export async function GetTournamentLeaderboard(tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/leaderboard`, "GET", undefined, undefined, true);
    }

    /**
     * Retrieves outfits participating in a tournament, with their vote counts. (Public)
     */
    export async function GetParticipatingOutfits(tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/outfits`, "GET", undefined, undefined, true);
    }

    /**
     * Retrieves the vote breakdown for a specific outfit in a tournament. (Public)
     */
    export async function GetOutfitVoteBreakdown(tournamentId: string, outfitId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/outfits/${outfitId}/votes`, "GET", undefined, undefined, true);
    }

    /**
     * Registers the authenticated user for a tournament.
     */
    export async function RegisterForTournament(token: string, tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/register`, "POST", {}, token);
    }

    /**
     * Records a user's vote for an outfit in a tournament.
     */
    export async function RecordVote(token: string, tournamentId: string, voteData: RecordVoteRequest): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/vote`, "POST", voteData, token);
    }

    /**
     * Retrieves statistics for a tournament. (Public)
     */
    export async function GetTournamentStats(tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/stats`, "GET", undefined, undefined, true);
    }

    /**
     * Adds an existing outfit to a tournament's featured list.
     */
    export async function AddOutfitToTournament(token: string, tournamentId: string, outfitData: AddOutfitRequest): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/add-outfit`, "POST", outfitData, token);
    }
}

export async function get_neutral_image(images : string[]){
  const resp = await request("/neutral-image", "POST", { images }, undefined, true);
  if (resp.ok){
    return (resp.body as any).image as string;
  }
  else {
    return null;
  }
}





// Compression options interface
interface CompressionOptions {
  compress?: number; // 0.1 to 1.0 (0.1 = highest compression, 1.0 = no compression)
  resize?: {
    width?: number;
    height?: number;
  };
}

// Default compression settings for different use cases
export const COMPRESSION_PRESETS = {
  thumbnail: { compress: 0.3, resize: { width: 300 } },
  profile: { compress: 0.6, resize: { width: 800 } },
  high_quality: { compress: 0.8, resize: { width: 1200 } },
  ultra_fast: { compress: 0.2, resize: { width: 400 } }
};

// Image compression function for web using canvas
async function compressImage(
  file: File,
  options?: CompressionOptions | keyof typeof COMPRESSION_PRESETS
): Promise<File> {
  return new Promise((resolve, reject) => {
    let compressionSettings: CompressionOptions;

    // Handle preset or custom options
    if (typeof options === 'string' && COMPRESSION_PRESETS[options]) {
      compressionSettings = COMPRESSION_PRESETS[options];
    } else if (typeof options === 'object' && options !== null) {
      compressionSettings = options;
    } else {
      // Default compression for fast upload
      compressionSettings = COMPRESSION_PRESETS.ultra_fast;
    }

    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      let { width, height } = image;

      // Resize logic
      if (compressionSettings.resize) {
        if (compressionSettings.resize.width && compressionSettings.resize.height) {
            width = compressionSettings.resize.width;
            height = compressionSettings.resize.height;
        } else if (compressionSettings.resize.width) {
          const ratio = width / height;
          width = compressionSettings.resize.width;
          height = width / ratio;
        } else if (compressionSettings.resize.height) {
          const ratio = width / height;
          height = compressionSettings.resize.height;
          width = height * ratio;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = compressionSettings.compress || 0.3;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, { type: mimeType });
            resolve(newFile);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        mimeType,
        quality
      );
    };
    image.onerror = (error) => {
      console.error('Image loading failed:', error);
      // Return original file if compression fails
      resolve(file);
    };
  });
}

// Main function with compression
export async function uploadFileAndGetUrl(
  file: File,
  compressionOptions?: CompressionOptions | keyof typeof COMPRESSION_PRESETS,
  url: string = API_BASE_URL + '/files/upload',
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  console.log(`Processing file: ${file.name}`);

  let processedFile = file;

  // Compress image if it's an image file
  if (file.type.startsWith('image/')) {
    console.log('Compressing image...');
    processedFile = await compressImage(file, compressionOptions);
    console.log(`Image compressed. Original size: ${file.size}, Compressed size: ${processedFile.size}`);
  }

  // Create FormData and append the file
  const formData = new FormData();
  formData.append('file', processedFile, processedFile.name);

  try {
    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // 'Content-Type': 'multipart/form-data' is set by the browser automatically
      },
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