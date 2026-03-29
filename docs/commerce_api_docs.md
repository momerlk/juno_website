# Commerce Module

Shopping cart, checkout, and user order history.

Auth:
- `GET /api/v2/commerce/cart` — user auth required
- `POST /api/v2/commerce/cart` — user auth required
- `POST /api/v2/commerce/checkout` — user auth required
- `GET /api/v2/commerce/orders` — user auth required

All endpoints require `Authorization: Bearer <token>`.

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
  "total_amount": 7500,
  "shipping_fee": 200,
  "subtotal": 7300,
  "status": "confirmed",
  "payment_method": "cod",
  "child_order_ids": ["child-1", "child-2"],
  "created_at": "2026-03-28T14:30:00Z"
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
- `400` — empty cart or invalid request
- `401 UNAUTHORIZED` — missing or invalid user token
- `404 NOT_FOUND` — address not found

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
| `400` | Empty cart, invalid quantity, or stock/validation failure |
| `401 UNAUTHORIZED` | Missing or invalid user token |
| `404 NOT_FOUND` | Product, variant, or address not found |
