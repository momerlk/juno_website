# Commerce Module

Shopping cart, checkout, order management, and order tracking.

## Day 1 operational order contract

Seller `Order` records are the only records created for checkout confirmation, customer/guest lookup,
receipts, tracking, admin detail, and cancellation. New checkouts do not create a `parent_orders` document
or set `parent_order_id`. Historical parent records remain readable for backwards compatibility.

All checkout endpoints return `201` with:

```json
{
  "checkout_id": "seller-order-id",
  "orders": [{ "id": "seller-order-id", "order_number": "ORD-300726-0001-A" }]
}
```

Each returned order has its own customer confirmation email, receipt, and tracking link. Sellers receive
only their order email, including packing instructions and the seller processing receipt; Juno CC recipients
come from the comma-separated `JUNO_OPERATIONS_EMAILS` environment variable. An empty value sends no CC.

**Frontend notes:** store and route using each `orders[].id`; do not send `checkout_id` to detail, tracking,
receipt, or cancellation actions. Refresh each seller order independently after an action.

New seller orders also snapshot `financials.brand_price` separately from the customer-facing subtotal. It is the seller's raw product price before Juno markup and is the immutable base for commission and brand settlement; `financials.seller_payout` is `brand_price − commission`.

**Rollback/fallback:** parent records and legacy code are retained for sprint rollback, but no active parent
cascade cancellation route exists.

## Address review

Every new seller order receives a `manual_review` with a ready-to-copy `formatter_prompt` for ChatGPT and
a safe customer message. No AI key, external formatter, or automated address invention is required.
The Pakistan COD-aware prompt instructs ChatGPT to normalize only supported locality facts and never invent
delivery details. Staff paste its `formatted_address`, `district`, `province`, `missing_fields`, and
`customer_message` back through the existing admin customer endpoint; accepted missing-field names are
`house_or_building`, `area`, `city`, `province`, and `postal_code`.

The review is returned as `order.address_review`:

```json
{
  "original_address": "12 Main Street, Karachi",
  "formatted_address": "12 Main Street, Karachi",
  "district": "Karachi",
  "province": "Sindh",
  "missing_fields": [],
  "customer_message": "Hi, to deliver your order, please reply with your house_or_building.",
  "format_status": "manual_review",
  "formatter_prompt": "You are helping Juno Pakistan dispatch order ...",
  "customer_confirmed": false,
  "formatted_at": "2026-07-30T12:00:00Z",
  "confirmed_at": null,
  "confirmed_by": ""
}
```

**Frontend notes:** display copy buttons for `formatter_prompt` and `customer_message`. Paste ChatGPT's
five JSON fields (`formatted_address`, `district`, `province`, `missing_fields`, `customer_message`) into the existing admin
customer endpoint; its response becomes `ready`. Submit customer corrections without those fields to
generate a fresh prompt. Only allow confirmation when a `ready` review has no missing fields.

Auth:
- `GET /api/v2/commerce/cart` — user auth required
- `POST /api/v2/commerce/cart` — user auth required
- `DELETE /api/v2/commerce/cart/items` — user auth required
- `GET /api/v2/commerce/cart/shipping-estimate` — user auth required
- `POST /api/v2/commerce/checkout` — user auth required
- `POST /api/v2/commerce/checkout/direct` — user auth required
- `GET /api/v2/commerce/orders` — user auth required
- `GET /api/v2/commerce/orders/{id}/tracking` — user/seller/admin auth required
- `POST /api/v2/commerce/orders/{id}/tracking/share` — user auth required
- `GET /api/v2/commerce/orders/{id}/support-link` — user/seller/admin auth required
- `GET /api/v2/commerce/orders/{id}/receipt` and `/invoice` — user/seller/admin auth required
- `POST /api/v2/commerce/orders/{id}/receipt/resend` — user/seller/admin auth required
- `POST /api/v2/commerce/shipping/estimate` — public
- `GET /api/v2/commerce/payment-methods` — public; COD and bank-deposit instructions
- `GET /api/v2/support/link` — public
- `GET /api/v2/track/{token}` — public route
- `GET /api/v2/commerce/guest/cart` — public guest cart route
- `POST /api/v2/commerce/guest/cart` — public guest cart route
- `DELETE /api/v2/commerce/guest/cart/items` — public guest cart route
- `GET /api/v2/commerce/guest/cart/shipping-estimate` — public
- `PUT /api/v2/commerce/guest/cart/customer` — public guest cart route
- `POST /api/v2/commerce/guest/checkout` — public guest checkout route
- `POST /api/v2/commerce/guest/checkout/direct` — public guest direct checkout route
- `POST /api/v2/commerce/guest/orders/lookup` — public guest order tracking route
- `GET /api/v2/commerce/guest/orders/{id}/tracking` — public guest tracking route (requires matching phone/email query)
- `GET /api/v2/commerce/guest/orders/{id}/receipt` and `/invoice` — public guest receipt route (requires matching phone/email query)
- `GET /api/v2/commerce/seller/orders` — seller auth required
- `GET /api/v2/commerce/seller/orders/{id}` — seller auth required
- `GET /api/v2/commerce/seller/orders/{id}/booking` — seller auth required; DEX booking status, tracking number, and history
- `GET /api/v2/commerce/seller/orders/{id}/airway-bill` — seller auth required; staff-uploaded DEX airway-bill URL
- `POST /api/v2/commerce/seller/airway-bills/download` — seller auth required; combines selected seller-owned labels into one PDF
- `POST /api/v2/commerce/seller/orders/{id}/packing` — seller auth required
- `GET /api/v2/commerce/seller/statements` — seller auth required; statement list only
- `POST /api/v2/admin/logistics/orders/{orderID}/refresh-tracking` — admin auth required
- `POST /api/v2/admin/logistics/orders/{orderID}/correct-tracking` — admin auth required
- `GET /api/v2/commerce/admin/analytics/orders` — admin auth required, legacy parent analytics only
- `GET /api/v2/commerce/admin/analytics/orders/{id}` — admin auth required, legacy parent analytics only
- `PATCH /api/v2/commerce/admin/orders/{id}/status` — admin auth required
- `PUT /api/v2/commerce/admin/orders/{id}/tracking/warehouse` — admin auth required
- `PATCH /api/v2/commerce/admin/orders/{id}/tracking/eta` — admin auth required
- `GET /api/v2/commerce/admin/orders/{id}/processing-receipt` — admin auth required, price-free seller packing receipt
- `PATCH /api/v2/commerce/admin/orders/{id}/details` — admin auth required; updates customer, address, payment, parent, and child snapshots
- `POST /api/v2/commerce/admin/orders/{id}/update-notice` — admin auth required; resends the current order update to customer and seller emails
- `POST /api/v2/commerce/admin/dm-orders` — admin auth required
- `GET /api/v2/size-quiz/{token}` — public shared DM size quiz
- `POST /api/v2/size-quiz/{token}/complete` — public shared DM size quiz completion

