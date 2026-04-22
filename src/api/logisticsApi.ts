/**
 * Logistics API
 *
 * Delivery fare estimation, booking, and shipment tracking utilities.
 */

import { request, APIResponse } from "./core";
import type {
    FareEstimateRequest,
    DeliveryOption,
    BookDeliveryRequest,
    DeliveryBooking,
    TrackingInfo,
    UpdateBookingStatusRequest,
    BookingListResponse,
} from "./api.types";

export namespace Logistics {
    const BASE_PATH = "/logistics";

    /**
     * Get public fare estimates for a seller-to-customer route.
     */
    export async function getFareEstimate(payload: FareEstimateRequest): Promise<APIResponse<DeliveryOption[]>> {
        return request(`${BASE_PATH}/fare-estimate`, "POST", payload, undefined, true);
    }

    /**
     * Book delivery for an order.
     */
    export async function bookDelivery(payload: BookDeliveryRequest, token?: string): Promise<APIResponse<DeliveryBooking>> {
        return request(`${BASE_PATH}/book`, "POST", payload, token);
    }

    /**
     * Track shipment by booking id.
     */
    export async function trackShipment(bookingId: string, token?: string): Promise<APIResponse<TrackingInfo>> {
        return request(`${BASE_PATH}/track/${bookingId}`, "GET", undefined, token);
    }

    /**
     * Update booking status.
     */
    export async function updateBookingStatus(
        bookingId: string,
        payload: UpdateBookingStatusRequest,
        token?: string
    ): Promise<APIResponse<DeliveryBooking>> {
        return request(`${BASE_PATH}/book/${bookingId}/status`, "PUT", payload, token);
    }

    /**
     * List seller delivery bookings with optional filtering.
     */
    export async function listBookings(
        params?: {
            order_id?: string;
            status?: string;
            from_date?: string;
            to_date?: string;
            page?: number;
            limit?: number;
        },
        token?: string
    ): Promise<APIResponse<BookingListResponse>> {
        const query = new URLSearchParams();
        if (params?.order_id) query.set("order_id", params.order_id);
        if (params?.status) query.set("status", params.status);
        if (params?.from_date) query.set("from_date", params.from_date);
        if (params?.to_date) query.set("to_date", params.to_date);
        if (params?.page !== undefined) query.set("page", String(params.page));
        if (params?.limit !== undefined) query.set("limit", String(params.limit));
        const qp = query.toString();
        const endpoint = qp ? `${BASE_PATH}/bookings?${qp}` : `${BASE_PATH}/bookings`;
        return request(endpoint, "GET", undefined, token);
    }
}
