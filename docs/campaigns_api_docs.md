# Campaigns Module

Performance marketing campaign management and lifecycle. Admin-only module. Handles campaign CRUD, status transitions, and landing page resolution for persona-driven customer acquisition.

Auth:
- Every endpoint in this module requires admin auth.
- Send `Authorization: Bearer <admin_token>`.

---

## Shared Request Schemas

### `CreateCampaignRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Campaign name |
| `slug` | string | yes | URL-friendly unique identifier |
| `description` | string | no | Campaign description |
| `channel` | string | yes | Marketing channel: `meta`, `google`, `tiktok`, `email`, `sms` |
| `type` | string | yes | Campaign type: `acquisition`, `retention`, `reengagement` |
| `product_strategy` | object | yes | Product selection strategy |
| `product_strategy.method` | string | yes | Selection method: `manual`, `persona_match`, `bestsellers`, `new_arrivals`, `category`, `drop` |
| `product_strategy.manual_product_ids` | array | conditional | Product IDs for `manual` method |
| `product_strategy.category_ids` | array | conditional | Category IDs for `category` method |
| `product_strategy.seller_ids` | array | no | Filter products by sellers |
| `product_strategy.max_products` | int | conditional | Max results for query-based methods (required for non-manual/drop) |
| `landing_type` | string | yes | Landing target: `drop`, `collection`, `brand_storefront`, `custom` |
| `drop_id` | string | conditional | Required for `drop` landing type |
| `collection_id` | string | conditional | Required for `collection` landing type |
| `brand_id` | string | conditional | Required for `brand_storefront` landing type |
| `utm_source` | string | yes | UTM source parameter |
| `utm_medium` | string | yes | UTM medium parameter |
| `utm_campaign` | string | yes | UTM campaign parameter |
| `utm_content` | string | no | UTM content parameter |
| `utm_term` | string | no | UTM term parameter |
| `start_date` | ISO 8601 | yes | Campaign launch date |
| `end_date` | ISO 8601 | no | Campaign end date |
| `budget` | object | no | Budget configuration |
| `budget.daily_budget` | number | no | Daily spend cap |
| `budget.total_budget` | number | no | Total spend cap |
| `budget.currency_code` | string | no | Budget currency |

### `UpdateCampaignRequest`

All fields optional. PATCH-like semantics via PUT.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Campaign name |
| `description` | string | Campaign description |
| `target_persona` | object | Persona criteria updates |
| `product_strategy` | object | Product strategy updates |
| `landing` | object | Landing config updates |
| `utm_content` | string | UTM content |
| `utm_term` | string | UTM term |
| `budget` | object | Budget updates |
| `end_date` | ISO 8601 | Campaign end date |

### `ChangeStatusRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | yes | New status: `draft`, `active`, `paused`, `completed`, `archived` |

---

## Shared Response Schemas

### `Campaign`

```json
{
  "id": "uuid",
  "name": "Summer Collection 2026",
  "slug": "summer-collection-2026",
  "description": "Targeted campaign for summer fashion",
  "status": "active",
  "channel": "meta",
  "type": "acquisition",
  "target_persona": {
    "gender": ["female"],
    "age_range": { "min": 18, "max": 35 },
    "cities": ["Lahore"],
    "institutes": ["LUMS"]
  },
  "product_strategy": {
    "method": "manual",
    "manual_product_ids": ["prod-1", "prod-2"],
    "max_products": 0,
    "auto_refresh": false
  },
  "landing_type": "drop",
  "drop_id": "drop-123",
  "landing": {
    "layout": "drop_countdown",
    "hero_image_url": "https://cdn.example.com/hero.jpg",
    "headline": "Summer Collection 2026",
    "subheadline": "Fresh prints for sunny days",
    "cta_text": "Shop Now",
    "show_filters": true,
    "show_search": false,
    "show_countdown": true
  },
  "utm_source": "facebook",
  "utm_medium": "paid_social",
  "utm_campaign": "summer_2026",
  "utm_content": "variant_a",
  "utm_term": "lawn collection",
  "budget": {
    "daily_budget": 5000,
    "total_budget": 50000,
    "total_spent": 12500,
    "currency_code": "PKR"
  },
  "start_date": "2026-05-01T00:00:00Z",
  "end_date": "2026-08-31T23:59:59Z",
  "metrics": {
    "impressions": 45000,
    "clicks": 2100,
    "unique_visitors": 1800,
    "product_views": 3200,
    "add_to_carts": 156,
    "checkouts": 82,
    "orders": 45,
    "revenue": 18500,
    "aov": 411.11,
    "conversion_rate": 2.5,
    "cart_abandon_rate": 47.4,
    "reminder_signups": 12,
    "cost_per_click": 0.95,
    "roas": 3.2,
    "last_updated": "2026-04-28T14:30:00Z"
  },
  "created_by": "admin-uuid",
  "created_at": "2026-04-01T10:00:00Z",
  "updated_at": "2026-04-28T14:30:00Z"
}
```

