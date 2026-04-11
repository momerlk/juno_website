# Catalog Module

Public product browsing, search, and filtering. No authentication required.

---

## Endpoints

### List Products
`GET /api/v2/catalog/products`

Returns a paginated list of products with optional filters via query parameters.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category ID |
| `seller_id` | string | Filter by seller/brand ID |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `sort` | string | Sort field: `price` or `created_at` |
| `order` | string | Sort direction: `asc` or `desc` |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |

**Response `200`** — array of `Product` objects.

---

### Get Product
`GET /api/v2/catalog/products/{id}`

Returns full details for a single product.

**Response `200`**
```json
{
  "id": "uuid",
  "raw_id": "shopify-123",
  "handle": "floral-lawn-suit",
  "title": "Floral Lawn Suit",
  "description": "Premium printed lawn suit with intricate floral motifs...",
  "short_description": "Summer lawn edit",
  "seller_id": "uuid",
  "seller_name": "Khaadi",
  "seller_logo": "https://cdn.example.com/logo.png",
  "categories": [{ "id": "...", "name": "Lawn", "slug": "lawn" }],
  "product_type": "Eastern",
  "pricing": {
    "price": 3599,
    "compare_at_price": 4299,
    "currency": "PKR",
    "discounted": true,
    "discount_value": 17,
    "discounted_price": 3599,
    "brand_price": 3500,
    "shipping_included": false,
    "commission_rate": 0.175,
    "seller_payout": 2887.5,
    "cost_price": 2000
  },
  "images": ["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"],
  "variants": [
    { "id": "...", "sku": "KH-001-S", "title": "Small", "options": {"Size": "S"}, "price": 3500, "available": true }
  ],
  "options": [{ "name": "Size", "values": ["S", "M", "L"] }],
  "tags": ["summer", "lawn", "floral"],
  "inventory": { "in_stock": true, "available_quantity": 12 },
  "shipping_details": { "free_shipping": false, "estimated_delivery_days": 5 },
  "status": "active",
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-03-28T14:30:00Z",
  "published_at": "2026-03-05T00:00:00Z",
  "rating": 4.5,
  "review_count": 23,
  "is_trending": false,
  "is_featured": true
}
```

**Error `404`** — product not found.

**Product Model Fields**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique product identifier (UUID) |
| `raw_id` | string | External ID from source (e.g., Shopify) |
| `handle` | string | URL-friendly slug |
| `title` | string | Product display name |
| `description` | string | Full product description |
| `short_description` | string | Brief summary |
| `seller_id` | string | Seller/brand ID |
| `seller_name` | string | Seller/brand name |
| `seller_logo` | string | Seller logo URL |
| `categories` | array | Product categories |
| `product_type` | string | Type: `Eastern`, `Western`, etc. |
| `pricing` | object | Pricing details |
| `pricing.price` | number | Current selling price (display price shown to customers) |
| `pricing.compare_at_price` | number | Original price (MSRP) |
| `pricing.currency` | string | Currency code (e.g., `PKR`) |
| `pricing.discounted` | boolean | Whether on sale |
| `pricing.discount_value` | number | Discount percentage |
| `pricing.discounted_price` | number | Price after discount |
| `pricing.brand_price` | number | Raw brand/seller price before the Rs.99 shipping buffer markup |
| `pricing.shipping_included` | boolean | True if brand embedded the Rs.99 shipping buffer in their listed price |
| `pricing.commission_rate` | number | Juno's commission rate (constant: 0.175 = 17.5%) |
| `pricing.seller_payout` | number | Amount transferred to the brand after commission deduction |
| `pricing.cost_price` | number | Seller's purchase/production cost (for profit calculation only) |
| `images` | string[] | Product image URLs |
| `variants` | array | Product variants (sizes, colors) |
| `options` | array | Configurable options |
| `tags` | string[] | Search/discovery keywords |
| `inventory` | object | Stock status |
| `inventory.in_stock` | boolean | Availability flag |
| `inventory.available_quantity` | int | Units available |
| `shipping_details` | object | Shipping constraints |
| `shipping_details.free_shipping` | boolean | Free shipping flag |
| `status` | string | Lifecycle: `active`, `draft`, `archived` |
| `created_at` | ISO 8601 | Creation timestamp |
| `updated_at` | ISO 8601 | Last update timestamp |
| `published_at` | ISO 8601 | Publication timestamp |
| `rating` | number | Average user rating |
| `review_count` | int | Total reviews |
| `is_trending` | boolean | Trending flag |
| `is_featured` | boolean | Featured flag |
| `seller_city` | string | City where this brand ships from (used for within-city vs outside-city shipping classification) |

---

### Search Products
`GET /api/v2/catalog/products/search`

Full-text keyword search across product titles, descriptions, and tags.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `keyword` | string | yes | Search term |
| `page` | int | no | Page number |
| `limit` | int | no | Items per page |

