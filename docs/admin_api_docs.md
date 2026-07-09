# Admin Module

Platform administration endpoints for ops, moderation, catalog control, seller onboarding, logistics, finance, and user management.

Auth:
- Every endpoint in this module requires admin auth except `POST /api/v2/admin/auth/login`.
- Send `Authorization: Bearer <admin_token>`.
- `POST /api/v2/admin/auth/refresh` rotates refresh tokens and returns a new access token.

---

## Router Coverage

### Auth + System
- `POST /api/v2/admin/auth/login`
- `POST /api/v2/admin/auth/refresh`
- `GET /api/v2/admin/health`

### User Management
- `GET /api/v2/admin/users`
- `POST /api/v2/admin/users`
- `GET /api/v2/admin/users/{id}`
- `PATCH /api/v2/admin/users/{id}`
- `PATCH /api/v2/admin/users/{id}/status`
- `GET /api/v2/admin/otps`

### Seller Management
- `GET /api/v2/admin/sellers`
- `GET /api/v2/admin/sellers/{id}`
- `PATCH /api/v2/admin/sellers/{id}/profile`
- `GET /api/v2/admin/sellers/{id}/access/profile`
- `PATCH /api/v2/admin/sellers/{id}/access/profile`
- `GET /api/v2/admin/sellers/{id}/access/products`
- `POST /api/v2/admin/sellers/{id}/access/products`
- `PUT /api/v2/admin/sellers/{id}/access/products/{productID}`
- `DELETE /api/v2/admin/sellers/{id}/access/products/{productID}`
- `PUT /api/v2/admin/sellers/{id}/access/products/{productID}/pricing`
- `GET /api/v2/admin/sellers/{id}/access/products/{productID}/profit`
- `POST /api/v2/admin/sellers/{id}/access/inventory/bulk-update`
- `GET /api/v2/admin/sellers/{id}/access/inventory/low-stock`
- `GET /api/v2/admin/sellers/{id}/access/inventory/categories`
- `GET /api/v2/admin/sellers/{id}/access/orders`
- `POST /api/v2/admin/sellers/{id}/access/orders/{orderID}/fulfill`
- `PUT /api/v2/admin/sellers/{id}/access/orders/{orderID}/status`
- `GET /api/v2/admin/sellers/{id}/access/analytics/sales`
- `GET /api/v2/admin/sellers/{id}/access/analytics/orders`
- `GET /api/v2/admin/sellers/{id}/access/analytics/inventory`
- `GET /api/v2/admin/sellers/{id}/access/analytics/product/{productID}`
- `PUT /api/v2/admin/sellers/{id}/approve`
- `PATCH /api/v2/admin/sellers/{id}/status`
- `PATCH /api/v2/admin/sellers/status`
- `GET /api/v2/admin/sellers/{id}/inventory`
- `PUT /api/v2/admin/sellers/{id}/inventory`
- `PUT /api/v2/admin/sellers/inventory/bulk`
- `GET /api/v2/admin/sellers/{sellerID}/wallet`
- `POST /api/v2/admin/sellers/{sellerID}/wallet/adjustments`
- `GET /api/v2/admin/seller-drafts`

### Product Management
- `GET /api/v2/admin/products`
- `GET /api/v2/admin/products/search`
- `POST /api/v2/admin/products/filter`
- `POST /api/v2/admin/products`
- `PATCH /api/v2/admin/products/bulk`
- `POST /api/v2/admin/products/bulk-delete`
- `GET /api/v2/admin/products/{id}`
- `PATCH /api/v2/admin/products/{id}`
- `DELETE /api/v2/admin/products/{id}`

### Product Queue Management
- `GET /api/v2/admin/products-queue`
- `PATCH /api/v2/admin/products-queue/bulk`
- `POST /api/v2/admin/products-queue/bulk/enrich`
- `POST /api/v2/admin/products-queue/bulk/promote`
- `POST /api/v2/admin/products-queue/bulk/reject`
- `POST /api/v2/admin/products-queue/bulk/delete`
- `GET /api/v2/admin/products-queue/{id}`
- `PUT /api/v2/admin/products-queue/{id}`
- `PUT /api/v2/admin/products-queue/{id}/enrich`
- `POST /api/v2/admin/products-queue/{id}/promote`
- `POST /api/v2/admin/products-queue/{id}/reject`
- `DELETE /api/v2/admin/products-queue/{id}`