All protected endpoints require `Authorization: Bearer <token>`.

## Seller packing evidence

### Submit packing

`POST /api/v2/commerce/seller/orders/{id}/packing` marks the seller's confirmed order as `packed` while saving its evidence. Every order item needs a photo and the final packed parcel/AWB photo is required.

```json
{
  "item_photos": [{"order_item_id": "item-1", "url": "private-object-name"}],
  "packed_parcel_photo_url": "private-object-name"
}
```

Success returns the updated order with `packing_evidence`, including `submitted_by` and `submitted_at`. Missing evidence returns `400`; another seller receives `403`; an unknown order returns `404`. Repeating a completed request is safe and does not send another ready email. It appends the normal `packed` tracking milestone and emails Juno operations with the brand CC'd, including only the order number and seller portal link.

**Storage contract:** upload every image with `POST /api/v2/files/upload`, seller bearer token, and `visibility=private`, then submit the returned `file.object` value—not a public or signed URL. The upload endpoint is otherwise public, but the token is required to establish private-object ownership. The service verifies every object is a private image uploaded by the authenticated seller before changing the order. No permanent download URL is returned or stored.

Sellers cannot use the generic status endpoint; packing is their only order mutation. Admins may set `packed` only with a non-empty `note` reason. A successful first packing submission sends the existing ready-for-collection email to Juno operations; recipients are application-owned, not deployment environment configuration. **Frontend notes:** upload one file per item plus the parcel/AWB photo, disable the button until all uploads succeed, then refresh the order. **Rollback/fallback:** hide this action; saved optional evidence remains intact.

Guest routes do not require authentication. They are keyed by `X-Guest-Cart-Id` so the website can persist a fast, anonymous cart for performance marketing traffic.

## Seller brand statements

`GET https://api.juno.com.pk/api/v2/commerce/seller/statements` requires seller authentication and returns only statements whose `seller_id` matches the logged-in seller. It is read-only; statement calculation and payment remain admin actions. It returns list records only. Seller statement detail, printable statement/invoice, and payment-proof signed download routes do not exist yet, so the seller UI must not offer those links. Frontend: load it on entry and refresh after a payment notification. Fallback: no seller action can alter payout data.

## DEX manual tracking refresh

`POST /api/v2/admin/logistics/orders/{orderID}/refresh-tracking` checks the saved manual DEX tracking number and returns the updated booking. It is admin-only and requires `DEX_TRACKING_POLL_ENABLED=true`. By default it uses DEX's public `POST https://www.dex.com.pk/api/get_package_history` response with `{"trackingNumber":"..."}`; `DEX_TRACKING_BASE_URL` may override the `/api` base for tests or an approved replacement. No request body is required.

```json
{
  "id": "booking-id",
  "order_id": "order-id",
  "delivery_partner": "Dex",
  "status": "out_for_delivery",
  "tracking_number": "DEX-123",
  "dex_raw_status": "Out for delivery",
  "last_checked_at": "2026-07-30T12:00:00Z",
  "tracking_history": [{"status":"out_for_delivery","source":"admin_refresh","raw_status":"Out for delivery"}]
}
```

Saving a manual DEX booking immediately performs this same refresh with `source: "manual_booking"`. The full DEX `timeline` is retained in `tracking_history`, including DEX timestamps, raw status, location and failure reason. Known DEX states update the order timeline: picked up, travelling, out for delivery, attempted, delivered and returned. Unknown raw states remain visible in booking history and `dex_raw_status`, while the customer-facing order status stays at its last known safe value. Repeated events are deduplicated by DEX status and timestamp, and terminal orders never move backward. A native poller refreshes every non-final DEX booking hourly from 08:00 through 22:00 Pakistan time and at 00:00, 03:00 and 06:00 otherwise; event `source` is `dex_poll`.