### `CampaignMetrics`

```json
{
  "impressions": 45000,
  "clicks": 2100,
  "unique_visitors": 1800,
  "product_views": 3200,
  "add_to_carts": 156,
  "checkouts": 82,
  "orders": 45,
  "revenue": 18500,
  "aov": 411.11,
  "conversion_rate": 2.5,
  "cart_abandon_rate": 47.4,
  "reminder_signups": 12,
  "cost_per_click": 0.95,
  "roas": 3.2,
  "last_updated": "2026-04-28T14:30:00Z"
}
```

Field descriptions:

- `impressions`: Total ad impressions served
- `clicks`: Total clicks on ads
- `unique_visitors`: Unique visitors to landing page
- `product_views`: Total product page views from campaign
- `add_to_carts`: Products added to cart
- `checkouts`: Checkouts initiated
- `orders`: Completed orders
- `revenue`: Total revenue attributed to campaign
- `aov`: Average order value (revenue / orders)
- `conversion_rate`: Visitor to order conversion percentage
- `cart_abandon_rate`: Percentage of carts not converted to orders
- `reminder_signups`: Users who signed up for reminders
- `cost_per_click`: Ad spend / clicks
- `roas`: Return on ad spend (revenue / ad spend)
- `last_updated`: Last metrics refresh timestamp

---

## Endpoints

### Create Campaign
`POST /api/v2/admin/campaigns`

Create a new performance marketing campaign with product strategy and landing configuration.

