# Juno Admin Portal API Guide

This document details the comprehensive API suite for the Juno Admin Portal. These endpoints provide full visibility and control over the platform, including users, sellers, products, orders, analytics, and system internals.

## Authentication

All admin endpoints require a valid JWT token with the `admin` role.
Include the token in the `Authorization` header:
`Authorization: Bearer <your_admin_token>`

## Base URL

`/api/v1/admin`

---

## 1. Core Platform Management

### Users
- **Get All Users**
  - `GET /users`
  - Returns a list of all registered users.

### Sellers
- **Get All Sellers**
  - `GET /sellers`
  - Returns a list of all sellers (active, pending, etc.).
- **Approve Seller**
  - `PUT /sellers/{id}/approve`
  - Marks a seller's status as `active`.
- **Update Seller**
  - `PUT /sellers/{id}`
  - Updates any field of a seller profile (admin override).

### Invites & Waitlist
- **Get All Invites**
  - `GET /invites`
  - View all invite codes and their usage stats.
- **Get Waitlist**
  - `GET /waitlist`
  - View all users currently on the waitlist.

---

## 2. Products & Catalog

### Products
- **Get All Products**
  - `GET /products`
  - View the entire product catalog, including draft and archived items.

### Product Queue
- **Get Product Queue**
  - `GET /products-queue`
  - View items currently in the ingestion queue awaiting validation or enrichment.

### Embeddings
- **Get Embeddings**
  - `GET /embeddings`
  - View vector embeddings for products/entities (for debugging search/recommendations).

---

## 3. Orders & Fulfillment

### Orders
- **Get All Orders**
  - `GET /orders`
  - View all orders placed on the platform.
- **Get Parent Orders**
  - `GET /parent-orders`
  - View parent order transactions (before splitting by seller).
- **Get Order History**
  - `GET /orders/{orderID}/history`
  - View the audit log/history of status changes for a specific order.
- **Update Order**
  - `PUT /orders/{orderID}`
  - Admin override to update order details or status.

### Carts
- **Get All Carts**
  - `GET /carts`
  - View all active user carts (useful for debugging and abandonment analysis).

### Delivery
- **Get Delivery Bookings**
  - `GET /delivery-bookings`
  - View all 3PL delivery bookings (Bykea, PostEx, etc.).

---

## 4. Marketing & Growth

### Interactions
- **Get All Interactions**
  - `GET /interactions`
  - View raw user interactions (views, likes, swipes, etc.).

### Analytics
- **Get Sales Funnel**
  - `GET /analytics/sales-funnel`
  - Derived metrics showing conversion flow: `Product Views -> Added to Cart -> Purchases`.
- **Get Analytics Events**
  - `GET /analytics/events`
  - Stream of raw analytical events for deep analysis.

### Chapter Forms
- **Get Chapter Forms**
  - `GET /chapter-forms`
  - View submissions from the Chapter/Ambassador program forms.

---

## 5. System & Notifications

### Notifications
- **Get Notification Tokens**
  - `GET /notifications/tokens`
  - View all registered Expo push tokens.

### OTPs
- **Get All OTPs**
  - `GET /otps`
  - View all active/recent OTPs (useful for manual verification/debugging).

### Health
- **System Health**
  - `GET /health`
  - Simple check to verify API status.

---

## 6. Tournaments (Admin)

- **Create Tournament**
  - `POST /tournaments`
  - Create a new fashion tournament.

---

## Workflow Examples

### Manually Approving a Seller
1.  **List Sellers**: Call `GET /admin/sellers` to find the seller with `status: "pending"`. Note their `id`.
2.  **Approve**: Call `PUT /admin/sellers/{id}/approve`.
3.  **Verify**: Call `GET /admin/sellers` again to confirm status is `active`.

### Investigating a Failed Order
1.  **Find Order**: Call `GET /admin/orders` to find the order ID.
2.  **Check History**: Call `GET /admin/orders/{orderID}/history` to see what happened.
3.  **Check Delivery**: Call `GET /admin/delivery-bookings` filtering for that order ID to see if a courier was booked.

### Analyzing Sales Funnel
1.  **Get Funnel**: Call `GET /admin/analytics/sales-funnel`.
2.  **Analyze**: Compare `product_views` vs `purchases` to determine conversion health.
