# Admin Module

Platform administration endpoints.

Auth:
- Every endpoint in this module requires admin auth.
- Send `Authorization: Bearer <admin_token>`.

Router coverage:
- `POST /api/v2/admin/auth/login`
- `GET /api/v2/admin/health`
- `GET /api/v2/admin/orders`
- `PUT /api/v2/admin/orders/{orderID}`
- `GET /api/v2/admin/carts`
- `GET /api/v2/admin/products-queue`
- `PUT /api/v2/admin/products-queue/{id}/enrich`
- `POST /api/v2/admin/products-queue/{id}/promote`
- `DELETE /api/v2/admin/products-queue/{id}`
- `GET /api/v2/admin/otps`
- `GET /api/v2/admin/waitlist`
- `GET /api/v2/admin/users`
- `GET /api/v2/admin/sellers`
- `GET /api/v2/admin/sellers/{id}`
- `PUT /api/v2/admin/sellers/{id}/approve`
- `GET /api/v2/admin/financials/summary`
- `GET /api/v2/admin/financials/orders`
- `GET /api/v2/admin/logistics/operational-config`
- `GET /api/v2/admin/logistics/orders/{orderID}/booking-data`
- `POST /api/v2/admin/logistics/booking-data/bulk`
- `POST /api/v2/admin/logistics/exports`
- `GET /api/v2/admin/logistics/exports`
- `POST /api/v2/admin/logistics/orders/{orderID}/manual-booking`
- `POST /api/v2/admin/logistics/orders/{orderID}/dex-location-verification`
- `POST /api/v2/admin/logistics/orders/{orderID}/dispatch-override`
- `POST /api/v2/admin/logistics/sellers/{sellerID}/pickup-strikes`
- `GET /api/v2/admin/logistics/pickup-aging`
- `POST /api/v2/admin/logistics/pickup-aging/process`

---

## Shared Response Schemas

### `Admin`
```json
{
  "id": "uuid",
  "email": "admin@juno.api",
  "name": "Admin Name",
  "role": "admin",
  "created_at": "2026-03-29T10:30:00Z",
  "updated_at": "2026-03-29T10:30:00Z"
}
```

