# Commerce Module

Shopping cart, checkout, and user order history.

Auth:
- `GET /api/v2/commerce/cart` — user auth required
- `POST /api/v2/commerce/cart` — user auth required
- `DELETE /api/v2/commerce/cart/items` — user auth required
- `POST /api/v2/commerce/checkout` — user auth required
- `GET /api/v2/commerce/orders` — user auth required
- `GET /api/v2/commerce/guest/cart` — public guest cart route
- `POST /api/v2/commerce/guest/cart` — public guest cart route
- `DELETE /api/v2/commerce/guest/cart/items` — public guest cart route
- `PUT /api/v2/commerce/guest/cart/customer` — public guest cart route
- `POST /api/v2/commerce/guest/checkout` — public guest checkout route
- `POST /api/v2/commerce/guest/orders/lookup` — public guest order tracking route

All endpoints require `Authorization: Bearer <token>`.

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
  "total_amount": 7500,
  "shipping_fee": 200,
  "subtotal": 7300,
  "status": "pending",
  "payment_method": "cod",
  "address_id": "address-1",
  "shipping_address": {
    "full_name": "Sara Ahmed",
    "phone_number": "+923001234567",
    "email": "sara@example.com",
    "address_line1": "12 Main Gulberg",
    "city": "Lahore",
    "country": "Pakistan"
  },
  "child_order_ids": ["child-1", "child-2"],
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
      "country": "Pakistan"
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
  "order_items": [
    {
      "id": "item-1",
      "product_id": "prod-1",
      "variant_id": "var-1",
      "quantity": 1,
      "unit_price": 3500
    }
  ],
  "status": "shipped",
  "total": 3700,
  "created_at": "2026-03-28T14:30:00Z"
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

If `country` is omitted it defaults to `Pakistan`.

**Body**
```json
{
  "full_name": "Sara Ahmed",
  "phone_number": "+923001234567",
  "email": "sara@example.com",
  "address_line1": "12 Main Gulberg",
  "city": "Lahore"
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

## Order Endpoints

### Get User Orders
`GET /api/v2/commerce/orders`

Auth: user token required

Returns the authenticated user's child orders, one per seller fulfillment group.

**Response `200`**: array of `Order`

Order statuses:
- `pending`
- `confirmed`
- `shipped`
- `delivered`
- `cancelled`
- `returned`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid user token

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400` | Empty cart, invalid quantity, missing fields, or stock/validation failure |
| `401 UNAUTHORIZED` | Missing or invalid user token |
| `404 NOT_FOUND` | Product, variant, address, or cart item not found |
