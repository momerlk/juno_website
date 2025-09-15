import moment from "moment";
import { Inventory, Product } from "../constants/types";
import { Address } from "../constants/address";
import { NestedOrderMap, Order } from "../constants/orders";
import { Seller as TSeller} from "../constants/seller";

export function setState(data: any) {
  if (data && data.token) {
    localStorage.setItem('token', data.token);
  }
}

// --- Generic API Response Interface ---
export interface APIResponse<T> {
    status: number;
    ok: boolean;
    body: T;
}

// --- API Configuration ---
const api_urls = {
    testing: "http://192.168.18.6:8080/api/v1",
    production: "https://junoapi-710509977105.asia-south2.run.app/api/v1",
    recsystem : "https://junorecsys-710509977105.asia-south2.run.app",
};

/**
 * The base URL for all API requests.
 */
export const api_url = api_urls.production;


// --- Reusable Helper Functions (Refactored to top-level) ---

/**
 * Parses the JSON body from a Response object.
 * @param resp The Response object.
 * @returns A promise that resolves to the parsed JSON or an empty object on error.
 */
async function parseBody(resp: Response): Promise<any> {
    try {
        return await resp.json();
    } catch {
        return {};
    }
}

/**
 * Makes an API request with a JSON body.
 * @param url The endpoint URL (e.g., "/users/profile").
 * @param method The HTTP method (e.g., "POST", "PUT").
 * @param token The authorization token.
 * @param data The data to be sent in the request body.
 * @returns A promise that resolves to an APIResponse.
 */
async function requestWithBody(url: string, method: string, token: string, data: any): Promise<APIResponse<any>> {
    const headers = new Headers({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    });

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers,
        body: JSON.stringify(data)
    });

    // token needs to be refreshed
    if (resp.status === 401 && token.length > 0){
      const refreshResponse = await fetch(`${api_url}/auth/refresh`, {
        method : "POST",
        body: JSON.stringify({
          "refresh_token" : token,
        })
      });
      if (!refreshResponse.ok){
        return {
          status : refreshResponse.status,
          ok : false,
          body : {message : "Login Token Expired"},
        }
      } else {
        const body = await parseBody(refreshResponse);
        setState({
          token : body.token,
        })
        const headers = new Headers({
          "Authorization": `Bearer ${body.token}`
        });
        resp = await fetch(`${api_url}${url}`, {
            method,
            headers,
            body : JSON.stringify(data),
        });
      }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

/**
 * Makes an API request without a body.
 * @param url The endpoint URL, including any query parameters.
 * @param method The HTTP method (e.g., "GET", "DELETE").
 * @param token The authorization token.
 * @returns A promise that resolves to an APIResponse.
 */
async function requestWithoutBody(url: string, method: string, token: string): Promise<APIResponse<any>> {
    const headers = new Headers({
        "Authorization": `Bearer ${token}`
    });

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers
    });

    // token needs to be refreshed
    if (resp.status === 401 && token.length > 0){
      const refreshResponse = await fetch(`${api_url}/auth/refresh`, {
        method : "POST",
        body: JSON.stringify({
          refresh_token : token,
        })
      });
      if (!refreshResponse.ok){
        return {
          status : refreshResponse.status,
          ok : false,
          body : {message : "Login Token Expired"},
        }
      } else {
        const body = await parseBody(refreshResponse);
        setState({
          token : body.token,
        })
        const headers = new Headers({
          "Authorization": `Bearer ${body.token}`
        });
        resp = await fetch(`${api_url}${url}`, {
            method,
            headers,
        });
      }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

// New helper for public endpoints that do not require an Authorization header.
async function publicRequestWithoutBody(url: string, method: string): Promise<APIResponse<any>> {
    const resp = await fetch(`${api_url}${url}`, {
        method
    });

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}



export namespace OTP {
    export async function Send(phone_number : string) : Promise<APIResponse<any>> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "phone_number": phone_number,
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
        };

        const resp = await fetch(api_url + "/auth/send-otp", requestOptions)

        const body = await resp.json();
        if (!resp.ok){
            return {
                status : resp.status,
                ok : false,
                body : body.error
            }
        }

        return {
            status : resp.status,
            ok : true,
            body : body
        };
    }

    export async function Verify(phone_number : string, otp : string) : Promise<APIResponse<any>> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "otp": otp,
            "phone_number": phone_number
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
        };

        const resp = await fetch(api_url + "/auth/verify", requestOptions)

        const body = await resp.json();
        if (!resp.ok){
            return {
                status : resp.status,
                ok : false,
                body : body.error
            }
        }

        return {
            status : resp.status,
            ok : true,
            body : body
        };
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
            device_id = crypto.randomUUID();
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
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const device_info = await getDeviceInfo();

        const raw = JSON.stringify({
            "password": password,
            "email": email,
            "device_info" : device_info
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
        };

        const resp = await fetch(api_url + "/seller/auth/login", requestOptions)

        const body = await resp.json();
        if (!resp.ok){
            return {
                status : resp.status,
                ok : false,
                body : body.error
            }
        }

        return {
            status : resp.status,
            ok : true,
            body : body
        };
    }

    export async function GetProfile(token : string) : Promise<APIResponse<TSeller>> {
        return await requestWithoutBody("/seller/profile", "GET", token);
    }
    
}


