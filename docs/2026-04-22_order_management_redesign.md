# Order Management — Clean-Up (Scoped)

**Date:** 2026-04-22
**Owner:** Commerce module
**Goal:** Fix the concrete pain points (missing variant/product/customer/shipping/financial details, bad parent-vs-child confusion, no role separation) with the **smallest possible set** of additive changes. Keep the existing schema, keep existing endpoints working, keep it shippable in roughly a week.

Companion to `2026-04-22_interactive_order_tracking.md` (tracking plan).

---

## 1. Pain Points → Minimum Fix

| Pain | Fix |
|------|-----|
| Variant + product details missing on display | Snapshot product/variant fields onto `OrderItem` at checkout. |
| Shipping address partial / missing | Normalize to `ShippingAddressSnapshot` on `Order` (copy of parent). |
| Subtotal / shipping / total not broken down | Add `OrderFinancials` sub-doc on `Order`. |
| Parent vs child confusion in UI | One list endpoint per role — seller lists children; admin lists parents with child summaries. No role switching on shared endpoints. |
| Parent status mutated as if one shipment | Parent status becomes a **computed rollup** derived from children; admin can't set it directly. |
| Missing commission / seller-payout on admin | Write `commission_rate`, `commission`, `seller_payout` into `OrderFinancials` at checkout. |
| Customer + prior-order info missing | Snapshot customer name/phone/email on `Order`. Compute "prior orders with this seller" via an indexed count query — no new collection. |
| Role boundaries blurry | Two small routers: `/seller/orders` + `/admin/orders`. Distinct DTOs. |
| No shipping fee API — client can't preview shipping | New `POST /commerce/shipping/estimate` using `pkg/pricing.CalculateShipping`. |
| Free-shipping-above-5900 rule missing | Add `FreeShippingThreshold = 5900` to `pkg/pricing`; apply on parent subtotal. |
| `GET /logistics/fare-estimate` outdated (hardcoded PostEx + Rs. 200) | Retire it. Logistics module focuses on courier *booking*, not customer-facing fare. |
| No customer support system | WhatsApp-first deep-links with pre-filled context. No ticket UI. Founders reply in WhatsApp Business. |

**What we're NOT doing (cut from earlier plan):**
- No new `customer_profiles` collection. Prior-order counts via indexed query.
- No CSV export endpoints.
- No seller internal notes.
- No refund endpoint (admin can still cancel + issue refunds out-of-band for now).
- No cursor pagination — skip-based is fine at current volume.
- No dual-write window — additive fields only, no collection renames.
- No admin customer-search surface (use existing user search).
- No line-item partial refunds.
- No ticket system, no admin support UI, no email support flows. Founders handle WhatsApp directly.
- No chat/live-agent inside the app.
- No seller-side support surface.

---

## 2. Compat Rules

1. **Additive only.** Do not remove or rename any existing BSON field. New fields are optional with `omitempty`.
2. **`ShippingAddress *GuestCheckoutDetails`** on `ParentOrder` stays. New `ShippingAddressSnapshot` aliases its shape for the new `Order` copy. No type swap on parent.
3. **Status enum** stays — already handled via `LegacyStatusMap` from the tracking PR. No new migration.
4. **Existing endpoints keep responding** with the same shape. New fields appear in the payload, old consumers ignore them.
5. **`ParentOrder.Status`** field stays writable for back-compat but is also computed on every child status change. UI migrates to `rollup_status` when ready.

---

## 3. Data Model Changes (Additive)

### 3.1 `OrderItem` — snapshot at checkout

```go
type OrderItem struct {
    ProductID    string  `bson:"product_id"`
    VariantID    string  `bson:"variant_id"`
    Quantity     int     `bson:"quantity"`
    UnitPrice    float64 `bson:"unit_price"`

    // --- new snapshot fields ---
    ProductName    string            `bson:"product_name,omitempty"`
    ProductImage   string            `bson:"product_image,omitempty"`
    VariantLabel   string            `bson:"variant_label,omitempty"` // "Medium / Blue"
    VariantOptions map[string]string `bson:"variant_options,omitempty"`
    LineTotal      float64           `bson:"line_total,omitempty"`
}
```

Populated in `buildOrdersFromCart` from `productCache` + resolved variant. Zero extra queries — product already cached.

### 3.2 `Order` — finance + customer + shipping snapshot

