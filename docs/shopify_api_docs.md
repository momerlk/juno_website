# Shopify Module

Shopify store connection and product sync for sellers.

Route auth:
- `GET /api/v2/shopify/callback` — public
- `GET /api/v2/shopify/auth` — seller auth required
- `POST /api/v2/shopify/sync` — seller auth required
- `GET /api/v2/shopify/status` — seller auth required
- `DELETE /api/v2/shopify/disconnect` — seller auth required

Protected routes require `Authorization: Bearer <seller_token>`.

---

## Shared Response Schemas

### `ConnectionStatus`
```json
{
  "connected": true,
  "shop": "yourstore.myshopify.com",
  "scopes": "read_products,write_products",
  "installed_at": "2026-03-28T14:30:00Z"
}
```

When no connection exists:
```json
{
  "connected": false
}
```

### `ProductSyncResponse`
```json
{
  "message": "Shopify sync completed",
  "count": 47
}
```

### `CollectionSyncResponse`
```json
{
  "message": "Shopify collection sync completed",
  "synced": 5,
  "created": 2,
  "updated": 3,
  "skipped": 0
}
```

---

## OAuth Flow

1. Seller calls `GET /api/v2/shopify/auth?shop=yourstore.myshopify.com`.
2. API responds with `302 Found` redirecting the seller to Shopify's authorization screen.
3. Shopify redirects the browser to `GET /api/v2/shopify/callback`.
4. API validates the callback, stores the connection, then redirects to:
   - `{FRONTEND_URL}/shopify/success` on success
   - `{FRONTEND_URL}/shopify/error?reason=...` on failure

---

## Endpoints

### Initiate OAuth
`GET /api/v2/shopify/auth`

Auth: seller token required

**Query parameters**
- `shop` — required Shopify shop domain, for example `yourstore.myshopify.com`

**Response `302`**
- Redirects seller to Shopify authorization page

**Common errors**
- `400 MISSING_SHOP` — missing `shop` query parameter
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### OAuth Callback
`GET /api/v2/shopify/callback`

Auth: public

Shopify redirects the seller's browser here after app approval.

**Query parameters** supplied by Shopify:
- `code`
- `shop`
- `state`
- `hmac`

**Response `302`**
- Redirects browser to frontend success or error page

Notes:
- This endpoint does not return a JSON body.
- Missing callback parameters cause a redirect to the frontend error page rather than a JSON error response.

---

### Sync Products
`POST /api/v2/shopify/sync`

Auth: seller token required

Fetches all products from the connected Shopify store and enqueues them in the seller moderation queue.

**Response `200`**: `ProductSyncResponse`

**Common errors**
- `400` — sync request could not be processed
- `401 UNAUTHORIZED` — missing or invalid seller token
- `404 NOT_FOUND` — no active Shopify connection for the seller

---

### Sync Collections
`POST /api/v2/shopify/collections/sync`

Auth: seller token required

Fetches all collections from the connected Shopify store and maps them to local collections.

**Response `200`**: `CollectionSyncResponse`

---

### Admin Sync Products
`POST /api/v2/admin/shopify/sync`

Auth: admin token required

**Body**
```json
{ "seller_id": "uuid" }
```

**Response `200`**: `ProductSyncResponse`

---

### Admin Sync Collections
`POST /api/v2/admin/catalog/collections/shopify-sync`

Auth: admin token required

**Body**
```json
{ "seller_id": "uuid" }
```

**Response `200`**: `CollectionSyncResponse`

---

### Get Connection Status
`GET /api/v2/shopify/status`

Auth: seller token required

**Response `200`**: `ConnectionStatus`

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token

---

### Disconnect Shopify
`DELETE /api/v2/shopify/disconnect`

Auth: seller token required

Removes the seller's Shopify connection record and stored access token.

**Response `200`**
```json
{ "message": "Shopify disconnected" }
```

**Common errors**
- `401 UNAUTHORIZED` — missing or invalid seller token

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 MISSING_SHOP` | Missing `shop` query parameter |
| `400` | Invalid OAuth/sync request |
| `401 UNAUTHORIZED` | Missing or invalid seller token |
| `404 NOT_FOUND` | Shopify connection not found |