Common errors: `400` when tracking is disabled or missing a number; `401/403` for non-admin callers; `404` when there is no DEX booking; `500` for an unavailable/invalid DEX response. **Frontend notes:** show the last checked time and normal order timeline to all permitted viewers; only admins show Refresh and raw DEX status/errors, then refresh the order after success. **Rollback/fallback:** set `DEX_TRACKING_POLL_ENABLED=false`; the saved tracking number and manual status tools remain available.

### Correct a DEX status

`POST /api/v2/admin/logistics/orders/{orderID}/correct-tracking` is an admin-only audited override when DEX has reported the wrong status. It requires a non-empty reason and accepts `picked_up`, `travelling`, `out_for_delivery`, `attempted`, `delivered`, or `returned` plus an optional location.

```json
{"status":"out_for_delivery","reason":"DEX support confirmed the rider has the parcel","location":"Karachi"}
```

The success response is the updated booking. The booking history saves `source: "admin_correction"`, the reason, time, and the admin account; the order timeline receives the same correction. Unlike DEX polling, an explicit correction may move a mistaken status backward. Common errors: `400` for an invalid status or missing reason, `401/403` for non-admin callers, `404` for no DEX booking, and `500` if it cannot be saved. **Frontend notes:** require a reason, confirm before submit, then refresh the order. **Rollback/fallback:** hide this control; its recorded timeline remains as an audit trail.

## Funnel analytics

Cart additions are client-tracked, so optimistic cart syncing does not inflate
funnel counts. Successful order creation records server-owned `purchase`.
Website is the default source; the app sends `X-Juno-Client: app` on checkout
so its purchase enters the app funnel. The app or website records
`begin_checkout` when the customer enters checkout.

## DM orders with a shared size quiz

`POST /api/v2/commerce/admin/dm-orders` creates a seven-day draft for one
product and returns `quiz_path`. It validates the customer details and confirms
that the product has an approved sizing quiz, but does not create an order.

```json
{
  "product_id": "product_123",
  "quantity": 1,
  "payment_method": "cod",
  "customer": {
    "full_name": "Ayesha Khan",
    "phone_number": "+923001234567",
    "address_line1": "12 Main Street",
    "city": "Lahore",
    "country": "Pakistan"
  }
}
```

Send the returned path to the customer. `GET /api/v2/size-quiz/{token}` returns
the standard sizing quiz. `POST /api/v2/size-quiz/{token}/complete` accepts its
`answers` map, selects an available recommended variant, and creates the normal
guest parent/child order. A draft is atomically claimed, so a link can create
at most one order.

## Correcting an order

Admins can correct a variant through `PATCH /api/v2/admin/orders/{orderID}/items/{itemID}/variant`.
Only an available variant may be selected; the original order price is retained,
and customer/seller emails are sent when email addresses are available.
Order item snapshots use the selected variant image when one is available,
falling back to the product image.

For contact, delivery, and payment corrections, use
`PATCH /api/v2/commerce/admin/orders/{id}/details`:

```json
{
  "payment_method": "cod",
  "customer": {
    "full_name": "Ayesha Khan",
    "phone_number": "+923001234567",
    "email": "ayesha@example.com",
    "address_line1": "12 Main Street",
    "city": "Lahore",
    "country": "Pakistan"
  }
}
```

It updates the parent order and every seller child-order snapshot together.
Use `POST /api/v2/commerce/admin/orders/{id}/update-notice` after any correction
to resend the current order details to the customer and all relevant sellers.

---

## Shared Response Schemas

### `Cart`
```json
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
  "gift_details": {
    "is_gift": true,
    "recipient_name": "Sara",
    "gift_message": "Happy birthday",
    "wrap_gift": true
  },
  "created_at": "2026-03-28T14:30:00Z",
  "updated_at": "2026-03-28T15:00:00Z"
}
```

