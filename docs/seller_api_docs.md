# Seller Module

Seller registration, authentication, onboarding, catalog management, queue processing, inventory, seller-order fulfillment, and seller analytics.

Route groups and auth:
- `POST /api/v2/seller/auth/register` — public
- `POST /api/v2/seller/auth/login` — public
- `POST /api/v2/seller/auth/register/draft` — public
- `GET /api/v2/seller/auth/register/draft` — public
- All other `/api/v2/seller/*` endpoints require seller auth: `Authorization: Bearer <seller_token>`

---

## Shared Response Schemas

### `SellerAuthResponse`
```json
{
  "token": "<seller_jwt>",
  "seller": {
    "id": "uuid",
    "name": "Ahmed Raza",
    "email": "ahmed@mybrand.pk",
    "legal_name": "Raza Textiles Pvt Ltd",
    "business_name": "Raza Fabrics",
    "description": "Premium lawn and silk fabrics from Lahore.",
    "short_description": "Lahore's finest fabric house",
    "contact": {
      "phone_number": "+923001234567",
      "alternate_phone_number": "+923007654321",
      "whatsapp": "+923001234567",
      "contact_person_name": "Ahmed Raza",
      "support_email": "support@mybrand.pk",
      "business_hours": "Mon-Sat 9am-6pm"
    },
    "location": {
      "address": "12 Main Gulberg",
      "city": "Lahore",
      "state": "Punjab",
      "postal_code": "54000",
      "country": "Pakistan",
      "latitude": 31.5204,
      "longitude": 74.3587,
      "neighborhood": "Gulberg III",
      "store_directions": "Near Gaddafi Stadium",
      "pickup_available": true,
      "pickup_hours": "Mon-Sat 10am-5pm"
    },
    "business_details": {
      "business_type": "sole_proprietorship",
      "business_category": "Fashion",
      "business_subcategory": "Women Wear",
      "founded_year": 2015,
      "number_of_employees": "12"
    },
    "kyc_documents": {
      "cnic_front": "https://cdn.example.com/cnic_front.jpg",
      "cnic_back": "https://cdn.example.com/cnic_back.jpg",
      "verification_status": "pending",
      "verified_at": null
    },
    "bank_details": {
      "bank_name": "HBL",
      "account_title": "Ahmed Raza",
      "account_number": "01234567890123",
      "iban": "PK36SCBL0000001123456702",
      "payment_method": "bank_transfer",
      "branch_code": "0123",
      "branch_address": "Main Branch, Lahore",
      "swift_code": "HABBPKKA",
      "payment_schedule": "monthly",
      "payment_threshold": 5000
    },
    "status": "pending",
    "website": "https://razafabrics.pk",
    "logo_url": "https://cdn.example.com/logo.png",
    "banner_url": "https://cdn.example.com/banner.jpg",
    "banner_mobile_url": "https://cdn.example.com/banner_mobile.jpg",
    "rejection_reason": "",
    "kyc_verified": false,
    "bank_verified": false,
    "created_at": "2026-03-28T14:30:00Z",
    "updated_at": "2026-03-28T14:30:00Z"
  }
}
```

### `SellerProfile`
Same `seller` object shown above, without the top-level `token`.

