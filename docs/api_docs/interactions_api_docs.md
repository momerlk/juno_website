# Interactions Module

User-product interaction tracking (ratings, likes, swipes). Powers recommendation and analytics. User routes require user authentication (`Authorization: Bearer <token>`); the admin listing requires admin authentication. The V2 router registers `GET` and `POST /api/v2/interactions`, plus `GET /api/v2/admin/interactions`.

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

**Response `200`** — an array of `Interaction` objects. When no interactions exist,
the response is `[]` (never `null`).

---

## Product Reviews

### List Product Reviews
`GET /api/v2/catalog/products/{id}/reviews`

Public. Returns up to the 100 newest reviews, or `[]` when the product has none.
Returns `404` when the product does not exist.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "id": "campaign-import-347982",
      "reviewer_name": "Saba Kazmi",
      "product_id": "d0f1831d-f95c-4179-86a3-fd4e441e507f",
      "rating": 5,
      "comment": "Beautiful as always Thankyou Juno",
      "created_at": "2025-12-24T17:07:46Z",
      "updated_at": "2025-12-24T17:07:46Z"
    }
  ]
}
```

`user_id` is never exposed. Imported reviews that have no source display name
use `Anonymous`; an empty `comment` is a valid rating-only review.

### Catalog Display

Catalog product responses already expose `rating` (average rating) and
`review_count` (total reviews). Use these fields for product-card and PDP
summary UI, then request this endpoint on a product detail page to display
individual reviews. Both summary fields are recalculated whenever a review is
created or imported.

### Create or Update a Review
`POST /api/v2/reviews` _(user auth required)_

Each user has one review per product; posting again replaces its rating and comment.

```json
{
  "product_id": "uuid",
  "rating": 5,
  "comment": "Great fit and fabric."
}
```

`rating` must be an integer from 1 through 5. `comment` is optional and limited to 2,000 characters.

---

## Admin Endpoint _(admin auth required)_

### Get All Interactions
`GET /api/v2/admin/interactions`

Returns all interactions across all users. Used for analytics and recommendation model training.

**Response `200`** — an array of `Interaction` objects. When no interactions exist,
the response is `[]` (never `null`).