### `ParentOrder` (legacy)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "customer_type": "guest",
  "customer_name": "Sara Ahmed",
  "customer_phone": "+923001234567",
  "customer_email": "sara@example.com",
  "total_amount": 7599,
  "shipping_fee": 0,
  "subtotal": 7500,
  "status": "pending",
  "rollup_status": "pending",
  "payment_method": "cod",
  "address_id": "address-1",
  "shipping_address": {
    "full_name": "Sara Ahmed",
    "phone_number": "+923001234567",
    "email": "sara@example.com",
    "address_line1": "12 Main Gulberg",
    "city": "Lahore",
    "country": "Pakistan",
    "latitude": 31.5204,
    "longitude": 74.3587
  },
  "child_order_ids": ["child-1", "child-2"],
  "child_summaries": [
    {
      "order_id": "child-1",
      "seller_id": "seller-1",
      "seller_name": "Zara Closet",
      "item_count": 2,
      "total": 3500,
      "status": "pending"
    }
  ],
  "created_at": "2026-03-28T14:30:00Z"
}
```

### `GuestCartResponse`
```json
{
  "guest_cart_id": "guest:uuid",
  "cart": {
    "id": "guest:uuid",
    "user_id": "guest:uuid",
    "items": [
      {
        "product_id": "uuid",
        "variant_id": "uuid",
        "quantity": 1,
        "price": 3500
      }
    ],
    "guest_checkout_details": {
      "full_name": "Sara Ahmed",
      "phone_number": "+923001234567",
      "email": "sara@example.com",
      "address_line1": "12 Main Gulberg",
      "city": "Lahore",
      "country": "Pakistan",
      "latitude": 31.5204,
      "longitude": 74.3587
    },
    "created_at": "2026-03-28T14:30:00Z",
    "updated_at": "2026-03-28T15:00:00Z"
  }
}
```

### `Order`
```json
{
  "id": "uuid",
  "order_number": "ORD-00123",
  "seller_id": "seller-1",
  "user_id": "user-1",
  "seller_name": "Zara Closet",
  "seller_city": "Lahore",
  "customer_name": "Sara Ahmed",
  "customer_phone": "+923001234567",
  "customer_email": "sara@example.com",
  "payment_method": "bank_deposit",
  "payment_proof_url": "https://storage.googleapis.com/.../payment-proof.png",
  "payment_status": "pending_verification",
  "payment_proof_note": "This payment proof also covers order(s): ORD-00123-B",
  "order_items": [
    {
      "id": "item-1",
      "product_id": "prod-1",
      "variant_id": "var-1",
      "quantity": 1,
      "unit_price": 3500,
      "product_name": "T-shirt",
      "product_image": "https://cdn.example.com/tshirt.jpg",
      "variant_label": "Blue / M",
      "variant_options": { "color": "Blue", "size": "M" },
      "line_total": 3500
    }
  ],
  "status": "at_warehouse",
  "financials": {
    "subtotal": 3500,
    "shipping_fee": 0,
    "commission_rate": 0.175,
    "commission": 612.5,
    "seller_payout": 2887.5,
    "total": 3500,
    "currency": "PKR",
    "free_shipping_applied": true
  },
  "shipping_address": {
    "full_name": "Sara Ahmed",
    "phone_number": "+923001234567",
    "email": "sara@example.com",
    "address_line1": "12 Main Gulberg",
    "city": "Lahore",
    "country": "Pakistan",
    "latitude": 31.5204,
    "longitude": 74.3587
  },
  "tracking": {
    "current_status": "at_warehouse",
    "estimated_delivery": "2026-04-25T14:30:00Z",
    "timeline": [
      {
        "status": "pending",
        "label": "Order Placed",
        "occurred_at": "2026-04-22T10:00:00Z",
        "set_by": "user-1"
      },
      {
        "status": "at_warehouse",
        "label": "Arrived at Warehouse",
        "occurred_at": "2026-04-23T09:00:00Z",
        "set_by": "admin-1"
      }
    ],
    "anchors": {
      "seller": { "lat": 31.5204, "lng": 74.3587, "city": "Lahore", "label": "Zara Closet" },
      "warehouse": { "lat": 24.8607, "lng": 67.0011, "city": "Karachi", "label": "Karachi Hub" },
      "customer": { "lat": 24.9462, "lng": 67.0056, "city": "Karachi", "label": "Delivery Location" }
    },
    "polyline": "encoded_polyline_string"
  },
  "total": 3599,
  "created_at": "2026-03-28T14:30:00Z"
}
```

### `OrderTracking`
```json
{
  "current_status": "at_warehouse",
  "estimated_delivery": "2026-04-25T14:30:00Z",
  "timeline": [
    {
      "status": "pending",
      "label": "Order Placed",
      "note": "Awaiting acceptance",
      "occurred_at": "2026-04-22T10:00:00Z",
      "set_by": "user-1",
      "location": { "lat": 31.5204, "lng": 74.3587, "city": "Lahore" }
    }
  ],
  "anchors": {
    "seller": { "lat": 31.5204, "lng": 74.3587, "city": "Lahore", "label": "Store" },
    "warehouse": { "lat": 24.8607, "lng": 67.0011, "city": "Karachi", "label": "Hub" },
    "customer": { "lat": 24.9462, "lng": 67.0056, "city": "Karachi", "label": "Home" }
  },
  "polyline": "encoded_polyline_string"
}
```

---

## Cart Endpoints

### Get Cart
`GET /api/v2/commerce/cart`

Auth: user token required

Returns the authenticated user's active cart.

**Response `200`**: `Cart`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid user token

---

### Add to Cart
`POST /api/v2/commerce/cart`

Auth: user token required

Adds a product variant to the authenticated user's cart. If the variant already exists in the cart, quantity is incremented.

**Body**
```json
{
  "product_id": "uuid",
  "variant_id": "uuid",
  "quantity": 1
}
```

All fields are required. `quantity` must be `>= 1`.

**Response `200`**: `Cart`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — invalid quantity or stock validation failure
- `401 UNAUTHORIZED` — missing or invalid user token
- `404 NOT_FOUND` — product or variant not found

---

### Remove From Cart
`DELETE /api/v2/commerce/cart/items?product_id={productId}&variant_id={variantId}`

Auth: user token required

Removes a specific product variant from the authenticated user's cart.

**Response `200`**: `Cart`

**Common errors**
- `400` — missing `product_id` or `variant_id`
- `401 UNAUTHORIZED` — missing or invalid user token
- `404 NOT_FOUND` — cart item not found

---

### Get Cart Shipping Estimate
`GET /api/v2/commerce/cart/shipping-estimate?buyer_city={city}`

Auth: user token required

Returns shipping fee breakdown for the authenticated user's current cart.

**Response `200`**:
```json
{
  "subtotal": 7500,
  "shipping_total": 0,
  "free_shipping_applied": true,
  "free_shipping_threshold": 0,
  "currency": "PKR",
  "breakdown": [
    {
      "seller_id": "seller-1",
      "seller_name": "Zara Closet",
      "seller_city": "Lahore",
      "quantity": 2,
      "fee": 99
    }
  ]
}
```

**Shipping:** Customer shipping is free on every order. Per-seller breakdown entries remain present with `fee: 0`.

**Common errors**
- `400` — missing `buyer_city` query param
- `401 UNAUTHORIZED` — missing or invalid user token

---

## Checkout Endpoint

### Payment Methods
`GET /api/v2/commerce/payment-methods`

Auth: none

Returns Cash on Delivery and Bank Deposit instructions. For `bank_deposit`, show the returned Bank Alfalah account details, calculate the checkout summary with `payment_method: "bank_deposit"`, upload the payment screenshot through the existing `POST /api/v2/files/upload`, then send its `file.url` as `payment_proof_url` when placing the order.

Bank deposits require a proof and are stored on every split seller order with `payment_status: "pending_verification"`; they receive no payment-method discount. When one checkout splits, each order includes the same `payment_proof_url` and a `payment_proof_note` naming every other order covered by that proof. Admins review the proof and call `POST /api/v2/admin/orders/{orderID}/payment/verify` to set that order's payment status to `verified`; they can cancel an invalid payment instead.

**Frontend notes:** do not display a bank-deposit discount or apply one locally. The `bank_deposit` method no longer includes a `discount_rate`; render the checkout-summary `discount_amount` and `total` returned by the API.

```json
{
  "methods": [
    { "id": "cod", "name": "Cash on Delivery" },
    {
      "id": "bank_deposit",
      "name": "Bank Deposit",
      "bank": {
        "bank_name": "Bank Alfalah",
        "account_title": "Muhammad Omer Ali Malik",
        "account_number": "00421010824133",
        "iban": "PK77ALFH0042001010824133"
      }
    }
  ]
}
```

### Checkout
`POST /api/v2/commerce/checkout`

Auth: user token required

Creates one seller order per seller from the current cart. No parent order is created.

**Body**
```json
{
  "address_id": "uuid",
  "payment_method": "cod"
}
```

`address_id` and `payment_method` are required.

Supported methods are `cod` and `bank_deposit`. A `bank_deposit` checkout must include `payment_proof_url`; the same fields apply to direct and guest checkout endpoints.

```json
{
  "address_id": "uuid",
  "payment_method": "bank_deposit",
  "payment_proof_url": "https://storage.googleapis.com/.../payment-proof.png"
}
```

**Shipping fee:** Customer shipping is free for every checkout (`shipping_fee: 0`), regardless of city, order subtotal, or seller count.

**Response `201`**: `CheckoutResponse` containing regular seller orders; `checkout_id` is the first order ID.

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — empty cart, missing fields, or unavailable cart items
- `401 UNAUTHORIZED` — missing or invalid user token
- `404 NOT_FOUND` — address not found

---

### Checkout Direct (Payload-Based)
`POST /api/v2/commerce/checkout/direct`

Auth: user token required

Creates an order directly from request `items` and does not read server cart items. This is intended for clients using optimistic/local cart state where server cart sync may lag.

**Body**
```json
{
  "address_id": "uuid",
  "payment_method": "cod",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 1
    }
  ]
}
```

`address_id`, `payment_method`, and non-empty `items` are required. Each item requires `product_id`, `variant_id`, `quantity >= 1`.

**Shipping fee:** Free for every order (`shipping_fee: 0`). Bank Deposit receives no payment-method discount.

**Response `201`**: `CheckoutResponse` containing regular seller orders.

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing fields, invalid/empty `items`, or unavailable cart items
- `401 UNAUTHORIZED` — missing or invalid user token
- `404 NOT_FOUND` — address not found

---

## Guest Cart And Checkout Endpoints

### Get Guest Cart
`GET /api/v2/commerce/guest/cart`

Auth: none

Header:

`X-Guest-Cart-Id: guest:uuid`

Returns the current anonymous cart for the provided guest cart token.

**Response `200`**: `GuestCartResponse`

**Common errors**
- `400` — missing or invalid `guest_cart_id`

---

### Add To Guest Cart
`POST /api/v2/commerce/guest/cart`

Auth: none

Optional header:

`X-Guest-Cart-Id: guest:uuid`

If the header is omitted, the API creates a new guest cart token and returns it in both the response body and `X-Guest-Cart-Id` response header.

**Body**
```json
{
  "product_id": "uuid",
  "variant_id": "uuid",
  "quantity": 1
}
```

**Response `200`**: `GuestCartResponse`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — invalid quantity or stock validation failure
- `404 NOT_FOUND` — product or variant not found

---

### Remove From Guest Cart
`DELETE /api/v2/commerce/guest/cart/items?product_id={productId}&variant_id={variantId}`

Auth: none

Header:

`X-Guest-Cart-Id: guest:uuid`

**Response `200`**: `GuestCartResponse`

**Common errors**
- `400` — missing or invalid `guest_cart_id`, `product_id`, or `variant_id`
- `404 NOT_FOUND` — cart item not found

---

### Save Guest Checkout Details
`PUT /api/v2/commerce/guest/cart/customer`

Auth: none

Header:

`X-Guest-Cart-Id: guest:uuid`

Minimal required fields are optimized for conversion:

- `full_name`
- `phone_number`
- `address_line1`
- `city`

Optional fields:

- `email`
- `address_line2`
- `province`
- `postal_code`
- `country`
- `latitude`
- `longitude`

If `country` is omitted it defaults to `Pakistan`.

**Body**
```json
{
  "full_name": "Sara Ahmed",
  "phone_number": "+923001234567",
  "email": "sara@example.com",
  "address_line1": "12 Main Gulberg",
  "city": "Lahore",
  "latitude": 31.5204,
  "longitude": 74.3587
}
```

**Response `200`**: `GuestCartResponse`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing or invalid required fields

---

### Guest Checkout
`POST /api/v2/commerce/guest/checkout`

Auth: none

Header:

`X-Guest-Cart-Id: guest:uuid`

The guest cart must already contain saved guest checkout details.

**Body**
```json
{
  "payment_method": "cod"
}
```

**Shipping fee:** Free for every order (`shipping_fee: 0`). Bank Deposit receives no payment-method discount.

**Response `201`**: `CheckoutResponse` containing regular seller orders.

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing `guest_cart_id`, empty cart, missing saved guest details, missing payment method, or unavailable cart items

---

### Guest Checkout Direct (Payload-Based)
`POST /api/v2/commerce/guest/checkout/direct`

Auth: none

Creates a guest order directly from request `items` and inline customer details. Does not read guest cart items or saved guest cart customer state.

**Body**
```json
{
  "payment_method": "cod",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 1
    }
  ],
  "customer": {
    "full_name": "Sara Ahmed",
    "phone_number": "+923001234567",
    "email": "sara@example.com",
    "address_line1": "12 Main Gulberg",
    "city": "Lahore",
    "country": "Pakistan",
    "latitude": 31.5204,
    "longitude": 74.3587
  }
}
```

`payment_method`, non-empty `items`, and required `customer` fields are mandatory.

**Shipping fee:** Free for every order (`shipping_fee: 0`).

**Response `201`**: `CheckoutResponse` containing regular seller orders.

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing payment method, invalid/empty `items`, missing customer details, or unavailable cart items

---

### Lookup Guest Orders
`POST /api/v2/commerce/guest/orders/lookup`

Auth: none

Returns guest parent orders for order tracking using either phone number or email.

**Body**
```json
{
  "phone_number": "+923001234567"
}
```

Or:

```json
{
  "email": "sara@example.com"
}
```

Provide at least one of `phone_number` or `email`.

`phone_number` accepts all of these equivalent Pakistan mobile formats and normalizes internally:
- `3000856955`
- `03000856955`
- `923000856955`
- `+923000856955`

**Response `200`**: array of `ParentOrder`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing lookup field

---

### Get Guest Order Tracking
`GET /api/v2/commerce/guest/orders/{id}/tracking?phone_number={phone}` or `?email={email}`

Auth: none

Returns tracking for a specific guest child order when contact proof matches the order.

Provide exactly one contact proof query param:
- `phone_number`
- `email`

`phone_number` supports the same normalization formats as lookup.

**Response `200`**: `OrderTracking`

**Common errors**
- `400` — missing both `phone_number` and `email`
- `404 NOT_FOUND` — order not found, not a guest order, or contact proof does not match

---

### Get Guest Order Receipt
`GET /api/v2/commerce/guest/orders/{id}/receipt?phone_number={phone}` or `?email={email}`

Auth: none

Returns the branded receipt payload for a specific guest parent order when contact proof matches.

Provide exactly one contact proof query param:
- `phone_number`
- `email`

`phone_number` supports the same normalization formats as lookup.

**Response `200`**
```json
{
  "parent_order_id": "parent-order-id",
  "order_number": "ORD-150526-0001",
  "subject": "Juno Order Confirmed: parent-o",
  "tracking_url": "https://juno.com.pk/checkout/track/parent-order-id?email=guest%40example.com",
  "support_url": "https://wa.me/923158972405?text=Hi%20Juno%20support...",
  "customer_email": "guest@example.com",
  "html": "<!doctype html> ...",
  "generated_at": "2026-05-15T19:00:00Z"
}
```

**Common errors**
- `400` — missing both `phone_number` and `email`
- `404 NOT_FOUND` — order not found, not a guest order, or contact proof does not match

---

### Get Guest Cart Shipping Estimate
`GET /api/v2/commerce/guest/cart/shipping-estimate?buyer_city={city}`

Auth: none

Header: `X-Guest-Cart-Id: guest:uuid`

Returns shipping fee breakdown for a guest cart.

**Response `200`**: same as Cart Shipping Estimate

**Common errors**
- `400` — missing `guest_cart_id` header or `buyer_city` query param

---

## Shipping Estimate Endpoint

### Estimate Shipping
`POST /api/v2/commerce/shipping/estimate`

Auth: none

Calculates shipping fee for a given list of items without requiring a cart.

**Body**
```json
{
  "buyer_city": "Karachi",
  "items": [
    {
      "product_id": "prod-1",
      "variant_id": "var-1",
      "quantity": 1
    },
    {
      "product_id": "prod-2",
      "variant_id": "var-2",
      "quantity": 2
    }
  ]
}
```

`buyer_city` is required. `items` is optional; if empty, returns zero estimate.

**Response `200`**: 
```json
{
  "subtotal": 7500,
  "shipping_total": 0,
  "free_shipping_applied": true,
  "free_shipping_threshold": 0,
  "currency": "PKR",
  "breakdown": [...]
}
```

**Free Shipping:** Applied to every order. All shipping fees are zero.

---

## Support Endpoints

### Get Support Link
`GET /api/v2/support/link?category={category}`

Auth: none

Returns a WhatsApp deep-link for customer support.

**Query params:**
- `category` (optional): `delivery`, `damaged`, `refund`, `payment`, `account`, `other` (defaults to `other`)

**Response `200`**:
```json
{
  "support_whatsapp_number": "923158972405",
  "support_url": "https://wa.me/923158972405?text=I%20need%20help%20with%20a%20delivery%20issue",
  "category": "delivery"
}
```

---

### Get Order Support Link
`GET /api/v2/commerce/orders/{id}/support-link?category={category}`

Auth: user/seller/admin token required (must have access to order)

Returns a WhatsApp deep-link pre-filled with order context.

**Query params:**
- `category` (optional): see above

**Response `200`**:
```json
{
  "support_whatsapp_number": "923158972405",
  "support_url": "https://wa.me/923158972405?text=Help%20with%20order%20ORD-abc123",
  "category": "delivery",
  "order_id": "uuid"
}
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid token
- `403 FORBIDDEN` — not your order
- `404 NOT_FOUND` — order not found