export namespace Seller {
  export async function GetProducts(token : string, page : number) :      Promise<APIResponse<Product[]>> {
    return await requestWithoutBody(`/seller/products?page=${page}` , "GET" , token);
  }

  export async function CreateProduct(token : string, product : Product) : Promise<APIResponse<any>> {
    return await requestWithBody("/seller/products", "POST" , token, product);
  }

  export async function UpdateProduct(token : string, product : Product) : Promise<APIResponse<any>> {
    return await requestWithBody(`/seller/products/${product.id}`, "PUT" , token, product);
  }

  export async function DeleteProduct(token : string, productId : string) : Promise<APIResponse<any>>{
    return await requestWithoutBody(`/seller/products/${productId}`, "DELETE" , token);
  }

  export interface InventoryUpdate {
    product_id : string;
    variant_id : string;
    quantity_change : string;
    reason : string;
  }
  export async function UpdateInventory(token : string, updates : InventoryUpdate[]){
    return await requestWithBody("/seller/inventory/bulk-update", "POST", token, updates);
  }

  export async function GetOrders(token : string) : Promise<APIResponse<Order[]>> {
    return await requestWithoutBody(`/seller/orders`, "GET", token);
  }

  export interface StatusUpdatePayload {
    changed_by_id: string;
    changed_by_name: string;
    status: string;
  }
  export async function UpdateOrderStatus(token : string, order_id : string, payload : StatusUpdatePayload) : Promise<APIResponse<any>> {
    return await requestWithBody(`/seller/orders/${order_id}/status`, "PUT", token, payload);
  }

  
  export async function UpdateProfile(token: string, seller: TSeller): Promise<APIResponse<any>> {
    return await requestWithBody(`/seller/profile`, "PUT", token, seller);
  }

  export async function bookDelivery(token: string, order_id: string): Promise<APIResponse<any>> {
    return await requestWithBody(`/delivery/book/${order_id}`, "POST", token, {});
  }
}

export namespace SellerAnalytics {
  export async function GetSalesAnalytics(token: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = "/seller/analytics/sales";
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await requestWithoutBody(url, "GET", token);
  }

  export async function GetOrderAnalytics(token: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = "/seller/analytics/orders";
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await requestWithoutBody(url, "GET", token);
  }

  export async function GetInventoryAnalytics(token: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = "/seller/analytics/inventory";
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await requestWithoutBody(url, "GET", token);
  }

  export async function GetProductAnalytics(token: string, productID: string, startTime?: string, endTime?: string): Promise<APIResponse<any>> {
    let url = `/seller/analytics/product/${productID}`;
    const params = new URLSearchParams();
    if (startTime) params.append("startTime", startTime);
    if (endTime) params.append("endTime", endTime);
    if (startTime || endTime) url += `?${params.toString()}`;
    return await requestWithoutBody(url, "GET", token);
  }
}


export namespace Users {
    // --- Addresses ---
    export async function AddAddress(token: string, address: any): Promise<APIResponse<any>> {
        return await requestWithBody("/users/addresses", "POST", token, address);
    }

