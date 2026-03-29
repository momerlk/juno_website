# Seller Portal Growth Layer — Backend Requirements

**Date:** 2026-03-29  
**Module:** `seller`, `shopify`, `admin`, `analytics`, `community`, `content`  
**Priority:** High — unblocks seller portal redesign and ongoing retention work  
**Author:** Frontend Team (Juno Website)

---

## Context

The seller portal is being redesigned from a lightweight operations panel into a real brand operating system for indie labels. The new direction is:

1. Sellers should feel like they joined a movement, not a dashboard
2. The portal should surface brand-story signals, not just inventory counts
3. Orders and operational urgency must stay extremely visible
4. Inventory management should stay simple while quality is incentivized
5. Education and community should live inside the portal, not outside it

### Current State

The current frontend already uses these existing seller endpoints:

- `GET /api/v2/seller/profile`
- `PATCH /api/v2/seller/profile`
- `GET /api/v2/seller/products`
- `POST /api/v2/seller/products`
- `PUT /api/v2/seller/products/{id}`
- `GET /api/v2/seller/queue`
- `POST /api/v2/seller/queue/{id}/promote`
- `GET /api/v2/seller/orders`
- `POST /api/v2/seller/orders/{id}/fulfill`
- `PUT /api/v2/seller/orders/{id}/status`
- `GET /api/v2/seller/analytics/sales`
- `GET /api/v2/seller/analytics/orders`
- `GET /api/v2/seller/analytics/inventory`
- `GET /api/v2/seller/analytics/product/{productID}`
- `GET /api/v2/shopify/status`
- `POST /api/v2/shopify/sync`
- `DELETE /api/v2/shopify/disconnect`

These endpoints are useful, but not enough for the new portal. The portal now needs:

- a top-level seller dashboard summary
- story analytics
- audience analytics
- product quality scoring
- seller tasks / urgency queues
- education content
- community feed
- payout visibility

### Current Flow

```text
Seller logs in → sees dashboard widgets → checks products/orders manually → no real story or audience layer
```

### Target Flow

```text
Seller logs in → sees one clear summary of urgency, momentum, and opportunities →
handles orders first → improves weak listings → sees audience/story signals →
learns from Juno content → stays engaged through community
```

---

## 1. Seller Dashboard Summary Endpoint

**Module:** `seller`  
**Endpoint:** `GET /api/v2/seller/dashboard/summary` (new)  
**Auth:** Seller token required

### Requirement

The frontend needs one top-level response for the portal shell and home screen. It should prevent multiple round trips for basic seller state and expose the most important actions in one call.

### Response `200`

```json
{
  "seller": {
    "id": "seller-1",
    "business_name": "Rakh",
    "status": "active",
    "verified": true,
    "city": "Lahore",
    "joined_at": "2026-01-12T10:00:00Z"
  },
  "shopify": {
    "connected": true,
    "shop": "rakh-store.myshopify.com",
    "last_sync_at": "2026-03-29T09:00:00Z",
    "sync_status": "healthy",
    "last_sync_products_added": 12
  },
  "orders": {
    "open": 6,
    "fulfilled_today": 3,
    "overdue": 2,
    "latest_order_at": "2026-03-29T11:10:00Z"
  },
  "inventory": {
    "total_products": 48,
    "draft_queue": 9,
    "low_stock": 7,
    "out_of_stock": 4,
    "size_guide_coverage": 61
  },
  "analytics": {
    "top_city": "Karachi",
    "projected_profile_visits": 214,
    "projected_saves": 58,
    "revenue_30d": 184000,
    "fulfillment_rate": 92
  },
  "tasks": [
    {
      "id": "task-1",
      "type": "shopify_connect",
      "priority": "high",
      "title": "Connect Shopify",
      "description": "Syncing your catalog will reduce listing work immediately.",
      "cta_label": "Connect",
      "cta_url": "/studio/dashboard"
    }
  ]
}
```

### Notes

- This endpoint should be fast and cacheable for a short TTL
- The `tasks` array should be ordered by urgency
- If Shopify is not connected, that task should appear first
- This endpoint should back the top dashboard card and sidebar snapshots

---

## 2. Story Analytics Endpoint

**Module:** `seller`, `analytics`  
**Endpoint:** `GET /api/v2/seller/analytics/story` (new)  
**Auth:** Seller token required

### Requirement

The new portal is intentionally moving away from “Excel-only” analytics. Sellers need story-level signals that feel closer to Instagram insights.