### Order Management
- `GET /api/v2/admin/orders`
- `GET /api/v2/admin/orders/{orderID}`
- `PUT /api/v2/admin/orders/{orderID}`
- `PATCH /api/v2/admin/orders/status`
- `POST /api/v2/admin/orders/bulk-cancel`
- `PATCH /api/v2/admin/orders/{orderID}/customer`
- `POST /api/v2/admin/orders/{orderID}/cancel`
- `GET /api/v2/admin/carts`

### Logistics Operations
- `GET /api/v2/admin/logistics/operational-config`
- `PUT /api/v2/admin/logistics/operational-config`
- `GET /api/v2/admin/logistics/orders/{orderID}/booking-data`
- `POST /api/v2/admin/logistics/booking-data/bulk`
- `POST /api/v2/admin/logistics/exports`
- `GET /api/v2/admin/logistics/exports`
- `POST /api/v2/admin/logistics/orders/{orderID}/manual-booking`
- `POST /api/v2/admin/logistics/orders/manual-booking/bulk`
- `POST /api/v2/admin/logistics/orders/{orderID}/dex-location-verification`
- `POST /api/v2/admin/logistics/orders/{orderID}/dispatch-override`
- `POST /api/v2/admin/logistics/orders/dispatch-override/bulk`
- `POST /api/v2/admin/logistics/sellers/{sellerID}/pickup-strikes`
- `GET /api/v2/admin/logistics/pickup-aging`
- `POST /api/v2/admin/logistics/pickup-aging/process`

### Financials + Misc
- `GET /api/v2/admin/financials/summary`
- `GET /api/v2/admin/financials/orders`

---

## Shared Schemas

### `AdminAuthResponse`
```json
{
  "token": "jwt_token_here",
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "admin": {
    "id": "uuid",
    "email": "admin@juno.api",
    "name": "Admin Name",
    "role": "admin",
    "created_at": "2026-03-29T10:30:00Z",
    "updated_at": "2026-03-29T10:30:00Z"
  }
}
```

### `ApprovalResponse`
```json
{
  "message": "Seller approved",
  "welcome_email_queued": true
}
```

### `HealthResponse`
```json
{
  "status": "ok",
  "timestamp": "2026-03-29T10:30:00Z",
  "services": {
    "api": "ok",
    "database": "ok"
  }
}
```

---

## Auth + System

### Admin Login
`POST /api/v2/admin/auth/login`

Body:
```json
{
  "email": "omer@juno",
  "password": "OmerPakistan12#"
}
```

Response `200`: `AdminAuthResponse`

### Refresh Admin Token
`POST /api/v2/admin/auth/refresh`

Body:
```json
{
  "refresh_token": "opaque_refresh_token_here"
}
```

Response `200`: `AdminAuthResponse`

### System Health
`GET /api/v2/admin/health`

Response `200`: `HealthResponse`

---

## User Management

### List Users
`GET /api/v2/admin/users`

Returns all registered users.

### Create User
`POST /api/v2/admin/users`

Body:
```json
{
  "name": "Sara Ahmed",
  "email": "sara@example.com",
  "phone_number": "+923001234567",
  "password": "StrongPass123",
  "role": "user"
}
```

Creates an active, verified account directly from admin.

### Get User
`GET /api/v2/admin/users/{id}`

Returns a single user profile.

### Update User
`PATCH /api/v2/admin/users/{id}`

Body:
```json
{
  "name": "Sara A.",
  "institute": "LUMS",
  "gender": "female",
  "role": "staff",
  "account_status": "active"
}
```

Use this for profile edits plus role/status corrections in one request.

### Update User Status
`PATCH /api/v2/admin/users/{id}/status`

Body:
```json
{
  "account_status": "suspended",
  "role": "user"
}
```

Use this when the admin action is specifically account access or role control.

### Get Active OTPs
`GET /api/v2/admin/otps`