    export async function UpdateAddress(token: string, id: string, address: any): Promise<APIResponse<any>> {
        return await requestWithBody(`/users/addresses/${id}`, "PUT", token, address);
    }

    export async function DeleteAddress(token: string, id: string): Promise<APIResponse<any>> {
        return await requestWithoutBody(`/users/addresses/${id}`, "DELETE", token);
    }

    // --- Measurements ---
    export async function UpdateMeasurements(token: string, measurements: any): Promise<APIResponse<any>> {
        return await requestWithBody("/users/measurements", "PUT", token, measurements);
    }

    // --- Notification Preferences ---
    export async function UpdateNotificationPrefs(token: string, prefs: any): Promise<APIResponse<any>> {
        return await requestWithBody("/users/notifications", "PUT", token, prefs);
    }

    // --- User Preferences ---
    export async function UpdatePreferences(token: string, prefs: any): Promise<APIResponse<any>> {
        return await requestWithBody("/users/preferences", "PUT", token, prefs);
    }

    // --- User Profile ---
    export async function GetProfile(token: string): Promise<APIResponse<any>> {
        return await requestWithoutBody("/users/profile", "GET", token);
    }

    export async function UpdateProfile(token: string, user: any): Promise<APIResponse<any>> {
        return await requestWithBody("/users/profile", "PUT", token, user);
    }
    
    interface Interaction {
      product_id : string;
      rating : number;
      action_type : string;
    }
    export async function PostInteraction(token: string, interaction: Interaction): Promise<APIResponse<any>> {
        return await requestWithBody("/interactions", "POST", token, interaction);
    }
    export async function GetInteractions(token: string): Promise<APIResponse<any>> {
        return await requestWithoutBody("/interactions", "GET", token);
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
        return await requestWithoutBody(`/products?limit=${limit}`, "GET", "");
    }

    /**
     * Gets all products in the database
     * @param id The id of the product to be returned.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetProductByID(id : string): Promise<APIResponse<Product>> {
        return await publicRequestWithoutBody(`/products/${id}`, "GET");
    }

    /**
     * Searches for products based on a keyword and other criteria.
     * @param token The authorization token.
     * @param params The search parameters.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function SearchProducts(token: string, params: SearchParams): Promise<APIResponse<Product[]>> {
        const query = new URLSearchParams(params as any).toString();
        return await requestWithoutBody(`/products/search?${query}`, "GET", token);
    }

    /**
     * Retrieves all available product filters.
     * @param token The authorization token.
     * @returns A promise resolving to the API response with available filters.
     */
    export async function GetAvailableFilters(token: string): Promise<APIResponse<any>> {
        return await requestWithoutBody("/products/filters/available", "GET", token);
    }

    /**
     * Retrieves products based on a set of filters.
     * @param token The authorization token.
     * @param filters The filter criteria.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetProductsByFilters(token: string, filters: ProductFilter): Promise<APIResponse<any>> {
        return await requestWithBody(`/products/filter`, "POST", token, filters);
    }


    /**
     * Gets top k(num-products) recommendations for the given user.
     * @param user_id The id of the user.
     * @param num_products The number of products to get.
     * @returns A promise resolving to the API response with a list of products.
     */
    export async function GetRecommendations(user_id : string, num_products : number): Promise<APIResponse<Product[]>> {
      const requestOptions = {
        method: "GET",
      };

      const resp = await fetch(`${api_urls.recsystem}/products?user_id=${user_id}&num_products=${num_products.toString()}`, requestOptions)
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
        return await requestWithBody("/orders", "POST", token, orderData);
    }

    /**
     * Retrieves all orders for a specific user.
     * @param token The authorization token.
     * @param userID The ID of the user.
     * @returns A promise resolving to the API response with the user's orders.
     */
    export async function GetUserOrders(token: string, userID: string): Promise<APIResponse<NestedOrderMap>> {
      console.log(`${api_url}/users/${userID}/orders`);
        return await requestWithoutBody(`/users/${userID}/orders`, "GET", token);
    }