### `AdminAuthResponse`
```json
{
  "token": "jwt_token_here",
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

### `ApprovalResponse`
```json
{
  "message": "Seller approved",
  "welcome_email_queued": true
}
```

The same schema is used for rejection/suspension responses, with `message` changed accordingly.

---

## Authentication

### Admin Login
`POST /api/v2/admin/auth/login`

**Body**
```json
{
  "email": "omer@juno",
  "password": "OmerPakistan12#"
}
```

**Response `200`**: `AdminAuthResponse`

**Common errors**
- `401 UNAUTHORIZED` — invalid credentials

---

## System

### System Health
`GET /api/v2/admin/health`

Auth: admin token required

**Response `200`**: `HealthResponse`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

## Logistics Operations

### Operational Config
`GET /api/v2/admin/logistics/operational-config`

Returns the runtime policy currently enforced by the backend: DEX pickup threshold, seller-center dropoff SLA, strike expiry, strike suspension threshold, penalty amounts, DEX seller-center CSV source, phone export format, COD split behavior, DEX location strictness, wallet deduction policy, and seller-center late-dispatch liability policy.

The defaults are:
- DEX pickup threshold: `5`
- Seller-center dropoff SLA: `24` hours
- Strike expiry: `30` days
- Suspension threshold: `3` active strikes
- Penalties: read from env vars and default to `0` until approved

### Dispatch Override
`POST /api/v2/admin/logistics/orders/{orderID}/dispatch-override`

Use this to override DEX dispatch mode after ops review.

**Body**
```json
{
  "dispatch_mode": "carrier_pickup",
  "reason": "Strategic seller approved for pickup below threshold",
  "approval_reference": "OPS-2026-0515-001",
  "approved_by": "ops-lead@juno"
}
```

If the seller has fewer than the DEX pickup threshold and the override changes the parcel to `carrier_pickup` or `manual_override`, `approval_reference` is required. `approved_by` defaults to the acting admin.

### Pickup Aging
`GET /api/v2/admin/logistics/pickup-aging?seller_id=seller-1&carrier=dex`

Returns ready parcels that are still waiting for carrier pickup or seller-center dropoff, including `seller_dispatch_due_at`, `days_waiting_for_pickup`, `pickup_urgency`, threshold state, and strike eligibility.

`POST /api/v2/admin/logistics/pickup-aging/process`

Processes the aging queue and auto-creates a strike when a row is breached and no active strike already exists for the same order/reason.

### Pickup Strikes
`POST /api/v2/admin/logistics/sellers/{sellerID}/pickup-strikes`

**Body**
```json
{
  "order_id": "order-1",
  "reason": "seller_center_dropoff_missed",
  "carrier": "dex",
  "notes": "Seller missed seller-center dropoff due time"
}
```

The response includes active strike count, expiry time, penalty type, and penalty amount. On the configured active strike threshold, the seller is suspended.

---

## Orders

### Get All Orders
`GET /api/v2/admin/orders`

Auth: admin token required

Returns all child orders across all sellers and users.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "parent_order_id": "parent-1",
    "order_number": "ORD-00123",
    "seller_id": "seller-1",
    "user_id": "user-1",
    "order_items": [
      {
        "id": "item-1",
        "product_id": "prod-1",
        "variant_id": "var-1",
        "quantity": 1,
        "unit_price": 3500
      }
    ],
    "status": "confirmed",
    "total": 3700,
    "created_at": "2026-03-28T14:30:00Z"
  }
]
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

### Update Order
`PUT /api/v2/admin/orders/{orderID}` (Legacy)
`PATCH /api/v2/commerce/admin/orders/{id}/status` (Recommended for Tracking)

Auth: admin token required

The `PATCH` route under commerce module is recommended as it supports the **Interactive Order Tracking** timeline and FSM validation.

**Body (PATCH commerce route)**
```json
{ 
  "status": "at_warehouse",
  "note": "Optional update note"
}
```

See [Commerce Module Tracking Docs](../commerce/docs.md#admin-order-management) for additional interactive tracking endpoints:
- `PUT /api/v2/commerce/admin/orders/{id}/tracking/warehouse` — Set map anchor
- `PATCH /api/v2/commerce/admin/orders/{id}/tracking/eta` — Manual ETA override

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — invalid order status
- `401 UNAUTHORIZED` — missing or invalid admin token

---

### Get All Carts
`GET /api/v2/admin/carts`

Auth: admin token required

**Response `200`**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "items": [
      {
        "product_id": "uuid",
        "variant_id": "uuid",
        "quantity": 2,
        "price": 3500
      }
    ],
    "gift_details": null,
    "created_at": "2026-03-28T14:30:00Z",
    "updated_at": "2026-03-28T15:00:00Z"
  }
]
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

## Product Queue

### Get Products Queue
`GET /api/v2/admin/products-queue`

Auth: admin token required

Returns all seller queue items regardless of status.

**Response `200`**
```json
[
  {
    "id": "queue-1",
    "seller_id": "seller-1",
    "product": {
      "id": "prod-1",
      "handle": "floral-lawn-suit",
      "title": "Floral Lawn Suit",
      "description": "Printed 3-piece lawn suit",
      "seller_id": "seller-1",
      "seller_name": "Raza Fabrics",
      "categories": [],
      "product_type": "Eastern",
      "pricing": { "price": 3500, "currency": "PKR", "discounted": false },
      "images": [],
      "variants": [],
      "options": [],
      "tags": [],
      "inventory": { "in_stock": true, "available_quantity": 12 },
      "shipping_details": { "free_shipping": false },
      "status": "draft",
      "created_at": "2026-03-28T14:30:00Z",
      "updated_at": "2026-03-28T14:30:00Z",
      "rating": 0,
      "review_count": 0,
      "is_trending": false,
      "is_featured": false
    },
    "status": "queued",
    "source": "manual",
    "errors": [],
    "created_at": "2026-03-28T14:30:00Z",
    "updated_at": "2026-03-28T15:00:00Z"
  }
]
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

### Enrich Queue Item
`PUT /api/v2/admin/products-queue/{id}/enrich`

Auth: admin token required

Enriches a queued product for any seller by queue item ID.

**Body**
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

**Response `200`**
```json
{ "message": "Queue item enriched successfully" }
```