Returns users with active, non-expired OTPs.

---

## Seller Management

### List Sellers
`GET /api/v2/admin/sellers?status=pending&q=studio`

Filters:
- `status` — `pending`, `active`, `suspended`, `rejected`
- `q` — matches seller ID, name, email, business name, or legal name

### Get Seller
`GET /api/v2/admin/sellers/{id}`

Returns the full seller profile.

### Update Seller Profile
`PATCH /api/v2/admin/sellers/{id}/profile`

Body:
```json
{
  "business_name": "Luna Atelier",
  "contact_person": "Ayesha Khan",
  "phone_number": "+923001112233",
  "email": "ops@lunaatelier.pk",
  "legal_name": "Luna Atelier Pvt Ltd",
  "commission_rate": 0.15,
  "city": "Karachi"
}
```

Use this for end-to-end admin intervention during approval, remediation, or account cleanup.

### Seller Access Profile
`GET /api/v2/admin/sellers/{id}/access/profile`

Returns the seller profile through the seller module. This is the admin "act as seller" read path.

### Update Seller Access Profile
`PATCH /api/v2/admin/sellers/{id}/access/profile`

Body: `seller.UpdateSellerProfileRequest`

Example:
```json
{
  "name": "Luna Atelier Team",
  "business_name": "Luna Atelier",
  "legal_name": "Luna Atelier Pvt Ltd",
  "description": "Modern formalwear made in Karachi.",
  "short_description": "Pakistani contemporary occasionwear",
  "website": "https://lunaatelier.pk",
  "logo_url": "https://cdn.juno/logo.png",
  "banner_url": "https://cdn.juno/banner.png",
  "banner_mobile_url": "https://cdn.juno/banner-mobile.png",
  "contact": {
    "phone_number": "+923001112233",
    "contact_person_name": "Ayesha Khan",
    "support_email": "support@lunaatelier.pk"
  },
  "location": {
    "address": "12C Sunset Lane",
    "city": "Karachi",
    "state": "Sindh",
    "postal_code": "75500",
    "country": "Pakistan",
    "pickup_available": true
  }
}
```

This uses the same profile update logic as `/api/v2/seller/profile`, so admins get seller-grade validation and field handling instead of a separate admin-only mutation path.

### Approve or Suspend Seller
`PUT /api/v2/admin/sellers/{id}/approve`

Body:
```json
{
  "approved": true,
  "note": "KYC verified"
}
```

### Update Seller Status
`PATCH /api/v2/admin/sellers/{id}/status`

Body:
```json
{
  "status": "rejected",
  "note": "Banking information incomplete"
}
```

Allowed statuses:
- `pending`
- `active`
- `suspended`
- `rejected`

### Bulk Update Seller Status
`PATCH /api/v2/admin/sellers/status`

Body:
```json
{
  "seller_ids": ["seller-1", "seller-2"],
  "status": "active",
  "note": "Approved in weekly batch"
}
```

### Get Seller Inventory
`GET /api/v2/admin/sellers/{id}/inventory`

Returns an admin inventory checklist flattened by product variant:
- `product_id`
- `product_title`
- `variant_id`
- `variant_title`
- `sku`
- `available_quantity`
- `price`
- `in_stock`

### Update Seller Inventory
`PUT /api/v2/admin/sellers/{id}/inventory`

Body:
```json
{
  "product_id": "prod-1",
  "variant_id": "var-1",
  "available_quantity": 18
}
```

Updates the selected variant and recomputes product-level stock totals.

### Bulk Update Seller Inventory
`PUT /api/v2/admin/sellers/inventory/bulk`

Body:
```json
{
  "seller_id": "seller-1",
  "updates": [
    {
      "product_id": "prod-1",
      "variant_id": "var-s",
      "available_quantity": 10
    },
    {
      "product_id": "prod-2",
      "variant_id": "var-m",
      "available_quantity": 0
    }
  ]
}
```

Returns per-row success, missing, or failed results.

### List Seller Access Products
`GET /api/v2/admin/sellers/{id}/access/products?status=draft`

Lists the seller's products through seller-facing logic.

