# Commerce Module

Shopping cart, checkout, order management, and order tracking.

Auth:
- `GET /api/v2/commerce/cart` — user auth required
- `POST /api/v2/commerce/cart` — user auth required
- `DELETE /api/v2/commerce/cart/items` — user auth required
- `GET /api/v2/commerce/cart/shipping-estimate` — user auth required
- `POST /api/v2/commerce/checkout` — user auth required
- `GET /api/v2/commerce/orders` — user auth required
- `GET /api/v2/commerce/orders/{id}/tracking` — user/seller/admin auth required
- `POST /api/v2/commerce/orders/{id}/tracking/share` — user auth required
- `GET /api/v2/commerce/orders/{id}/support-link` — user/seller/admin auth required
- `POST /api/v2/commerce/shipping/estimate` — public
- `GET /api/v2/support/link` — public
- `GET /api/v2/track/{token}` — public route
- `GET /api/v2/commerce/guest/cart` — public guest cart route
- `POST /api/v2/commerce/guest/cart` — public guest cart route
- `DELETE /api/v2/commerce/guest/cart/items` — public guest cart route
- `GET /api/v2/commerce/guest/cart/shipping-estimate` — public
- `PUT /api/v2/commerce/guest/cart/customer` — public guest cart route
- `POST /api/v2/commerce/guest/checkout` — public guest checkout route
- `POST /api/v2/commerce/guest/orders/lookup` — public guest order tracking route
- `GET /api/v2/commerce/seller/orders` — seller auth required
- `GET /api/v2/commerce/seller/orders/{id}` — seller auth required
- `PATCH /api/v2/commerce/seller/orders/{id}/status` — seller auth required
- `GET /api/v2/commerce/admin/orders` — admin auth required
- `GET /api/v2/commerce/admin/orders/{id}` — admin auth required
- `POST /api/v2/commerce/admin/orders/{id}/cancel` — admin auth required
- `PATCH /api/v2/commerce/admin/orders/{id}/status` — admin auth required
- `PUT /api/v2/commerce/admin/orders/{id}/tracking/warehouse` — admin auth required
- `PATCH /api/v2/commerce/admin/orders/{id}/tracking/eta` — admin auth required

All protected endpoints require `Authorization: Bearer <token>`.

Guest routes do not require authentication. They are keyed by `X-Guest-Cart-Id` so the website can persist a fast, anonymous cart for performance marketing traffic.

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

### `ParentOrder`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "customer_type": "guest",
  "customer_name": "Sara Ahmed",
  "customer_phone": "+923001234567",
  "customer_email": "sara@example.com",
  "total_amount": 7599,
  "shipping_fee": 99,
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
  "parent_order_id": "parent-1",
  "order_number": "ORD-00123",
  "seller_id": "seller-1",
  "user_id": "user-1",
  "seller_name": "Zara Closet",
  "seller_city": "Lahore",
  "customer_name": "Sara Ahmed",
  "customer_phone": "+923001234567",
  "customer_email": "sara@example.com",
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
    "shipping_fee": 99,
    "commission_rate": 0.175,
    "commission": 612.5,
    "seller_payout": 2887.5,
    "total": 3599,
    "currency": "PKR",
    "free_shipping_applied": false
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
  "shipping_total": 99,
  "free_shipping_applied": false,
  "free_shipping_threshold": 5900,
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

**Allocation Note:** Shipping fees are allocated proportionally per-seller using `seller_id` to prevent collisions if multiple sellers ship from the same city.

**Common errors**
- `400` — missing `buyer_city` query param
- `401 UNAUTHORIZED` — missing or invalid user token

---

## Checkout Endpoint

### Checkout
`POST /api/v2/commerce/checkout`

Auth: user token required

Creates a parent transaction from the current cart and splits it into seller-specific child orders.

**Body**
```json
{
  "address_id": "uuid",
  "payment_method": "cod"
}
```

`address_id` and `payment_method` are required.

**Shipping fee calculation:** The `shipping_fee` in the response is computed using the city-aware Juno shipping formula:
1. Each brand's shipment is classified as within-city (Rs. 130) or outside-city (Rs. 220) by comparing the seller's city vs the buyer's delivery address city.
2. A subsidy pool of Rs. 99 × total quantity is subtracted from total logistics cost.
3. The net cost is mapped to a fixed bucket: ≤100→99 | ≤200→149 | ≤300→199 | >300→249.
4. A Rs. 60 surcharge is added per additional brand beyond the first.
5. If any product in the cart lacks `seller_city` (legacy products), the old flat formula (`200 × brand_count`) is used instead to avoid overcharging.

**Response `201`**: `ParentOrder`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — empty cart, missing fields, or unavailable cart items
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

The guest cart must already contain saved guest checkout details. The buyer's city from `guest_checkout_details.city` is used for the city-aware shipping formula.

**Body**
```json
{
  "payment_method": "cod"
}
```

**Shipping fee:** Computed using the same city-aware formula as authenticated checkout (see Checkout endpoint above). Buyer city comes from the saved `guest_checkout_details.city`.

**Response `201`**: `ParentOrder`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing `guest_cart_id`, empty cart, missing saved guest details, missing payment method, or unavailable cart items

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

**Response `200`**: array of `ParentOrder`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing lookup field

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
  "shipping_total": 99,
  "free_shipping_applied": false,
  "free_shipping_threshold": 5900,
  "currency": "PKR",
  "breakdown": [...]
}
```

**Free Shipping:** Applied when `subtotal >= 5900` PKR. All shipping fees waived.

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

### Update Order Status (Seller)
`PATCH /api/v2/commerce/seller/orders/{id}/status`

Auth: seller token required (must own the order)

Updates the status of an order and appends a tracking milestone.

**Body**
```json
{
  "status": "packed",
  "note": "Parcel ready for pickup"
}
```

Allowed statuses: `confirmed`, `packed`, `handed_to_rider`, `cancelled`.

**Response `200`**
```json
{ "success": true, "data": { "message": "Order status updated successfully" } }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token
- `403 FORBIDDEN` — not your order
- `400` — invalid status transition

---

## Admin Order Management

### List Admin Parent Orders
`GET /api/v2/commerce/admin/orders?status={status}&limit=20&offset=0`

Auth: admin token required

Returns paginated parent orders with child summaries.

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

### Get Admin Parent Order Detail
`GET /api/v2/commerce/admin/orders/{id}`

Auth: admin token required

Returns the parent order and all child orders.

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

### Cancel Parent Order
`POST /api/v2/commerce/admin/orders/{id}/cancel`

Auth: admin token required

Cancels a parent order and all child orders.

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