---

## Order Endpoints

### Guest Order Tracking Flows

Guest order tracking now supports two self-serve paths plus optional public share links:
1. `POST /api/v2/commerce/guest/orders/lookup` to find guest parent orders by `phone_number` or `email`.
2. `GET /api/v2/commerce/guest/orders/{id}/tracking?phone_number=...` (or `email=...`) to fetch tracking for a specific guest child order directly.
3. `GET /api/v2/track/{token}` for public token-based tracking links (usually generated via authenticated `POST /api/v2/commerce/orders/{id}/tracking/share`).

Authenticated `/api/v2/commerce/orders/{id}/tracking` remains protected for user/seller/admin tokens.

---

### Get User Orders
`GET /api/v2/commerce/orders`

Auth: user token required

Returns the authenticated user's child orders, one per seller fulfillment group.

**Response `200`**: array of `Order`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid user token

---

### Get Order Tracking
`GET /api/v2/commerce/orders/{id}/tracking`

Auth: user OR seller token required (must own the order)

Returns the granular milestone timeline and map anchors for an order.

**Response `200`**: `OrderTracking`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid token
- `403 FORBIDDEN` — not your order
- `404 NOT_FOUND` — order not found

---

### Share Order Tracking
`POST /api/v2/commerce/orders/{id}/tracking/share`

