# Admin Module

## DEX manual rows and manual booking

`GET /api/v2/admin/logistics/orders/{orderID}/booking-data?delivery_note=...` and `POST /api/v2/admin/logistics/booking-data/bulk` return one staff-copyable row per product in `rows`. The rows contain: order number, sender address, recipient name and 10-digit phone, province, district, wards, specific address, product name, unit price, quantity, weight, length, width, height, COD, COD amount, failed-delivery storage, and delivery note. Sender address is deliberately `""` so staff select it in DEX; default weight/length/width/height are `0.2` kg, `15` cm, `20` cm and `0.5` cm. Specific address uses the ready ChatGPT-formatted address where available, otherwise the complete saved address, always including city. COD orders put the full COD amount on the first product row and `0` on later rows. Bank-deposit orders put `COD: N` and leave the COD amount blank on every row. The default delivery note is `Call before delivery`; pass `delivery_note` to override it. DEX order numbers contain digits only; a trailing `-A`/`-B`/`-C` becomes `1`/`2`/`3`. There is no DEX/Smartlane export, location-resolution, dispatch/SLA, pickup-threshold, parcel, or carrier-payload system. Manual booking is DEX-only and requires exactly the DEX tracking number plus the `airway_bill_url` returned by the existing `POST /api/v2/files/upload` media upload. The API fills the DEX tracking URL and booking time itself.

## DEX statement imports and brand payments

Upload the Net-Off `.xlsx` with the existing simple media endpoint, then send the returned `file.object` to `POST /api/v2/admin/financials/dex-statements`:

```json
{"statement_object_name":"2026/07/31/uploaded-statement"}
```

There is no order selection, manually entered statement number, bank reference, or DEX payment checkbox. The server first verifies that `statement_object_name` is an exact record in the media `files` collection, then reads that same storage object. The importer reads `Statement Number`, `Tracking No.`, `COD Amount`, `Shipping Fee`, `Shipping Fee VAT`, `Income Tax`, `Sales Tax`, and `Payable Amount`; it keeps every supplied Net-Off column in each persisted row. It normalizes each tracking value and matches it against both saved DEX `tracking_number` and `consignment_number`. Matched orders are marked `dex_payment_status: "received"`; unmatched DEX tracking numbers remain on the imported document for operations review. Duplicate file hashes and statement numbers are rejected before anything is saved.

The import response explicitly returns `matched_order_count`, `unmatched_tracking_count`, `order_ids`, `statement_object_name`, `statement_file_name`, and every persisted `rows` entry. The portal must use `matched_order_count` for its matched number—not the number of brand statements. Each row includes its source `tracking_number`, `normalized_tracking_number`, `match_status` (`matched` or `unmatched`), `matched_order_id`, and `matched_by` (`tracking_number` or `consignment_number`) so operations can immediately see which workbook values were processed and why a row did or did not match.

The import automatically creates one brand payment statement per seller represented by the matched orders. Its rows use each order's immutable `financials.brand_price` and checkout-time commission rate; the final transfer is `brand price − Juno commission`, not DEX remittance minus commission. It separately shows COD, DEX delivery fee, DEX VAT, income-tax withholding, sales-tax withholding, and DEX net remittance. Under the current Juno settlement policy those DEX deductions do not reduce the contracted brand transfer; operations must retain the courier tax certificate and confirm seller filing treatment with a Pakistan tax adviser. A seller without complete bank details receives a visible `needs_bank_details` statement, which cannot be paid until the details are fixed. Existing pre-snapshot statements are recalculated once from their DEX source and current catalog brand price when read. `GET /api/v2/admin/financials/dex-statements` lists the fully converted source statements, `GET /api/v2/admin/financials/dex-statements/{id}` returns every converted row, and `GET /api/v2/admin/financials/brand-statements` lists their split brand payments.

Admin routes: `GET /api/v2/admin/financials/brand-statements`, `GET /api/v2/admin/financials/brand-statements/{id}`, and `POST /api/v2/admin/financials/brand-statements/{id}/pay`. Upload payment proof with the same simple media endpoint and submit its returned `file.url`:

```json
{"payment_proof_url":"https://storage.googleapis.com/junos_storage/...","bank_reference":"BANK-123","payment_date":"2026-07-31"}
```

Only an `open` brand statement may be marked paid. Printable admin statement/invoice views are `GET https://api.juno.com.pk/api/v2/admin/financials/brand-statements/{id}/statement` and `/invoice`; each displays bank details, order rows, deductions, and the final amount to transfer. The customer invoice aliases are `GET /api/v2/commerce/orders/{id}/invoice` for signed-in customers and `GET /api/v2/commerce/guest/orders/{id}/invoice` with the existing guest proof.

**Frontend notes:** require a media-uploaded `.xlsx` and let the server read its statement number. Display the returned row decisions and refresh the financial list after success; do not calculate DEX totals in the browser. **Rollback/fallback:** hide the action and status filter; the additive batch and booking fields remain auditable.

## Address formatting and confirmation

### `POST /api/v2/admin/orders/{orderID}/address/format`