Supported `status` values:
- `draft`
- `active`
- `rejected`
- `archived`
- empty string for the seller module's default listing behavior

### Create Seller Access Product
`POST /api/v2/admin/sellers/{id}/access/products`

Body: full `catalog.Product` payload.

Behavior:
- creates the product through `seller.Service`
- auto-generates product IDs when missing
- auto-generates variant SKUs when missing
- recalculates pricing using `pkg/pricing`
- refreshes seller city from seller profile
- forces `seller_id` from the route
- defaults product status to `draft`

Use this when admin needs to create a product exactly as if the seller created it.

### Update Seller Access Product
`PUT /api/v2/admin/sellers/{id}/access/products/{productID}`

Body: full `catalog.Product` payload.

Behavior:
- enforces seller ownership
- preserves seller pricing semantics
- recomputes display price, payout, and discounts
- refreshes seller city from the latest profile
- validates unique variant SKUs

Use this when admin needs to repair or manage a seller-owned product without bypassing seller rules.

### Delete Seller Access Product
`DELETE /api/v2/admin/sellers/{id}/access/products/{productID}`

Deletes the seller-owned product through seller access rules.

### Update Seller Access Product Pricing
`PUT /api/v2/admin/sellers/{id}/access/products/{productID}/pricing`

Body:
```json
{
  "shipping_included": false,
  "cost_price": 2450
}
```

Uses the seller pricing workflow to update `shipping_included`, preserve brand-price semantics, and recompute display price and seller payout.

### Get Seller Access Product Profit
`GET /api/v2/admin/sellers/{id}/access/products/{productID}/profit?cost_price=2450&subscription_fee=5000`

Returns:
- `brand_price`
- `effective_brand_price`
- `commission`
- `seller_payout`
- `cost_price`
- `monthly_subscription_fee`
- `profit`
- `margin_percent`

### Bulk Update Seller Access Inventory
`POST /api/v2/admin/sellers/{id}/access/inventory/bulk-update`

Body:
```json
[
  {
    "product_id": "prod-1",
    "variant_id": "var-s",
    "quantity_change": 5,
    "reason": "restock"
  },
  {
    "product_id": "prod-1",
    "variant_id": "var-m",
    "quantity_change": -1,
    "reason": "damage"
  }
]
```

Uses the seller bulk inventory adjustment logic instead of direct quantity replacement.

### Get Seller Access Low Stock
`GET /api/v2/admin/sellers/{id}/access/inventory/low-stock?threshold=10`

Returns seller low-stock alerts:
- `product_id`
- `product_name`
- `current_quantity`
- `threshold`

### Get Seller Access Inventory Categories
`GET /api/v2/admin/sellers/{id}/access/inventory/categories`

Returns category counts for the seller's inventory.

### Get Seller Access Orders
`GET /api/v2/admin/sellers/{id}/access/orders`

Returns seller-scoped orders exactly as exposed to the seller dashboard.

### Fulfill Seller Access Order
`POST /api/v2/admin/sellers/{id}/access/orders/{orderID}/fulfill`

Marks a seller order fulfilled through the seller order workflow.

### Update Seller Access Order Status
`PUT /api/v2/admin/sellers/{id}/access/orders/{orderID}/status`

Body:
```json
{
  "status": "shipped"
}
```

Supported seller-facing statuses depend on seller module rules. Common values:
- `shipped`
- `delivered`
- `cancelled`

### Get Seller Access Sales Analytics
`GET /api/v2/admin/sellers/{id}/access/analytics/sales`

Returns:
- `total_revenue`
- `total_orders`
- `average_order_value`

### Get Seller Access Order Analytics
`GET /api/v2/admin/sellers/{id}/access/analytics/orders`

Returns:
- `pending`
- `shipped`
- `delivered`
- `cancelled`
- `total`

### Get Seller Access Inventory Analytics
`GET /api/v2/admin/sellers/{id}/access/analytics/inventory`

Returns:
- `total_products`
- `in_stock`
- `out_of_stock`
- `low_stock`

### Get Seller Access Product Analytics
`GET /api/v2/admin/sellers/{id}/access/analytics/product/{productID}`

