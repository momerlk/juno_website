# Recsys Catalog Module

## Scope

The Recsys Catalog module owns product browse/search, facets, product detail,
similarity, outfit complements, visual search, and trending discovery.

Implementation: catalog indexing, filter validation, FAISS lookup, and routes in
`recsys_core/system.py`.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/products/search` | Cursor browse and text search with facets. |
| `POST /api/v1/products/filters` | Available catalog filters. |
| `GET /api/v1/products/{product_id}` | Product detail. |
| `POST /api/v1/products/trending` | Trending products with optional filters. |
| `GET /api/v1/similar/{product_id}` | Semantically similar products. |
| `GET /api/v1/complements/{product_id}` | Visually/category complementary products. |
| `POST /api/v1/image-search` | Search from an upstream image embedding. |

## Search and browse

```json
{
  "query": "black kurta",
  "filters": {
    "gender": "women",
    "department": "apparel",
    "product_group": "eastern_wear",
    "product_type": "kurta",
    "price_min": 2000,
    "price_max": 9000
  },
  "sort_by": "price",
  "page_size": 24,
  "cursor": null
}
```

Response fields are `products`, `count`, `total`, `cursor`, `facets`,
`breadcrumbs`, `catalog`, and `success`.

Client rules:

- use a cursor only with the same query, filters, sort, and catalog version;
- render zero-count facets disabled rather than hiding valid catalog values;
- treat filters across different fields as AND and list values within one field
  as OR;
- preserve the department → product group → product type hierarchy;
- start a new first-page request when the hierarchy or sort changes;
- supported sorts are `recommended`, `price`, `rating`, and `newest`.

Invalid fields, values, booleans, numeric bounds, hierarchy combinations, and
sorts return HTTP `400` with `field`, `value`, and `accepted` where available.

## Similar and complements

```http
GET /api/v1/similar/prod_123?k=12&user_id=usr_123&session_id=sess_abc
GET /api/v1/complements/prod_123?k=8&user_id=usr_123&session_id=sess_abc
```

Use similar for alternatives and complements for outfit-building. Supplying a
user id enables history exclusion and impression attribution. Missing product
embeddings return HTTP `404`.

## Image search

```json
{
  "image_embedding": [0.01, 0.02],
  "k": 24,
  "filters": {},
  "user_id": "usr_123",
  "session_id": "sess_abc"
}
```

The client or upstream image service must encode the image first. Raw uploads
are not accepted. The vector length must equal `VISUAL_EMBEDDING_DIM`.

## Filters and catalog state

The in-memory facet index is rebuilt atomically with the product and FAISS
indexes. Catalog version changes when eligible product metadata, inventory,
pricing, or embedding model state changes, invalidating browse cursors and
caches.

Products must be active, belong to an active seller, have inventory, and pass
all explicit filters before they can be returned.

## Product images

Clients should load product images directly from their Shopify/CDN URL. Use the
catalog width/height when available, responsive width variants, one eager
above-the-fold image, and lazy loading below the fold. The Recsys service should
not proxy image bytes. Compact cards expose a primary `image` object with `url`,
`width`, `height`, `alt`, and `thumbhash` when the catalog provides them.

Update this file whenever searchable fields, facet semantics, hierarchy, sort,
catalog versioning, similarity, visual search, product responses, or image
delivery changes.