Auth: user token required (must own the order)

Generates a signed token for public, read-only tracking access.

**Response `200`**
```json
{
  "token": "signed_jwt_token",
  "url": "/track/signed_jwt_token"
}
```

---

### Get Order Receipt
`GET /api/v2/commerce/orders/{id}/receipt`

`GET /api/v2/commerce/orders/{id}/invoice` is an alias for the same individual-order customer invoice payload. The guest equivalent is `GET /api/v2/commerce/guest/orders/{id}/invoice` with the same phone/email proof as the guest receipt route.

Auth: user/seller/admin token required (must have access to order)

Returns the same branded receipt payload used for transactional order confirmation emails, including:
- `tracking_url`
- `support_url`
- `html` receipt content

`{id}` can be either a parent order ID or a child order ID.

**Response `200`**: `OrderReceiptResponse`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid token
- `403 FORBIDDEN` — not your order
- `404 NOT_FOUND` — order not found

---

### Resend Order Receipt
`POST /api/v2/commerce/orders/{id}/receipt/resend`

Auth: user/seller/admin token required (must have access to order)

Re-sends the order confirmation receipt email to the customer email on the parent order.

`{id}` can be either a parent order ID or a child order ID.

**Response `200`**
```json
{
  "message": "receipt resent"
}
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid token
- `403 FORBIDDEN` — not your order
- `404 NOT_FOUND` — order not found

---

### Get Public Tracking
`GET /api/v2/track/{token}`

Auth: none

Returns order tracking data without PII using a valid share token.

**Response `200`**: `OrderTracking`

---

## Seller Order Management

### List Seller Orders
`GET /api/v2/commerce/seller/orders?status={status}&search={query}&limit=20&offset=0`

Auth: seller token required

Returns paginated child orders for the authenticated seller.

**Query params:**
- `status` (optional): filter by order status
- `search` (optional): search by customer name or phone (case-insensitive regex)
- `limit` (default 20): items per page
- `offset` (default 0): pagination offset

**Response `200`**:
```json
{
  "orders": [{ /* Order objects */ }],
  "total": 42
}
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### Get Seller Order Detail
`GET /api/v2/commerce/seller/orders/{id}`