**Response `200`** — array of matching `Product` objects.

---

### Filter Products (POST)
`POST /api/v2/catalog/products/filter`

Advanced multi-criteria filtering via JSON body. Use when query params are insufficient (e.g., multiple sizes or colors).

**Body**
```json
{
  "category_id": "uuid",
  "seller_id": "uuid",
  "min_price": "500",
  "max_price": "5000",
  "sort": "price",
  "order": "asc",
  "page": "1",
  "limit": "20",
  "keyword": "lawn",
  "sizes": ["S", "M"],
  "colors": ["White", "Blue"],
  "materials": ["Cotton"],
  "product_types": ["Eastern"],
  "occasions": ["Casual"]
}
```
All fields optional.

**Response `200`** — array of `Product` objects.

---

### Get Filter Options
`GET /api/v2/catalog/products/filters`

Returns all available filter values to populate a search sidebar/filter UI.

**Response `200`**
```json
{
  "sizes": ["XS", "S", "M", "L", "XL"],
  "price_ranges": [{ "min": 0, "max": 1000 }, { "min": 1000, "max": 3000 }],
  "categories": [{ "id": "...", "name": "Tops", "slug": "tops" }],
  "colors": ["Black", "White", "Red"],
  "brands": [{ "id": "...", "name": "Khaadi" }],
  "materials": ["Cotton", "Chiffon"],
  "occasions": ["Casual", "Formal"],
  "product_types": ["Eastern", "Western"]
}
```

---

### Get Brand Stats
`GET /api/v2/catalog/brands/{id}/stats`

Returns aggregated stats for a brand/seller.

**Response `200`**
```json
{ "product_count": 142, "average_rating": 4.2 }
```

---

### Get Brand Storefront
`GET /api/v2/catalog/brands/{id}/storefront`

Returns guest-facing brand landing data for performance marketing and storefront pages.

**Response `200`**
```json
{
  "brand": {
    "id": "seller-1",
    "name": "Khaadi",
    "business_name": "Khaadi Pakistan",
    "description": "Seasonal prints and everyday staples.",
    "logo_url": "https://...",
    "banner_url": "https://..."
  },
  "featured_products": [
    { "id": "p1", "title": "Printed Lawn Suit" }
  ],
  "collections": [
    { "id": "c1", "title": "Summer Lawn", "slug": "summer-lawn" }
  ],
  "drops": [
    { "id": "d1", "title": "Weekend Drop", "status": "announced" }
  ],
  "product_count": 142,
  "average_rating": 4.2
}
```

---

### Get Trending Searches
`GET /api/v2/catalog/search/trending`

Returns the most-searched keywords.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Number of terms (default: 10) |

**Response `200`**
```json
[{ "term": "lawn suit", "count": 1520 }, { "term": "kurta", "count": 980 }]
```

---

### Search Autocomplete
`GET /api/v2/catalog/search/autocomplete`

Returns type-ahead suggestions for a given prefix.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Prefix to complete |

**Response `200`**
```json
["lawn suit","lawn fabric","lawn dupatta"]
```

---

### Get Popular Products
`GET /api/v2/catalog/products/popular`

Returns a ranked list of popular products for guest storefronts and landing pages.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Maximum products to return (default: 12) |

**Response `200`** — array of `Product` objects.

---

### Get Related Products
`GET /api/v2/catalog/products/{id}/related`

Returns a recommendation set related to the given product.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Maximum products to return (default: 8) |

**Response `200`** — array of `Product` objects.

---

## Collection Endpoints

### List Collections
`GET /api/v2/catalog/collections`

Returns all curated product collections marked as active.

**Response `200`** — array of `Collection` objects.

---

### Get Collection
`GET /api/v2/catalog/collections/{idOrSlug}`

Returns collection details and the first page of products.

**Response `200`**
```json
{
  "collection": {
    "id": "uuid",
    "title": "Summer Lawn",
    "slug": "summer-lawn",
    "description": "The finest lawn collection...",
    "image_url": "https://...",
    "product_ids": ["uuid-1", "uuid-2"]
  },
  "products": [
    { "id": "uuid-1", "title": "...", "pricing": { ... } }
  ]
}
```

---

## Drop Endpoints

### List Drops
`GET /api/v2/catalog/drops`

Returns public drops. By default this excludes `draft` drops and includes announced, live, sold out, and ended drops.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Optional explicit status filter |
| `seller_id` | string | Filter by seller |

**Response `200`** — array of `Drop` objects.

---

### Get Drop
`GET /api/v2/catalog/drops/{idOrSlug}`

Returns a single drop with its products.