### Response `200`

```json
{
  "range": "30d",
  "totals": {
    "profile_visits": 1240,
    "product_opens": 3120,
    "saves": 428,
    "shares": 71,
    "story_taps": 640,
    "add_to_cart": 138,
    "orders": 42
  },
  "conversion": {
    "visit_to_open_rate": 61.5,
    "open_to_save_rate": 13.7,
    "open_to_cart_rate": 4.4,
    "cart_to_order_rate": 30.4
  },
  "top_products": [
    {
      "product_id": "prod-1",
      "title": "Ribbed Shirt",
      "image": "https://cdn.example.com/p1.jpg",
      "profile_visits": 210,
      "opens": 480,
      "saves": 88,
      "orders": 9
    }
  ],
  "top_content_sources": [
    { "source": "brand_profile", "count": 420 },
    { "source": "feed", "count": 350 },
    { "source": "search", "count": 210 }
  ]
}
```

### Notes

- This is not the same as revenue analytics
- The portal should be able to answer: “Which products are attracting attention even before they convert?”
- If the backend cannot support all metrics immediately, it can ship in phases

### Phase 1 Fields

- `profile_visits`
- `product_opens`
- `saves`
- `orders`
- `top_products`

### Phase 2 Fields

- `shares`
- `story_taps`
- `source attribution`
- `hour/day trends`

---

## 3. Audience Analytics Endpoint

**Module:** `seller`, `analytics`  
**Endpoint:** `GET /api/v2/seller/analytics/audience` (new)  
**Auth:** Seller token required

### Requirement

Sellers need to understand who is browsing and buying, not just how many orders landed.

### Response `200`

```json
{
  "range": "30d",
  "buyers": {
    "new": 84,
    "repeat": 21,
    "repeat_rate": 20.0
  },
  "geography": [
    { "city": "Karachi", "visits": 420, "orders": 16 },
    { "city": "Lahore", "visits": 310, "orders": 11 },
    { "city": "Islamabad", "visits": 180, "orders": 6 }
  ],
  "behavior": {
    "avg_order_value": 4380,
    "avg_items_per_order": 1.9,
    "top_browsing_hour": 21,
    "top_browsing_day": "Sunday"
  }
}
```

### Notes

- The seller home and analytics pages should be able to surface “Top city” and “repeat buyer” signals from this endpoint
- If demographic attributes are unavailable, geography and repeat/new split are enough for v1

---

## 4. Product Quality / Content Health Endpoint

**Module:** `seller`, `analytics`, `catalog`  
**Endpoint:** `GET /api/v2/seller/analytics/content-quality` (new)  
**Auth:** Seller token required

### Requirement

The portal should make it obvious which listings are hurting trust or conversion. Quality issues should be visible without manually inspecting each product.

### Response `200`

```json
{
  "summary": {
    "size_guide_coverage": 61,
    "products_missing_size_guide": 19,
    "products_missing_descriptions": 4,
    "products_with_low_image_count": 11,
    "products_out_of_stock": 4
  },
  "issues": [
    {
      "product_id": "prod-1",
      "title": "Ribbed Shirt",
      "image": "https://cdn.example.com/p1.jpg",
      "severity": "high",
      "issues": ["missing_size_guide", "only_one_image"],
      "suggested_action": "Add a size guide and at least 3 images"
    }
  ]
}
```

### Notes

- This endpoint should feed inventory warnings and product scorecards
- The frontend should be able to sort/filter by severity

---

## 5. Seller Tasks / Urgency Endpoint

**Module:** `seller`  
**Endpoint:** `GET /api/v2/seller/tasks` (new)  
**Auth:** Seller token required

### Requirement

The seller portal should tell the seller exactly what needs attention now.

### Task Types

| Type | Example |
|------|---------|
| `shopify_connect` | “Connect Shopify to sync your catalog” |
| `fulfillment_overdue` | “2 orders are overdue for fulfillment” |
| `low_stock` | “7 products are low on stock” |
| `missing_size_guides` | “19 products are missing size guides” |
| `queue_ready` | “3 products are ready to publish from queue” |
| `profile_incomplete` | “Your store banner is missing” |

### Response `200`

```json
[
  {
    "id": "task-1",
    "type": "fulfillment_overdue",
    "priority": "high",
    "count": 2,
    "title": "Overdue fulfillment",
    "description": "2 orders have not been fulfilled on time.",
    "cta_label": "Open Orders",
    "cta_url": "/studio/dashboard/orders"
  }
]
```

