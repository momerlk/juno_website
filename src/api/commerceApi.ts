/**
 * Commerce API
 * 
 * Shopping cart, checkout, and user order history.
 * Includes both authenticated user endpoints and public guest endpoints
 * for performance marketing traffic.
 * 
 * @module Commerce
 */

import { request, APIResponse, API_BASE_URL } from "./core";
import type {
    Cart,
    ShippingEstimateResponse,
    ParentOrder,
    CheckoutRequest,
    CheckoutDirectRequest,
    GuestCartResponse,
    GuestCheckoutDetails,
    GuestCheckoutRequest,
    GuestCheckoutDirectRequest,
    DirectCheckoutItem,
    GuestOrderLookupRequest,
    OrderTracking,
    Order,
} from "./api.types";

// ============================================================================
// User Commerce API
// ============================================================================

export namespace Commerce {
    const BASE_PATH = '/commerce';

    function getUserToken(): string | undefined {
        return localStorage.getItem('token') ?? undefined;
    }

    /**
     * Get user cart
     * 
     * Returns the authenticated user's active cart with all items
     * and gift details if applicable.
     */
    export async function getCart(token?: string): Promise<APIResponse<Cart>> {
        return request(`${BASE_PATH}/cart`, 'GET', undefined, token || getUserToken());
    }

    /**
     * Add item to cart
     * 
     * Adds a product variant to the authenticated user's cart.
     * If the variant already exists, quantity is incremented.
     * 
     * Required fields: product_id, variant_id, quantity (>= 1)
     */
    export async function addToCart(item: { product_id: string; variant_id: string; quantity: number }, token?: string): Promise<APIResponse<Cart>> {
        return request(`${BASE_PATH}/cart`, 'POST', item, token || getUserToken());
    }

    /**
     * Remove item from cart
     * 
     * Removes a specific product variant from the authenticated user's cart.
     */
    export async function removeFromCart(productId: string, variantId: string, token?: string): Promise<APIResponse<Cart>> {
        return request(`${BASE_PATH}/cart/items?product_id=${productId}&variant_id=${variantId}`, 'DELETE', undefined, token || getUserToken());
    }

    /**
     * Get cart shipping estimate
     *
     * Returns shipping fee breakdown for the authenticated user's cart.
     */
    export async function getCartShippingEstimate(buyerCity: string, token?: string): Promise<APIResponse<ShippingEstimateResponse>> {
        return request(
            `${BASE_PATH}/cart/shipping-estimate?buyer_city=${encodeURIComponent(buyerCity)}`,
            'GET',
            undefined,
            token || getUserToken()
        );
    }

    /**
     * Checkout
     * 
     * Creates a parent transaction from the current cart and splits
     * it into seller-specific child orders.
     * 
     * Required fields: address_id, payment_method
     */
    export async function checkout(payload: CheckoutRequest, token?: string): Promise<APIResponse<ParentOrder>> {
        return request(`${BASE_PATH}/checkout`, 'POST', payload, token || getUserToken());
    }

    /**
     * Checkout direct (payload-based)
     *
     * Creates order directly from provided items; does not rely on server cart.
     */
    export async function checkoutDirect(payload: CheckoutDirectRequest, token?: string): Promise<APIResponse<ParentOrder>> {
        return request(`${BASE_PATH}/checkout/direct`, 'POST', payload, token || getUserToken());
    }

    /**
     * Get user orders
     * 
     * Returns the authenticated user's child orders, one per seller
     * fulfillment group. Includes order status history.
     */
    export async function getOrders(token?: string): Promise<APIResponse<Order[]>> {
        return request(`${BASE_PATH}/orders`, 'GET', undefined, token || getUserToken());
    }

    /**
     * Get order tracking
     * 
     * Returns the granular milestone timeline and map anchors for an order.
     */
    export async function getOrderTracking(orderId: string, token?: string): Promise<APIResponse<OrderTracking>> {
        return request(`${BASE_PATH}/orders/${orderId}/tracking`, 'GET', undefined, token || getUserToken());
    }

    /**
     * Get order tracking polyline
     *
     * Returns the encoded polyline for the active segment.
     * Some backends return `{ polyline: string }`; others may return the raw string.
     */
    export async function getOrderTrackingPolyline(orderId: string, token?: string): Promise<APIResponse<{ polyline: string } | string>> {
        return request(`${BASE_PATH}/orders/${orderId}/tracking/polyline`, 'GET', undefined, token || getUserToken());
    }

    /**
     * Share order tracking
     * 
     * Generates a signed token for public, read-only tracking access.
     */
    export async function shareOrderTracking(orderId: string, token?: string): Promise<APIResponse<{ token: string; url: string }>> {
        return request(`${BASE_PATH}/orders/${orderId}/tracking/share`, 'POST', undefined, token || getUserToken());
    }

    /**
     * Get order support link
     *
     * Returns an order-aware support WhatsApp link.
     */
    export async function getOrderSupportLink(orderId: string, category?: string, token?: string): Promise<APIResponse<{ support_whatsapp_number: string; support_url: string; category: string; order_id: string }>> {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return request(`${BASE_PATH}/orders/${orderId}/support-link${query}`, 'GET', undefined, token || getUserToken());
    }

    /**
     * Get generic support link
     *
     * Public support deep-link helper.
     */
    export async function getSupportLink(category?: string): Promise<APIResponse<{ support_whatsapp_number: string; support_url: string; category: string }>> {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return request(`/support/link${query}`, 'GET', undefined, undefined, true);
    }
}

// ============================================================================
// Guest Commerce API
// ============================================================================

