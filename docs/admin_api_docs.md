# Admin Module

Platform administration panel. All endpoints require admin authentication (`Authorization: Bearer <admin_token>`).

---

## Endpoints

### System Health
`GET /api/v2/admin/health`

Returns API and database health status.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": { "database": "ok", "api": "ok" }
}
```

---

## Order Management

### Get All Orders
`GET /api/v2/admin/orders`

Returns all orders across all sellers and users.

**Response `200`** — array of `Order` objects (see [Commerce module](../commerce/docs.md)).

---

### Update Order
`PUT /api/v2/admin/orders/{orderID}`

Overrides the status of any order.

**Body**
```json
{ "status": "delivered" }
```
Valid statuses: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `returned`.

**Response `200`** `{ "message": "Order updated successfully" }`

---

### Get All Carts
`GET /api/v2/admin/carts`

Returns all active shopping carts.

**Response `200`** — array of `Cart` objects.

---

## Product Queue

### Get Products Queue
`GET /api/v2/admin/products-queue`

Returns all items currently in the seller product moderation queue across all sellers.

**Response `200`** — array of `ProductsQueue` objects (see [Seller module](../seller/docs.md)).

---

## User Management

### Get All Users
`GET /api/v2/admin/users`

Returns all registered user accounts.

**Response `200`** — array of `User` objects (see [Identity module](../identity/docs.md)).

---

### Get Active OTPs
`GET /api/v2/admin/otps`

Returns users with currently active (non-expired) OTP codes. Useful for debugging verification issues.

**Response `200`** — array of `User` objects.

---

## Seller Management

### Get All Sellers
`GET /api/v2/admin/sellers`

Returns all seller accounts regardless of status (`pending`, `active`, `suspended`).

**Response `200`** — array of `SellerProfile` objects (see [Seller module](../seller/docs.md)).

---

### Get Seller
`GET /api/v2/admin/sellers/{id}`

Returns the full profile of a specific seller including KYC and bank details.

**Response `200`** — `SellerProfile` object. `404` if not found.

---

### Approve or Suspend Seller
`PUT /api/v2/admin/sellers/{id}/approve`

Approves a pending seller (sets status to `active`) or suspends them.

**Body**
```json
{ "approved": true, "note": "KYC verified" }
```

| Field | Description |
|-------|-------------|
| `approved` | `true` → status becomes `active`; `false` → status becomes `suspended` |
| `note` | Optional internal note |

**Response `200`** `{ "message": "Seller approved" }` or `{ "message": "Seller suspended" }`

---

## Waitlist

### Get Waitlist
`GET /api/v2/admin/waitlist`

Returns all waitlist entries.

**Response `200`** — array of `WaitlistEntry` objects (see [Waitlist module](../waitlist/docs.md)).

---

## Notifications (Admin)

See [Notifications module](../notifications/docs.md) for admin notification endpoints (`broadcast`, `send to user`, `delete tokens`).

---

## Ambassador (Admin)

See [Ambassador module](../ambassador/docs.md) for admin ambassador endpoints (`create task`, `get forms`, `get reports`, `get institutes`).
