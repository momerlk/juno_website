# Catalog Module

Public product browsing, search, and filtering. No authentication required.

---

## Endpoints

### List Products
`GET /api/v2/catalog/products`

Returns products with optional filters. Cursor pagination is the recommended way to
load the complete Juno catalog. The response keeps products in `data` and publishes
pagination state in `meta.pagination`.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `category` / `category_id` | string | Filter by category ID |
| `seller_id` | string | Filter by one seller/brand ID |
| `seller_ids` / `brand_ids` | string | Comma-separated seller/brand IDs. IDs are the preferred stable brand filter |
| `brands` / `brand` | string | Comma-separated exact brand names, matched case-insensitively |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `in_stock` | boolean | `true` for available products, `false` for unavailable products |
| `sizes` | string | Comma-separated variant sizes |
| `colors` | string | Comma-separated variant colors |
| `product_types` | string | Comma-separated product types |
| `materials` | string | Comma-separated material tags |
| `occasions` | string | Comma-separated occasion tags |
| `tags` | string | Comma-separated product tags |
| `sort` | string | `priority` (default badge precedence), `created_at`, `updated_at`, `price`, `rating`, `popularity`, or `title` |
| `order` | string | Sort direction: `asc` or `desc` |
| `limit` | int | Items per page. Default `20`, maximum `100` |
| `cursor` | string | Opaque `next_cursor` from the previous response |
| `page` | int | Legacy page number. Ignored when `cursor` is supplied |

**Response `200`**

```json
{
  "success": true,
  "data": [
    { "id": "product-1", "title": "Printed Lawn Suit" }
  ],
  "meta": {
    "pagination": {
      "limit": 100,
      "returned": 100,
      "has_more": true,
      "next_cursor": "eyJ2IjoxLCJzb3J0IjoiY3JlYXRlZF9hdCIsLi4ufQ"
    }
  }
}
```

**How a client fetches every product**

1. Request `GET /api/v2/catalog/products?limit=100`.
2. Append `data` to the local result set.
3. If `meta.pagination.has_more` is `true`, request the same URL and filters
   with `cursor=<meta.pagination.next_cursor>`.
4. Continue until `has_more` is `false`.

The sort, order, and filters must remain unchanged while following a cursor.
Cursors are opaque and clients must not decode or modify them.

```ts
async function fetchEntireCatalog() {
  const products = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`/api/v2/catalog/products?${params}`);
    const body = await response.json();
    products.push(...body.data);
    cursor = body.meta.pagination.has_more
      ? body.meta.pagination.next_cursor
      : undefined;
  } while (cursor);

  return products;
}
```

Page-number pagination remains available for older clients, but cursor pagination
avoids increasingly expensive database skips on deep pages and gives deterministic
ordering using the product ID as a tie-breaker.

Default catalog listing gives badge precedence to:
1. products with `badges.marketing_campaign=true`
2. then products with `badges.best_seller=true`
3. then all other products

If a product has both marketing-campaign and best-seller badges, it appears ahead of products that only have one.

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
  "is_featured": true,
  "badges": {
    "marketing_campaign": true,
    "best_seller": false,
    "thrifted": false
  }
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
| `gender` | string | Target gender: `Male`, `Female`, `Unisex` |
| `enrichment` | object | Seller-supplied metadata (see below) |
| `enrichment.product_type` | string | Targeted product type |
| `enrichment.gender` | string | Target gender |
| `enrichment.sizing_guide` | object | Category-specific sizing information |
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
| `badges` | object | Optional admin-managed badges |
| `badges.marketing_campaign` | boolean | Marketing campaign priority badge |
| `badges.best_seller` | boolean | Best seller badge |
| `badges.thrifted` | boolean | Thrifted display badge; does not affect ranking |
| `seller_city` | string | City where this brand ships from (used for within-city vs outside-city shipping classification) |

---

### Search Products
`GET /api/v2/catalog/products/search`