Returns:
- `product_id`
- `product_name`
- `total_sold`
- `revenue`

### Seller Wallet
`GET /api/v2/admin/sellers/{sellerID}/wallet`

Returns current balance plus recent ledger entries.

### Adjust Seller Wallet
`POST /api/v2/admin/sellers/{sellerID}/wallet/adjustments`

Body:
```json
{
  "amount": 500,
  "direction": "debit",
  "reason": "late_dispatch_penalty",
  "adjustment_type": "penalty",
  "related_order_id": "order-1"
}
```

### List Seller Registration Drafts
`GET /api/v2/admin/seller-drafts?email=brand@example.com&step=3&page=1&limit=50`

Shows onboarding drafts that have not yet become full seller accounts.

---

## Product Management

### List Catalog Products
`GET /api/v2/admin/products?seller_id=seller-1&status=all&sort=created_at&order=desc&limit=50`

Admin listing for catalog operations using the same filter and pagination model as storefront catalog endpoints.

Behavior:
- defaults to `status=all` for admin, so draft, archived, rejected, and active products are visible
- includes products belonging to inactive sellers
- returns cursor pagination metadata in `meta.pagination`
- preserves badge priority ahead of secondary sorts like `created_at` and `popularity`

Useful query params:
- `status` — single status or comma-separated list, or `all`
- `seller_id`, `seller_ids`, `brands`
- `category`, `min_price`, `max_price`, `in_stock`
- `sort`, `order`, `cursor`, `page`, `limit`
- metadata filters like `departments`, `product_groups`, `genders`, `style_categories`, `aesthetics`, `occasions`, `materials`, `color_families`, `fits`, `patterns`, `collection_ids`, `validation_status`

### Search Catalog Products
`GET /api/v2/admin/products/search?keyword=lawn&status=all&limit=20`

Uses the same Atlas AI search behavior as storefront catalog search, but with admin visibility defaults.

### Filter Catalog Products
`POST /api/v2/admin/products/filter`

Body: `catalog.ProductFilter`

This uses the same catalog filtering business logic as storefront filtering. When `keyword` is present in the body, Atlas AI search is used before applying the rest of the filters.

### Create Catalog Product
`POST /api/v2/admin/products`

Body: full `catalog.Product` payload.

This is the manual admin product-creation path. It bypasses the seller queue and writes directly to the active catalog.

Admin product creation is direct-to-catalog:
- seller identity is validated
- seller name/logo/city are refreshed from seller profile
- empty product IDs are auto-generated
- empty status defaults to `active`
- `published_at` is auto-set when creating an active product
- optional `badges` can be attached by admin:
  - `marketing_campaign`
  - `best_seller`
  - `thrifted`

### Get Catalog Product
`GET /api/v2/admin/products/{id}`

Returns the active catalog product.

### Update Catalog Product
`PATCH /api/v2/admin/products/{id}`

Body: `catalog.UpdateProductRequest`

Example:
```json
{
  "title": "Updated product title",
  "short_description": "Sharper admin-managed merchandising copy",
  "pricing": {
    "price": 3999,
    "compare_at_price": 4500,
    "currency": "PKR",
    "discounted": true,
    "discount_value": 11.13,
    "discounted_price": 3999,
    "brand_price": 3900,
    "shipping_included": false
  },
  "status": "active",
  "is_featured": true,
  "badges": {
    "marketing_campaign": true,
    "best_seller": true,
    "thrifted": false
  }
}
```

### Delete Catalog Product
`DELETE /api/v2/admin/products/{id}`

Removes the catalog product.

### Bulk Update Catalog Products
`PATCH /api/v2/admin/products/bulk`

Body:
```json
{
  "product_ids": ["prod-1", "prod-2"],
  "update": {
    "status": "archived",
    "is_featured": false
  }
}
```

Applies the same partial update payload to every listed product.

### Bulk Delete Catalog Products
`POST /api/v2/admin/products/bulk-delete`

Body:
```json
{
  "product_ids": ["prod-3", "prod-4", "prod-5"]
}
```

Deletes many products in one request and reports per-product outcomes.

---

## Product Queue Management

