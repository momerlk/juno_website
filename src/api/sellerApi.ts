import { Product, QueueItem } from "../constants/types";
import { Address } from "../constants/address";
import { NestedOrderMap, Order } from "../constants/orders";
import { Seller as TSeller} from "../constants/seller";
import { request, API_BASE_URL, RECSYSTEM_BASE_URL, APIResponse } from "./core";
import { uploadFileAndGetUrl, COMPRESSION_PRESETS, CompressionOptions } from "./shared";

export { uploadFileAndGetUrl, COMPRESSION_PRESETS };
export type { CompressionOptions };

export { API_BASE_URL as api_url };

export function setState(data: any) {
  if (data && data.token) {
    localStorage.setItem('token', data.token);
  }
}

export type { APIResponse };

function normalizeSellerProfile(body: any): TSeller {
  return body as TSeller;
}

function normalizeOrderStatus(status?: string): Order["status"] {
  switch ((status || "").toLowerCase()) {
    case "pending":
    case "shipped":
    case "delivered":
    case "cancelled":
    case "returned":
    case "confirmed":
    case "packed":
    case "booked":
    case "fulfilled":
    case "refunded":
      return status!.toLowerCase() as Order["status"];
    default:
      return "pending";
  }
}

function normalizeSellerOrder(raw: any): Order {
  const items = Array.isArray(raw?.order_items) ? raw.order_items : Array.isArray(raw?.items) ? raw.items : [];
  const total = Number(raw?.total ?? raw?.total_amount ?? 0);

  return {
    id: raw?.id,
    user_id: raw?.user_id ?? "",
    seller_id: raw?.seller_id ?? "",
    order_number: raw?.order_number ?? raw?.id ?? "Order",
    order_items: items.map((item: any) => ({
      id: item?.id,
      order_id: raw?.id ?? "",
      product_id: item?.product_id ?? "",
      variant_id: item?.variant_id ?? "",
      seller_id: raw?.seller_id ?? "",
      quantity: Number(item?.quantity ?? 0),
      unit_price: Number(item?.unit_price ?? item?.price ?? 0),
      total_price: Number(item?.total_price ?? (item?.unit_price ?? item?.price ?? 0) * (item?.quantity ?? 0)),
      sku: item?.sku ?? "",
      size: item?.size,
      color: item?.color,
      discount: Number(item?.discount ?? 0),
      status: item?.status ?? raw?.status ?? "pending",
      is_returned: Boolean(item?.is_returned),
      return_reason: item?.return_reason,
      created_at: item?.created_at ?? raw?.created_at ?? new Date().toISOString(),
      updated_at: item?.updated_at ?? raw?.updated_at ?? new Date().toISOString(),
    })),
    shipping_address_id: raw?.shipping_address_id ?? "",
    shipping_address: raw?.shipping_address,
    billing_address_id: raw?.billing_address_id ?? "",
    billing_address: raw?.billing_address,
    status: normalizeOrderStatus(raw?.status),
    payment_method: (raw?.payment_method === "cod" ? "cash_on_delivery" : raw?.payment_method) ?? "cash_on_delivery",
    payment_status: raw?.payment_status ?? "pending",
    delivery_method: raw?.delivery_method ?? "standard",
    delivery_partner: raw?.delivery_partner,
    subtotal: Number(raw?.subtotal ?? total),
    shipping_cost: Number(raw?.shipping_cost ?? 0),
    discount: Number(raw?.discount ?? 0),
    tax: Number(raw?.tax ?? 0),
    total,
    coupon_code: raw?.coupon_code,
    notes: raw?.notes,
    is_gift: Boolean(raw?.is_gift),
    gift_message: raw?.gift_message,
    require_signature: Boolean(raw?.require_signature),
    tracking_info: raw?.tracking_info,
    created_at: raw?.created_at ?? new Date().toISOString(),
    updated_at: raw?.updated_at ?? raw?.created_at ?? new Date().toISOString(),
    deleted_at: raw?.deleted_at,
  };
}

export namespace Auth {

    export interface RegisterRequest {
        name: string;
        email: string;
        password: string;
        legal_name: string;
        business_name: string;
        description?: string;
        short_description?: string;
        logo_url?: string;
        banner_url?: string;
        banner_mobile_url?: string;
        website?: string;
        contact: {
            phone_number: string;
            contact_person_name: string;
            alternate_phone_number?: string;
            whatsapp?: string;
            support_email?: string;
            business_hours?: string;
        };
        location: {
            address: string;
            city: string;
            state: string;
            postal_code: string;
            country: string;
            latitude?: number;
            longitude?: number;
            neighborhood?: string;
            store_directions?: string;
            pickup_available?: boolean;
            pickup_hours?: string;
        };
        business_details: {
            business_type: string;
            business_category: string;
            business_subcategory?: string;
            founded_year?: number;
            number_of_employees?: string;
        };
        kyc_documents: {
            cnic_front: string;
            cnic_back?: string;
        };
        bank_details: {
            bank_name: string;
            account_title: string;
            account_number: string;
            iban: string;
            payment_method: string;
            branch_code?: string;
            branch_address?: string;
            swift_code?: string;
            payment_schedule?: string;
            payment_threshold?: number;
        };
    }