Auth: seller token required (must own the order)

Returns full details of a specific child order.

**Response `200`**: `Order`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token
- `403 FORBIDDEN` — not your order
- `404 NOT_FOUND` — order not found

---

### Seller delivery updates

`GET /api/v2/commerce/seller/orders/{id}/booking` returns the owning seller's DEX booking, including its status, tracking number, DEX raw status, last check time, and tracking history.

`GET /api/v2/commerce/seller/orders/{id}/airway-bill` returns `{ "url": "..." }` for the airway bill uploaded by Juno operations. Both endpoints return `404` when the booking or label does not exist and reject another seller's order. `GET /api/v2/commerce/orders/{id}/airway-bill` returns the same stored public URL without authentication for simple seller/admin downloads.

`POST /api/v2/commerce/seller/airway-bills/download` accepts selected seller order IDs and returns a downloadable `application/pdf` with each matching airway bill in request order. It accepts 1–50 unique IDs, rejects another seller's order, and fails the whole request if any selected order lacks a valid PDF label.

```json
{"order_ids": ["order-1", "order-2"]}
```

**Frontend notes:** offer this only when one or more listed orders have an airway bill. Send the selected IDs, download the binary response as `juno-airway-bills.pdf`, and surface an error rather than silently omitting a missing label.

### Viewing all packing evidence