Queue status flow:
- `queued`
- `synced`
- `enrichment_pending`
- `ready`
- `promoted`
- `failed`

### List Products Queue
`GET /api/v2/admin/products-queue`

Returns all queue items across sellers.

### Get Queue Item
`GET /api/v2/admin/products-queue/{id}`

Returns one queue item including seller, product snapshot, enrichment, and errors.

### Update Queue Product
`PUT /api/v2/admin/products-queue/{id}`

Body: full `catalog.Product` payload

Use this when ops or merchandising needs to fix copy, variants, images, tags, or pricing before promotion. Seller linkage and queue enrichment are preserved.

### Bulk Update Queue Items
`PATCH /api/v2/admin/products-queue/bulk`

Body:
```json
{
  "queue_ids": ["queue-1", "queue-2"],
  "update": {
    "title": "Revised merchandising title",
    "short_description": "Cleaned up by admin ops",
    "tags": ["festive", "summer-edit"]
  }
}
```

Applies one shared partial update payload across multiple queued products.

### Enrich Queue Item
`PUT /api/v2/admin/products-queue/{id}/enrich`

Body:
```json
{
  "product_type": "Eastern",
  "gender": "Female",
  "sizing_guide": {
    "S": { "chest": 86, "waist": 68 },
    "M": { "chest": 91, "waist": 73 }
  }
}
```

### Bulk Enrich Queue Items
`POST /api/v2/admin/products-queue/bulk/enrich`

Body:
```json
{
  "queue_ids": ["queue-10", "queue-11"],
  "enrichment": {
    "product_type": "Eastern",
    "gender": "Female",
    "sizing_guide": {
      "S": { "chest": 86, "waist": 68 },
      "M": { "chest": 91, "waist": 73 }
    }
  }
}
```

Use this when ops needs to standardize metadata for multiple queued products at once.

### Promote Queue Item
`POST /api/v2/admin/products-queue/{id}/promote`

Queue item must already be `ready`.

### Reject Queue Item
`POST /api/v2/admin/products-queue/{id}/reject`

Body:
```json
{
  "reason": "Missing size chart and inconsistent SKU structure"
}
```

Sets the queue item to `failed`, appends the rejection reason to queue errors, and emails the seller.

### Bulk Promote Queue Items
`POST /api/v2/admin/products-queue/bulk/promote`

Body:
```json
{
  "queue_ids": ["queue-1", "queue-2"],
  "allow_unenriched": false
}
```

Promotes multiple queue items in one request.

- Default behavior: only `ready` queue items are promoted.
- When `allow_unenriched` is `true`, admin can promote directly from queue into the active catalog even if enrichment has not been completed yet.

### Bulk Reject Queue Items
`POST /api/v2/admin/products-queue/bulk/reject`

Body:
```json
{
  "queue_ids": ["queue-3", "queue-4"],
  "reason": "Missing imagery and invalid variant setup"
}
```

Rejects multiple queue items with one shared reason.

### Bulk Delete Queue Items
`POST /api/v2/admin/products-queue/bulk/delete`

Body:
```json
{
  "queue_ids": ["queue-5", "queue-6"]
}
```

Deletes multiple queue items and returns per-item results.

### Delete Queue Item
`DELETE /api/v2/admin/products-queue/{id}`

Hard-removes the queue record.

---

## Order Management

### List Orders
`GET /api/v2/admin/orders`

Returns all child orders across the platform.

### Get Order
`GET /api/v2/admin/orders/{orderID}`

Returns the full child order including tracking snapshot and shipping address.

### Update Order Status (Legacy)
`PUT /api/v2/admin/orders/{orderID}`

Body:
```json
{
  "status": "packed"
}
```

### Bulk Update Orders
`PATCH /api/v2/admin/orders/status`

Body:
```json
{
  "updates": [
    { "order_id": "order-1", "status": "packed" },
    { "order_id": "order-2", "status": "at_warehouse" },
    { "order_id": "order-3", "status": "cancelled", "note": "Ops cancellation" }
  ]
}
```

Supported statuses:
- `pending`
- `confirmed`
- `packed`
- `handed_to_rider`
- `at_warehouse`
- `out_for_delivery`
- `delivery_attempted`
- `delivered`
- `cancelled`
- `returned`