```go
type Order struct {
    // ... existing fields ...

    // --- new snapshot fields ---
    SellerName       string                   `bson:"seller_name,omitempty"`
    SellerCity       string                   `bson:"seller_city,omitempty"`
    CustomerName     string                   `bson:"customer_name,omitempty"`
    CustomerPhone    string                   `bson:"customer_phone,omitempty"`
    CustomerEmail    string                   `bson:"customer_email,omitempty"`
    ShippingAddress  *ShippingAddressSnapshot `bson:"shipping_address,omitempty"`
    Financials       *OrderFinancials         `bson:"financials,omitempty"`
}
```

### 3.3 `OrderFinancials`

```go
type OrderFinancials struct {
    Subtotal        float64 `bson:"subtotal"`         // sum(line_total)
    ShippingFee     float64 `bson:"shipping_fee"`     // this child's share
    DiscountAmount  float64 `bson:"discount_amount,omitempty"`
    CommissionRate  float64 `bson:"commission_rate"`  // captured at checkout
    Commission      float64 `bson:"commission"`       // subtotal * rate
    SellerPayout    float64 `bson:"seller_payout"`    // subtotal - commission
    Total           float64 `bson:"total"`            // subtotal + shipping - discount
    Currency        string  `bson:"currency"`         // "PKR"
}
```

`CommissionRate` — read once from `seller.SellerPricing` at order build. If seller has no override, use platform default constant. Frozen on the order.

### 3.4 `ShippingAddressSnapshot`

