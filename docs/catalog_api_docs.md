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
  "title": "Floral Lawn Suit",
  "description": "...",
  "seller_id": "uuid",
  "seller_name": "Khaadi",
  "categories": [{ "id": "...", "name": "Lawn", "slug": "lawn" }],
  "product_type": "Eastern",
  "pricing": {
    "price": 3500,
    "compare_at_price": 4200,
    "currency": "PKR",
    "discounted": true,
    "discount_value": 17,
    "discounted_price": 3500
  },
  "images": ["https://cdn.example.com/img1.jpg"],
  "variants": [
    { "id": "...", "sku": "KH-001-S", "title": "Small", "options": {"Size": "S"}, "price": 3500, "available": true }
  ],
  "options": [{ "name": "Size", "values": ["S", "M", "L"] }],
  "inventory": { "in_stock": true, "available_quantity": 12 },
  "rating": 4.5,
  "review_count": 23,
  "is_trending": false,
  "is_featured": true
}
```

**Error `404`** — product not found.

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
["lawn suit", "lawn fabric", "lawn dupatta"]
```

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON (filter endpoint) |
| `404 NOT_FOUND` | Product not found |
| `500 INTERNAL` | Database error |