### `ProductsQueue`
```json
{
  "id": "uuid",
  "seller_id": "uuid",
  "product": {
    "id": "uuid",
    "raw_id": "shopify-123",
    "handle": "floral-lawn-suit",
    "title": "Floral Lawn Suit",
    "description": "Printed 3-piece lawn suit",
    "short_description": "Summer lawn edit",
    "seller_id": "uuid",
    "seller_name": "Raza Fabrics",
    "seller_logo": "https://cdn.example.com/logo.png",
    "categories": [{ "id": "cat-1", "name": "Lawn", "slug": "lawn" }],
    "product_type": "Eastern",
    "enrichment": {
      "product_type": "Eastern",
      "gender": "Female",
      "sizing_guide": {
        "S": { "chest": 86, "waist": 68 },
        "M": { "chest": 91, "waist": 73 }
      }
    },
    "pricing": {
      "price": 3599,
      "compare_at_price": 4200,
      "currency": "PKR",
      "discounted": true,
      "discount_value": 17,
      "discounted_price": 3500,
      "brand_price": 3500,
      "shipping_included": false,
      "commission_rate": 0.175,
      "seller_payout": 2887.5,
      "cost_price": 2000
    },
    "images": ["https://cdn.example.com/img1.jpg"],
    "variants": [
      {
        "id": "var-1",
        "sku": "RF-001-S",
        "title": "Small",
        "options": { "Size": "S" },
        "price": 3599,
        "brand_price": 3500,
        "available": true
      }
    ],
    "options": [{ "name": "Size", "values": ["S", "M", "L"] }],
    "tags": ["summer", "lawn"],
    "inventory": { "in_stock": true, "available_quantity": 12 },
    "shipping_details": { "free_shipping": false },
    "status": "draft",
    "created_at": "2026-03-28T14:30:00Z",
    "updated_at": "2026-03-28T14:30:00Z",
    "published_at": null,
    "rating": 0,
    "review_count": 0,
    "is_trending": false,
    "is_featured": false
  },
  "status": "queued",
  "source": "manual",
  "shopify_product_id": "",
  "enrichment": {
    "product_type": "Eastern",
    "gender": "Female",
    "sizing_guide": {
      "S": { "chest": 86, "waist": 68 },
      "M": { "chest": 91, "waist": 73 }
    }
  },
  "errors": [],
  "created_at": "2026-03-28T14:30:00Z",
  "updated_at": "2026-03-28T15:00:00Z"
}
```

**Note on Enrichment Data:** The `enrichment` field appears in **two places**:
- **Top-level** (`queue_item.enrichment`): The queue's authoritative source for enrichment data
- **Nested** (`queue_item.product.enrichment`): Mirrored inside the product object for visibility

When creating a product with enrichment data, both fields are automatically populated. When using the enrich endpoint, both fields are updated together.

### `DraftResponse`
```json
{
  "draft_id": "uuid",
  "email": "ahmed@mybrand.pk",
  "step": 3,
  "draft_data": {
    "business_name": "Raza Fabrics",
    "contact": {
      "contact_person_name": "Ahmed Raza",
      "phone_number": "+923001234567"
    }
  },
  "created_at": "2026-03-28T14:30:00Z",
  "updated_at": "2026-03-28T15:00:00Z",
  "expires_at": "2026-04-04T15:00:00Z",
  "message": "Draft saved"
}
```

### `OnboardingStatusResponse`
```json
{
  "status": "pending",
  "steps_completed": {
    "registration": true,
    "kyc_submitted": true,
    "kyc_verified": false,
    "bank_verified": false,
    "approved": false
  },
  "submitted_at": "2026-03-28T14:30:00Z",
  "estimated_review_hours": 48,
  "rejection_reason": null,
  "next_action": "Your application is under review. We'll email you within 48 hours.",
  "can_edit_profile": true
}
```

### `SellerOrder`
```json
{
  "id": "uuid",
  "order_number": "ORD-00123",
  "user_id": "uuid",
  "items": [
    {
      "id": "item-1",
      "product_id": "prod-1",
      "variant_id": "var-1",
      "quantity": 1,
      "unit_price": 3500
    }
  ],
  "status": "pending",
  "total": 3700,
  "created_at": "2026-03-28T14:30:00Z"
}
```

---

## Seller Auth Endpoints

### Register
`POST /api/v2/seller/auth/register`

Auth: public

Creates a new seller account. New sellers start in `pending` status.

**Body**
```json
{
  "name": "Ahmed Raza",
  "email": "ahmed@mybrand.pk",
  "password": "secret123",
  "legal_name": "Raza Textiles Pvt Ltd",
  "business_name": "Raza Fabrics",
  "description": "Premium lawn and silk fabrics from Lahore.",
  "short_description": "Lahore's finest fabric house",
  "contact": {
    "phone_number": "+923001234567",
    "contact_person_name": "Ahmed Raza"
  },
  "location": {
    "address": "12 Main Gulberg",
    "city": "Lahore",
    "state": "Punjab",
    "postal_code": "54000",
    "country": "Pakistan"
  },
  "business_details": {
    "business_type": "sole_proprietorship",
    "business_category": "Fashion"
  },
  "kyc_documents": {
    "cnic_front": "https://cdn.example.com/cnic_front.jpg",
    "cnic_back": "https://cdn.example.com/cnic_back.jpg"
  },
  "bank_details": {
    "bank_name": "HBL",
    "account_title": "Ahmed Raza",
    "account_number": "01234567890123",
    "iban": "PK36SCBL0000001123456702",
    "payment_method": "bank_transfer"
  }
}
```