### Bulk Cancel Orders
`POST /api/v2/admin/orders/bulk-cancel`

Body:
```json
{
  "order_ids": ["order-10", "order-11", "order-12"],
  "reason": "Inventory audit failed"
}
```

Cancels multiple orders and appends the same cancellation reason to each tracking history.

### Update Order Customer
`PATCH /api/v2/admin/orders/{orderID}/customer`

Body:
```json
{
  "name": "Sara Ahmed",
  "email": "sara@example.com",
  "phone": "+923001234567",
  "address_line1": "12 Main Gulberg",
  "address_line2": "Near Stadium Road",
  "city": "Lahore"
}
```

Use this to repair buyer-facing delivery details without a low-level DB edit.

### Cancel Order
`POST /api/v2/admin/orders/{orderID}/cancel`

Body:
```json
{
  "reason": "Fraud review failed"
}
```

Adds a cancellation milestone to tracking and persists the cancelled state.

### Get All Carts
`GET /api/v2/admin/carts`

Returns all carts, including guest carts stored by `X-Guest-Cart-Id`.

### Recommended Cross-Module Admin Order Tracking

For sequential tracking transitions and interactive timeline management, also use:
- `GET /api/v2/commerce/admin/orders`
- `GET /api/v2/commerce/admin/orders/{id}`
- `POST /api/v2/commerce/admin/orders/{id}/cancel`
- `PATCH /api/v2/commerce/admin/orders/{id}/status`
- `PUT /api/v2/commerce/admin/orders/{id}/tracking/warehouse`
- `PATCH /api/v2/commerce/admin/orders/{id}/tracking/eta`

