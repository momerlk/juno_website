/**
 * Admin API - Extended Types and Functions
 * 
 * Additional admin endpoints for seller management, user management,
 * orders, system operations, notifications, and ambassador program.
 * 
 * @module AdminAPI
 */

import { request, APIResponse } from "./core";
import type { Order } from "../constants/orders";

// ============================================================================
// Admin API (Extended)
// ============================================================================

export namespace AdminAPI {
    const BASE_PATH = '/admin';

    function getAdminToken(): string | undefined {
        return localStorage.getItem('admin_token') ?? undefined;
    }

    // ========================================================================
    // Seller Management
    // ========================================================================

    /**
     * Get all sellers (admin view)
     * 
     * Returns complete list of sellers with full profile data.
     */
    export async function getSellers(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/sellers`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get seller details
     * 
     * Returns comprehensive seller profile including business details,
     * KYC status, bank details, and performance metrics.
     */
    export async function getSellerDetails(sellerId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${sellerId}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Approve or Suspend seller
     * 
     * Transitions seller from pending to approved status if approved is true,
     * or suspends the seller if false.
     */
    export async function approveSeller(sellerId: string, approved: boolean = true, note: string = "KYC verified"): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${sellerId}/approve`, 'PUT', { approved, note }, getAdminToken());
    }

    /**
     * Update seller
     * 
     * Admin update of seller profile. Can modify any field including
     * status, KYC verification, and bank details.
     */
    export async function updateSeller(sellerId: string, data: any): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${sellerId}`, 'PUT', data, getAdminToken());
    }

    // ========================================================================
    // User Management
    // ========================================================================

    /**
     * Get all users
     * 
     * Returns list of all platform users.
     */
    export async function getUsers(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/users`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get user details
     * 
     * Returns comprehensive user profile including order history,
     * interactions, and session data.
     */
    export async function getUserDetails(userId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/users/${userId}`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // Orders & Carts
    // ========================================================================

    /**
     * Get all orders
     * 
     * Returns all platform orders with filtering and pagination.
     */
    export async function getOrders(): Promise<APIResponse<Order[]>> {
        return request(`${BASE_PATH}/orders`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get order by ID
     * 
     * Returns complete order details including items, addresses,
     * payment info, and fulfillment status.
     */
    export async function getOrderById(orderId: string): Promise<APIResponse<Order>> {
        return request(`${BASE_PATH}/orders/${orderId}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Update order
     * 
     * Admin update of order status, delivery partner, or other fields.
     */
    export async function updateOrder(orderId: string, data: any): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${orderId}`, 'PUT', data, getAdminToken());
    }

    /**
     * Get all carts
     * 
     * Returns all active user carts for monitoring and analytics.
     */
    export async function getCarts(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/carts`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // Product Queue & Moderation
    // ========================================================================

    /**
     * Get product queue
     * 
     * Returns products awaiting moderation/approval.
     */
    export async function getProductQueue(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/products-queue`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // Interactions & Analytics
    // ========================================================================

    /**
     * Get all interactions
     * 
     * Returns user interactions (likes, saves, ratings) for analytics.
     */
    export async function getInteractions(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/interactions`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // Waitlist
    // ========================================================================

    /**
     * Get waitlist
     * 
     * Returns users on the platform waitlist.
     */
    export async function getWaitlist(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/waitlist`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // System Health
    // ========================================================================

    /**
     * Get system health
     * 
     * Returns system health metrics and status.
     */
    export async function getSystemHealth(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/health`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // OTPs
    // ========================================================================

    /**
     * Get all OTPs
     * 
     * Returns OTP records for monitoring and debugging.
     */
    export async function getOTPs(): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/otps`, 'GET', undefined, getAdminToken());
    }

    // ========================================================================
    // Updates & Content
    // ========================================================================

    /**
     * Create update
     * 
     * Creates a new platform update/post for the updates feed.
     */
    export async function createUpdate(data: any): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/updates`, 'POST', data, getAdminToken());
    }

    // ========================================================================
    // Notifications
    // ========================================================================

    /**
     * Broadcast notification
     * 
     * Sends push notification to all users.
     * 
     * Body: { title, body, data }
     */
    export async function broadcastNotification(title: string, body: string, data?: object): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/notifications/broadcast`, 'POST', { title, body, data: data || {} }, getAdminToken());
    }

    /**
     * Send notification to user
     * 
     * Sends push notification to a specific user.
     */
    export async function sendNotificationToUser(userId: string, title: string, body: string, data?: object): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/notifications/users/${userId}/send`, 'POST', { title, body, data }, getAdminToken());
    }

    /**
     * Delete notification token
     * 
     * Removes a specific Expo push token from the system.
     */
    export async function deleteNotificationToken(expoToken: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/notifications/tokens/${expoToken}`, 'DELETE', undefined, getAdminToken());
    }

    /**
     * Delete user notification tokens
     * 
     * Removes all Expo push tokens for a specific user.
     */
    export async function deleteUserNotificationTokens(userId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/notifications/tokens/user/${userId}`, 'DELETE', undefined, getAdminToken());
    }

    // ========================================================================
    // Ambassador Program
    // ========================================================================

    /**
     * Create ambassador task
     * 
     * Creates a new task for brand ambassadors or campus leads.
     */
    export async function createAmbassadorTask(data: any): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/ambassador/tasks`, 'POST', data, getAdminToken());
    }
}