Required fields:
- `name`
- `email`
- `password`
- `legal_name`
- `business_name`
- `contact.phone_number`
- `contact.contact_person_name`
- `location.address`
- `location.city`
- `location.state`
- `location.postal_code`
- `location.country`
- `business_details.business_type`
- `business_details.business_category`
- `kyc_documents.cnic_front`
- `kyc_documents.cnic_back`
- `bank_details.bank_name`
- `bank_details.account_title`
- `bank_details.account_number`
- `bank_details.iban`
- `bank_details.payment_method`

**Response `201`**: `SellerAuthResponse`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — missing required fields / validation failure
- `409 CONFLICT` — seller email already exists

---

### Login
`POST /api/v2/seller/auth/login`

Auth: public

**Body**
```json
{
  "email": "ahmed@mybrand.pk",
  "password": "secret123"
}
```

**Response `200`**: `SellerAuthResponse`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `401 UNAUTHORIZED` — invalid credentials

---

### Save Draft
`POST /api/v2/seller/auth/register/draft`

Auth: public

Upserts a partial seller registration draft by email. Passwords are stripped before storage.

**Body**
```json
{
  "email": "ahmed@mybrand.pk",
  "step": 3,
  "draft_data": {
    "business_name": "Raza Fabrics",
    "contact": {
      "contact_person_name": "Ahmed Raza",
      "phone_number": "+923001234567"
    }
  }
}
```

**Response `200`**: `DraftResponse`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `409 CONFLICT` — seller account already exists for this email

---

### Get Draft
`GET /api/v2/seller/auth/register/draft?email=ahmed@mybrand.pk`

Auth: public

**Response `200`**: `DraftResponse`

**Common errors**
- `404 NOT_FOUND` — no draft found for the email

---

## Onboarding and Profile

### Get Onboarding Status
`GET /api/v2/seller/onboarding/status`

Auth: seller token required

Returns the seller's current onboarding state. `can_edit_profile` is true for `pending`, `suspended`, and `rejected` sellers.

**Response `200`**: `OnboardingStatusResponse`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### Get Profile
`GET /api/v2/seller/profile`

Auth: seller token required

**Response `200`**: `SellerProfile`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### Update Profile
`PATCH /api/v2/seller/profile`

Auth: seller token required

PATCH semantics: only provided fields are changed.

**Body**
```json
{
  "name": "Ahmed R.",
  "business_name": "Raza Fabrics Co.",
  "legal_name": "Raza Textiles Pvt Ltd",
  "description": "Updated description",
  "short_description": "New tagline",
  "website": "https://razafabrics.pk",
  "logo_url": "https://cdn.example.com/logo.png",
  "banner_url": "https://cdn.example.com/banner.jpg",
  "banner_mobile_url": "https://cdn.example.com/banner_mobile.jpg",
  "contact": {
    "phone_number": "+923001234567",
    "contact_person_name": "Ahmed"
  },
  "location": {
    "address": "New address",
    "city": "Lahore",
    "state": "Punjab",
    "postal_code": "54000",
    "country": "Pakistan"
  },
  "business_details": {
    "business_type": "partnership",
    "business_category": "Fashion"
  },
  "kyc_documents": {
    "cnic_front": "https://cdn.example.com/new_front.jpg",
    "cnic_back": "https://cdn.example.com/new_back.jpg"
  },
  "bank_details": {
    "bank_name": "UBL",
    "account_title": "Ahmed Raza",
    "account_number": "99887766554433",
    "iban": "PK36SCBL0000001123456703",
    "payment_method": "bank_transfer"
  }
}
```

**Response `200`**: `SellerProfile`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — validation failure
- `401 UNAUTHORIZED` — missing or invalid seller token

---

## Products

### List Products
`GET /api/v2/seller/products`

Auth: seller token required

**Query parameters**
- `status` — optional product status filter

**Response `200`**
```json
[
  {
    "id": "uuid",
    "handle": "floral-lawn-suit",
    "title": "Floral Lawn Suit",
    "description": "Printed 3-piece lawn suit",
    "seller_id": "uuid",
    "seller_name": "Raza Fabrics",
    "categories": [{ "id": "cat-1", "name": "Lawn", "slug": "lawn" }],
    "product_type": "Eastern",
    "pricing": {
      "price": 3500,
      "currency": "PKR",
      "discounted": false
    },
    "images": ["https://cdn.example.com/img1.jpg"],
    "variants": [],
    "options": [],
    "tags": ["summer"],
    "inventory": { "in_stock": true, "available_quantity": 12 },
    "shipping_details": { "free_shipping": false },
    "status": "active",
    "created_at": "2026-03-28T14:30:00Z",
    "updated_at": "2026-03-28T14:30:00Z",
    "rating": 0,
    "review_count": 0,
    "is_trending": false,
    "is_featured": false
  }
]
```

