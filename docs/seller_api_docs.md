# Seller Module

Seller registration, authentication, product management, inventory, orders, and analytics. Seller-protected endpoints require `Authorization: Bearer <seller_token>`.

---

## Auth Endpoints _(no auth required)_

### Register
`POST /api/v2/seller/auth/register`

Creates a new seller account. Account starts in `pending` status until approved by an admin.

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
    "contact_person_name": "Ahmed Raza",
    "alternate_phone_number": "+923007654321",
    "whatsapp": "+923001234567",
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
    "store_directions": "Near Gaddafi Stadium, first left after the petrol pump",
    "pickup_available": true,
    "pickup_hours": "Mon-Sat 10am-5pm"
  },
  "business_details": {
    "business_type": "sole_proprietorship",
    "business_category": "Fashion",
    "business_subcategory": "Women Wear",
    "founded_year": 2015,
    "number_of_employees": 12
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
    "payment_method": "bank_transfer",
    "branch_code": "0123",
    "branch_address": "Main Branch, Lahore",
    "swift_code": "HABBPKKA",
    "payment_schedule": "monthly",
    "payment_threshold": 5000
  },
  "website": "https://razafabrics.pk",
  "logo_url": "https://cdn.example.com/logo.png",
  "banner_url": "https://cdn.example.com/banner.jpg",
  "banner_mobile_url": "https://cdn.example.com/banner_mobile.jpg"
}
```

**Required fields:** `name`, `email`, `password` (min 8 chars), `legal_name`, `business_name`, `contact.phone_number`, `contact.contact_person_name`, `location.address/city/state/postal_code/country`, `business_details.business_type/business_category`, `kyc_documents.cnic_front/cnic_back`, `bank_details.bank_name/account_title/account_number/iban/payment_method`.

**Ignored by backend** (UI-only fields stripped silently): `formErrors`, `confirmPassword`, `contract_agreed`, `status`, `verified`, `shipping_settings`, `return_policy`, `categories`, `tags`.

KYC `verification_status` is automatically set to `pending`.

**Response `201`**
```json
{ "token": "<seller_jwt>", "seller": { "id": "...", "email": "...", "status": "pending", ... } }
```

---

### Save Draft
`POST /api/v2/seller/auth/register/draft`

Saves (or updates) a partial registration form. Upserts by email — calling again with the same email overwrites the previous draft. Drafts expire after 7 days. Passwords are never stored in drafts.

**Body**
```json
{
  "email": "ahmed@mybrand.pk",
  "step": 3,
  "draft_data": {
    "business_name": "Raza Fabrics",
    "legal_name": "Raza Textiles Pvt Ltd",
    "contact": { "contact_person_name": "Ahmed Raza", "phone_number": "+923001234567" }
  }
}
```

**Response `200`**
```json
{ "message": "Draft saved", "draft_id": "uuid", "step": 3, "updated_at": "..." }
```

**Response `409`** — email already has a full seller account.

---

### Get Draft
`GET /api/v2/seller/auth/register/draft?email=ahmed@mybrand.pk`

Retrieves a saved draft by email.

**Response `200`**
```json
{
  "draft_id": "uuid",
  "email": "ahmed@mybrand.pk",
  "step": 3,
  "draft_data": { ... },
  "created_at": "...",
  "updated_at": "...",
  "expires_at": "..."
}
```

**Response `404`** — no draft found.

---

### Login
`POST /api/v2/seller/auth/login`

**Body**
```json
{ "email": "ahmed@mybrand.pk", "password": "secret123" }
```

**Response `200`** — `{ "token": "<seller_jwt>", "seller": { ... } }`

---

## Profile Endpoints _(seller auth required)_

### Get Profile
`GET /api/v2/seller/profile`

Returns the full seller profile including contact, location, KYC status, and bank details.

**Response `200`** — full `SellerProfile` object (password excluded).

---

### Update Profile
`PATCH /api/v2/seller/profile`

Updates seller profile fields. All fields optional — only provided fields are changed. Available to sellers in **any** status (`pending`, `active`, `suspended`) so sellers can fix issues before approval.

**Body** (all fields optional)
```json
{
  "name": "Ahmed R.",
  "legal_name": "Raza Textiles Pvt Ltd",
  "business_name": "Raza Fabrics Co.",
  "description": "Updated description",
  "short_description": "New tagline",
  "website": "https://razafabrics.pk",
  "logo_url": "https://cdn.example.com/logo.png",
  "banner_url": "https://cdn.example.com/banner.jpg",
  "banner_mobile_url": "https://cdn.example.com/banner_mobile.jpg",
  "contact": { "phone_number": "+923001234567", "contact_person_name": "Ahmed" },
  "location": { "address": "New address", "city": "Lahore", "state": "Punjab", "postal_code": "54000", "country": "Pakistan" },
  "business_details": { "business_type": "partnership", "business_category": "Fashion" },
  "kyc_documents": { "cnic_front": "https://cdn.example.com/new_front.jpg", "cnic_back": "https://cdn.example.com/new_back.jpg" },
  "bank_details": { "bank_name": "UBL", "account_title": "Ahmed Raza", "account_number": "99887766554433", "iban": "PK36SCBL0000001123456703", "payment_method": "bank_transfer" }
}
```

**Response `200`** — updated `SellerProfile`.

---

## Onboarding Endpoints _(seller auth required)_

### Get Onboarding Status
`GET /api/v2/seller/onboarding/status`

Returns the seller's application status and step-by-step onboarding progress. Works for sellers in **any** status (pending, active, suspended, rejected).

**Response `200`**
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

| `status` | Meaning |
|----------|---------|
| `pending` | Awaiting admin review |
| `active` | Approved — redirect to dashboard |
| `suspended` | Suspended — show rejection reason |
| `rejected` | Rejected — show rejection reason |

`can_edit_profile` is `true` for `pending`, `suspended`, and `rejected` sellers.

---

## Product Endpoints _(seller auth required)_

### List Products
`GET /api/v2/seller/products`

Returns all products belonging to the seller.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `active`, `draft`, `archived` |

**Response `200`** — array of `Product` objects.

---

### Create Product
`POST /api/v2/seller/products`

Adds a new product to the moderation queue (status: `queued`). It will not be publicly visible until it passes enrichment, embedding, and promotion.

**Body** — `Product` object (see [Catalog module](./catalog.md) for the full `Product` schema). `seller_id` is injected automatically from the token.

**Response `201`** — `ProductsQueue` object.

---

### Update Product
`PUT /api/v2/seller/products/{id}`

Replaces an existing product's details.

**Body** — `Product` object.

**Response `200`** — updated `Product`.

---

### Delete Product
`DELETE /api/v2/seller/products/{id}`

Permanently removes a product.

**Response `200`** `{ "message": "Product deleted" }`

---

## Product Queue _(seller auth required)_

Products go through a pipeline before becoming publicly visible:
`queued` → `enrichment_pending` → `embedding_pending` → `ready` → `promoted`

### Get Queue
`GET /api/v2/seller/queue`

Returns all queue items for the seller.

**Response `200`** — array of `ProductsQueue` objects.

---

### Enrich Product
`PUT /api/v2/seller/queue/{id}/enrich`

Adds product type, gender targeting, and sizing guide metadata. Transitions item to `embedding_pending`.

**Body**
```json
{
  "product_type": "Eastern",
  "gender": "Female",
  "sizing_guide": { "S": { "chest": 86, "waist": 68 }, "M": { "chest": 91, "waist": 73 } }
}
```

**Response `200`** `{ "message": "Product enriched, pending embeddings" }`

---

### Get Pending Embeddings
`GET /api/v2/seller/queue/pending-embeddings`

Returns all queue items in `embedding_pending` status for the local embedding machine to process.

**Response `200`** — array of `ProductsQueue` objects.

---

### Submit Embeddings
`POST /api/v2/seller/queue/{id}/embeddings`

Stores the AI embedding vector for a product. Transitions item to `ready`.

**Body**
```json
{ "embeddings": [0.12, -0.34, 0.56, ...] }
```

**Response `200`** `{ "message": "Embeddings stored, product is ready for promotion" }`

---

### Promote Product
`POST /api/v2/seller/queue/{id}/promote`

Moves a `ready` queue item into the live catalog. Product becomes publicly visible.

**Response `200`** `{ "message": "Product promoted from queue" }`

---

## Inventory Endpoints _(seller auth required)_

### Bulk Update Inventory
`POST /api/v2/seller/inventory/bulk-update`

Updates stock quantities for multiple variants at once.

**Body**
```json
[
  { "product_id": "uuid", "variant_id": "uuid", "quantity_change": 50, "reason": "restock" },
  { "product_id": "uuid", "variant_id": "uuid", "quantity_change": -3, "reason": "damage" }
]
```
`reason` values: `restock`, `sale`, `damage`, `other`. Positive `quantity_change` adds stock; negative removes it.

**Response `200`** `{ "message": "Inventory updated successfully" }`

---

### Get Low Stock
`GET /api/v2/seller/inventory/low-stock`

Returns variants with inventory at or below the threshold.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `threshold` | int | Alert threshold (default: 10) |

**Response `200`**
```json
[
  { "product_id": "uuid", "product_name": "Lawn Suit", "current_quantity": 3, "threshold": 10 }
]
```

---

### Get Inventory Categories
`GET /api/v2/seller/inventory/categories`

Returns a count of products per category in the seller's catalog.

**Response `200`**
```json
[{ "name": "Tops", "count": 24 }, { "name": "Bottoms", "count": 18 }]
```

---

## Order Endpoints _(seller auth required)_

### Get Orders
`GET /api/v2/seller/orders`

Returns all orders containing this seller's products.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "order_number": "ORD-00123",
    "user_id": "uuid",
    "items": [{ "id": "...", "product_id": "...", "variant_id": "...", "quantity": 1, "unit_price": 3500 }],
    "status": "pending",
    "total": 3700,
    "created_at": "..."
  }
]
```