Documentation: [Commerce Module Tracking Docs](../commerce/docs.md#admin-order-management)

---

## Logistics Operations

### Get Operational Config
`GET /api/v2/admin/logistics/operational-config`

Returns the active runtime policy enforced by the backend:
- DEX pickup threshold
- seller-center dropoff SLA
- strike expiry
- strike suspension threshold
- configured penalties
- seller-center source
- recipient phone export format
- COD split policy
- DEX location strictness
- wallet deduction policy
- seller-center liability policy
- supported carriers

### Update Operational Config
`PUT /api/v2/admin/logistics/operational-config`

Body:
```json
{
  "max_strikes_before_suspension": 4,
  "strike_expiry_days": 45,
  "dex_pickup_threshold": 7,
  "sla_hours": 36,
  "supported_carriers": ["DEX", "Smartlane", "Trax"]
}
```

This updates the in-memory operational overrides used by admin logistics workflows.

### Booking Data
`GET /api/v2/admin/logistics/orders/{orderID}/booking-data?carrier=dex`

Returns booking validation, warnings, parcel data, carrier payload, export preview, and location resolution when available.

### Bulk Booking Data
`POST /api/v2/admin/logistics/booking-data/bulk`

Body:
```json
{
  "carrier": "dex",
  "order_ids": ["order-1", "order-2"],
  "include_location_resolution": true
}
```

### Create Logistics Export
`POST /api/v2/admin/logistics/exports`

Body:
```json
{
  "carrier": "smartlane",
  "order_ids": ["order-1", "order-2"],
  "format": "xlsx",
  "require_human_verified_locations": false
}
```

### List Logistics Exports
`GET /api/v2/admin/logistics/exports?carrier=dex&status=ready&page=1&limit=20`

### Manual Booking
`POST /api/v2/admin/logistics/orders/{orderID}/manual-booking`

Body:
```json
{
  "carrier": "dex",
  "consignment_number": "CN-12345",
  "airway_bill_number": "AWB-12345",
  "tracking_url": "https://carrier.example.com/track/CN-12345",
  "notes": "Booked by ops after portal outage"
}
```

### Bulk Manual Booking
`POST /api/v2/admin/logistics/orders/manual-booking/bulk`

Body:
```json
{
  "bookings": [
    {
      "order_id": "order-1",
      "carrier": "dex",
      "consignment_number": "CN-1001",
      "airway_bill_number": "AWB-1001"
    },
    {
      "order_id": "order-2",
      "carrier": "smartlane",
      "consignment_number": "CN-1002",
      "tracking_url": "https://carrier.example.com/track/CN-1002"
    }
  ]
}
```

Writes manual booking rows for multiple orders and returns per-order outcomes.

### DEX Location Verification
`POST /api/v2/admin/logistics/orders/{orderID}/dex-location-verification`

Body:
```json
{
  "province": "Punjab",
  "district": "Lahore",
  "ward": "Gulberg",
  "specific_address": "12 Main Gulberg",
  "apply_as_override": true
}
```

### Dispatch Override
`POST /api/v2/admin/logistics/orders/{orderID}/dispatch-override`

Body:
```json
{
  "dispatch_mode": "carrier_pickup",
  "reason": "Strategic seller approved for pickup below threshold",
  "approval_reference": "OPS-2026-0515-001",
  "approved_by": "ops-lead@juno"
}
```

### Bulk Dispatch Override
`POST /api/v2/admin/logistics/orders/dispatch-override/bulk`

Body:
```json
{
  "overrides": [
    {
      "order_id": "order-30",
      "dispatch_mode": "carrier_pickup",
      "reason": "Approved pickup exception",
      "approval_reference": "OPS-2026-0709-01"
    },
    {
      "order_id": "order-31",
      "dispatch_mode": "manual_override",
      "reason": "DEX routing correction"
    }
  ]
}
```

Applies dispatch overrides across multiple orders with per-order success or failure reporting.

### Pickup Strikes
`POST /api/v2/admin/logistics/sellers/{sellerID}/pickup-strikes`

Body:
```json
{
  "order_id": "order-1",
  "reason": "seller_center_dropoff_missed",
  "carrier": "dex",
  "notes": "Seller missed seller-center dropoff due time"
}
```

### Pickup Aging
`GET /api/v2/admin/logistics/pickup-aging?seller_id=seller-1&carrier=dex`

Returns rows with:
- `seller_dispatch_due_at`
- `days_waiting_for_pickup`
- `pickup_urgency`
- threshold state
- strike eligibility

### Process Pickup Aging
`POST /api/v2/admin/logistics/pickup-aging/process?seller_id=seller-1&carrier=dex`

Creates overdue strikes where policy conditions are met and no active strike already exists for the same order/reason.

---

## Financials

### Financial Summary
`GET /api/v2/admin/financials/summary?from=2026-07-01&to=2026-07-31&carrier=dex`

Returns:
- GMV
- commission revenue
- shipping revenue
- generated revenue
- take rate
- courier shipping cost
- gross income
- seller payout
- booked/unbooked order counts

### Financial Orders
`GET /api/v2/admin/financials/orders?from=2026-07-01&to=2026-07-31&carrier=smartlane&page=1&limit=50`

Returns order-level financial rows for reconciliation and export checks.

---

## Cross-Module Admin Endpoints

Specialized admin functionality also exists in other modules:

### Catalog Admin
- `POST /api/v2/admin/catalog/collections`
- `GET /api/v2/admin/catalog/drops`
- `PATCH /api/v2/admin/catalog/drops/{id}/status`
- `POST /api/v2/admin/catalog/drops/{id}/products`
- `PATCH /api/v2/admin/catalog/products/{id}`
- `DELETE /api/v2/admin/catalog/products/{id}`

Docs: [Catalog Admin Docs](../catalog/docs.md)

### Analytics
- `GET /admin/probe/overview`
- `GET /admin/probe/real-time`
- `GET /admin/probe/users`
- `GET /admin/probe/commerce`
- `GET /admin/probe/operations`

Docs: [Probe Analytics Docs](../analytics/docs.md)

### Notifications
- `POST /api/v2/admin/notifications/broadcast`

### Ambassador
- `POST /api/v2/admin/ambassador/tasks`

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400 INVALID_QUERY` | Query string validation failed |
| `400 BAD_REQUEST` | Invalid admin action or unsupported value |
| `401 UNAUTHORIZED` | Missing or invalid admin token |
| `404 NOT_FOUND` | Requested user, seller, queue item, product, or order was not found |