Ranked fuzzy search powered by the MongoDB Atlas Search index `products_search`.
Search covers product titles, descriptions, short descriptions, HTML body text,
tags, brand names, product types, and category names. Title and brand matches are
boosted above generic description matches.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `keyword` | string | yes | Search term |
| `seller_id` | string | no | One seller/brand ID |
| `seller_ids` / `brand_ids` | string | no | Comma-separated seller/brand IDs |
| `brands` / `brand` | string | no | Comma-separated exact brand names |
| `category` | string | no | Category ID |
| `min_price` / `max_price` | number | no | Price range |
| `in_stock` | boolean | no | Inventory availability |
| `sizes`, `colors`, `product_types`, `materials`, `occasions`, `tags` | string | no | Comma-separated filters |
| `cursor` | string | no | Atlas Search `next_cursor` from the previous response |
| `page` | int | no | Legacy page number |
| `limit` | int | no | Default `20`, maximum `100` |

The response uses the same `data` and `meta.pagination` structure as List Products.
Search cursors are generated by Atlas Search and are only valid for the same keyword,
filters, and sort semantics.

---

### Filter Products (POST)
`POST /api/v2/catalog/products/filter`

Advanced multi-criteria filtering via JSON body. Use when query params are insufficient (e.g., multiple sizes or colors).

**Body**
```json
{
  "category_id": "uuid",
  "seller_id": "uuid",
  "seller_ids": ["brand-1", "brand-2"],
  "seller_names": ["Khaadi", "Sapphire"],
  "min_price": "500",
  "max_price": "5000",
  "sort": "price",
  "order": "asc",
  "limit": "20",
  "cursor": "",
  "keyword": "lawn",
  "in_stock": true,
  "sizes": ["S", "M"],
  "colors": ["White", "Blue"],
  "materials": ["Cotton"],
  "product_types": ["Eastern"],
  "occasions": ["Casual"]
}
```
All fields are optional. If `keyword` is present, this endpoint uses Atlas Search;
otherwise it uses the normal catalog listing query. Multi-value filters use OR
within one field and AND across different fields.

**Response `200`** — products in `data`, with cursor state in `meta.pagination`.

---

### Get Filter Options
`GET /api/v2/catalog/products/filters`

Returns filter values derived from active `products_v2` rows belonging to active
sellers. The same query parameters supported by product listing can be supplied
here to scope the returned filter options to the current result set.

**Response `200`**
```json
{
  "sizes": ["XS", "S", "M", "L", "XL"],
  "price_ranges": [{ "min": 0, "max": 1000 }, { "min": 1000, "max": 3000 }],
  "categories": [{ "id": "...", "name": "Tops", "slug": "tops" }],
  "colors": ["Black", "White", "Red"],
  "brands": [{ "id": "...", "name": "Khaadi", "product_count": 142 }],
  "materials": ["Cotton", "Chiffon"],
  "occasions": ["Casual", "Formal"],
  "product_types": ["kurta", "maxi_dress"],
  "departments": ["apparel"],
  "product_groups": ["sets", "dresses_and_one_pieces"],
  "genders": ["women", "unisex"]
}
```

---

### Get Catalog Facets
`GET /api/v2/catalog/products/facets`

Returns count-based facet buckets built from `products_v2` metadata after
applying any query parameters. This is the richer discovery endpoint for
building layered catalog filters in the frontend.

**Response `200`**
```json
{
  "price_range": { "min": 1890, "max": 14990 },
  "brands": [{ "id": "seller-1", "name": "Khaadi", "count": 142 }],
  "departments": [{ "value": "apparel", "count": 721 }],
  "product_groups": [{ "value": "sets", "count": 244 }],
  "product_types": [{ "value": "kurta_trouser_dupatta_set", "count": 63 }],
  "genders": [{ "value": "women", "count": 580 }],
  "style_categories": [{ "value": "pret", "count": 311 }],
  "pakistani_wear": [{ "value": "lawn", "count": 88 }]
}
```

---

### Get Catalog Hierarchy
`GET /api/v2/catalog/hierarchy`

Returns a live taxonomy tree from `department -> product_group -> product_type`
using `products_v2.metadata`, with counts at each level. Optional query filters
can be supplied to scope the hierarchy to a gender, brand, price band, or any
other metadata selection.