Creates a fresh ready-to-copy ChatGPT prompt for one seller order. Requires admin authentication; no request
body. Returns `200` with the `address_review` object documented in the Commerce module. The action records
`formatted_at`; it does not confirm the address.

### `PATCH /api/v2/admin/orders/{orderID}/customer`

This existing admin-only endpoint accepts the existing optional customer/address fields plus ChatGPT output:
`formatted_address`, `district`, `province`, `missing_fields`, and `customer_message`, plus
`customer_confirmed` (optional boolean). The prompt is Pakistan COD-aware: it may normalize supported locality
facts, but must leave unknown district/province/address details blank rather than invent them.
It saves the structured correction and returns the updated seller order. Confirmation is saved only when a
ready review has no missing fields, with the admin ID/time in `address_review`. Frontend: refresh from this
response and keep confirmation disabled while fields remain. Rollback: omit the optional review fields;
normal customer-address editing continues.

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
- `PATCH /api/v2/admin/products/size-chart/bulk`
- `POST /api/v2/admin/products/bulk-delete`
- `GET /api/v2/admin/products/{id}`
- `PATCH /api/v2/admin/products/{id}`
- `PATCH /api/v2/admin/products/{id}/price`
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
- `PATCH /api/v2/admin/orders/{orderID}/items/{itemID}/variant`