---

### Create Product
`POST /api/v2/seller/products`

Auth: seller token required

Adds a product to the moderation queue. The authenticated seller ID is injected from the token.

**Body**: catalog product payload

To include enrichment data (sizing guide, product type, gender) at creation time, include the `enrichment` field in the product:

```json
{
  "title": "Floral Lawn Suit",
  "seller_id": "uuid",
  "pricing": { "price": 3500 },
  "images": ["https://cdn.example.com/img1.jpg"],
  "variants": [],
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

**Response `201`**: `ProductsQueue`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — validation failure
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### Update Product
`PUT /api/v2/seller/products/{id}`

Auth: seller token required

Replaces an existing seller-owned product.

**Body**: catalog product payload

**Response `200`**
```json
{
  "id": "uuid",
  "handle": "floral-lawn-suit",
  "title": "Updated Floral Lawn Suit",
  "description": "Updated description",
  "seller_id": "uuid",
  "seller_name": "Raza Fabrics",
  "categories": [],
  "product_type": "Eastern",
  "pricing": {
    "price": 3800,
    "currency": "PKR",
    "discounted": false
  },
  "images": [],
  "variants": [],
  "options": [],
  "tags": [],
  "inventory": { "in_stock": true, "available_quantity": 12 },
  "shipping_details": { "free_shipping": false },
  "status": "active",
  "created_at": "2026-03-28T14:30:00Z",
  "updated_at": "2026-03-29T10:00:00Z",
  "rating": 0,
  "review_count": 0,
  "is_trending": false,
  "is_featured": false
}
```

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — product not found

---

### Delete Product
`DELETE /api/v2/seller/products/{id}`

Auth: seller token required

**Response `200`**
```json
{ "message": "Product deleted" }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — product not found

---

## Product Queue

Queue status flow:
- `queued`
- `synced`
- `enrichment_pending`
- `ready` (after enrichment)
- `promoted`
- `failed`

### Queue Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v2/seller/queue` | Get all queue items |
| `PUT` | `/api/v2/seller/queue/{id}` | Update product in queue |
| `POST` | `/api/v2/seller/queue/{id}/promote` | Promote ready product to catalog |
| `POST` | `/api/v2/seller/queue/{id}/reject` | Reject product from queue |
| `PUT` | `/api/v2/seller/queue/{id}/enrich` | Enrich product with metadata (transitions to ready) |

### Get Queue
`GET /api/v2/seller/queue`

Auth: seller token required

**Response `200`**: array of `ProductsQueue`

---

### Update Queue Product
`PUT /api/v2/seller/queue/{id}`

Auth: seller token required

Updates the product details of a queued item. Preserves the queue status, seller information, and any existing enrichment data.

**Body**: catalog product payload (same schema as Create Product)

```json
{
  "title": "Updated Floral Lawn Suit",
  "description": "Updated description",
  "pricing": { "price": 3800 },
  "images": ["https://cdn.example.com/img1.jpg"],
  "variants": [
    {
      "id": "var-1",
      "sku": "RF-001-S",
      "title": "Small",
      "options": { "Size": "S" },
      "price": 3800,
      "available": true
    }
  ],
  "tags": ["summer", "lawn"]
}
```

**Response `200`**: `ProductsQueue`

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — queue item not found

---

### Enrich Product
`PUT /api/v2/seller/queue/{id}/enrich`

Auth: seller token required