**Response `200`**
```json
{
  "drop": {
    "id": "uuid",
    "title": "Weekend Lawn Drop",
    "slug": "weekend-lawn-drop",
    "seller_id": "seller-1",
    "status": "announced",
    "product_ids": ["p1", "p2"],
    "launch_at": "2026-04-05T18:00:00Z",
    "reminder_count": 24,
    "view_count": 153
  },
  "products": [
    { "id": "p1", "title": "Printed Lawn Suit" }
  ]
}
```

This public detail endpoint increments the drop `view_count`.

---

### Set Drop Reminder
`POST /api/v2/catalog/drops/{idOrSlug}/remind`

Subscribes an authenticated user or guest to the drop launch reminder.

**Body**
```json
{
  "channel": "email",
  "email": "guest@example.com"
}
```

For `push`, supply an authenticated user or a guest identity such as `guest_id` or `expo_token`.

---

### Cancel Drop Reminder
`DELETE /api/v2/catalog/drops/{idOrSlug}/remind`

Cancels a reminder for the current authenticated user or for the guest identity supplied in the request body.

**Body**
```json
{
  "email": "guest@example.com"
}
```

---

## Seller Drop Endpoints

Authenticated sellers can create and manage their own draft drops.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v2/seller/drops` | List seller drops |
| `POST` | `/api/v2/seller/drops` | Create draft drop |
| `GET` | `/api/v2/seller/drops/{id}` | Get seller drop |
| `PUT` | `/api/v2/seller/drops/{id}` | Update seller draft drop |
| `GET` | `/api/v2/seller/drops/{id}/analytics` | View seller drop analytics |

---

## Admin Drop Endpoints

Authenticated admins can manage the full drop lifecycle.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v2/admin/catalog/drops` | List all drops |
| `POST` | `/api/v2/admin/catalog/drops` | Create drop |
| `GET` | `/api/v2/admin/catalog/drops/{id}` | Get drop |
| `PUT` | `/api/v2/admin/catalog/drops/{id}` | Update drop |
| `PATCH` | `/api/v2/admin/catalog/drops/{id}/status` | Change drop status |
| `POST` | `/api/v2/admin/catalog/drops/{id}/products` | Replace or reorder drop products |
| `GET` | `/api/v2/admin/catalog/drops/{id}/reminders` | List pending reminders |
| `GET` | `/api/v2/admin/catalog/drops/{id}/analytics` | View denormalized drop metrics |

---

### Get Collection Products
`GET /api/v2/catalog/collections/{idOrSlug}/products`

Returns a paginated list of products belonging to a collection.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |

**Response `200`** — array of `Product` objects.

---

## Admin Collection Endpoints

### Create Collection
`POST /api/v2/admin/catalog/collections`

Auth: admin token required

**Body**
```json
{
  "title": "New Arrival",
  "slug": "new-arrival",
  "description": "Curated new arrivals",
  "image_url": "https://...",
  "product_ids": ["uuid-1", "uuid-2"],
  "tags": ["new", "summer"],
  "is_active": true,
  "priority": 10
}
```

**Response `201`** — `Collection` object.

---

### Update Collection
`PUT /api/v2/admin/catalog/collections/{id}`

Auth: admin token required

PATCH-like semantics via PUT. All fields optional.

**Response `200`** — `Collection` object.

---

### Delete Collection
`DELETE /api/v2/admin/catalog/collections/{id}`

Auth: admin token required

Archives the collection by setting `is_active` to `false`.

**Response `200`** `{ "message": "Collection deleted" }`

---

### Add Products to Collection
`POST /api/v2/admin/catalog/collections/{id}/products`

Auth: admin token required

**Body**
```json
{
  "product_ids": ["uuid-3", "uuid-4"]
}
```

**Response `200`** `{ "message": "Products added to collection" }`

---

## Product Deletion

Product deletion is handled through the **Seller module**, not the Catalog module. Sellers can delete their own products via:

### Delete Product
`DELETE /api/v2/seller/products/{id}`

Auth: seller token required

Deletes a product from the catalog and cleans up associated queue items.

**Response `200`** `{ "message": "Product deleted successfully" }`

**Error `404`** — product not found.

**Error `401`** — not your product.

**Implementation Notes:**
- When a product is deleted, the system also attempts to delete any associated queue item from the `products_queue` collection
- This prevents orphaned queue items from accumulating when products are removed
- Queue items that were promoted to the catalog share the same ID as the product, so cleanup is straightforward

### Reject Product from Queue
`POST /api/v2/seller/queue/{id}/reject`

Auth: seller token required

Rejects a product from the moderation queue without deleting it from the catalog. Sets the queue item status to `failed`.

**Request Body** (optional)
```json
{
  "reason": "Product images are low quality"
}
```

**Response `200`** `{ "message": "Product rejected and removed from queue" }`

**Error `404`** — queue item not found.

---

## Error Responses


| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON (filter endpoint) |
| `404 NOT_FOUND` | Product not found |
| `500 INTERNAL` | Database error |