**Request Body**: [`CreateCampaignRequest`](#createcampaignrequest)

**Response `201`**: [`Campaign`](#campaign)

**Common errors**
- `400 BAD_REQUEST` — Invalid product strategy method, missing required fields, invalid landing type
- `409 CONFLICT` — Campaign slug already exists

---

### List Campaigns
`GET /api/v2/admin/campaigns`

Get paginated list of all campaigns with optional status filter.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `draft`, `active`, `paused`, `completed`, `archived` |
| `limit` | int | Results per page (default: 10) |
| `offset` | int | Pagination offset (default: 0) |

**Response `200`**: Array of [`Campaign`](#campaign) objects.

---

### Get Campaign
`GET /api/v2/admin/campaigns/{id}`

Retrieve complete campaign details.

**Response `200`**: [`Campaign`](#campaign)

**Error `404`** — Campaign not found

---

### Update Campaign
`PUT /api/v2/admin/campaigns/{id}`

Update campaign details. Only allowed for `draft` or `paused` status campaigns.

**Request Body**: [`UpdateCampaignRequest`](#updatecampaignrequest)

**Response `200`**: [`Campaign`](#campaign)

**Common errors**
- `400 BAD_REQUEST` — Cannot update active/completed campaigns
- `404 NOT_FOUND` — Campaign not found

---

### Change Campaign Status
`PATCH /api/v2/admin/campaigns/{id}/status`

Transition campaign through valid status lifecycle.

**Request Body**: [`ChangeStatusRequest`](#changestatusrequest)

**Status Transitions**

Valid transitions:
- `draft` → `active`, `archived`
- `active` → `paused`, `completed`, `archived`
- `paused` → `active`, `completed`, `archived`
- `completed` → `archived`
- `archived` → (no transitions)

**Response `200`**: [`Campaign`](#campaign)

**Common errors**
- `400 BAD_REQUEST` — Invalid status transition
- `404 NOT_FOUND` — Campaign not found

---

### Archive Campaign
`DELETE /api/v2/admin/campaigns/{id}`

Soft-delete campaign.

**Response `204`**: No content

**Error `404`** — Campaign not found

---

### Get Campaign Metrics
`GET /api/v2/admin/campaigns/{id}/metrics`

Retrieve real-time metrics for a campaign.

**Response `200`**: [`CampaignMetrics`](#campaignmetrics)

**Error `404`** — Campaign not found

---

### Resolve Landing Target
`GET /api/v2/admin/campaigns/{id}/landing`

Validate and resolve campaign landing page configuration. Returns the target resource IDs and layout type for frontend rendering.

**Response `200`**
```json
{
  "type": "drop",
  "drop_id": "drop-123"
}
```

---

### Update Meta Inputs
`PATCH /api/v2/admin/campaigns/{id}/meta-inputs`

Update real-time performance data from Meta (spend, impressions, clicks) and recompute KPIs. Admin only.

**Request Body**
```json
{
  "ad_spend_to_date": 125000,
  "impressions": 450000,
  "clicks": 9800,
  "impression_lower": 400000,
  "impression_upper": 600000
}
```

**Response `200`**: [`Campaign`](#campaign)

---

### Get Public Campaign
`GET /api/v2/campaigns/slug/{slug}`

Public endpoint for website landing pages. Returns active campaign details, resolved product list, and recomputed metrics.

**Response `200`**
```json
{
  "campaign": { ... },
  "products": [ ... ],
  "metrics": { ... }
}
```

**Error `404`** — Campaign not found or not active

---

### Get Public Campaign Product
`GET /api/v2/campaigns/slug/{slug}/products/{product_id}`

Public endpoint for campaign-scoped product view. Only returns if product is part of the campaign.

**Response `200`**
```json
{
  "campaign": { "id": "...", "slug": "...", "name": "..." },
  "product": { ... }
}
```

**Error `404`** — Campaign not active or product not in campaign

---

## Data Models

### Campaign Status Lifecycle

```
draft ──► active ──► paused ──► active (loop)
  │          │          │
  │          │          └──► completed
  │          │
  │          └──► completed
  │
  └──► archived (terminal)
```

### PersonaCriteria

| Field | Type | Description |
|-------|------|-------------|
| `gender` | string[] | Target genders |
| `age_range` | object | Age range with `min` and `max` |
| `cities` | string[] | Target cities |
| `institutes` | string[] | Target institutes |
| `favorite_categories` | string[] | Preferred product categories |
| `favorite_brands` | string[] | Preferred brands |
| `preferred_styles` | string[] | Style preferences |
| `price_range` | object | Price range with `min` and `max` |
| `min_interactions` | int | Minimum interaction count |
| `interaction_types` | string[] | Types of interactions to consider |
| `min_session_count` | int | Minimum session count |
| `active_in_last_days` | int | Days since last activity |
| `exclude_user_ids` | string[] | Users to exclude |

### ProductStrategy

| Field | Type | Description |
|-------|------|-------------|
| `method` | string | Selection method |
| `manual_product_ids` | string[] | Manual product selection |
| `category_ids` | string[] | Category-based selection |
| `seller_ids` | string[] | Seller-based filtering |
| `max_products` | int | Maximum products to return |
| `auto_refresh` | boolean | Auto-refresh products |
| `refresh_interval` | string | Refresh frequency: `daily`, `weekly` |

### LandingConfig

| Field | Type | Description |
|-------|------|-------------|
| `layout` | string | Layout type: `drop_countdown`, `collection_grid`, `brand_storefront`, `single_product`, `category_browse` |
| `hero_image_url` | string | Hero/banner image URL |
| `headline` | string | Main headline |
| `subheadline` | string | Sub-headline |
| `cta_text` | string | Call-to-action button text |
| `color_scheme` | string | Color theme |
| `show_filters` | boolean | Show filter controls |
| `show_search` | boolean | Show search bar |
| `show_countdown` | boolean | Show countdown timer |
| `urgency_copy` | string | Urgency messaging |
| `custom_css` | string | Custom CSS |
| `metadata` | object | Arbitrary metadata |

### `BudgetConfig`

| Field | Type | Description |
|-------|------|-------------|
| `daily_budget` | number | Daily spend limit |
| `total_budget` | number | Total campaign budget |
| `total_spent` | number | Amount spent so far |
| `currency_code` | string | Currency (e.g., `PKR`) |
| `ad_spend_to_date` | number | Real-time Meta ad spend |
| `impression_lower` | int | Forecast lower bound impressions |
| `impression_upper` | int | Forecast upper bound impressions |
| `last_spent_date` | ISO 8601 | Last spend update time |


---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400 BAD_REQUEST` | Validation failure, invalid state transition, or unsupported status |
| `401 UNAUTHORIZED` | Missing or invalid admin token |
| `404 NOT_FOUND` | Campaign not found |
| `409 CONFLICT` | Campaign slug already exists |