The seller order detail and admin parent-order detail include `packing_evidence`. It contains one `item_photos[]` entry for every order item and one `packed_parcel_photo_url` entry for the complete sealed order. The portal must render every entry, not just the parcel photo.

Private packing images are streamed—not exposed as storage URLs—at `GET /api/v2/commerce/seller/orders/{id}/packing-photo?object={object_name}` for the owning seller and `GET /api/v2/commerce/admin/orders/{id}/packing-photo?object={object_name}` for admins. Pass each `item_photos[].url` and `packed_parcel_photo_url` value in turn; both endpoints render the corresponding image inline and reject any object not saved in that order's `packing_evidence`.

Sellers do not update delivery statuses. Their only order mutation is `POST /api/v2/commerce/seller/orders/{id}/packing`.

---

## Admin Order Management

### List Admin Parent Orders (historical)
`GET /api/v2/commerce/admin/orders?status={status}&limit=20&offset=0`

Auth: admin token required

Returns historical parent orders with child summaries. New checkouts are regular seller orders and should use the regular admin order view.

**Query params:**
- `status` (optional): filter by rollup status
- `limit` (default 20): items per page
- `offset` (default 0): pagination offset

**Response `200`**:
```json
{
  "orders": [{ /* ParentOrder objects with child_summaries */ }],
  "total": 156
}
```

---

### Get Admin Parent Order Detail (historical)
`GET /api/v2/commerce/admin/orders/{id}`

Auth: admin token required

Returns a historical parent order and its child orders.

**Response `200`**:
```json
{
  "parent": { /* ParentOrder */ },
  "children": [{ /* Order objects */ }]
}
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — order not found

---

### Cancel Parent Order (historical)
`POST /api/v2/commerce/admin/orders/{id}/cancel`

Auth: admin token required

Cancels a historical parent order and all child orders.

**Body** (optional):
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response `200`**
```json
{ "success": true, "data": { "message": "Parent order cancelled" } }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid admin token
- `404 NOT_FOUND` — order not found
- `400` — order already in terminal state

---

### Update Order Status (Admin)
`PATCH /api/v2/commerce/admin/orders/{id}/status`

Auth: admin token required

Updates the status of an order and appends a tracking milestone.

**Body**
```json
{
  "status": "at_warehouse",
  "note": "Arrived at Lahore Hub"
}
```

Allowed statuses: any valid transition in the state machine.

---

### Set Warehouse Anchor (Admin)
`PUT /api/v2/commerce/admin/orders/{id}/tracking/warehouse`

Auth: admin token required

Sets the coordinates and label for the warehouse waypoint.

**Body**
```json
{
  "lat": 31.5204,
  "lng": 74.3587,
  "city": "Lahore",
  "label": "Lahore Central Warehouse"
}
```

---

### Update ETA (Admin)
`PATCH /api/v2/commerce/admin/orders/{id}/tracking/eta`

Auth: admin token required

Manually overrides the estimated delivery timestamp.

**Body**
```json
{
  "eta": "2026-04-25T14:30:00Z"
}
```

---

## Order Statuses

| Status | Set by | Meaning |
|--------|--------|---------|
| `pending` | system | Order placed, awaiting seller acceptance |
| `confirmed` | seller/admin | Seller accepted order |
| `packed` | seller/admin | Ready for pickup |
| `handed_to_rider` | seller/admin | Released to courier pickup rider |
| `at_warehouse` | admin | Arrived at courier warehouse hub |
| `out_for_delivery` | admin | Out for final delivery leg |
| `delivered` | admin/courier | Customer received parcel |
| `delivery_attempted` | admin | Rider attempted delivery, will retry |
| `cancelled` | seller/admin | Order cancelled |
| `returned` | admin | Parcel returned to warehouse/seller |

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400` | Empty cart, invalid quantity, missing fields, or stock/validation failure |
| `401 UNAUTHORIZED` | Missing or invalid user/seller token |
| `403 FORBIDDEN` | No permission to access this resource |
| `404 NOT_FOUND` | Order, product, variant, address, or cart item not found |