export namespace GuestCommerce {
    const BASE_PATH = '/commerce/guest';

    function getHeaders(guestCartId?: string): Headers {
        const headers = new Headers();
        if (guestCartId) {
            headers.append('X-Guest-Cart-Id', guestCartId);
        }
        return headers;
    }

    /**
     * Handle guest commerce response with proper unwrapping
     * 
     * Uses the same response format as standard API: { success, data/error }
     */
    async function handleGuestResponse<T>(resp: Response): Promise<APIResponse<T>> {
        const body = await resp.json().catch(() => ({}));
        
        // Check for standard API response format
        const isSuccess = resp.ok || (body && body.success === true);
        
        // Unwrap data field if present
        const unwrappedBody = isSuccess && body?.data ? body.data : body;
        
        return {
            status: resp.status,
            ok: isSuccess,
            body: isSuccess ? unwrappedBody : (unwrappedBody?.error || unwrappedBody)
        };
    }

    /**
     * Get guest cart
     * 
     * Returns the current anonymous cart for the provided guest cart token.
     * Uses X-Guest-Cart-Id header for cart identity.
     */
    export async function getCart(guestCartId?: string): Promise<APIResponse<GuestCartResponse>> {
        const headers = getHeaders(guestCartId);
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/cart`, { method: 'GET', headers });
        return handleGuestResponse<GuestCartResponse>(resp);
    }

    /**
     * Add item to guest cart
     * 
     * Adds a product variant to the anonymous cart.
     * If X-Guest-Cart-Id header is omitted, creates a new guest cart
     * and returns the guest_cart_id in response.
     * 
     * Required fields: product_id, variant_id, quantity (>= 1)
     */
    export async function addToCart(item: { product_id: string; variant_id: string; quantity: number }, guestCartId?: string): Promise<APIResponse<GuestCartResponse>> {
        const headers = getHeaders(guestCartId);
        headers.append('Content-Type', 'application/json');
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/cart`, {
            method: 'POST',
            headers,
            body: JSON.stringify(item)
        });
        return handleGuestResponse<GuestCartResponse>(resp);
    }

    /**
     * Remove item from guest cart
     * 
     * Removes a specific product variant from the anonymous cart.
     */
    export async function removeFromCart(productId: string, variantId: string, guestCartId?: string): Promise<APIResponse<GuestCartResponse>> {
        const headers = getHeaders(guestCartId);
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/cart/items?product_id=${productId}&variant_id=${variantId}`, {
            method: 'DELETE',
            headers
        });
        return handleGuestResponse<GuestCartResponse>(resp);
    }

    /**
     * Get guest cart shipping estimate
     *
     * Returns shipping fee breakdown for a guest cart.
     */
    export async function getCartShippingEstimate(buyerCity: string, guestCartId?: string): Promise<APIResponse<ShippingEstimateResponse>> {
        const headers = getHeaders(guestCartId);
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/cart/shipping-estimate?buyer_city=${encodeURIComponent(buyerCity)}`, {
            method: 'GET',
            headers
        });
        return handleGuestResponse<ShippingEstimateResponse>(resp);
    }

    /**
     * Save guest checkout details
     * 
     * Saves minimal required fields optimized for conversion:
     * - Required: full_name, phone_number, address_line1, city
     * - Optional: email, address_line2, province, postal_code, country
     * 
     * If country is omitted, defaults to Pakistan.
     */
    export async function saveCustomerDetails(details: GuestCheckoutDetails, guestCartId?: string): Promise<APIResponse<GuestCartResponse>> {
        const headers = getHeaders(guestCartId);
        headers.append('Content-Type', 'application/json');
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/cart/customer`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(details)
        });
        return handleGuestResponse<GuestCartResponse>(resp);
    }

    /**
     * Guest checkout
     * 
     * Creates order from guest cart. The guest cart must already
     * contain saved guest checkout details.
     * 
     * Required fields: payment_method
     */
    export async function checkout(payload: GuestCheckoutRequest, guestCartId?: string): Promise<APIResponse<ParentOrder>> {
        const headers = getHeaders(guestCartId);
        headers.append('Content-Type', 'application/json');
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/checkout`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        return handleGuestResponse<ParentOrder>(resp);
    }

    /**
     * Guest checkout direct (payload-based)
     *
     * Creates guest order directly from items + inline customer details.
     */
    export async function checkoutDirect(payload: GuestCheckoutDirectRequest): Promise<APIResponse<ParentOrder>> {
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/checkout/direct`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return handleGuestResponse<ParentOrder>(resp);
    }

    /**
     * Public shipping estimate from raw items (no cart dependency)
     */
    export async function estimateShipping(payload: { buyer_city: string; items: DirectCheckoutItem[] }): Promise<APIResponse<ShippingEstimateResponse>> {
        return request('/commerce/shipping/estimate', 'POST', payload, undefined, true);
    }

    /**
     * Lookup guest orders
     * 
     * Returns guest parent orders for order tracking using either
     * phone number or email. Provide at least one lookup field.
     */
    export async function lookupOrders(payload: GuestOrderLookupRequest): Promise<APIResponse<ParentOrder[]>> {
        const resp = await fetch(`${API_BASE_URL}${BASE_PATH}/orders/lookup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return handleGuestResponse<ParentOrder[]>(resp);
    }

    /**
     * Get public tracking
     * 
     * Returns order tracking data without PII using a valid share token.
     */
    export async function getPublicTracking(token: string): Promise<APIResponse<OrderTracking>> {
        const resp = await fetch(`${API_BASE_URL}/track/${token}`, { method: 'GET' });
        return handleGuestResponse<OrderTracking>(resp);
    }
}
