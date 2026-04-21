# Probe Analytics Engine

Probe is the platform analytics and event-ingestion engine. It provides high-performance, write-heavy behavioral tracking and multi-domain business intelligence.

## Core Capabilities

- **Client-Side Event Ingestion**: High-throughput batch ingestion for mobile and web.
- **Session Lifecycle Management**: Automatic heartbeat tracking and session reconstruction.
- **Internal Event Emission**: Native Go interface (`EventEmitter`) for server-side modules.
- **Platform Analytics (Admin)**: Full visibility into user growth, engagement, and commerce health.
- **Seller Analytics**: Actionable business intelligence and growth signals for brands.
- **Real-Time Stream**: Live activity monitoring and event debugging.

## Integration

### Probe SDK
The Probe SDK is the recommended way to track client-side behavior. It handles batching, offline queuing, and automatic session tracking.
- [Mobile SDK (Expo/React Native)](../../../probe_sdk/INTEGRATION_GUIDE.md#mobile-sdk-exporeact-native)
- [Web SDK (React.js)](../../../probe_sdk/INTEGRATION_GUIDE.md#web-sdk-reactjs)

### Internal Event Emission
Other Go modules emit events by injecting the `analytics.EventEmitter` interface. This ensures transactionally accurate analytics for server-side actions (e.g., successful orders).
Currently wired modules:
- `identity`: Auth lifecycle (`auth.signup`, `auth.login`)
- `commerce`: Order lifecycle (`order.placed`, `order.cancelled`, etc.)
- `catalog`: Discovery signals (`product.view`, `search.query`)
- `interactions`: Social engagement (`interaction.like`)
- `closet`: Intent signals (`product.add_to_closet`)

## Security & Reliability

- **Rate Limiting**: Ingest and Heartbeat endpoints are protected by a sliding-window rate limiter (Redis-backed in production).
- **IP Protection**: Full support for `X-Forwarded-For` and `X-Real-IP` behind trusted proxies.
- **Graceful Shutdown**: Buffered event channels are flushed to MongoDB during process termination to prevent data loss.
- **Retention Tiers**:
  - Raw Events (`probe_events`): 30 days (Time-series storage).
  - Sessions (`probe_sessions`): 90 days.
  - Pre-aggregated Metrics (`probe_metrics`): 2 years.

---

## Route Groups and Auth

- `POST /api/v2/probe/events/ingest` — Public (Client Ingestion)
- `POST /api/v2/probe/sessions/heartbeat` — Public (Heartbeat)
- `GET /api/v2/admin/probe/*` — Admin Auth Required
- `GET /api/v2/seller/probe/*` — Seller Auth Required

---

## Shared Request Schemas

### `ProbeDevice`

Captured once per batch or heartbeat and copied to persisted events/sessions.

| Field | Type | Required | Notes |
|------|------|----------|------|
| `device_id` | `string` | no | Client-generated stable device identifier |
| `platform` | `string` | no | Example: `ios`, `android`, `web` |
| `app_version` | `string` | no | Client app/web build version |
| `os_version` | `string` | no | Device OS or browser runtime version |
| `locale` | `string` | no | Example: `en-PK` |

### `ProbeEventContext`

Per-event contextual metadata.

| Field | Type | Required | Notes |
|------|------|----------|------|
| `screen_name` | `string` | no | Logical screen/page name |
| `referrer` | `string` | no | Previous route, campaign, or deep link |
| `source` | `string` | no | Marketing or acquisition source |
| `user_agent` | `string` | no | Usually server-enriched from request |
| `ip_address` | `string` | no | Usually server-enriched from request |

### `ProbeEventInput`

Single event payload accepted in an ingest batch.

| Field | Type | Required | Notes |
|------|------|----------|------|
| `type` | `string` | yes | Must be one of the supported Probe event types |
| `product_id` | `string` | no | Product identifier when relevant |
| `category_id` | `string` | no | Category identifier when relevant |
| `timestamp` | `string<RFC3339>` | no | Client event time; if omitted server receive time is used |
| `properties` | `object` | no | Free-form event metadata |
| `context` | [`ProbeEventContext`](#probeeventcontext) | no | Per-event context |

### `IngestEventsRequest`

| Field | Type | Required | Notes |
|------|------|----------|------|
| `session_id` | `string` | yes | Required for all batched events |
| `user_id` | `string` | no | Anonymous sessions may omit this |
| `device` | [`ProbeDevice`](#probedevice) | no | Shared client/device metadata |
| `events` | `ProbeEventInput[]` | yes | Minimum `1`, maximum `250` items |

Example:

```json
{
  "session_id": "sess_123",
  "user_id": "user_123",
  "device": {
    "device_id": "ios-device-1",
    "platform": "ios",
    "app_version": "2.4.0",
    "os_version": "17.4",
    "locale": "en-PK"
  },
  "events": [
    {
      "type": "screen.view",
      "timestamp": "2026-03-31T14:20:00Z",
      "context": {
        "screen_name": "home",
        "source": "organic"
      },
      "properties": {
        "tab": "discover"
      }
    },
    {
      "type": "product.view",
      "product_id": "prod_456",
      "properties": {
        "seller_id": "seller_001"
      },
      "context": {
        "screen_name": "product_detail"
      }
    }
  ]
}
```

### `SessionHeartbeatRequest`

| Field | Type | Required | Notes |
|------|------|----------|------|
| `session_id` | `string` | yes | Session identifier being refreshed |
| `user_id` | `string` | no | Included when session is authenticated |
| `device` | [`ProbeDevice`](#probedevice) | no | Latest device metadata |
| `timestamp` | `string<RFC3339>` | no | Client heartbeat time; server time used if omitted |
| `screen_name` | `string` | no | Current visible screen/page |
| `page_count` | `int64` | no | Current page/screen count in the session |
| `metadata` | `object` | no | Arbitrary session metadata |

Example:

```json
{
  "session_id": "sess_123",
  "user_id": "user_123",
  "screen_name": "product_detail",
  "page_count": 4,
  "metadata": {
    "network_type": "wifi",
    "foreground": true
  }
}
```

### Admin Query Parameters

Most `GET /api/v2/admin/probe/*` endpoints accept:

| Query Param | Type | Required | Notes |
|------|------|----------|------|
| `start_time` | `string<RFC3339>` | no | Defaults to `end_time - 30 days` |
| `end_time` | `string<RFC3339>` | no | Defaults to current UTC time |
| `granularity` | `string` | no | One of `hourly`, `daily`, `weekly`, `monthly`. Defaults to `daily` |
| `compare` | `string` | no | Currently supported: `previous_period` |
| `limit` | `integer` | no | Used by real-time endpoints. Defaults to `100` |

### Seller Query Parameters

Most `GET /api/v2/seller/probe/*` endpoints accept the same parameters as admin endpoints, but are automatically scoped to the authenticated seller. The `seller_id` is extracted from the JWT token.

| Query Param | Type | Required | Notes |
|------|------|----------|------|
| `start_time` | `string<RFC3339>` | no | Defaults to `end_time - 30 days` |
| `end_time` | `string<RFC3339>` | no | Defaults to current UTC time |
| `granularity` | `string` | no | One of `hourly`, `daily`, `weekly`, `monthly`. Defaults to `daily` |
| `compare` | `string` | no | Currently supported: `previous_period` |
| `limit` | `integer` | no | Used by product list endpoints. Defaults to `50` |

---

## Seller Analytics Response Schemas

### `SellerOverviewResponse`

Returned by `GET /api/v2/seller/probe/overview`.

```json
{
  "revenue": 125000.0,
  "revenue_change_pct": 15.3,
  "orders": 48,
  "orders_change_pct": 12.5,
  "products_listed": 32,
  "profile_views": 1240,
  "followers": 89,
  "conversion_rate": 0.045,
  "health_score": 78,
  "revenue_trend": [{ "x_value": "2026-03-01", "y_value": 4200 }],
  "orders_trend": [{ "x_value": "2026-03-01", "y_value": 2 }]
}
```

Field descriptions:

- `revenue`: Total revenue in the period
- `revenue_change_pct`: Percentage change vs previous period (if `compare=previous_period`)
- `orders`: Total orders in the period
- `orders_change_pct`: Percentage change vs previous period
- `products_listed`: Active product count
- `profile_views`: Seller profile page views
- `followers`: Total followers
- `conversion_rate`: Orders / product views
- `health_score`: Composite health score (0-100) based on conversion rate, AOV, return rate, fulfillment speed, catalog freshness
- `revenue_trend`: Revenue time series
- `orders_trend`: Orders time series

---

### `SellerSalesResponse`

Returned by `GET /api/v2/seller/probe/sales`.

```json
{
  "total_revenue": 125000.0,
  "revenue_trend": [{ "x_value": "2026-03-01", "y_value": 4200 }],
  "total_orders": 48,
  "orders_trend": [{ "x_value": "2026-03-01", "y_value": 2 }],
  "average_order_value": 2604.17,
  "fulfillment_speed_hours": 18.5,
  "cancellation_rate": 0.04,
  "return_rate": 0.03,
  "repeat_order_rate": 0.25
}
```

Field descriptions:

- `total_revenue`: Total GMV in the period
- `revenue_trend`: Daily revenue time series
- `total_orders`: Order count
- `orders_trend`: Daily orders time series
- `average_order_value`: Revenue / orders
- `fulfillment_speed_hours`: Average time from order to shipped
- `cancellation_rate`: Cancelled orders / total orders
- `return_rate`: Returned orders / delivered orders
- `repeat_order_rate`: Orders from customers with 2+ orders / total orders

---

### `SellerProductMetric`

Represents a single product's performance in the product list response.

```json
{
  "product_id": "prod_456",
  "product_name": "Floral Lawn Suit",
  "impressions": 8400,
  "views": 2400,
  "cart_adds": 320,
  "purchases": 54,
  "revenue": 189000,
  "conversion_rate": 0.022,
  "likes": 145,
  "closet_saves": 89,
  "shares": 23,
  "return_rate": 0.04
}
```

Field descriptions:

- `product_id`: Product identifier
- `product_name`: Product name from catalog
- `impressions`: Times product appeared in feeds/search results
- `views`: Product detail page views
- `cart_adds`: Times added to cart
- `purchases`: Units sold
- `revenue`: Total revenue from this product
- `conversion_rate`: Purchases / views
- `likes`: Interaction likes count
- `closet_saves`: Times added to user closets
- `shares`: Times product was shared
- `return_rate`: Returned orders / purchases

---

### `ProductPerformanceSummary`

Aggregate insights across a seller's products.

```json
{
  "total_impressions": 45000,
  "total_views": 12400,
  "avg_conversion_rate": 0.028,
  "best_performer_id": "prod_456",
  "needs_attention_ids": ["prod_789", "prod_012"]
}
```

Field descriptions:

- `total_impressions`: Sum of all product impressions
- `total_views`: Sum of all product views
- `avg_conversion_rate`: Average conversion rate across products
- `best_performer_id`: Product ID with highest revenue
- `needs_attention_ids`: Products with high views but low conversion

---

### `SellerProductPerformanceResponse`

Returned by `GET /api/v2/seller/probe/products`.

```json
{
  "products": [
    {
      "product_id": "prod_456",
      "product_name": "Floral Lawn Suit",
      "impressions": 8400,
      "views": 2400,
      "cart_adds": 320,
      "purchases": 54,
      "revenue": 189000,
      "conversion_rate": 0.022,
      "likes": 145,
      "closet_saves": 89,
      "shares": 23,
      "return_rate": 0.04
    }
  ],
  "summary": {
    "total_impressions": 45000,
    "total_views": 12400,
    "avg_conversion_rate": 0.028,
    "best_performer_id": "prod_456",
    "needs_attention_ids": ["prod_789"]
  }
}
```

---

### `SellerProductDetailResponse`

Returned by `GET /api/v2/seller/probe/products/{id}`.

```json
{
  "product_id": "prod_456",
  "product_name": "Floral Lawn Suit",
  "impressions": 8400,
  "views": 2400,
  "views_trend": [{ "x_value": "2026-03-01", "y_value": 120 }],
  "cart_adds": 320,
  "purchases": 54,
  "revenue": 189000,
  "conversion_rate": 0.022,
  "cart_abandon_rate": 0.83,
  "likes": 145,
  "closet_saves": 89,
  "shares": 23,
  "return_rate": 0.04,
  "revenue_per_view": 78.75,
  "traffic_sources": {
    "search": 820,
    "browse": 1557,
    "share": 23
  }
}
```

Field descriptions:

- `product_id`: Product identifier
- `product_name`: Product name from catalog
- `impressions`: Total product impressions
- `views`: Total product views
- `views_trend`: Daily views time series
- `cart_adds`: Total cart additions
- `purchases`: Units sold
- `revenue`: Total revenue
- `conversion_rate`: Purchases / views
- `cart_abandon_rate`: 1 - (purchases / cart_adds)
- `likes`: Interaction count
- `closet_saves`: Closet save count
- `shares`: Share count
- `return_rate`: Return rate
- `revenue_per_view`: Revenue / views
- `traffic_sources`: Breakdown by source (search, browse, share)

---

### `SellerInventoryMetric`

Represents a single product's inventory health.

```json
{
  "product_id": "prod_456",
  "product_name": "Floral Lawn Suit",
  "stock_level": 12,
  "sell_through_rate": 0.68,
  "days_of_inventory": 7,
  "is_dead_stock": false,
  "needs_restock": true
}
```

---

### `SellerInventoryResponse`

Returned by `GET /api/v2/seller/probe/inventory`.

```json
{
  "total_products": 32,
  "active_products": 28,
  "dead_stock_count": 4,
  "restock_alerts": [
    {
      "product_id": "prod_456",
      "product_name": "Floral Lawn Suit",
      "stock_level": 12,
      "sell_through_rate": 0.68,
      "days_of_inventory": 7,
      "is_dead_stock": false,
      "needs_restock": true
    }
  ],
  "inventory_turnover": 0.45,
  "avg_days_of_inventory": 18.5
}
```

Field descriptions:

- `total_products`: Total product count
- `active_products`: Products with stock > 0
- `dead_stock_count`: Products with 0 sales in period and stock > 0
- `restock_alerts`: Products trending toward stockout
- `inventory_turnover`: Average sell-through rate
- `avg_days_of_inventory`: Average days until stockout at current velocity

---

### `SellerCustomerMetric`

Represents a single customer's purchasing behavior.

```json
{
  "customer_id": "user_123",
  "order_count": 5,
  "total_spend": 24500.0,
  "last_order_date": "2026-03-28T14:20:00Z"
}
```

---

### `CustomerSegment`

Represents a group of customers with shared characteristics.

```json
{
  "name": "Loyal",
  "count": 12,
  "pct": 0.25,
  "avg_spend": 4800.0
}
```

Segment definitions:

- `One-time`: Customers with exactly 1 order
- `Occasional`: Customers with 2-3 orders
- `Loyal`: Customers with 4+ orders

---

### `SellerCustomerInsightsResponse`

Returned by `GET /api/v2/seller/probe/customers`.

```json
{
  "total_customers": 48,
  "new_customers": 32,
  "returning_customers": 16,
  "repeat_purchase_rate": 0.25,
  "top_customers": [
    {
      "customer_id": "user_123",
      "order_count": 5,
      "total_spend": 24500.0,
      "last_order_date": "2026-03-28T14:20:00Z"
    }
  ],
  "segments": [
    { "name": "One-time", "count": 24, "pct": 0.50, "avg_spend": 1200.0 },
    { "name": "Occasional", "count": 12, "pct": 0.25, "avg_spend": 3500.0 },
    { "name": "Loyal", "count": 12, "pct": 0.25, "avg_spend": 4800.0 }
  ],
  "geographic_distribution": {
    "Lahore": 18,
    "Karachi": 12,
    "Islamabad": 10,
    "Rawalpindi": 8
  },
  "customer_trend": [{ "x_value": "2026-03-01", "y_value": 2 }]
}
```

Field descriptions:

- `total_customers`: Unique buyers in period
- `new_customers`: First-time buyers
- `returning_customers`: Repeat buyers
- `repeat_purchase_rate`: Repeat buyers / total customers
- `top_customers`: Top 10 customers by spend
- `segments`: Customer segmentation breakdown
- `geographic_distribution`: Customer count by city
- `customer_trend`: Daily customer acquisition time series

---

### `OptimizationSignal`

Represents an actionable insight for a seller.

```json
{
  "type": "warning",
  "category": "conversion",
  "title": "High views, low conversion",
  "description": "Product gets lots of views but few purchases — consider adjusting price or improving photos",
  "product_id": "prod_789",
  "priority": 1
}
```

Signal types:

- `type`: `warning`, `opportunity`, or `success`
- `category`: `pricing`, `inventory`, `engagement`, `conversion`, `returns`
- `priority`: `1` (high), `2` (medium), `3` (low)

---

### `BenchmarkValue`

Compares seller performance against platform averages.

```json
{
  "seller": 0.045,
  "platform_avg": 0.038,
  "percentile": 0
}
```

---

### `SellerBenchmarks`

Holds all benchmark comparisons for a seller.

```json
{
  "conversion_rate": {
    "seller": 0.045,
    "platform_avg": 0.038,
    "percentile": 0
  },
  "aov": {
    "seller": 2604.17,
    "platform_avg": 2717.04,
    "percentile": 0
  },
  "fulfillment_time": {
    "seller": 18.5,
    "platform_avg": 24.0,
    "percentile": 0
  },
  "return_rate": {
    "seller": 0.03,
    "platform_avg": 0.04,
    "percentile": 0
  },
  "growth_rate": {
    "seller": 0.15,
    "platform_avg": 0.12,
    "percentile": 0
  }
}
```

Note: Lower is better for `fulfillment_time` and `return_rate`.

---

### `SellerOptimizationResponse`

Returned by `GET /api/v2/seller/probe/optimization`.

```json
{
  "signals": [
    {
      "type": "warning",
      "category": "conversion",
      "title": "High views, low conversion",
      "description": "Product gets lots of views but few purchases — consider adjusting price or improving photos",
      "product_id": "prod_789",
      "priority": 1
    },
    {
      "type": "warning",
      "category": "returns",
      "title": "High return rate",
      "description": "Product has a high return rate — review product description accuracy and sizing",
      "product_id": "prod_012",
      "priority": 2
    }
  ],
  "benchmarks": {
    "conversion_rate": {
      "seller": 0.045,
      "platform_avg": 0.038,
      "percentile": 0
    },
    "aov": {
      "seller": 2604.17,
      "platform_avg": 2717.04,
      "percentile": 0
    },
    "fulfillment_time": {
      "seller": 18.5,
      "platform_avg": 24.0,
      "percentile": 0
    },
    "return_rate": {
      "seller": 0.03,
      "platform_avg": 0.04,
      "percentile": 0
    },
    "growth_rate": {
      "seller": 0.15,
      "platform_avg": 0.12,
      "percentile": 0
    }
  }
}
```

---

### `SellerForecastResponse`

Returned by `GET /api/v2/seller/probe/forecast`.

```json
{
  "current_revenue": 32000.0,
  "forecast_7_day": 28500.0,
  "forecast_30_day": 125000.0,
  "confidence_level": 0.7,
  "trend_direction": "accelerating",
  "daily_averages": [{ "x_value": "2026-03-01", "y_value": 4200 }]
}
```

Field descriptions:

- `current_revenue`: Revenue in last 7 days
- `forecast_7_day`: Predicted revenue for next 7 days (moving average)
- `forecast_30_day`: Predicted revenue for next 30 days (moving average)
- `confidence_level`: Forecast confidence (0.5-0.7 based on data availability)
- `trend_direction`: `accelerating`, `stable`, or `decelerating`
- `daily_averages`: Daily revenue time series used for forecasting

---

## Shared Response Schemas

### `IngestEventsResponse`

```json
{
  "accepted": 2
}
```

| Field | Type | Notes |
|------|------|------|
| `accepted` | `int` | Number of events written from the batch |

### `SessionHeartbeatResponse`

```json
{
  "session_id": "sess_123",
  "last_seen_at": "2026-03-31T14:25:00Z"
}
```

### `ProbeEvent`

Canonical stored event shape returned by real-time event APIs.

```json
{
  "id": "uuid",
  "type": "product.view",
  "session_id": "sess_123",
  "user_id": "user_123",
  "seller_id": "seller_001",
  "product_id": "prod_456",
  "category_id": "cat_12",
  "timestamp": "2026-03-31T14:20:00Z",
  "server_time": "2026-03-31T14:20:01Z",
  "properties": {
    "position": 3
  },
  "device": {
    "platform": "ios",
    "app_version": "2.4.0"
  },
  "context": {
    "screen_name": "home",
    "source": "organic",
    "user_agent": "Juno/2.4.0",
    "ip_address": "203.0.113.10"
  }
}
```

### `GraphDataPoint`

Time-series point used across analytics responses.

```json
{
  "x_value": "2026-03-31",
  "y_value": 128
}
```

- `x_value` is typically a bucket key string such as day/week/month
- `y_value` is usually a numeric value

### `QueryComparison`

Returned when `compare=previous_period` is requested on supported endpoints.

```json
{
  "previous_start": "2026-02-01T00:00:00Z",
  "previous_end": "2026-03-01T00:00:00Z",
  "metrics": {
    "revenue_change_pct": 12.4,
    "orders_change_pct": 8.1
  }
}
```

### `PlatformOverviewResponse`

```json
{
  "dau": 1240,
  "wau": 6830,
  "mau": 21840,
  "concurrent_users": 104,
  "new_signups": 182,
  "revenue": 845000.5,
  "orders": 311,
  "aov": 2717.04,
  "conversion_rate": 0.063,
  "cart_abandonment_rate": 0.42,
  "avg_session_duration": 312.5,
  "bounce_rate": 0.27,
  "active_sellers": 56,
  "active_products": 924,
  "trends": {
    "revenue": [{ "x_value": "2026-03-01", "y_value": 32000 }],
    "users": [{ "x_value": "2026-03-01", "y_value": 880 }],
    "orders": [{ "x_value": "2026-03-01", "y_value": 14 }],
    "sessions": [{ "x_value": "2026-03-01", "y_value": 225 }]
  },
  "comparison": {
    "previous_start": "2026-02-01T00:00:00Z",
    "previous_end": "2026-03-01T00:00:00Z",
    "metrics": {
      "revenue_change_pct": 12.4,
      "orders_change_pct": 8.1,
      "signups_change_pct": 4.2,
      "sessions_change_pct": 10.9,
      "aov_change_pct": 3.6,
      "conversion_change_pct": 1.8
    }
  }
}
```

Key field types:

- `dau`, `wau`, `mau`, `concurrent_users`, `new_signups`, `orders`, `active_sellers`, `active_products`: `int64`
- `revenue`, `aov`, `conversion_rate`, `cart_abandonment_rate`, `avg_session_duration`, `bounce_rate`: `float64`
- `trends.*`: `GraphDataPoint[]`
- `comparison`: `QueryComparison | null`

### `UserAnalyticsResponse`

```json
{
  "acquisition": {
    "new_users": 182,
    "new_users_time_series": [{ "x_value": "2026-03-01", "y_value": 12 }],
    "signup_sources": {
      "organic": 120,
      "invite": 40,
      "social": 22
    },
    "invites_sent": 310,
    "invites_accepted": 48,
    "viral_coefficient": 0.26
  },
  "engagement": {
    "avg_sessions_per_user": 3.4,
    "avg_session_duration": 312.5,
    "top_screens": [
      {
        "screen_name": "home",
        "views": 4200,
        "avg_time_seconds": 36.7
      }
    ],
    "screen_flows": [
      {
        "path": "home > search > product_detail",
        "count": 240
      }
    ],
    "feature_usage": {
      "search": 1800,
      "closet": 730
    },
    "time_of_day_heatmap": [[4, 2, 1], [8, 12, 6]],
    "search_metrics": {
      "top_queries": [{ "query": "black dress", "count": 82 }],
      "no_result_queries": [{ "query": "linen co-ord", "count": 6 }],
      "search_to_purchase_rate": 0.11
    }
  },
  "retention": {
    "cohort_table": [
      {
        "cohort_date": "2026-03-01",
        "size": 120,
        "retention": [1, 0.45, 0.31]
      }
    ],
    "churn_rate": 0.19,
    "stickiness": 0.31,
    "resurrection_rate": 0.04
  },
  "segments": [
    {
      "name": "new_users",
      "count": 182,
      "pct": 0.23
    }
  ],
  "comparison": {
    "previous_start": "2026-02-01T00:00:00Z",
    "previous_end": "2026-03-01T00:00:00Z",
    "metrics": {
      "new_users_change_pct": 4.2,
      "avg_sessions_per_user_change": 7.1,
      "avg_session_duration_change": 2.5
    }
  }
}
```

Nested schema notes:

- `signup_sources`: `map[string]int64`
- `top_screens`: array of `{ screen_name: string, views: int64, avg_time_seconds: float64 }`
- `screen_flows`: array of `{ path: string, count: int64 }`
- `feature_usage`: `map[string]int64`
- `time_of_day_heatmap`: `int64[][]`
- `segments`: array of `{ name: string, count: int64, pct: float64 }`

### `CommerceAnalyticsResponse`

```json
{
  "revenue": 845000.5,
  "revenue_time_series": [{ "x_value": "2026-03-01", "y_value": 32000 }],
  "orders": 311,
  "aov": 2717.04,
  "top_products": [
    {
      "product_id": "prod_456",
      "product_name": "Floral Lawn Suit",
      "units_sold": 54,
      "revenue": 189000
    }
  ],
  "category_breakdown": [
    {
      "category": "Lawn",
      "revenue": 220000,
      "orders": 80,
      "views": 4100,
      "conversion_rate": 0.07,
      "growth_rate": 0.12
    }
  ],
  "funnel": {
    "stages": [
      { "name": "View Product", "count": 12000, "drop_off_pct": 0 },
      { "name": "Add to Cart", "count": 1600, "drop_off_pct": 86.67 }
    ],
    "overall_conversion": 0.025
  },
  "revenue_by_category": {
    "Lawn": 220000,
    "Western": 95000
  },
  "orders_by_status": {
    "pending": 20,
    "delivered": 240
  },
  "return_rate": 0.03,
  "time_to_first_purchase": 5.8,
  "arpu": 684.2,
  "comparison": {
    "previous_start": "2026-02-01T00:00:00Z",
    "previous_end": "2026-03-01T00:00:00Z",
    "metrics": {
      "revenue_change_pct": 12.4,
      "orders_change_pct": 8.1,
      "aov_change_pct": 3.6,
      "return_rate_change_pct": -0.4,
      "arpu_change_pct": 5.2
    }
  }
}
```

### `FunnelAnalytics`

```json
{
  "stages": [
    { "name": "View Product", "count": 12000, "drop_off_pct": 0 },
    { "name": "Add to Cart", "count": 1600, "drop_off_pct": 86.67 },
    { "name": "Start Checkout", "count": 620, "drop_off_pct": 61.25 },
    { "name": "Complete Purchase", "count": 300, "drop_off_pct": 51.61 }
  ],
  "overall_conversion": 0.025
}
```

### `RealTimeResponse`

```json
{
  "active_users_now": 104,
  "events_per_minute": 58,
  "recent_events": [
    {
      "id": "uuid",
      "type": "product.view",
      "session_id": "sess_123",
      "timestamp": "2026-03-31T14:20:00Z",
      "server_time": "2026-03-31T14:20:01Z"
    }
  ],
  "active_screens": {
    "home": 34,
    "product_detail": 19
  },
  "orders_last_hour": 12,
  "revenue_last_hour": 32100
}
```

### Additional Implemented Admin Schemas

These endpoints are also available in the current module and reuse the following shapes:

- `SearchAnalyticsResponse`
- `CategoryMetric[]`
- `OperationalAnalyticsResponse`
- `SellerOperationsResponse`
- `FeedbackAnalyticsResponse`
- `LogisticsAnalyticsResponse`
- `ProbeEvent[]` for `/real-time/events`

---

### Retention Cohorts Response

Returned by `GET /api/v2/admin/probe/users/retention`.

```json
{
  "cohorts": [
    {
      "cohort_date": "2026-03-01",
      "size": 120,
      "retention": [1.0, 0.45, 0.31, 0.22]
    }
  ],
  "churn_rate": 0.19,
  "stickiness": 0.31,
  "resurrection_rate": 0.04
}
```

Field descriptions:

- `cohorts`: Array of retention cohorts
- `cohort_date`: The date this cohort was acquired (e.g., first signup date)
- `size`: Number of users in the cohort
- `retention`: Array of retention rates for each subsequent period (Day 0, Day 1, Day 2, ...)
- `churn_rate`: Overall churn rate for the period
- `stickiness`: DAU/MAU ratio
- `resurrection_rate`: Rate of previously churned users returning

---

### User Segments Response

Returned by `GET /api/v2/admin/probe/users/segments`.

```json
[
  {
    "name": "new_users",
    "count": 182,
    "pct": 0.23
  },
  {
    "name": "active_shoppers",
    "count": 450,
    "pct": 0.36
  },
  {
    "name": "at_risk",
    "count": 210,
    "pct": 0.17
  }
]
```

Field descriptions:

- `name`: Segment identifier
- `count`: Number of users in this segment
- `pct`: Percentage of total user base

---

### Search Analytics Response

Returned by `GET /api/v2/admin/probe/search`.

```json
{
  "top_queries": [
    { "query": "black dress", "count": 82, "click_through_rate": 0.45 }
  ],
  "no_result_queries": [
    { "query": "linen co-ord", "count": 6 }
  ],
  "search_to_purchase_rate": 0.11,
  "avg_results_per_query": 24.5
}
```

Field descriptions:

- `top_queries`: Most frequent search queries with counts and CTR
- `no_result_queries`: Queries that returned no results
- `search_to_purchase_rate`: Percentage of searches resulting in a purchase
- `avg_results_per_query`: Average number of results returned per search

---

### Category Metrics Response

Returned by `GET /api/v2/admin/probe/commerce/categories`.

```json
[
  {
    "category": "Lawn",
    "revenue": 220000,
    "orders": 80,
    "views": 4100,
    "conversion_rate": 0.07,
    "growth_rate": 0.12
  }
]
```

Field descriptions:

- `category`: Category name
- `revenue`: Total revenue from this category
- `orders`: Number of orders
- `views`: Total product views in this category
- `conversion_rate`: Views to orders conversion rate
- `growth_rate`: Period-over-period growth rate

---

### Operational Analytics Response

Returned by `GET /api/v2/admin/probe/operations`.

```json
{
  "total_bookings": 1250,
  "status_breakdown": {
    "pending": 45,
    "confirmed": 180,
    "shipped": 890,
    "delivered": 120,
    "cancelled": 15
  },
  "avg_fulfillment_time_hours": 36.5
}
```

---

### Seller Operations Response

Returned by `GET /api/v2/admin/probe/operations/sellers`.

```json
{
  "total_applications": 245,
  "status_breakdown": {
    "pending": 32,
    "approved": 180,
    "rejected": 28,
    "suspended": 5
  },
  "approval_rate": 0.73
}
```

---

### Feedback Analytics Response

Returned by `GET /api/v2/admin/probe/operations/feedback`.

```json
{
  "total_volume": 156,
  "category_breakdown": {
    "product_quality": 45,
    "shipping": 32,
    "customer_service": 28,
    "website": 51
  },
  "status_breakdown": {
    "open": 42,
    "in_progress": 38,
    "resolved": 76
  }
}
```

---

### Logistics Analytics Response

Returned by `GET /api/v2/admin/probe/operations/logistics`.

```json
{
  "total_bookings": 890,
  "status_breakdown": {
    "pending": 45,
    "in_transit": 320,
    "delivered": 500,
    "returned": 25
  },
  "partner_breakdown": {
    "trax": 340,
    "leopards": 280,
    "call Courier": 270
  }
}
```

---

### Top Product

Returned by `GET /api/v2/admin/probe/products`.

```json
[
  {
    "product_id": "prod_456",
    "product_name": "Floral Lawn Suit",
    "units_sold": 54,
    "revenue": 189000,
    "views": 2400,
    "conversion_rate": 0.022
  }
]
```

---

### Product Deep Dive Response

Returned by `GET /api/v2/admin/probe/products/{id}`.

```json
{
  "product_id": "prod_456",
  "product_name": "Floral Lawn Suit",
  "views": 2400,
  "added_to_cart": 320,
  "purchases": 54,
  "revenue": 189000,
  "conversion_rate": 0.022,
  "cart_abandon_rate": 0.83,
  "avg_time_on_page_seconds": 45.2,
  "return_rate": 0.04
}
```

Field highlights:

- `RetentionCohort`: `{ cohort_date: string, size: int64, retention: float64[] }`
- `QueryMetric`: `{ query: string, count: int64 }`

---

## Event Taxonomy

Supported `type` values are validated server-side. Current categories:

- Session: `session.start`, `session.end`, `session.heartbeat`
- Screen: `screen.view`, `screen.exit`
- Auth: `auth.signup`, `auth.login`, `auth.logout`, `auth.password_reset`
- Product: `product.view`, `product.impression`, `product.share`, `product.add_to_closet`, `product.remove_from_closet`
- Search: `search.query`, `search.result_click`, `search.no_results`, `search.filter_apply`
- Commerce: `cart.add`, `cart.remove`, `cart.view`, `checkout.start`, `checkout.complete`, `checkout.abandon`, `order.placed`, `order.cancelled`, `order.delivered`, `order.returned`
- Interaction: `interaction.like`, `interaction.dislike`, `interaction.save`, `interaction.share`
- Social: `poll.vote`, `poll.view`, `groupchat.message`, `groupchat.join`
- Seller: `seller.profile_view`, `seller.follow`, `seller.unfollow`, `seller.contact`
- Notification: `notification.received`, `notification.opened`, `notification.dismissed`
- Closet: `closet.create`, `closet.add_item`, `closet.remove_item`, `closet.share`, `outfit.create`, `outfit.view`
- Invite: `invite.sent`, `invite.accepted`, `invite.expired`
- Feedback: `feedback.submitted`, `bug_report.submitted`, `brand.review_submitted`, `app.review_submitted`
- App lifecycle: `app.install`, `app.open`, `app.background`, `app.foreground`, `app.update`, `app.uninstall`
- Navigation: `navigation.tab_switch`, `navigation.deep_link`, `navigation.back`
- Content: `update.view`, `update.reaction`
- Logistics: `delivery.booked`, `delivery.tracking_viewed`, `delivery.completed`

---

## Endpoints

### Ingest Events
`POST /api/v2/probe/events/ingest`

Auth: public

Accepts a batched event payload from mobile or web clients.

**Body**: [`IngestEventsRequest`](#ingesteventsrequest)

**Response `202`**: [`IngestEventsResponse`](#ingesteventsresponse)

Server behavior:

- validates event types
- defaults missing event timestamps to request receive time
- enriches `user_agent` and `ip_address` when available
- bulk inserts events into `probe_events`
- upserts the owning session in `probe_sessions`

**Common errors**

- `400 INVALID_BODY` — malformed JSON
- `400 BAD_REQUEST` — missing `session_id`, empty `events`, oversized batch, or unsupported event type

---

### Session Heartbeat
`POST /api/v2/probe/sessions/heartbeat`

Auth: public

Refreshes an active session's last-seen timestamp and optional session metadata.

**Body**: [`SessionHeartbeatRequest`](#sessionheartbeatrequest)

**Response `200`**: [`SessionHeartbeatResponse`](#sessionheartbeatresponse)

**Common errors**

- `400 INVALID_BODY` — malformed JSON
- `400 BAD_REQUEST` — missing `session_id`

---

### Platform Overview
`GET /api/v2/admin/probe/overview`

Auth: admin token required

Returns the top-level admin dashboard metrics for the selected time window.

**Query params**

- standard admin query params
- `compare=previous_period` supported

**Response `200`**: [`PlatformOverviewResponse`](#platformoverviewresponse)

---

### User Analytics
`GET /api/v2/admin/probe/users`

Auth: admin token required

Returns acquisition, engagement, retention, and segment metrics.

**Query params**

- standard admin query params
- `compare=previous_period` supported

**Response `200`**: [`UserAnalyticsResponse`](#useranalyticsresponse)

---

### Commerce Analytics
`GET /api/v2/admin/probe/commerce`

Auth: admin token required

Returns revenue, order, category, funnel, and monetization metrics.

**Query params**

- standard admin query params
- `compare=previous_period` supported

**Response `200`**: [`CommerceAnalyticsResponse`](#commerceanalyticsresponse)

---

### Conversion Funnel
`GET /api/v2/admin/probe/commerce/funnel`

Auth: admin token required

Returns core funnel stages:

- `View Product`
- `Add to Cart`
- `Start Checkout`
- `Complete Purchase`

**Query params**

- standard admin query params except `compare`

**Response `200`**: [`FunnelAnalytics`](#funnelanalytics)

---

### Real-Time Analytics
`GET /api/v2/admin/probe/real-time`

Auth: admin token required

Returns a current activity snapshot across sessions and events.

**Query params**

- `limit` — optional recent event count to include inside `recent_events`

**Response `200`**: [`RealTimeResponse`](#realtimeresponse)

---

### Product Rankings
`GET /api/v2/admin/probe/products`

Auth: admin token required

Returns top products ranked by revenue or units sold.

**Query params**

- standard admin query params
- `limit` — optional results limit (default 50)

**Response `200`**: `TopProduct[]`

---

### Product Deep Dive
`GET /api/v2/admin/probe/products/{id}`

Auth: admin token required

Returns comprehensive metrics for a specific product.

**Path params**

- `id` — product ID

**Query params**

- standard admin query params

**Response `200`**: `ProductDeepDiveResponse`

---

### Additional Implemented Admin Endpoints

These endpoints are also available and use the shared shapes listed above:

- `GET /api/v2/admin/probe/users/retention` → `RetentionMetrics`
- `GET /api/v2/admin/probe/users/segments` → `UserSegment[]`
- `GET /api/v2/admin/probe/search` → `SearchAnalyticsResponse`
- `GET /api/v2/admin/probe/commerce/categories` → `CategoryMetric[]`
- `GET /api/v2/admin/probe/operations` → `OperationalAnalyticsResponse`
- `GET /api/v2/admin/probe/operations/sellers` → `SellerOperationsResponse`
- `GET /api/v2/admin/probe/operations/feedback` → `FeedbackAnalyticsResponse`
- `GET /api/v2/admin/probe/operations/logistics` → `LogisticsAnalyticsResponse`
- `GET /api/v2/admin/probe/real-time/events` → `ProbeEvent[]`

All require admin auth. `start_time`, `end_time`, `granularity`, and `limit` are accepted where relevant.

---

## Seller Analytics Endpoints

### Seller Overview
`GET /api/v2/seller/probe/overview`

Auth: seller token required

Returns the seller dashboard landing page metrics including revenue, orders, profile views, followers, conversion rate, health score, and trend data.

**Query params**

- standard seller query params
- `compare=previous_period` supported

**Response `200`**: [`SellerOverviewResponse`](#selleroverviewresponse)

**Common errors**

- `401 UNAUTHORIZED` — missing or invalid seller token
- `403 FORBIDDEN` — authenticated user is not a seller

---

### Seller Sales Analytics
`GET /api/v2/seller/probe/sales`

Auth: seller token required

Returns detailed sales performance metrics including revenue trends, order trends, AOV, fulfillment speed, cancellation rate, return rate, and repeat order rate.

**Query params**

- standard seller query params

**Response `200`**: [`SellerSalesResponse`](#sellersalesresponse)

---

### Seller Product Performance List
`GET /api/v2/seller/probe/products`

Auth: seller token required

Returns product performance rankings with metrics for each product including impressions, views, cart adds, purchases, revenue, conversion rate, likes, closet saves, shares, and return rate.

**Query params**

- standard seller query params
- `limit` — optional results limit (default 50)

**Response `200`**: [`SellerProductPerformanceResponse`](#sellerproductperformanceresponse)

---

### Seller Product Detail
`GET /api/v2/seller/probe/products/{id}`

Auth: seller token required

Returns comprehensive analytics for a specific product including views trend, cart abandon rate, revenue per view, and traffic source breakdown.

**Path params**

- `id` — product ID

**Query params**

- standard seller query params (except `compare`)

**Response `200`**: [`SellerProductDetailResponse`](#sellerproductdetailresponse)

---

### Seller Inventory Intelligence
`GET /api/v2/seller/probe/inventory`

Auth: seller token required

Returns inventory health metrics including total products, active products, dead stock count, restock alerts with stock levels and days of inventory, and inventory turnover.

**Query params**

- standard seller query params

**Response `200`**: [`SellerInventoryResponse`](#sellerinventoryresponse)

---

### Seller Customer Insights
`GET /api/v2/seller/probe/customers`

Auth: seller token required

Returns customer analytics including total customers, new vs returning breakdown, repeat purchase rate, top 10 customers by spend, customer segmentation (one-time/occasional/loyal), geographic distribution, and customer acquisition trend.

**Query params**

- standard seller query params

**Response `200`**: [`SellerCustomerInsightsResponse`](#sellercustomerinsightsresponse)

---

### Seller Optimization Signals
`GET /api/v2/seller/probe/optimization`

Auth: seller token required

Returns actionable optimization signals and platform benchmarks. Signals include warnings for high views/low conversion, high cart abandonment, high return rates, and opportunities for growth. Benchmarks compare seller performance against platform averages.

**Query params**

- standard seller query params

**Response `200`**: [`SellerOptimizationResponse`](#selleroptimizationresponse)

---

### Seller Revenue Forecast
`GET /api/v2/seller/probe/forecast`

Auth: seller token required

Returns revenue forecasts using moving average projections. Includes 7-day and 30-day forecasts, confidence level, trend direction (accelerating/stable/decelerating), and daily revenue history.

**Query params**

- standard seller query params

**Response `200`**: [`SellerForecastResponse`](#sellerforecastresponse)

---

## Server-Side Emission

Probe also accepts server-generated events through the internal `EventEmitter` interface. Current emitters include:

- `identity`: `auth.signup`, `auth.login`
- `commerce`: `order.placed`, `order.cancelled`, `order.delivered`, `order.returned`

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400 BAD_REQUEST` | Validation failure such as missing `session_id`, invalid date, invalid limit, or unsupported event type |
| `401 UNAUTHORIZED` | Missing or invalid admin/seller token |
| `403 FORBIDDEN` | Authenticated user is not an admin (admin routes) or not a seller (seller routes) |
