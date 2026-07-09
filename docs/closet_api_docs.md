# Closet Module

Virtual wardrobe and outfit management. All endpoints require user authentication (`Authorization: Bearer <token>`).

---

## Closet Endpoints

### Create Closet
`POST /api/v2/closets`

**Body**
```json
{ "name": "Summer Wardrobe", "description": "All my summer picks", "is_public": false }
```
`name` required. Public closets are shareable.

**Response `201`** — `Closet` object.

---

### Get User Closets
`GET /api/v2/closets`

Returns all closets belonging to the authenticated user.

**Response `200`** — array of `Closet` objects.

---

### Get Closet
`GET /api/v2/closets/{id}`

**Response `200`** — `Closet` object. `404` if not found.

---

### Update Closet
`PUT /api/v2/closets/{id}`

All fields optional.

**Body**
```json
{ "name": "Updated Name", "description": "Updated desc", "is_public": true }
```

**Response `200`** — updated `Closet` object.

---

### Delete Closet
`DELETE /api/v2/closets/{id}`

**Response `200`** `{ "message": "Closet deleted" }`

---

### Add Item to Closet
`POST /api/v2/closets/{id}/items`

Adds a product to the closet.

**Body**
```json
{ "product_id": "uuid" }
```

**Response `200`** — updated `Closet` object.

---

### Remove Item from Closet
`DELETE /api/v2/closets/{id}/items`

**Query Parameters**

| Param | Required | Description |
|-------|----------|-------------|
| `product_id` | yes | ID of the product to remove |

**Response `200`** — updated `Closet` object.

---

## Outfit Endpoints

### Create Outfit
`POST /api/v2/outfits`

Creates a curated outfit from a set of product IDs.

**Body**
```json
{
  "name": "Friday Casual",
  "product_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "image_url": "https://cdn.example.com/outfit.jpg"
}
```
`name` and `product_ids` required.

**Response `201`** — `Outfit` object.

---

### Get User Outfits
`GET /api/v2/outfits`

**Response `200`** — array of `Outfit` objects.

---

### Get Outfit
`GET /api/v2/outfits/{id}`

**Response `200`** — `Outfit` object.

---

### Delete Outfit
`DELETE /api/v2/outfits/{id}`

**Response `200`** `{ "message": "Outfit deleted" }`

---

## Models

**Closet**
```json
{
  "id": "uuid", "user_id": "uuid", "name": "Summer Wardrobe",
  "description": "...", "is_public": false,
  "items": [{ "product_id": "uuid", "added_at": "..." }],
  "created_at": "...", "updated_at": "..."
}
```

**Outfit**
```json
{
  "id": "uuid", "user_id": "uuid", "name": "Friday Casual",
  "product_ids": ["uuid-1", "uuid-2"],
  "image_url": "https://...",
  "created_at": "...", "updated_at": "..."
}
```