    /**
     * Provides an estimated delivery date for a product.
     * @param token The authorization token.
     * @param productID The ID of the product.
     * @returns A promise resolving to the API response with the estimated delivery date.
     */
    export async function GetEstimatedDeliveryDate(token: string, productID: string): Promise<APIResponse<any>> {
        const query = new URLSearchParams({ productID }).toString();
        return await requestWithoutBody(`/orders/estimated-delivery?${query}`, "GET", token);
    }

    /**
     * Retrieves tracking information for a specific order item.
     * @param token The authorization token.
     * @param orderID The ID of the order.
     * @param orderItemID The ID of the order item.
     * @returns A promise resolving to the API response with tracking information.
     */
    export async function TrackOrderItemLocation(token: string, orderID: string, orderItemID: string): Promise<APIResponse<any>> {
        return await requestWithoutBody(`/orders/${orderID}/items/${orderItemID}/tracking`, "GET", token);
    }

    /**
     * Updates the status of an order.
     * @param token The authorization token.
     * @param orderID The ID of the order to update.
     * @param statusData The new status information.
     * @returns A promise resolving to the API response.
     */
    export async function UpdateOrderStatus(token: string, orderID: string, statusData: UpdateOrderStatusRequest): Promise<APIResponse<any>> {
        return await requestWithBody(`/orders/${orderID}/status`, "PUT", token, statusData);
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
        return await requestWithoutBody("/cart", "GET", token);
    }

    /**
     * Adds a specified product with a given quantity to the cart.
     */
    export async function AddItemToCart(token: string, item: { product_id: string; quantity: number, variant_id : string}): Promise<APIResponse<any>> {
        return await requestWithBody("/cart/items", "POST", token, item);
    }

    /**
     * Updates the quantity of a specific product in the cart.
     */
    export async function UpdateItemQuantity(token: string, productID: string, variantID : string, newQuantity: { quantity: number }): Promise<APIResponse<any>> {
        return await requestWithBody(`/cart/items/${productID}/${variantID}`, "PUT", token, newQuantity);
    }

    /**
     * Removes a specific product from the cart.
     */
    export async function RemoveItemFromCart(token: string, productID: string, variantID : string): Promise<APIResponse<any>> {
        return await requestWithoutBody(`/cart/items/${productID}/${variantID}`, "DELETE", token);
    }

    /**
     * Removes all items from the authenticated user's cart.
     */
    export async function ClearCart(token: string): Promise<APIResponse<any>> {
        return await requestWithoutBody("/cart/clear", "DELETE", token);
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
        return await requestWithBody("/addresses", "POST", token, address);
    }

    /**
     * Retrieves a list of all addresses for the authenticated user.
     */
    export async function GetAllAddresses(token: string): Promise<APIResponse<Address[]>> {
        return await requestWithoutBody("/addresses", "GET", token);
    }

    /**
     * Retrieves details of a specific address by its ID.
     */
    export async function GetAddress(token: string, addressID: string): Promise<APIResponse<Address>> {
        return await requestWithoutBody(`/addresses/${addressID}`, "GET", token);
    }

    /**
     * Updates details of an existing address by its ID.
     */
    export async function UpdateAddress(token: string, addressID: string, address: any): Promise<APIResponse<any>> {
        return await requestWithBody(`/addresses/${addressID}`, "PUT", token, address);
    }

    /**
     * Deletes an existing address by its ID.
     */
    export async function DeleteAddress(token: string, addressID: string): Promise<APIResponse<any>> {
        return await requestWithoutBody(`/addresses/${addressID}`, "DELETE", token);
    }

    /**
     * Marks a specific address as the default for the user.
     */
    export async function SetDefaultAddress(token: string, addressID: string): Promise<APIResponse<any>> {
        // This endpoint doesn't require a body, so we pass an empty object.
        return await requestWithBody(`/addresses/${addressID}/default`, "PUT", token, {});
    }

    /**
     * Retrieves the default address for the authenticated user.
     */
    export async function GetDefaultAddress(token: string): Promise<APIResponse<Address>> {
        return await requestWithoutBody("/addresses/default", "GET", token);
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
        return await requestWithBody("/outfits", "POST", token, outfitData);
    }

    /**
     * Retrieves all outfits saved by the authenticated user.
     */
    export async function GetUserOutfits(token: string): Promise<APIResponse<any>> {
        return await requestWithoutBody("/outfits", "GET", token);
    }