**Common errors**
- `400 BAD_REQUEST` — invalid body or invalid queue status
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — queue item not found

---

### Promote Queue Item
`POST /api/v2/admin/products-queue/{id}/promote`

Auth: admin token required

Promotes a queue item to the active catalog. Queue item must already be in `ready` status.

**Response `200`**
```json
{ "message": "Queue item promoted successfully" }
```

**Common errors**
- `400 BAD_REQUEST` — queue item is not in `ready` status
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — queue item not found

---

### Delete Queue Item
`DELETE /api/v2/admin/products-queue/{id}`

Auth: admin token required

Deletes a queue item from the moderation queue.

**Response `200`**
```json
{ "message": "Queue item deleted successfully" }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — queue item not found

---

## Users and OTPs

### Get All Users
`GET /api/v2/admin/users`

Auth: admin token required

Returns all registered users.

**Response `200`**: array of `identity.User` objects

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

### Get Active OTPs
`GET /api/v2/admin/otps`

Auth: admin token required

Returns users with active, non-expired OTPs.

**Response `200`**: array of `identity.User` objects

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

## Sellers

### Get All Sellers
`GET /api/v2/admin/sellers`

Auth: admin token required

Returns all seller accounts across statuses.

**Response `200`**: array of `seller.SellerProfile` objects

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

### Get Seller
`GET /api/v2/admin/sellers/{id}`

Auth: admin token required

Returns the full seller profile.

**Response `200`**: `seller.SellerProfile`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — seller not found

---

### Approve or Suspend Seller
`PUT /api/v2/admin/sellers/{id}/approve`

Auth: admin token required

Approves a seller when `approved` is true, or suspends the seller when false. Rejection notes are stored as `rejection_reason`. The email send is asynchronous and does not block the response.

**Body**
```json
{
  "approved": true,
  "note": "KYC verified"
}
```

**Response `200`**: `ApprovalResponse`

Examples:
```json
{
  "message": "Seller approved",
  "welcome_email_queued": true
}
```

```json
{
  "message": "Seller suspended",
  "welcome_email_queued": true
}
```

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — seller not found

---

## Waitlist

### Get Waitlist
`GET /api/v2/admin/waitlist`

Auth: admin token required

Returns all waitlist entries.

**Response `200`**: array of `waitlist.WaitlistEntry` objects

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token

---

---

## Cross-Module Admin Endpoints

While this document covers core platform administration, specialized admin features are documented within their respective modules:

### Admin Catalog
Management of collections and drops for discovery.
- `POST /api/v2/admin/catalog/collections` — Create discovery collection
- `GET /api/v2/admin/catalog/drops` — List all seller drops
- `PATCH /api/v2/admin/catalog/drops/{id}/status` — Approve/Live status
- Documentation: [Catalog Admin Docs](../catalog/docs.md)

### Admin Campaigns
Marketing and acquisition campaign management.
- `POST /api/v2/admin/campaigns` — Create new marketing campaign
- `GET /api/v2/admin/campaigns/{id}/metrics` — Performance tracking
- Documentation: [Campaigns Docs](../campaigns/docs.md)

### Admin Analytics (Probe Engine)
Comprehensive platform-wide business intelligence and real-time monitoring across 23 modules.
- `GET /admin/probe/overview` — Platform KPIs (DAU, Revenue, Orders, Conversion)
- `GET /admin/probe/real-time` — Live event stream and concurrent user activity
- `GET /admin/probe/users` — Acquisition funnels, retention cohorts, and user segments
- `GET /admin/probe/commerce` — Sales analytics, category performance, and conversion funnels
- `GET /admin/probe/operations` — Operational health (seller onboarding, logistics performance)
- Documentation: [Probe Analytics Docs](../analytics/docs.md)


### Notifications
- `POST /api/v2/admin/notifications/broadcast` — Send to all users
- Documentation: [Notifications Docs](../notifications/docs.md)

### Ambassador
- `POST /api/v2/admin/ambassador/tasks` — Assign tasks to ambassadors
- Documentation: [Ambassador Docs](../ambassador/docs.md)

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400` | Invalid admin action, such as unsupported order status |
| `401 UNAUTHORIZED` | Missing or invalid admin token |
| `404 NOT_FOUND` | Seller not found |