### Notes

- This should drive the dynamic ordering on the seller home page
- `high` tasks should always render above `medium` and `low`

---

## 6. Seller Education Feed Endpoint

**Module:** `content`, `seller`  
**Endpoint:** `GET /api/v2/seller/education` (new)  
**Auth:** Seller token required

### Requirement

The portal should include short “how to win on Juno” content inside seller flows.

### Response `200`

```json
{
  "featured": [
    {
      "id": "edu-1",
      "type": "video",
      "title": "How to take a product photo on your phone in 5 minutes",
      "duration_seconds": 126,
      "thumbnail": "https://cdn.example.com/edu-thumb-1.jpg",
      "url": "https://cdn.example.com/edu-1.mp4",
      "category": "photography"
    }
  ],
  "playlists": [
    {
      "id": "pl-1",
      "title": "Listing Basics",
      "items": ["edu-1", "edu-2", "edu-3"]
    }
  ]
}
```

### Suggested Categories

- `photography`
- `copywriting`
- `drop_strategy`
- `pricing`
- `inventory_quality`

---

## 7. Seller Community Feed Endpoint

**Module:** `community`, `seller`  
**Endpoint:** `GET /api/v2/seller/community/feed` (new)  
**Auth:** Seller token required

### Requirement

The portal should make Juno feel human and alive. Sellers need a visible connection to the team and the wider label community.

### Response `200`

```json
{
  "announcements": [
    {
      "id": "post-1",
      "type": "announcement",
      "title": "Weekly seller note",
      "body": "Focus on image quality this week. Labels with 3+ clean images are outperforming.",
      "author_name": "Hooria Wasif",
      "author_role": "Growth & Brand",
      "author_image": "/team/hooria.jpg",
      "created_at": "2026-03-29T09:00:00Z"
    }
  ],
  "wins": [
    {
      "id": "win-1",
      "brand_name": "Rakh",
      "message": "Sold out its first drop in 48 hours",
      "image": "https://cdn.example.com/win-1.jpg"
    }
  ],
  "community": {
    "whatsapp_invite_url": "https://chat.whatsapp.com/example",
    "community_status": "invite_only"
  }
}
```

### Notes

- The frontend should be able to show team members and community wins from this endpoint
- The WhatsApp invite URL can be omitted for sellers who have not been invited yet

---

## 8. Seller Payouts Endpoint

**Module:** `seller`, `finance`  
**Endpoint:** `GET /api/v2/seller/payouts` (new)  
**Auth:** Seller token required

### Requirement

Sellers need financial visibility beyond revenue totals.

### Response `200`

```json
{
  "summary": {
    "available_balance": 84200,
    "pending_balance": 18600,
    "next_payout_at": "2026-04-02T00:00:00Z",
    "last_payout_amount": 54000
  },
  "history": [
    {
      "id": "payout-1",
      "status": "paid",
      "amount": 54000,
      "paid_at": "2026-03-20T00:00:00Z"
    }
  ]
}
```

### Notes

- If a full payouts system is not ready, at minimum return `available_balance`, `pending_balance`, and `next_payout_at`

---

## 9. Product Analytics Endpoint — Expand Existing Response

**Module:** `seller`, `analytics`  
**Endpoint:** `GET /api/v2/seller/analytics/product/{productID}` (existing — expand)

### Requirement

The current product analytics endpoint exists in docs, but the redesigned portal needs richer per-product storytelling signals.

### Add Fields

```json
{
  "product_id": "prod-1",
  "title": "Ribbed Shirt",
  "image": "https://cdn.example.com/p1.jpg",
  "opens": 480,
  "saves": 88,
  "add_to_cart": 24,
  "orders": 9,
  "top_city": "Karachi",
  "repeat_buyer_orders": 3,
  "quality_flags": ["missing_size_guide"]
}
```

### Notes

- This should be the source of “top products” and “underperforming products” surfaces

---

## 10. Shopify Status Endpoint — Expand Existing Response

**Module:** `shopify`  
**Endpoint:** `GET /api/v2/shopify/status` (existing — expand)

### Requirement

The portal needs more than just “connected / disconnected”.

### Add Fields

```json
{
  "connected": true,
  "shop": "rakh-store.myshopify.com",
  "last_sync_at": "2026-03-29T09:00:00Z",
  "sync_status": "healthy",
  "last_sync_products_added": 12,
  "last_sync_products_updated": 7,
  "last_sync_error": null
}
```

### Notes