    /**
     * Retrieves a specific outfit by its ID.
     */
    export async function GetOutfitById(token: string, outfitId: string): Promise<APIResponse<any>> {
        return await requestWithoutBody(`/outfits/${outfitId}`, "GET", token);
    }

    /**
     * Updates an existing outfit's details (name, product IDs, and/or image URL).
     */
    export async function UpdateOutfit(token: string, outfitId: string, outfitData: UpdateOutfitRequest): Promise<APIResponse<any>> {
        return await requestWithBody(`/outfits/${outfitId}`, "PUT", token, outfitData);
    }

    /**
     * Deletes an outfit by its ID.
     */
    export async function DeleteOutfit(token: string, outfitId: string): Promise<APIResponse<any>> {
        return await requestWithoutBody(`/outfits/${outfitId}`, "DELETE", token);
    }

    /**
     * Renames an existing outfit.
     */
    export async function RenameOutfit(token: string, outfitId: string, newName: RenameOutfitRequest): Promise<APIResponse<any>> {
        return await requestWithBody(`/outfits/${outfitId}/rename`, "PATCH", token, newName);
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
        return await requestWithBody("/admin/tournaments", "POST", token, tournamentData);
    }

    /**
     * Retrieves a list of all tournaments. (Public)
     */
    export async function GetAllTournaments(): Promise<APIResponse<any>> {
        return await publicRequestWithoutBody("/tournaments", "GET");
    }

    /**
     * Retrieves detailed information for a tournament, including its leaderboard. (Public)
     */
    export async function GetTournamentDetails(tournamentId: string): Promise<APIResponse<any>> {
        return await publicRequestWithoutBody(`/tournaments/${tournamentId}`, "GET");
    }

    /**
     * Retrieves the leaderboard for a specific tournament. (Public)
     */
    export async function GetTournamentLeaderboard(tournamentId: string): Promise<APIResponse<any>> {
        return await publicRequestWithoutBody(`/tournaments/${tournamentId}/leaderboard`, "GET");
    }

    /**
     * Retrieves outfits participating in a tournament, with their vote counts. (Public)
     */
    export async function GetParticipatingOutfits(tournamentId: string): Promise<APIResponse<any>> {
        return await publicRequestWithoutBody(`/tournaments/${tournamentId}/outfits`, "GET");
    }

    /**
     * Retrieves the vote breakdown for a specific outfit in a tournament. (Public)
     */
    export async function GetOutfitVoteBreakdown(tournamentId: string, outfitId: string): Promise<APIResponse<any>> {
        return await publicRequestWithoutBody(`/tournaments/${tournamentId}/outfits/${outfitId}/votes`, "GET");
    }

    /**
     * Registers the authenticated user for a tournament.
     */
    export async function RegisterForTournament(token: string, tournamentId: string): Promise<APIResponse<any>> {
        return await requestWithBody(`/tournaments/${tournamentId}/register`, "POST", token, {});
    }

    /**
     * Records a user's vote for an outfit in a tournament.
     */
    export async function RecordVote(token: string, tournamentId: string, voteData: RecordVoteRequest): Promise<APIResponse<any>> {
        return await requestWithBody(`/tournaments/${tournamentId}/vote`, "POST", token, voteData);
    }

    /**
     * Retrieves statistics for a tournament. (Public)
     */
    export async function GetTournamentStats(tournamentId: string): Promise<APIResponse<any>> {
        return await publicRequestWithoutBody(`/tournaments/${tournamentId}/stats`, "GET");
    }

    /**
     * Adds an existing outfit to a tournament's featured list.
     */
    export async function AddOutfitToTournament(token: string, tournamentId: string, outfitData: AddOutfitRequest): Promise<APIResponse<any>> {
        return await requestWithBody(`/tournaments/${tournamentId}/add-outfit`, "POST", token, outfitData);
    }
}

export async function get_neutral_image(images : string[]){
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "images": images 
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
  };

  const resp = await fetch(api_url + "/neutral-image", requestOptions)
  const data = await resp.json();
  if (resp.ok){
    return data.image as string;
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
  url: string = api_url + '/files/upload',
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