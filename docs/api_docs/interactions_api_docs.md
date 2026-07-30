# Interactions Module

User-product interaction tracking (ratings, likes, swipes). Powers recommendation and analytics. All endpoints require user authentication (`Authorization: Bearer <token>`).

---

## Endpoints

### Create or Update Interaction
`POST /api/v2/interactions`

Records or updates a user's interaction with a product. If an interaction for the same `product_id` already exists for the user, it is updated in place.

**Body**
```json
{
  "product_id": "uuid",
  "rating": 4.5,
  "action_type": "like"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `product_id` | yes | ID of the product |
| `rating` | yes | Numeric score (e.g. 1.0–5.0) |
| `action_type` | no | Interaction type: `like`, `dislike`, `view`, `swipe_right`, `swipe_left`, etc. |

**Response `200`** — `Interaction` object.

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "product_id": "uuid",
  "rating": 4.5,
  "action_type": "like",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Get User Interactions
`GET /api/v2/interactions`

Returns all recorded interactions for the authenticated user.

**Response `200`** — array of `Interaction` objects.

---

## Admin Endpoint _(admin auth required)_

### Get All Interactions
`GET /api/v2/admin/interactions`

Returns all interactions across all users. Used for analytics and recommendation model training.

**Response `200`** — array of `Interaction` objects.