- This supports dynamic placement of Shopify in the seller dashboard
- If not connected, return:

```json
{
  "connected": false,
  "shop": "",
  "sync_status": "not_connected"
}
```

---

## 11. Existing Endpoints to Leverage More Aggressively

These do not require backend creation, but the frontend should build around them more deeply:

| Method | Path | Opportunity |
|--------|------|-------------|
| `GET` | `/api/v2/seller/onboarding/status` | Post-approval / pending state banners |
| `GET` | `/api/v2/seller/queue` | Draft readiness surfaces and publishing workflows |
| `GET` | `/api/v2/seller/inventory/low-stock` | Alerting and urgency cards |
| `GET` | `/api/v2/seller/inventory/categories` | Better filters and inventory navigation |
| `GET` | `/api/v2/seller/orders` | Live operational feed and top-priority dashboard modules |
| `GET` | `/api/v2/seller/analytics/sales` | Revenue and GMV summary |
| `GET` | `/api/v2/seller/analytics/orders` | Order health and fulfillment metrics |
| `GET` | `/api/v2/seller/analytics/inventory` | Product count and stock health |

---

## 12. New Internal Data / Models

### Suggested Derived Tables / Materialized Views

| Name | Purpose |
|------|---------|
| `seller_dashboard_summaries` | Fast precomputed summary for seller portal shell |
| `seller_story_analytics_daily` | Daily event aggregates for visits, saves, opens, shares |
| `seller_audience_analytics_daily` | City and buyer cohort breakdowns |
| `seller_content_quality_scores` | Product-level quality and trust flags |
| `seller_tasks` | Materialized urgency/action queue |

### New Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `shopify_connected` | bool | Shortcut on seller profile/session |
| `last_shopify_sync_at` | timestamp | Useful for shell and dashboard |
| `size_guide_coverage` | int | Percentage across seller catalog |
| `profile_completion_score` | int | Store readiness score |

---

## 13. Frontend UX Requirements Enabled by This Work

These are frontend outcomes the backend should explicitly support:

1. Top dashboard card with a real seller summary
2. Dynamic module ordering based on urgency
3. Orders-first workflow when fulfillment needs attention
4. Shopify-first workflow when sync is disconnected
5. Story analytics cards that feel like social insights
6. Product quality warnings before sellers lose conversion
7. Education clips embedded in inventory flows
8. Community feed and real Juno team presence inside the portal
9. Payout visibility so sellers understand business health, not just order counts

---

## Summary of All New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v2/seller/dashboard/summary` | Seller token | Top-level shell and home page summary |
| `GET` | `/api/v2/seller/analytics/story` | Seller token | Saves, visits, story-level and funnel signals |
| `GET` | `/api/v2/seller/analytics/audience` | Seller token | Cities, repeat/new buyers, browsing behavior |
| `GET` | `/api/v2/seller/analytics/content-quality` | Seller token | Product quality and trust issues |
| `GET` | `/api/v2/seller/tasks` | Seller token | Urgency queue and seller actions |
| `GET` | `/api/v2/seller/education` | Seller token | Educational videos and guidance content |
| `GET` | `/api/v2/seller/community/feed` | Seller token | Announcements, wins, and invite links |
| `GET` | `/api/v2/seller/payouts` | Seller token | Balance, payout schedule, and history |

---

## Summary of Modified Endpoints

| Method | Path | Change |
|--------|------|--------|
| `GET` | `/api/v2/seller/analytics/product/{productID}` | Add richer product-level story and quality signals |
| `GET` | `/api/v2/shopify/status` | Add last sync metadata, sync health, and sync counts |

---

## Implementation Priority

1. **`GET /seller/dashboard/summary`** — highest leverage; unblocks cleaner seller home and top shell
2. **`GET /seller/tasks`** — enables dynamic ordering and urgency-first UX
3. **Expanded `GET /shopify/status`** — critical for top-of-dashboard sync state
4. **`GET /seller/analytics/story`** — core to the new brand-first analytics model
5. **`GET /seller/analytics/audience`** — makes analytics more actionable for founders
6. **`GET /seller/analytics/content-quality`** — directly improves inventory trust and conversion
7. **Expanded `GET /seller/analytics/product/{productID}`** — useful for drilling into winners and weak listings
8. **`GET /seller/education`** — supports quality improvement and seller enablement
9. **`GET /seller/community/feed`** — strengthens retention and authenticity
10. **`GET /seller/payouts`** — important, but not required for the first seller portal redesign wave