Order contact, address, payment, receipts, and resendable update notices are
documented in the [Commerce Module](../commerce/docs.md#correcting-an-order).
- `GET /api/v2/admin/carts`

### Logistics Operations
- `GET /api/v2/admin/logistics/orders/{orderID}/booking-data`
- `POST /api/v2/admin/logistics/booking-data/bulk`
- `POST /api/v2/admin/logistics/orders/{orderID}/manual-booking`
- `POST /api/v2/admin/logistics/orders/manual-booking/bulk`

### Financials + Misc
- `GET /api/v2/admin/financials/summary`
- `GET /api/v2/admin/financials/orders`

### WordPress Imports
- `POST /api/v2/admin/wordpress/import`

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

Size charts are optional under `sizing_guide`:

```json
{
  "sizing_guide": {
    "image_url": "https://storage.googleapis.com/juno/size-charts/product.png",
    "html_table": "<table><thead><tr><th>Size</th><th>Length</th></tr></thead><tbody><tr><td>M</td><td>42</td></tr></tbody></table>",
    "measurement_unit": "inches"
  }
}
```

Upload images with `POST /api/v2/files/upload` and use the returned public URL. HTML must contain a table and is restricted to safe table markup; only `colspan`, `rowspan`, and `scope` attributes are accepted.

For colour-specific media, set `variants[].image_url` to the matching product-image URL. Keep the same URL in the product's top-level `images` gallery.

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
  "variants": [
    {
      "id": "variant-blue-m",
      "options": { "Color": "Blue", "Size": "M" },
      "image_url": "https://cdn.example.com/product-blue.jpg"
    }
  ],
  "sizing_guide": {
    "html_table": "<table><tr><th>Size</th><th>Length</th></tr><tr><td>M</td><td>42</td></tr></table>",
    "measurement_unit": "inches"
  },
  "is_featured": true,
  "badges": {
    "marketing_campaign": true,
    "best_seller": true,
    "thrifted": false
  }
}
```

### Update Product Price Across Variants
`PATCH /api/v2/admin/products/{id}/price`

Body:
```json
{
  "price": 2189
}
```

Applies the raw price to every variant, then recalculates customer display prices, payouts, and discount fields.

Response `200`:
```json
{
  "message": "Product price updated"
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

### Bulk Assign Size Chart
`PATCH /api/v2/admin/products/size-chart/bulk`

Assigns one `sizing_guide` to up to 10,000 products with one database update. It does not read or replace individual product documents.

```json
{
  "product_ids": ["prod-1", "prod-2"],
  "sizing_guide": {
    "image_url": "https://storage.googleapis.com/juno/size-charts/brand-guide.png",
    "html_table": "<table><tr><th>Size</th><th>Chest</th></tr><tr><td>M</td><td>40</td></tr></table>",
    "measurement_unit": "inches"
  }
}
```

Response counts unique requested IDs, matched product documents, and documents actually modified. HTML table markup permits `class`, `id`, `colspan`, `rowspan`, and `scope` attributes only.

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

Bank-deposit orders appear in the regular admin order list/detail with `payment_method: "bank_deposit"`, `payment_status: "pending_verification"`, `payment_proof_url`, its shared-proof note, and the server-calculated `financials.discount_amount`. Review the proof, then verify it with the endpoint below; use the existing cancel-order action if payment is invalid. DEX/manual-booking exports set their `cod_amount` to zero for these prepaid orders.

Regular admin order responses include a derived `dex_order_number` for quick DEX entry. It keeps numeric characters from `order_number` and converts a final `-A` through `-I` suffix to `1` through `9`: `ORD-010826-1234-A` becomes `01082612341`.

### List Orders
`GET /api/v2/admin/orders`

Returns all child orders across the platform.

### Get Order
`GET /api/v2/admin/orders/{orderID}`

Returns the full child order including tracking snapshot and shipping address.

### Verify Bank-Deposit Payment
`POST /api/v2/admin/orders/{orderID}/payment/verify`

Marks a bank-deposit order with a stored payment proof as `payment_status: "verified"`. Admin authentication is required; COD orders and orders without a proof return `400`.

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

### Booking Data
`GET /api/v2/admin/logistics/orders/{orderID}/booking-data`

Returns only `{order_id, order_number, rows}`. Add optional `?delivery_note=...` to override the default `Call before delivery` note. `rows` contains the 19 manual DEX fields staff copy into DEX. It does not validate pickup SLAs, resolve locations, choose a dispatch mode, build a parcel object, or create a workbook.

### Bulk Booking Data
`POST /api/v2/admin/logistics/booking-data/bulk`

Body:
```json
{
  "order_ids": ["order-1", "order-2"],
  "delivery_note": "Leave with reception"
}
```

### Manual Booking
`POST /api/v2/admin/logistics/orders/{orderID}/manual-booking`

Body:
```json
{
  "consignment_number": "PK-DEX204946602",
  "airway_bill_url": "https://storage.googleapis.com/junos_storage/2026/07/31/airway-bill.pdf"
}
```

Manual booking is DEX-only. Upload the PDF, JPG, or PNG first through the existing media endpoint, then send its returned `file.url` as `airway_bill_url`. These are the only two inputs. The API generates the DEX tracking URL and booking time, immediately imports every DEX timeline event already available for that tracking number, and then polls non-final parcels hourly from 08:00 through 22:00 Pakistan time and at 00:00, 03:00 and 06:00 otherwise. It does not calculate courier cost, dispatch SLA, pickup threshold, revenue, or seller payout.

The successful manual-booking response includes `status`, `dex_raw_status`, `last_checked_at`, and `tracking_history` when DEX responds; refresh the order detail afterward to display the persisted history.

### Admin order detail delivery booking
`GET /api/v2/admin/orders/{orderID}` returns the seller order and its latest manual booking in `delivery_booking`. The relationship uses the same seller `order_id` accepted by manual booking; it never reads a parent order. When no booking exists, `delivery_booking` is `null`.

```json
{
  "id": "order-1",
  "order_number": "ORD-1",
  "delivery_booking": {
    "order_id": "order-1",
    "consignment_number": "PK-DEX204946602",
    "tracking_number": "PK-DEX204946602",
    "airway_bill_url": "https://storage.googleapis.com/junos_storage/2026/07/31/airway-bill.pdf",
    "tracking_url": "https://www.dex.com.pk/tracking?references=PK-DEX204946602",
    "status": "booked",
    "dex_raw_status": "domestic_package_stationed_in",
    "last_checked_at": "2026-07-31T12:00:00Z",
    "tracking_history": [{"status":"in_transit","raw_status":"domestic_package_stationed_in","source":"manual_booking"}],
    "booking_time": "2026-07-31T12:00:00Z",
    "booked_at": "2026-07-31T12:00:00Z"
  }
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
      "consignment_number": "PK-DEX204946602",
      "airway_bill_url": "https://storage.googleapis.com/junos_storage/2026/07/31/airway-bill.pdf"
    }
  ]
}
```

Writes manual booking rows for multiple orders and returns per-order outcomes.

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
`GET /api/v2/admin/financials/orders?from=2026-07-01&to=2026-07-31&page=1&limit=50`

Returns order-level financial rows for reconciliation and export checks.

---

## Cross-Module Admin Endpoints

Specialized admin functionality also exists in other modules:

### Metadata Taxonomies
`GET /api/v2/admin/metadata/taxonomies`

Returns the MongoDB-backed catalog and seller taxonomies used by admin metadata tools.

### Catalog Admin
- `POST /api/v2/admin/catalog/collections`
- `GET /api/v2/admin/catalog/drops`
- `PATCH /api/v2/admin/catalog/drops/{id}/status`
- `POST /api/v2/admin/catalog/drops/{id}/products`
- `PATCH /api/v2/admin/catalog/products/{id}`
- `DELETE /api/v2/admin/catalog/products/{id}`

Docs: [Catalog Admin Docs](../catalog/docs.md)

### Analytics
The Admin module owns no analytics routes. Customer funnel reporting is owned
by the Analytics module: `GET /api/v2/admin/analytics/funnel`.

Docs: [Customer Funnel Analytics](../analytics/docs.md)

### Notifications
- `POST /api/v2/admin/notifications/broadcast`

### WordPress / WooCommerce Import
`POST /api/v2/admin/wordpress/import`

Imports a WooCommerce product-export CSV for the specified seller. This endpoint
is implemented by the seller module but is restricted to admin users. The import
runs asynchronously and returns `202 Accepted` when it has been queued.

Send `multipart/form-data` with:

- `seller_id` (required): Juno seller ID.
- `file` (required): WooCommerce product-export CSV, up to 25 MB.

Response:
```json
{
  "message": "WooCommerce product import started",
  "count": 0
}
```

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
