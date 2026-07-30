# Notifications Module

Expo push notification token management and delivery. Uses [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/).

---

## User Endpoints _(user auth required)_

### Register Token
`POST /api/v2/notifications/register`

Registers or updates an Expo push token for the authenticated user. Call this on app launch after obtaining a token from Expo.

**Body**
```json
{ "expo_token": "ExponentPushToken[xxxx]", "project_type": "user" }
```

**Response `200`** — `NotificationToken` object.

---

### Send Notification
`POST /api/v2/notifications/send`

Queues a notification for specific users. Internal/System use.

**Body**
```json
{
  "user_ids": ["uuid-1", "uuid-2"],
  "title": "Alert",
  "body": "System message",
  "data": {}
}
```

**Response `202`** `{ "message": "Notifications queued" }`

---

### Unregister Token
`POST /api/v2/notifications/unregister`

Removes a push token (e.g., on logout).

**Body**
```json
{ "expo_token": "ExponentPushToken[xxxx]" }
```

**Response `200`** `{ "message": "Token unregistered successfully" }`

---

## Seller Endpoints _(seller auth required)_

### Register Seller Token
`POST /api/v2/notifications-seller/register`

Same as user registration but scoped to the seller app. `project_type` is automatically set to `"seller"`.

**Body**
```json
{ "expo_token": "ExponentPushToken[xxxx]", "project_type": "seller" }
```

**Response `200`** — `NotificationToken` object.

---

### Unregister Seller Token
`POST /api/v2/notifications-seller/unregister`

**Body**
```json
{ "expo_token": "ExponentPushToken[xxxx]" }
```

**Response `200`** `{ "message": "Token unregistered successfully" }`

---

## Admin Endpoints _(admin auth required)_

### Broadcast Notification
`POST /api/v2/admin/notifications/broadcast`

Sends a push notification to all registered user tokens.

**Body**
```json
{
  "title": "New Collection Drop!",
  "body": "Check out the latest arrivals from your favourite brands.",
  "data": { "screen": "catalog" }
}
```
`title` and `body` required. `data` is an optional arbitrary payload passed to the app.

**Response `200`** `{ "message": "Broadcast sent successfully" }`

---

### Send to Specific User
`POST /api/v2/admin/notifications/users/{user_id}/send`

Sends a push notification to a single user.

**Body**
```json
{ "title": "Your order has shipped!", "body": "Track your order now.", "data": { "order_id": "uuid" } }
```

**Response `200`** `{ "message": "Notification sent successfully" }`

---

### Delete User Tokens
`DELETE /api/v2/admin/notifications/tokens/user/{user_id}`

Removes all push tokens associated with a user (e.g., after account suspension).

**Response `200`** `{ "message": "Tokens deleted", "count": 2 }`

---

### Delete Token by Expo Token
`DELETE /api/v2/admin/notifications/tokens/{expo_token}`

Removes a specific token by its Expo token string.

**Response `200`** `{ "message": "Token deleted successfully" }`

---

## User Notification Endpoints _(user auth required)_

### Trigger Notification by Event
`POST /api/v2/notifications/trigger`

Sends a push notification to a user based on event type. Uses predefined notification templates.

**Body**
```json
{
  "user_id": "uuid",
  "event_type": "order_shipped",
  "variables": {
    "order_number": "ORD-12345"
  }
}
```

**Response `200`**
```json
{
  "notification_id": "uuid",
  "status": "sent",
  "recipients_count": 1
}
```

**Common errors**
- `400 INVALID_BODY` — Invalid request body
- `400 BAD_REQUEST` — Missing user_id or event_type

---

### Get Notification History
`GET /api/v2/notifications/history`

Returns a paginated list of notifications sent to the authenticated user.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `event_type` | string | Filter by event type |
| `from_date` | string | Filter from date (YYYY-MM-DD) |
| `to_date` | string | Filter to date (YYYY-MM-DD) |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20) |

**Response `200`**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "event_type": "order_shipped",
      "title": "Order Shipped",
      "body": "Your order ORD-12345 has been shipped",
      "read": false,
      "created_at": "2026-04-13T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "has_next": true
}
```

---

### Mark as Read
`PUT /api/v2/notifications/{id}/read`

Marks a specific notification as read for the authenticated user.

**Path Params**
| Param | Type | Description |
|-------|------|-------------|
| `id` | string | Notification ID |

**Response `200`** `{ "message": "Notification marked as read" }`

**Error `404`** — Notification not found

---

### Get Unread Count
`GET /api/v2/notifications/unread-count`

Returns the number of unread notifications for the authenticated user.

**Response `200`**
```json
{ "count": 5 }
```