    export async function Login(email: string, password: string): Promise<APIResponse<any>> {
        return await request("/seller/auth/login", "POST", { email, password }, undefined, true);
    }

    export async function Register(data: RegisterRequest): Promise<APIResponse<any>> {
        return await request("/seller/auth/register", "POST", data, undefined, true);
    }

    export async function SaveDraft(email: string, step: number, draft_data: object): Promise<APIResponse<any>> {
        return await request("/seller/auth/register/draft", "POST", { email, step, draft_data }, undefined, true);
    }

    export async function GetDraft(email: string): Promise<APIResponse<any>> {
        return await request(`/seller/auth/register/draft?email=${encodeURIComponent(email)}`, "GET", undefined, undefined, true);
    }

    export async function GetProfile(token: string): Promise<APIResponse<TSeller>> {
        const response = await request<any>("/seller/profile", "GET", undefined, token);
        return { ...response, body: response.ok ? normalizeSellerProfile(response.body) : response.body };
    }

    export async function ChangePassword(token: string, old_password: string, new_password: string): Promise<APIResponse<any>> {
        return await request("/auth/change-password", "POST", { old_password, new_password }, token);
    }

    export async function Refresh(refresh_token: string): Promise<APIResponse<any>> {
        return await request("/auth/refresh", "POST", { refresh_token }, undefined, true);
    }
}


export namespace Seller {
  export async function GetProducts(token : string, page : number) :      Promise<APIResponse<Product[]>> {
    return await request(`/seller/products?page=${page}`, "GET", undefined, token);
  }

  export async function CreateProduct(token : string, product : Product) : Promise<APIResponse<any>> {
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
    const response = await request<any[]>(`/seller/orders`, "GET", undefined, token);
    return {
      ...response,
      body: response.ok ? (Array.isArray(response.body) ? response.body : []).map(normalizeSellerOrder) : response.body,
    };
  }

  export interface StatusUpdatePayload {
    status: "pending" | "shipped" | "delivered" | "cancelled";
  }
  export async function UpdateOrderStatus(token : string, order_id : string, payload : StatusUpdatePayload) : Promise<APIResponse<any>> {
    return await request(`/seller/orders/${order_id}/status`, "PUT", { status: payload.status }, token);
  }

