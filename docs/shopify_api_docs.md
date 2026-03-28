# Shopify Module

Shopify store connection and product sync for sellers. Protected endpoints require seller authentication (`Authorization: Bearer <seller_token>`).

---

## OAuth Flow

1. Seller calls `GET /api/v2/shopify/auth?shop=yourstore.myshopify.com` — receives a `302` redirect to Shopify's authorization page.
2. Seller approves permissions on Shopify.
3. Shopify redirects to `GET /api/v2/shopify/callback` with auth code — **no seller token needed here, it is a public browser redirect**.
4. On success, browser is redirected to `{FRONTEND_URL}/shopify/success`. On failure, to `{FRONTEND_URL}/shopify/error?reason=...`.

---

## Endpoints

### Initiate OAuth _(seller auth required)_
`GET /api/v2/shopify/auth`

Generates the Shopify authorization URL and redirects the seller's browser to Shopify.

**Query Parameters**

| Param | Required | Description |
|-------|----------|-------------|
| `shop` | yes | Shopify store domain e.g. `yourstore.myshopify.com` |

**Response** — `302` redirect to Shopify authorization page.

**Error `400`** — `shop` parameter missing.

---

### OAuth Callback _(public)_
`GET /api/v2/shopify/callback`

Shopify redirects here after the seller approves the app. Handles HMAC signature verification, code exchange, and stores the access token.

**Query Parameters** (set automatically by Shopify)

| Param | Description |
|-------|-------------|
| `code` | Authorization code |
| `shop` | Store domain |
| `state` | CSRF state token |
| `hmac` | Shopify HMAC signature |

**Response** — `302` redirect to frontend success or error page.

---

### Sync Products _(seller auth required)_
`POST /api/v2/shopify/sync`

Fetches all products from the connected Shopify store and enqueues them in the seller's product queue (status: `queued`). Products then go through the standard enrichment → embedding → promotion pipeline.

**Response `200`**
```json
{ "message": "Shopify sync completed", "count": 47 }
```

**Error `404`** — no active Shopify connection found for the seller.

---

### Get Connection Status _(seller auth required)_
`GET /api/v2/shopify/status`

**Response `200`**
```json
{
  "connected": true,
  "shop": "yourstore.myshopify.com",
  "scopes": "read_products,write_products",
  "installed_at": "2024-01-15T10:30:00Z"
}
```
`connected: false` if no connection exists.

---

### Disconnect Shopify _(seller auth required)_
`DELETE /api/v2/shopify/disconnect`

Removes the seller's Shopify access token and connection record.

**Response `200`** `{ "message": "Shopify disconnected" }`