Enriches a product with metadata (sizing guide, gender, product type) and **automatically transitions it to `ready` for admin promotion**.

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
{ "message": "Product enriched and ready for promotion" }
```

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — invalid queue state or request data
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — queue item not found

---

### Promote Product
`POST /api/v2/seller/queue/{id}/promote`

Auth: seller token required

Promotes a product from the queue to the live catalog. The product must be in `ready` status.

**Response `200`**
```json
{ "message": "Product promoted from queue" }
```

**Common errors**
- `400` — queue item not in `ready` status
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — queue item not found

---

### Reject Product
`POST /api/v2/seller/queue/{id}/reject`

Auth: seller token required

Rejects a product from the moderation queue. Sets the queue item status to `failed` and optionally records a rejection reason.

**Body** (optional)
```json
{
  "reason": "Product images are low quality"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | No | Explanation for why the product was rejected |

**Response `200`**
```json
{ "message": "Product rejected and removed from queue" }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — queue item not found

---

## Inventory

### Bulk Update Inventory
`POST /api/v2/seller/inventory/bulk-update`

Auth: seller token required

**Body**
```json
[
  {
    "product_id": "uuid",
    "variant_id": "uuid",
    "quantity_change": 50,
    "reason": "restock"
  },
  {
    "product_id": "uuid",
    "variant_id": "uuid",
    "quantity_change": -3,
    "reason": "damage"
  }
]
```

**Response `200`**
```json
{ "message": "Inventory updated successfully" }
```

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — invalid update payload
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### Get Low Stock
`GET /api/v2/seller/inventory/low-stock`

Auth: seller token required

**Query parameters**
- `threshold` — optional integer, defaults to `10`

**Response `200`**
```json
[
  {
    "product_id": "uuid",
    "product_name": "Lawn Suit",
    "current_quantity": 3,
    "threshold": 10
  }
]
```

---

### Get Inventory Categories
`GET /api/v2/seller/inventory/categories`

Auth: seller token required

**Response `200`**
```json
[
  { "name": "Tops", "count": 24 },
  { "name": "Bottoms", "count": 18 }
]
```

---

## Orders

### Get Orders
`GET /api/v2/seller/orders`

Auth: seller token required

**Response `200`**: array of `SellerOrder`

---

### Fulfill Order
`POST /api/v2/seller/orders/{id}/fulfill`

Auth: seller token required

The handler accepts an optional body in Swagger, but the current implementation ignores it and only transitions the order to `shipped`.

**Response `200`**
```json
{ "message": "Order fulfilled successfully" }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — order not found

---

### Update Order Status
`PUT /api/v2/seller/orders/{id}/status` (Legacy)
`PATCH /api/v2/commerce/seller/orders/{id}/status` (Recommended for Tracking)

Auth: seller token required

The `PATCH` route under commerce module is recommended as it supports the **Interactive Order Tracking** timeline and FSM validation.

**Body (PATCH commerce route)**
```json
{ 
  "status": "packed",
  "note": "Optional update note"
}
```

Valid values for interactive tracking:
- `confirmed`
- `packed`
- `handed_to_rider`
- `cancelled`

See [Commerce Module Tracking Docs](../commerce/docs.md#seller-order-management) for details.

**Response `200`**
```json
{ "success": true, "data": { "message": "Order status updated successfully" } }
```

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `400` — unsupported status
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — order not found

---

## Drops

Sellers can manage their own product drops. Drops created by sellers start in `draft` status.

### List Seller Drops
`GET /api/v2/seller/drops`

Auth: seller token required

**Query parameters**
- `status` — optional drop status filter

**Response `200`**: array of `catalog.Drop` objects.

---

### Create Seller Drop
`POST /api/v2/seller/drops`

Auth: seller token required

Creates a new draft drop proposal. The `seller_id` is automatically set from the token.

**Body**: [`catalog.CreateDropRequest`](../catalog/docs.md#createdroprequest)

**Response `201`**: `catalog.Drop`

---

### Get Seller Drop
`GET /api/v2/seller/drops/{id}`

Auth: seller token required

Returns the drop details and the list of products included in the drop.

**Response `200`**
```json
{
  "drop": { ...catalog.Drop... },
  "products": [ ...catalog.Product... ]
}
```

---

### Update Seller Drop
`PUT /api/v2/seller/drops/{id}`

Auth: seller token required

Updates a seller-owned draft drop. Only drops in `draft` status can be updated by the seller.

**Body**: [`catalog.UpdateDropRequest`](../catalog/docs.md#updatedroprequest)

**Response `200`**: `catalog.Drop`

---

### Get Seller Drop Analytics
`GET /api/v2/seller/drops/{id}/analytics`

Auth: seller token required

Returns real-time performance metrics for a specific drop.

**Response `200`**
```json
{
  "drop_id": "uuid",
  "status": "live",
  "reminder_count": 142,
  "view_count": 850,
  "metrics": {
    "total_revenue": 125000,
    "order_count": 42,
    "units_sold": 58,
    "conversion_rate": 0.049
  },
  "launch_at": "...",
  "end_at": "..."
}
```

---

## Analytics

### Get Sales Analytics
`GET /api/v2/seller/analytics/sales`

Auth: seller token required

**Response `200`**
```json
{
  "total_revenue": 125000,
  "total_orders": 84,
  "average_order_value": 1488.1
}
```

---

### Get Order Analytics
`GET /api/v2/seller/analytics/orders`

Auth: seller token required

**Response `200`**
```json
{
  "pending": 5,
  "shipped": 30,
  "delivered": 45,
  "cancelled": 4,
  "total": 84
}
```

---

### Get Inventory Analytics
`GET /api/v2/seller/analytics/inventory`

Auth: seller token required

**Response `200`**
```json
{
  "total_products": 62,
  "in_stock": 54,
  "out_of_stock": 5,
  "low_stock": 3
}
```

---

### Get Product Analytics
`GET /api/v2/seller/analytics/product/{productID}`

Auth: seller token required

**Response `200`**
```json
{
  "product_id": "uuid",
  "product_name": "Lawn Suit",
  "total_sold": 18,
  "revenue": 63000
}
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — product not found

---

## Pricing Endpoints

These endpoints let sellers manage pricing configuration and calculate profit/margin on their products.

### Update Product Pricing
`PUT /api/v2/seller/products/{id}/pricing`

Auth: seller token required

Updates a product's `shipping_included` and/or `cost_price` settings, then recomputes the display price, seller payout, variant prices, and discount fields.

**Pointer semantics:** Omitted fields (`null`/missing) are preserved. Only explicitly provided fields are changed.

**Body**
```json
{
  "shipping_included": true,
  "cost_price": 1200.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipping_included` | boolean | No | True if brand embedded Rs.99 shipping buffer in their listed price |
| `cost_price` | number | No | Seller's purchase/production cost (PKR) |

**Response `200`**
```json
{ "message": "Pricing updated" }
```

**Common errors**
- `400 INVALID_BODY` — malformed JSON
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — product not found

**Side effects:**
- Recalculates `Pricing.Price` (display price shown to customers)
- Recalculates `Pricing.SellerPayout`
- Recalculates all `Variants[*].Price`
- Recomputes `Discounted`, `DiscountedPrice`, `DiscountValue` from the new display price

---

### Get Product Profit
`GET /api/v2/seller/products/{id}/profit?cost_price=X&subscription_fee=Y`

Auth: seller token required

Returns a breakdown of commission, seller payout, profit, and margin for a product. Query parameters are optional — if omitted, the stored `cost_price` from the product is used.

**Query parameters**
- `cost_price` — optional, seller's purchase cost in PKR (explicit `0` is respected)
- `subscription_fee` — optional, monthly platform subscription fee in PKR

**Response `200`**
```json
{
  "brand_price": 3500.0,
  "effective_brand_price": 3500.0,
  "commission": 612.5,
  "seller_payout": 2887.5,
  "cost_price": 2000.0,
  "monthly_subscription_fee": 500.0,
  "profit": 387.5,
  "margin_percent": 19.375
}
```

**With `shipping_included = true` (brand_price = 3500):**
```json
{
  "brand_price": 3500.0,
  "effective_brand_price": 3401.0,
  "commission": 595.175,
  "seller_payout": 2805.825,
  "cost_price": 2000.0,
  "monthly_subscription_fee": 500.0,
  "profit": 305.825,
  "margin_percent": 15.291
}
```

**Common errors**
- `400 INVALID_QUERY` — `cost_price` or `subscription_fee` is not a valid number
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — product not found

**Formula reference:**
- `effective_brand_price` = `brand_price` (if `shipping_included=false`) or `brand_price - 99` (if `shipping_included=true`, floored at 0)
- `commission` = `effective_brand_price × 0.175`
- `seller_payout` = `effective_brand_price × 0.825`
- `profit` = `effective_brand_price - commission - cost_price - subscription_fee`
- `margin_percent` = `(profit / cost_price) × 100` (0 if `cost_price` = 0)

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400` | Validation failure, invalid state transition, or unsupported status |
| `401 UNAUTHORIZED` | Missing or invalid seller token |
| `404 NOT_FOUND` | Seller resource, queue item, order, or product not found |
| `409 CONFLICT` | Seller email or draft email conflicts with existing account |
