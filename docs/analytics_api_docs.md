# Analytics Module - Phase 2 Completed 

Probe is the platform analytics and event-ingestion module. It handles:

- client-side event ingestion
- session heartbeat tracking
- server-side event emission used by other modules
- admin analytics dashboards and drill-down APIs

Route groups and auth:

- `POST /api/v2/probe/events/ingest` — public client ingestion
- `POST /api/v2/probe/sessions/heartbeat` — public client heartbeat
- `GET /api/v2/admin/probe/*` — admin auth required via `Authorization: Bearer <admin_token>`

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

- `RetentionMetrics`
- `UserSegment[]`
- `SearchAnalyticsResponse`
- `CategoryMetric[]`
- `OperationalAnalyticsResponse`
- `SellerOperationsResponse`
- `FeedbackAnalyticsResponse`
- `LogisticsAnalyticsResponse`
- `ProbeEvent[]` for `/real-time/events`

Field highlights:

- `RetentionCohort`: `{ cohort_date: string, size: int64, retention: float64[] }`
- `QueryMetric`: `{ query: string, count: int64 }`
- `CategoryMetric`: `{ category: string, revenue: float64, orders: int64, views: int64, conversion_rate: float64, growth_rate: float64 }`
- `SellerOperationsResponse`: `{ total_applications: int64, status_breakdown: map[string]int64, approval_rate: float64 }`
- `FeedbackAnalyticsResponse`: `{ total_volume: int64, category_breakdown: map[string]int64, status_breakdown: map[string]int64 }`
- `LogisticsAnalyticsResponse`: `{ total_bookings: int64, status_breakdown: map[string]int64, partner_breakdown: map[string]int64 }`

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
- Feedback: `feedback.submitted`, `bug_report.submitted`
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
| `401 UNAUTHORIZED` | Missing or invalid admin token on admin routes |
| `403 FORBIDDEN` | Authenticated user is not an admin |