  export async function GetAirwayBill(order_id: string): Promise<APIResponse<Blob>> {
    const response = await fetch(`${API_BASE_URL}/orders/${order_id}/airway-bill`);

    if (!response.ok) {
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

  
  export async function GetOnboardingStatus(token: string): Promise<APIResponse<any>> {
    return await request("/seller/onboarding/status", "GET", undefined, token);
  }

  export async function GetProfile(token: string): Promise<APIResponse<any>> {
    const response = await request<any>("/seller/profile", "GET", undefined, token);
    return { ...response, body: response.ok ? normalizeSellerProfile(response.body) : response.body };
  }

  export async function UpdateProfile(token: string, data: { name?: string; legal_name?: string; business_name?: string; description?: string; short_description?: string; logo_url?: string; banner_url?: string; banner_mobile_url?: string; website?: string; contact?: object; location?: object; business_details?: object; kyc_documents?: object; bank_details?: object }): Promise<APIResponse<any>> {
    const response = await request<any>("/seller/profile", "PATCH", data, token);
    return { ...response, body: response.ok ? normalizeSellerProfile(response.body) : response.body };
  }

  export async function FulfillOrder(token: string, order_id: string, tracking_number?: string): Promise<APIResponse<any>> {
    return await request(`/seller/orders/${order_id}/fulfill`, "POST", { tracking_number }, token);
  }

  export async function GetInventoryCategories(token: string): Promise<APIResponse<any>> {
    return await request("/seller/inventory/categories", "GET", undefined, token);
  }

  export async function UpdateProductSizingGuide(token: string, productIds: string[], sizingGuide: any): Promise<APIResponse<any>> {
    return await request("/seller/products/bulk-sizing-guide", "POST", { product_ids: productIds, sizing_guide: sizingGuide }, token);
  }

  export async function bookDelivery(token: string, order_id: string): Promise<APIResponse<any>> {
    return await request(`/delivery/book/${order_id}`, "POST", {}, token);
  }

  export async function GetLowStock(token: string): Promise<APIResponse<any>> {
    return await request("/seller/inventory/low-stock", "GET", undefined, token);
  }

  export namespace Queue {
      export async function List(token: string): Promise<APIResponse<QueueItem[]>> {
          return await request("/seller/queue", "GET", undefined, token);
      }
      export async function Get(token: string, id: string): Promise<APIResponse<QueueItem>> {
          return await request(`/seller/queue/${id}`, "GET", undefined, token);
      }
      export async function Create(token: string, product: Product): Promise<APIResponse<any>> {
          return await request("/seller/products", "POST", { product }, token);
      }
      export async function Update(token: string, id: string, data: any): Promise<APIResponse<any>> {
          return await request(`/seller/queue/${id}`, "PUT", data, token);
      }
      export async function Promote(token: string, id: string): Promise<APIResponse<any>> {
          return await request(`/seller/queue/${id}/promote`, "POST", {}, token);
      }
      export async function Reject(token: string, id: string, reason: string): Promise<APIResponse<any>> {
          return await request(`/seller/queue/${id}/reject`, "POST", { reason }, token);
      }
      export async function GetPendingEmbeddings(token: string): Promise<APIResponse<any>> {
          return await request("/seller/queue/pending-embeddings", "GET", undefined, token);
      }
      export async function GenerateEmbeddings(token: string, id: string): Promise<APIResponse<any>> {
          return await request(`/seller/queue/${id}/embeddings`, "POST", {}, token);
      }
      export async function Enrich(token: string, id: string, data: any): Promise<APIResponse<any>> {
          return await request(`/seller/queue/${id}/enrich`, "PUT", data, token);
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
        return await request("/location/addresses", "POST", address, token);
    }

    export async function UpdateAddress(token: string, id: string, address: any): Promise<APIResponse<any>> {
        return await request(`/location/addresses/${id}`, "PUT", address, token);
    }

    export async function DeleteAddress(token: string, id: string): Promise<APIResponse<any>> {
        return await request(`/location/addresses/${id}`, "DELETE", undefined, token);
    }

    // --- User Profile ---
    export async function GetProfile(token: string): Promise<APIResponse<any>> {
        return await request("/me", "GET", undefined, token);
    }

    export async function UpdateProfile(token: string, user: any): Promise<APIResponse<any>> {
        return await request("/me", "PUT", user, token);
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

// --- Products Namespace ---
export namespace Products {
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
      sort?: string;
      order?: string;
      page?: string;
      limit?: string;
      status?: string;
      keyword?: string;
      sizes?: string[];
      colors?: string[];
      brands?: Brand[];
      categories? : any[];
      materials?: string[];
      product_types?: string[];
      occasions?: string[];
    }

    export async function GetProducts(limit? : number): Promise<APIResponse<Product[]>> {
        return await request(`/catalog/products?limit=${limit}`, "GET", undefined, undefined, true);
    }

    export async function GetProductByID(id : string): Promise<APIResponse<Product>> {
        return await request(`/catalog/products/${id}`, "GET", undefined, undefined, true);
    }

    export async function SearchProducts(token: string, params: SearchParams): Promise<APIResponse<Product[]>> {
        const query = new URLSearchParams(params as any).toString();
        return await request(`/catalog/products/search?${query}`, "GET", undefined, token);
    }

    export async function GetAvailableFilters(token: string): Promise<APIResponse<any>> {
        return await request("/catalog/products/filters", "GET", undefined, token);
    }

    export async function GetProductsByFilters(token: string, filters: ProductFilter): Promise<APIResponse<any>> {
        return await request(`/catalog/products/filter`, "POST", filters, token);
    }

    export async function GetRecommendations(user_id: string, num_products: number): Promise<APIResponse<Product[]>> {
        const resp = await fetch(`${RECSYSTEM_BASE_URL}/products?user_id=${user_id}&num_products=${num_products}`);
        const body = await resp.json();
        return { status: resp.status, ok: resp.ok, body: resp.ok ? body.products : body.error };
    }

    export async function GetAutocomplete(query: string): Promise<APIResponse<any>> {
        return await request(`/catalog/search/autocomplete?q=${encodeURIComponent(query)}`, "GET", undefined, undefined, true);
    }

    export async function GetTrending(): Promise<APIResponse<any>> {
        return await request("/catalog/search/trending", "GET", undefined, undefined, true);
    }

    export async function GetBrandStats(brand_id: string): Promise<APIResponse<any>> {
        return await request(`/catalog/brands/${brand_id}/stats`, "GET", undefined, undefined, true);
    }
}

// --- Orders Namespace ---
export namespace Orders {
    export interface CartItem {
        product_id: string;
        variant_id : string;
        seller_id: string;
        quantity: number;
        price: number;
    }

    export interface CreateOrderRequest {
        address_id: string;
        payment_method: string;
    }

    export interface UpdateOrderStatusRequest {
        status: string;
        changed_by_id: string;
        changed_by_name: string;
    }

    export async function CreateOrder(token: string, orderData: CreateOrderRequest): Promise<APIResponse<any>> {
        return await request("/commerce/checkout", "POST", orderData, token);
    }

    export async function GetUserOrders(token: string, userID: string): Promise<APIResponse<Order[]>> {
        return await request(`/commerce/orders`, "GET", undefined, token);
    }

    export async function UpdateOrderStatus(token: string, order_id: string, statusData: UpdateOrderStatusRequest): Promise<APIResponse<any>> {
        return await request(`/commerce/orders/${order_id}/status`, "PUT", statusData, token);
    }
}

/*
 * ===========================================================================
 * Cart Namespace
 * ===========================================================================
 */
export namespace Cart {
    export async function GetUserCart(token: string): Promise<APIResponse<any>> {
        return await request("/commerce/cart", "GET", undefined, token);
    }

    export async function AddItemToCart(token: string, item: { product_id: string; quantity: number, variant_id : string}): Promise<APIResponse<any>> {
        return await request("/commerce/cart", "POST", item, token);
    }

    export async function UpdateItemQuantity(token: string, productID: string, variantID : string, newQuantity: { quantity: number }): Promise<APIResponse<any>> {
        return await request(`/commerce/cart/items/${productID}/${variantID}`, "PUT", newQuantity, token);
    }

    export async function RemoveItemFromCart(token: string, productID: string, variantID : string): Promise<APIResponse<any>> {
        return await request(`/commerce/cart/items/${productID}/${variantID}`, "DELETE", undefined, token);
    }

    export async function ClearCart(token: string): Promise<APIResponse<any>> {
        return await request("/commerce/cart/clear", "DELETE", undefined, token);
    }
}

/*
 * ===========================================================================
 * Addresses Namespace
 * ===========================================================================
 */
export namespace Addresses {
    export async function CreateAddress(token: string, address: any): Promise<APIResponse<any>> {
        return await request("/location/addresses", "POST", address, token);
    }

    export async function GetAllAddresses(token: string): Promise<APIResponse<Address[]>> {
        return await request("/location/addresses", "GET", undefined, token);
    }

    export async function GetAddress(token: string, addressID: string): Promise<APIResponse<Address>> {
        return await request(`/location/addresses/${addressID}`, "GET", undefined, token);
    }

    export async function UpdateAddress(token: string, addressID: string, address: any): Promise<APIResponse<any>> {
        return await request(`/location/addresses/${addressID}`, "PUT", address, token);
    }

    export async function DeleteAddress(token: string, addressID: string): Promise<APIResponse<any>> {
        return await request(`/location/addresses/${addressID}`, "DELETE", undefined, token);
    }

    export async function SetDefaultAddress(token: string, addressID: string): Promise<APIResponse<any>> {
        return await request(`/location/addresses/${addressID}/default`, "PUT", {}, token);
    }

    export async function GetDefaultAddress(token: string): Promise<APIResponse<Address>> {
        return await request("/location/addresses/default", "GET", undefined, token);
    }
}

/*
 * ===========================================================================
 * Outfits Namespace
 * ===========================================================================
 */
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
    export async function CreateOutfit(token: string, outfitData: CreateOutfitRequest): Promise<APIResponse<any>> {
        return await request("/outfits", "POST", outfitData, token);
    }

    export async function GetUserOutfits(token: string): Promise<APIResponse<any>> {
        return await request("/outfits", "GET", undefined, token);
    }

    export async function GetOutfitById(token: string, outfitId: string): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}`, "GET", undefined, token);
    }

    export async function UpdateOutfit(token: string, outfitId: string, outfitData: UpdateOutfitRequest): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}`, "PUT", outfitData, token);
    }

