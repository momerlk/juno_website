# Website and app funnel analytics

Analytics is one small, 90-day event log for the website and app. It has no
SDK, sessions, device/IP profiling, queues, rollups, or real-time dashboards.

## Events

Each milestone has one owner so cart and purchase counts cannot be
double-counted. Events are tagged `web` or `app`.

| Funnel | Events |
| --- | --- | --- |
| Website catalog | `page_view` → `view_item` → `add_to_cart` → `begin_checkout` → `purchase` |
| App | `download_page_view` → `store_visit` → `app_install` → `sign_up` → `view_item` → `add_to_cart` → `begin_checkout` → `purchase` |

`download_page_view` and `store_visit` are emitted by the website but belong to
the app funnel; `app_install` is a first-launch proxy because app stores do not
report installs to this API.
`product_id` and a small `properties` object may be included. Do not send PII.

## Journey diagnostics

The broad funnel remains the source for the five main stages. Diagnostic events
are additional records in the same `funnel_events` collection and never change
those counts. A website creates one random UUID in session storage and sends it
as `journey_id` with client events and `X-Juno-Journey-Id` with checkout
requests. This is an anonymous visit key, not a customer profile.

Only these sub-events are accepted:

| Main event | Sub-event | Safe detail, when needed |
| --- | --- | --- |
| `view_item` | `variant_selected` | — |
| `add_to_cart` | `blocked` | `variant_required`, `out_of_stock`, `quantity_limit` |
| `begin_checkout` | `form_started`, `form_ready`, `payment_method_selected`, `submit_clicked` | — |
| `begin_checkout` | `field_completed` | `name`, `phone`, `address`, `city` |
| `begin_checkout` | `preflight_failed` | `shipping_estimate`, `payment_proof` |
| `begin_checkout` | `request_received`, `failed` | server-only; failures use a safe enum such as `empty_cart`, `item_unavailable`, or `internal_error` |

Never send field values, contact details, raw errors, addresses, IPs, or
payment data. `purchase` remains the one server-owned successful completion
event; no `checkout_completed` sub-event exists.

## API

This module owns both routes. The `admin` module defines no analytics routes.

`POST /api/v2/analytics/events` is public and accepts only client-owned events:
`download_page_view`, `store_visit`, `app_install`, `view_item`, and
`begin_checkout`, plus website `page_view`. Set `source` to `app` for app
`view_item` and `begin_checkout`; omitted source defaults to `web`.

```json
{"type":"view_item","source":"app","product_id":"prod_456"}
```

The request body is limited to 16 KB. Server-owned `sign_up` and `purchase`
are rejected from this endpoint. Responses are `202
{"accepted":true}` or a validation error. `properties` is optional, should
remain small, and must not include customer personal data.

`GET /api/v2/admin/analytics/funnel?from=<RFC3339>&to=<RFC3339>` returns the
original five-stage website catalog funnel. `GET
/api/v2/admin/analytics/app-funnel?from=<RFC3339>&to=<RFC3339>` returns the
eight-stage app funnel. They return event counts (not unique people), so
`view_item` intentionally counts every product a customer views. Omitting dates
uses the last 30 days. Both require admin authentication.

### Funnel response and charting

Both funnel endpoints return the exact effective window as RFC3339 UTC `from`
and `to`, the aggregate `stages`, and `events`: every matching stored event in
ascending `created_at` order. The window is inclusive at both ends. This gives
charts both their summary values and timestamped source data without a second
analytics request.

Each event has `type` and `created_at`, plus the fields captured for that
event: `user_id`, `seller_id`, `product_id`, `campaign_id`, `source`, and
`properties`. Optional fields are omitted when not recorded. `events` is an
empty array when no event matches. The website endpoint includes `web` events
(and legacy events with no source); the app endpoint includes only `app`
events.

### Fast diagnostic reads

These admin-only website endpoints perform grouping and timeline lookups in
MongoDB, so the portal does not download and group the full event log:

- `GET /api/v2/admin/analytics/funnel/diagnostics?from=<RFC3339>&to=<RFC3339>`
  returns grouped `{event, sub_event, detail, count}` rows.
- `GET /api/v2/admin/analytics/journeys?from=<RFC3339>&to=<RFC3339>&after=<RFC3339>&limit=50`
  returns up to 100 anonymous journeys which reached the base `begin_checkout`
  event. Use `next_after` as the cursor when present.
- `GET /api/v2/admin/analytics/journeys/{journeyID}` returns that journey's
  ordered, timestamped events.

`funnel_events` retains its existing 90-day TTL. It also has a
`source + journey_id + created_at` index for the journey list and timeline.

`add_to_cart` is client-owned so optimistic cart syncing does not inflate the
funnel. `sign_up` and `purchase` remain server-owned. The app must send
`X-Juno-Client: app` on registration and checkout requests; omitted or website
traffic is counted in the website funnel.

Example response:

```json
{
  "from": "2026-07-01T00:00:00Z",
  "to": "2026-07-29T00:00:00Z",
  "stages": [
    {"event": "page_view", "count": 1200, "conversion": 0},
    {"event": "view_item", "count": 640, "conversion": 0.533}
  ],
  "events": [
    {
      "type": "view_item",
      "product_id": "prod_456",
      "source": "web",
      "properties": {"collection": "summer"},
      "created_at": "2026-07-28T15:04:05Z"
    }
  ]
}
```

Events are retained for 90 days in `funnel_events`. The old Probe collections
are not read or written by this module.