**Response `200`**
```json
{
  "departments": [
    {
      "department": "apparel",
      "product_count": 721,
      "groups": [
        {
          "product_group": "sets",
          "product_count": 244,
          "types": [
            { "product_type": "kurta_trouser_dupatta_set", "product_count": 63 }
          ]
        }
      ]
    }
  ]
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

### Get Gender Overview
`GET /api/v2/catalog/gender/{gender}`

Returns a paginated product list and brand list for a gender category. No authentication required.

Men includes products with canonical metadata gender `men` or `unisex`. Women includes products with canonical metadata gender `women` or `unisex`.

The brands array only includes brands that have at least one product in the returned (filtered) product set. The `total` field reflects the full count of matching products across all pages, not just the current page length.

**Path Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `gender` | string | yes | Gender category: `men` or `women` |

**Query Parameters** (all optional)

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |
| `sort` | string | Sort field: `price` or `created_at` |
| `order` | string | Sort direction: `asc` or `desc` |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `category` | string | Filter by category ID |

**Response `200`**
```json
{
  "gender": "men",
  "products": [
    {
      "id": "uuid",
      "title": "Product Name",
      "seller_name": "Brand Name",
      "seller_logo": "https://...",
      "pricing": { "price": 2500, "currency": "PKR" },
      "images": ["https://..."],
      "metadata": { "gender": "men", "department": "apparel", "product_type": "kurta" },
      "status": "active"
    }
  ],
  "brands": [
    { "id": "uuid", "name": "Brand Name" }
  ],
  "total": 42
}
```

**Response `400`** — invalid gender value
```json
{
  "code": "BAD_REQUEST",
  "message": "gender must be 'men' or 'women'"
}
```

**Metadata Mapping**

| URL path param | Metadata genders sent to MongoDB `$in` filter |
|---|---|
| `men` | `["men", "unisex"]` |
| `women` | `["women", "unisex"]` |
| anything else | returns 400 Bad Request |

**Edge Cases**
- No products found for a gender → returns `products: []`, `brands: []`, `total: 0` (not 404)
- Additional filters (category, price, etc.) are applied to both products and brands, ensuring consistency
- Only brands from active sellers are included (same seller status check as the product listing)

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
| `PATCH` | `/api/v2/admin/catalog/products/{id}` | Partially update active catalog product |
| `DELETE` | `/api/v2/admin/catalog/products/{id}` | Delete product from active catalog |
| `DELETE` | `/api/v2/admin/catalog/collections/{id}/products/{productID}` | Remove a product from collection |

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

### Remove Product from Collection
`DELETE /api/v2/admin/catalog/collections/{id}/products/{productID}`

Auth: admin token required

Removes a single product from an existing collection.

**Response `200`** `{ "message": "Product removed from collection" }`

---

## Sizing

### Get approved sizing data
`GET /api/v2/catalog/{id}/sizing`

Returns only an approved normalized chart, the matching section, available variants,
and the taxonomy-selected questionnaire. Source image/HTML artifacts are never exposed
as normalized customer data. `availability` is one of `normalized`,
`needs_manual_review`, `not_found`, or `not_required`.

### Get a size recommendation
`POST /api/v2/catalog/{id}/sizing/recommend`

```json
{
  "usual_size": "M",
  "fit": "regular",
  "measurements": {"chest": 40}
}
```

The deterministic `size-match-v1` matcher only considers available variants and never
calls Gemini at request time.

## Admin Product Endpoints

### Update Product
`PATCH /api/v2/admin/catalog/products/{id}`

Auth: admin token required

Partially updates a product in the active catalog.

**Body** (all fields optional)
```json
{
  "title": "Updated product title",
  "description": "Updated description",
  "status": "active",
  "is_featured": true,
  "tags": ["summer", "new"]
}
```

**Response `200`** — updated `Product`.

---

### Delete Product
`DELETE /api/v2/admin/catalog/products/{id}`

Auth: admin token required

Deletes a product from the catalog and also removes stale references in collections and drops.

**Response `200`** `{ "message": "Product deleted" }`

**Error `404`** — product not found.

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
