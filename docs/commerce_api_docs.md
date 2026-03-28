# Commerce Module

Shopping cart, checkout, and order management. All endpoints require user authentication (`Authorization: Bearer <token>`).

---

## Cart Endpoints

### Get Cart
`GET /api/v2/commerce/cart`

Returns the authenticated user's current cart.

**Response `200`**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "variant_id": "uuid",
      "quantity": 2,
      "price": 3500.00
    }
  ],
  "gift_details": null,
  "created_at": "...",
  "updated_at": "..."
}
```

---

### Add to Cart
`POST /api/v2/commerce/cart`

Adds a product variant to the cart. Validates stock availability before adding. If the same variant already exists, its quantity is incremented.

**Body**
```json
{
  "product_id": "uuid",
  "variant_id": "uuid",
  "quantity": 1
}
```
All fields required. `quantity` must be ≥ 1.

**Response `200`** — updated `Cart` object.

**Errors**
- `400` — missing/invalid fields
- `404` — product or variant not found
- `400` — insufficient stock

---

## Checkout Endpoint

### Checkout
`POST /api/v2/commerce/checkout`

Converts the user's cart into a confirmed order. Creates a `ParentOrder` containing one or more seller-specific child `Order`s. Cart is cleared on success.

**Body**
```json
{
  "address_id": "uuid",
  "payment_method": "cod"
}
```

Both fields required. `address_id` must refer to a saved address from the [Location module](./location.md). Common `payment_method` values: `cod`, `easypaisa`, `jazzcash`, `bank_transfer`.

**Response `201`**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "total_amount": 7500.00,
  "shipping_fee": 200.00,
  "subtotal": 7300.00,
  "status": "confirmed",
  "payment_method": "cod",
  "child_order_ids": ["uuid-1", "uuid-2"],
  "created_at": "..."
}
```

**Errors**
- `400` — cart is empty or missing fields
- `404` — address not found

---

## Order Endpoints

### Get User Orders
`GET /api/v2/commerce/orders`

Returns all child orders placed by the authenticated user, each representing a fulfillment group for a single seller.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "parent_order_id": "uuid",
    "order_number": "ORD-00123",
    "seller_id": "uuid",
    "user_id": "uuid",
    "order_items": [
      { "id": "...", "product_id": "...", "variant_id": "...", "quantity": 1, "unit_price": 3500.00 }
    ],
    "status": "shipped",
    "total": 3700.00,
    "created_at": "..."
  }
]
```

**Order statuses:** `pending` → `confirmed` → `shipped` → `delivered` | `cancelled` | `returned`

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON |
| `400` | Empty cart, insufficient stock, or invalid quantity |
| `401 UNAUTHORIZED` | Missing/invalid token |
| `404 NOT_FOUND` | Product, variant, or address not found |