    export async function DeleteOutfit(token: string, outfitId: string): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}`, "DELETE", undefined, token);
    }

    export async function RenameOutfit(token: string, outfitId: string, newName: RenameOutfitRequest): Promise<APIResponse<any>> {
        return await request(`/outfits/${outfitId}/rename`, "PATCH", newName, token);
    }
}

/*
 * ===========================================================================
 * Tournaments Namespace
 * ===========================================================================
 */
export namespace Tournaments {
    export async function CreateTournament(token: string, tournamentData: any): Promise<APIResponse<any>> {
        return await request("/tournaments", "POST", tournamentData, token);
    }

    export async function GetAllTournaments(): Promise<APIResponse<any>> {
        return await request("/tournaments", "GET", undefined, undefined, true);
    }

    export async function GetTournamentDetails(tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}`, "GET", undefined, undefined, true);
    }

    export async function GetTournamentLeaderboard(tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/leaderboard`, "GET", undefined, undefined, true);
    }

    export async function RegisterForTournament(token: string, tournamentId: string): Promise<APIResponse<any>> {
        return await request(`/tournaments/${tournamentId}/register`, "POST", {}, token);
    }
}

/*
 * ===========================================================================
 * Shopify Namespace
 * ===========================================================================
 */
export namespace Shopify {
    // Returns the direct OAuth redirect URL to open in a new tab.
    // Cannot use fetch() here — the backend returns a 303 redirect to Shopify which CORS blocks.
    
    export interface ConnectionStatus {
        connected: boolean;
        shop?: string;
        scopes?: string;
        installed_at?: string;
    }

    export interface SyncResponse {
        message: string;
        count: number;
    }

    export function GetAuthUrl(token: string, shop: string): string {
        // Docs require seller auth on GET /shopify/auth. On web, navigation cannot send Authorization headers,
        // so we keep token-in-query fallback used by current backend web flow.
        return `${API_BASE_URL}/shopify/auth?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`;
    }


    export async function GetStatus(token: string): Promise<APIResponse<ConnectionStatus>> {
        return await request("/shopify/status", "GET", undefined, token);
    }
    // Syncs products from the already-connected Shopify store (no params needed after OAuth)
    export async function Sync(token: string): Promise<APIResponse<SyncResponse>> {
        return await request("/shopify/sync", "POST", {}, token);
    }
    export async function Disconnect(token: string): Promise<APIResponse<any>> {
        return await request("/shopify/disconnect", "DELETE", undefined, token);
    }
}

export namespace Probe {
    export interface ProbeDevice {
        device_id?: string;
        platform?: string;
        app_version?: string;
        os_version?: string;
        locale?: string;
    }

    export interface ProbeEventContext {
        screen_name?: string;
        referrer?: string;
        source?: string;
        user_agent?: string;
        ip_address?: string;
    }

    export interface ProbeEventInput {
        type:
            | "session.start"
            | "session.end"
            | "session.heartbeat"
            | "screen.view"
            | "screen.exit"
            | "product.view"
            | "product.impression"
            | "product.share"
            | "product.add_to_closet"
            | "product.remove_from_closet"
            | "cart.add"
            | "cart.remove"
            | "cart.view"
            | "checkout.start"
            | "checkout.complete"
            | "checkout.abandon"
            | "order.placed"
            | "order.cancelled"
            | "order.delivered"
            | "order.returned"
            | "seller.profile_view"
            | "seller.follow"
            | "seller.unfollow"
            | "seller.contact";
        product_id?: string;
        category_id?: string;
        timestamp?: string;
        properties?: Record<string, any>;
        context?: ProbeEventContext;
    }

    export interface IngestEventsRequest {
        session_id: string;
        user_id?: string;
        device?: ProbeDevice;
        events: ProbeEventInput[];
    }

    export interface SessionHeartbeatRequest {
        session_id: string;
        user_id?: string;
        device?: ProbeDevice;
        timestamp?: string;
        screen_name?: string;
        page_count?: number;
        metadata?: Record<string, any>;
    }

    export async function IngestEvents(payload: IngestEventsRequest): Promise<APIResponse<{ accepted: number }>> {
        return await request("/probe/events/ingest", "POST", payload, undefined, true);
    }

    export async function Heartbeat(payload: SessionHeartbeatRequest): Promise<APIResponse<{ session_id: string; last_seen_at: string }>> {
        return await request("/probe/sessions/heartbeat", "POST", payload, undefined, true);
    }
}

export namespace SellerNotifications {
    export async function Register(token: string, expo_token: string): Promise<APIResponse<any>> {
        return await request("/notifications-seller/register", "POST", { expo_token }, token);
    }
    export async function Unregister(token: string, expo_token: string): Promise<APIResponse<any>> {
        return await request("/notifications-seller/unregister", "POST", { expo_token }, token);
    }
}

export async function get_neutral_image(images: string[]) {
    const resp = await request("/neutral-image", "POST", { images }, undefined, true);
    return resp.ok ? (resp.body as any).image as string : null;
}