Identical field shape to the existing `GuestCheckoutDetails` plus `Latitude/Longitude` (already added in tracking PR) plus `Instructions` (optional). Reuse `GuestCheckoutDetails` as-is if easier — a type alias works. Copy into `Order.ShippingAddress` at checkout from `ParentOrder.ShippingAddress` (or registered user's `location.Address`).

### 3.5 `ParentOrder` — rollup fields (additive)

```go
type ParentOrder struct {
    // ... existing fields ...

    RollupStatus    string          `bson:"rollup_status,omitempty"`    // computed
    ChildSummaries  []ChildSummary  `bson:"child_summaries,omitempty"`  // denormalized for admin list
}

type ChildSummary struct {
    OrderID    string      `bson:"order_id"`
    SellerID   string      `bson:"seller_id"`
    SellerName string      `bson:"seller_name"`
    ItemCount  int         `bson:"item_count"`
    Total      float64     `bson:"total"`
    Status     OrderStatus `bson:"status"`
}
```

Both are recomputed on every child status write. Cheap — children per parent rarely exceed 3-5.

**`ParentOrder.Status` (old field)** also gets written with the rollup value. Old consumers keep working.

---

## 4. Parent Rollup Logic

```
all children delivered          → delivered
all children cancelled          → cancelled
all children returned           → returned
mix of delivered + in-flight    → partially_delivered
mix with any cancellation       → partially_cancelled
any child in out_for_delivery / at_warehouse / handed_to_rider → in_progress
all children pending            → pending
otherwise                       → in_progress
```

One pure function: `computeRollup([]Order) string`. Called from `recomputeParent(parentID)` which reads children, computes, writes `RollupStatus` + `ChildSummaries` + legacy `Status` in one `$set`.

Hook: every `UpdateOrderStatus` call (already exists post-tracking PR) calls `recomputeParent` after the child write. Best-effort; logged on failure.

---

## 5. API Surfaces

Keep existing endpoints as-is. Add these.

### 5.1 Seller — `/commerce/seller/orders` (already has `RequireSellerAuth`)

| Method | Path                                | Purpose                                                        |
|--------|-------------------------------------|----------------------------------------------------------------|
| GET    | `/commerce/seller/orders`           | Paginated child orders owned by seller. Filters: status, date range, customer search. |
| GET    | `/commerce/seller/orders/{id}`      | Full child detail (new rich shape).                            |
| PATCH  | `/commerce/seller/orders/{id}/status` | Already exists (tracking PR). Keep.                          |

The detail endpoint also returns `prior_orders_with_seller` — one indexed `count` query on `orders` where `seller_id + customer_phone (or user_id)` and status is not cancelled.

Seller ownership check in service layer: `order.seller_id == ctx.seller_id`, else `apperrors.Forbidden`.

### 5.2 Admin — `/commerce/admin/orders` (already has `RequireAdminAuth`)

| Method | Path                                              | Purpose                                                    |
|--------|---------------------------------------------------|------------------------------------------------------------|
| GET    | `/commerce/admin/orders`                          | Paginated parent orders with `ChildSummaries` inline.      |
| GET    | `/commerce/admin/orders/{parent_id}`              | Parent detail: customer, shipping, all children expanded with per-child `OrderFinancials`, aggregate financials. |
| PATCH  | `/commerce/admin/orders/{parent_id}/children/{child_id}/status` | Admin override on child. Already partially exists — tighten to child scope. |
| POST   | `/commerce/admin/orders/{parent_id}/cancel`       | Cascade cancel of all children still in a cancellable status. |

Aggregate financials = sum over children: `subtotal`, `shipping_fee`, `commission`, `seller_payout`, `total`.

### 5.3 Customer — `/commerce/orders` (keep existing)

Add the new snapshot fields to the existing response shape. Customer already reads their parent order detail — it just becomes richer.

---

## 6. Response Shapes (Sketch)

### 6.1 `SellerOrderDetailResponse`

```json
{
  "id": "ord_abc",
  "parent_order_id": "po_xyz",
  "status": "confirmed",
  "created_at": "...",
  "customer": {
    "name": "Ayesha Khan",
    "phone": "+923001234567",
    "email": "ayesha@example.com",
    "customer_type": "user",
    "prior_orders_with_seller": 3
  },
  "shipping_address": { /* snapshot */ },
  "items": [
    {
      "product_id": "p_123",
      "product_name": "Floral Lawn Suit",
      "product_image": "...",
      "variant_label": "Medium / Blue",
      "variant_options": { "size": "M", "color": "Blue" },
      "quantity": 2,
      "unit_price": 3500,
      "line_total": 7000
    }
  ],
  "financials": {
    "subtotal": 7000,
    "shipping_fee": 200,
    "commission_rate": 0.15,
    "commission": 1050,
    "seller_payout": 5950,
    "total": 7200,
    "currency": "PKR"
  },
  "tracking": { /* from tracking PR */ }
}
```

### 6.2 `AdminParentOrderDetailResponse`

```json
{
  "id": "po_xyz",
  "rollup_status": "partially_delivered",
  "customer": { /* snapshot */ },
  "shipping_address": { /* snapshot */ },
  "aggregate_financials": {
    "subtotal": 12500,
    "shipping_fee": 400,
    "commission_total": 1875,
    "seller_payout_total": 10625,
    "total": 12900,
    "currency": "PKR"
  },
  "children": [
    {
      "id": "ord_abc",
      "seller": { "id": "s_1", "name": "Zara Closet", "city": "Lahore" },
      "status": "delivered",
      "items": [ /* snapshot */ ],
      "financials": { /* per-child */ },
      "tracking": { /* per-child */ }
    }
  ]
}
```

---

## 7. Shipping Fee Allocation + Free-Shipping + Public Estimate

Current in `pkg/pricing/pricing.go`:
```go
func CalculateShipping(shipments []Shipment, buyerCity string, totalQuantity int) float64
```
Returns a single aggregate. Bucket pricing (99/149/199/249) + Rs. 60/additional brand. Subsidy = Rs. 99 × total units.

### 7.1 Per-seller breakdown

Add a sister function:

```go
type ShippingAllocation struct {
    SellerCity string
    Quantity   int
    Fee        float64
}

func CalculateShippingBreakdown(shipments []Shipment, buyerCity string, totalQuantity int, subtotal float64) (total float64, per []ShippingAllocation)
```

Algorithm:
1. Compute total via the existing `CalculateShipping` logic.
2. **Free-shipping gate:** if `subtotal >= FreeShippingThreshold`, set `total = 0`.
3. Allocate `total` proportionally across shipments by `(logistics_cost_per_shipment / sum)`, rounding the last shipment to preserve the aggregate.

Existing `CalculateShipping` stays callable as a wrapper that ignores the breakdown. No existing caller breaks.

### 7.2 Free-shipping threshold

New constant in `pkg/pricing`:

```go
const FreeShippingThreshold = 5900.0 // PKR — shipping waived when parent order subtotal ≥ this
```

Applied on the **parent subtotal** (sum of all seller subtotals before shipping). Not per-seller. This protects against the edge case where one child order just crosses 5900 but the whole cart does.

When applied, each child's `Financials.ShippingFee = 0`, parent `ShippingFee = 0`. Record a flag `Financials.FreeShippingApplied bool` for admin visibility.

### 7.3 Public shipping estimate endpoint

Sellers/clients need to preview shipping before checkout. Current `GET /logistics/fare-estimate` is hardcoded PostEx + Rs. 200 — retire it.

New public endpoint:

```
POST /commerce/shipping/estimate
```

Request:
```json
{
  "buyer_city": "Lahore",
  "items": [
    { "product_id": "p_123", "variant_id": "v_1", "quantity": 2 },
    { "product_id": "p_999", "variant_id": "v_2", "quantity": 1 }
  ]
}
```

Response:
```json
{
  "subtotal": 8400,
  "shipping_total": 0,
  "free_shipping_applied": true,
  "free_shipping_threshold": 5900,
  "breakdown": [
    {
      "seller_id": "s_1",
      "seller_name": "Zara Closet",
      "seller_city": "Lahore",
      "quantity": 2,
      "fee": 0
    },
    {
      "seller_id": "s_2",
      "seller_name": "Maria B",
      "seller_city": "Karachi",
      "quantity": 1,
      "fee": 0
    }
  ],
  "currency": "PKR"
}
```

Also usable without `items` via an existing cart ID — add `GET /commerce/cart/shipping-estimate?buyer_city=X` and `GET /commerce/guest/cart/shipping-estimate?buyer_city=X` that pull items from the cart. Keeps client logic thin.

### 7.4 Retire the logistics fare estimate

- Mark `GET /logistics/fare-estimate` as deprecated in Swagger.
- Leave the handler returning a single `DeliveryOption{Name: "juno", EstimatedFare: <result of new shipping estimate>}` so any existing callers don't 404.
- Remove after 2 sprints when no traffic observed.

The logistics module's job shrinks to actual courier booking (Bykea/PostEx bookings), not customer-facing fare. Clean separation.

---

## 8. Indexes (Minimum)

Add only what's needed for the new queries:

```
orders:
  {seller_id: 1, created_at: -1}               // seller list (likely exists already)
  {seller_id: 1, customer_phone: 1}            // prior-orders count
  {seller_id: 1, user_id: 1}                   // prior-orders count for registered users
  {parent_order_id: 1}                         // parent detail expansion

parent_orders:
  {created_at: -1}                             // admin list default sort
  {rollup_status: 1, created_at: -1}           // admin filter
```

Verify existing indexes before creating to avoid duplicates.

---

## 9. Backfill (Lightweight)

One script: `scripts/backfill_order_details.go`.

For each existing `orders` row:
1. Populate `product_name`, `product_image`, `variant_label`, `variant_options` from `catalog` (best-effort; skip rows where product is gone).
2. Compute `line_total` + `Financials` using current commission rate (flag if seller missing).
3. Copy customer + shipping snapshot from parent.
4. Write `seller_name` + `seller_city` from seller profile.

For each `parent_orders` row:
1. Read children, compute `RollupStatus` + `ChildSummaries`, write back.

Idempotent. `--dry-run` flag. Chunk 500 at a time. Log failures. Re-runnable.

Not blocking: old rows without snapshot fields render with empty strings on the new UI, which is acceptable. Backfill can run over a couple of days in the background.

---

## 10. Phased Delivery (~9 days)

### Phase 1 — Pricing + shipping estimate (Day 1)
- [ ] Add `FreeShippingThreshold = 5900` to `pkg/pricing/pricing.go`
- [ ] Add `CalculateShippingBreakdown` (returns total + per-shipment allocations, applies free-shipping gate)
- [ ] Unit tests for breakdown + threshold
- [ ] `POST /commerce/shipping/estimate` handler + service + docs
- [ ] `GET /commerce/cart/shipping-estimate` + guest variant
- [ ] Deprecate `GET /logistics/fare-estimate` — wrap it over new estimate

### Phase 2 — Order model + checkout write path (Day 2-3)
- [ ] Add new fields to `Order` + `OrderItem` + `ParentOrder` (additive)
- [ ] Wire `CalculateShippingBreakdown` into `buildOrdersFromCart`
- [ ] Populate `Financials`, snapshot fields, `ChildSummaries`
- [ ] `computeRollup` + `recomputeParent`
- [ ] Hook `recomputeParent` into existing `UpdateOrderStatus`

### Phase 3 — Repo + indexes (Day 3-4)
- [ ] New repo methods: `CountSellerCustomerOrders`, `ListSellerOrders(filters)`, `ListParentOrders(filters)`, `GetParentWithChildren`
- [ ] Ensure indexes
- [ ] Unit tests for rollup

### Phase 4 — Seller + admin order endpoints (Day 4-6)
- [ ] Seller: list + detail + ownership check
- [ ] Admin: parent list + parent detail + cascade cancel
- [ ] `postman.md` + `docs.md` updated
- [ ] `./scripts/update_api_spec.sh` + `swag init`

### Phase 5 — WhatsApp support link (Day 6)
- [ ] Add `SUPPORT_WHATSAPP_NUMBER=923158972405` to `.env` + `deploy.sh` + `config/config.go`
- [ ] `BuildWhatsAppSupportURL` helper + category label map
- [ ] `GET /commerce/orders/{parent_id}/support-link` + `GET /support/link`
- [ ] Optional `support_requests` log (single-row insert; can ship v1.1)
- [ ] `docs.md` + `postman.md`

### Phase 6 — Backfill + client wiring (Day 7-9)
- [ ] Run `backfill_order_details.go` in staging → prod
- [ ] Seller portal: swap order list + detail to new endpoints
- [ ] Admin portal: swap order list + detail
- [ ] Expo app: consume new snapshot fields; add "Need help?" button on order detail (opens WhatsApp)
- [ ] Web: same "Need help?" button
- [ ] Shipping preview shown on cart screen using new estimate endpoint

---

## 11. Customer Support — WhatsApp Deep-Link (Minimal)

Two founders run support from a single WhatsApp Business number: **`+92 315 8972405`**. No ticket system, no admin inbox, no kanban. Customer taps "Help" → `wa.me` link opens with all context pre-filled → founder replies in WhatsApp directly.

### 11.1 Config

```
SUPPORT_WHATSAPP_NUMBER=923158972405
```

Added to `.env` + `deploy.sh` + `config/config.go` as `SupportWhatsAppNumber`.

### 11.2 Link builder

Pure helper in `internal/v2/modules/commerce/support_link.go`:

```go
func BuildWhatsAppSupportURL(number string, prefill string) string {
    return "https://wa.me/" + number + "?text=" + url.QueryEscape(prefill)
}
```

Prefill template (order context):

```
Hi Juno, I need help with order {order_ref}.
Issue: {category_label}
Customer: {customer_name} ({customer_phone})
Item(s): {first_item_name} x{qty}{more_items_indicator}
```

Non-order / general support template (no order ID):

```
Hi Juno, I need help.
Issue: {category_label}
```

### 11.3 Endpoints

**Customer (auth or guest):**

| Method | Path                                              | Purpose                                               |
|--------|---------------------------------------------------|-------------------------------------------------------|
| GET    | `/commerce/orders/{parent_id}/support-link`       | Returns `{ whatsapp_url, order_ref }` — authenticated owner or guest (via `X-Guest-Cart-Id` if applicable). `category` query param optional. |
| GET    | `/support/link`                                   | General support link, no order context. `category` query param optional. |

Request shape for both:

```
GET /commerce/orders/po_xyz/support-link?category=delivery
```

Response:

```json
{
  "whatsapp_url": "https://wa.me/923158972405?text=Hi%20Juno%2C%20I%20need%20help%20with%20order%20JN-2B4F9...",
  "order_ref": "JN-2B4F9",
  "whatsapp_number": "+923158972405"
}
```

Clients deep-link directly; nothing else to build server-side.

### 11.4 Categories (optional dropdown in client)

Passed as `category` query param. Maps to a human label in the prefilled text:

| Slug          | Label                        |
|---------------|------------------------------|
| `delivery`    | Delivery issue               |
| `damaged`     | Damaged or wrong item        |
| `refund`      | Refund request               |
| `payment`     | Payment issue                |
| `account`     | Account help                 |
| `other`       | Other                        |

Unknown slug defaults to "Other".

### 11.5 Lightweight request log (optional)

Collection: `support_requests`. Single write on every link-fetch. No update path, no admin UI, no status.

```go
type SupportRequest struct {
    ID         string    `bson:"id"`
    UserID     string    `bson:"user_id,omitempty"`
    OrderID    string    `bson:"order_id,omitempty"`
    Category   string    `bson:"category,omitempty"`
    Source     string    `bson:"source"`           // "mobile" | "web"
    CreatedAt  time.Time `bson:"created_at"`
}
```

Purpose: volume metrics + later migration to a real ticket system if we ever need one. Not user-visible.

Index: `{created_at: -1}` for future admin reporting — ship later, not in v1.

### 11.6 UI touch-points

- Mobile app (Expo): order detail screen gets "Need help?" button → `Linking.openURL(whatsapp_url)`. Category sheet opens first if user needs to pick a reason.
- Web (Vite): same pattern — button opens `whatsapp_url` in a new tab.
- Admin / seller portals: nothing. Founders live in WhatsApp Business.

### 11.7 Scale-up trigger

Revisit when any of these hits:

- >50 inbound WhatsApps/week feels unmanageable
- Hiring first dedicated support agent
- Need async email replies or CSAT surveys
- Need audit trail for refund disputes

At that point, migrate `support_requests` log forward by backfilling into a proper `support_tickets` collection, and build the admin inbox from the original plan.

---

## 12. Out of Scope (explicitly)

- CSV exports
- Customer 360 collection / LTV dashboard
- Refunds / partial refunds
- Seller notes
- Admin customer search
- Cursor pagination
- Dual-write compatibility window
- Line-item status

When the startup needs these, they become their own small features.