---

### Fulfill Order
`POST /api/v2/seller/orders/{id}/fulfill`

Marks an order as shipped.

**Body** (optional)
```json
{ "tracking_number": "TCS-123456" }
```

**Response `200`** `{ "message": "Order fulfilled successfully" }`

---

### Update Order Status
`PUT /api/v2/seller/orders/{id}/status`

Updates the fulfillment status of an order.

**Body**
```json
{ "status": "delivered" }
```
Valid values: `shipped`, `delivered`, `cancelled`.

**Response `200`** `{ "message": "Order status updated" }`

---

## Analytics Endpoints _(seller auth required)_

### Get Sales Analytics
`GET /api/v2/seller/analytics/sales`

**Response `200`**
```json
{ "total_revenue": 125000.00, "total_orders": 84, "average_order_value": 1488.10 }
```

---

### Get Order Analytics
`GET /api/v2/seller/analytics/orders`

**Response `200`**
```json
{ "pending": 5, "shipped": 30, "delivered": 45, "cancelled": 4, "total": 84 }
```

---

### Get Inventory Analytics
`GET /api/v2/seller/analytics/inventory`

**Response `200`**
```json
{ "total_products": 62, "in_stock": 54, "out_of_stock": 5, "low_stock": 3 }
```

---

### Get Product Analytics
`GET /api/v2/seller/analytics/product/{productID}`

Returns units sold and revenue for a specific product.

**Response `200`**
```json
{ "product_id": "uuid", "product_name": "Lawn Suit", "total_sold": 18, "revenue": 63000.00 }
```

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON |
| `400` | Missing required fields during registration |
| `401 UNAUTHORIZED` | Missing/invalid seller token |
| `404 NOT_FOUND` | Product, queue item, or order not found |
| `409 CONFLICT` | Email already registered |
