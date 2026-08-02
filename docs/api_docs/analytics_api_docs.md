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
Campaign attribution is intentionally not part of this funnel: do not send a
`campaign_id`.

## Journey diagnostics

The broad funnel remains the source for the five main stages. Diagnostic events
are additional records in the same `funnel_events` collection and never change
those counts. A website creates one random UUID in session storage and sends it
as `journey_id` with client events and `X-Juno-Journey-Id` with checkout
requests. This is an anonymous visit key, not a customer profile.

Only these sub-events are accepted:

| Main event | Sub-event | Safe detail, when needed |
| --- | --- | --- |
| `view_item` | `variant_selected`, `size_guide_opened` | — |
| `view_item` | `unavailable_shown` | `out_of_stock`, `variant_unavailable` |
| `add_to_cart` | `clicked` | — |
| `add_to_cart` | `blocked` | `variant_required`, `out_of_stock`, `quantity_limit` |
| `begin_checkout` | `form_started`, `form_ready`, `submit_clicked`, `payment_proof_opened`, `payment_proof_added` | — |
| `begin_checkout` | `payment_method_selected` | `cod`, `bank_deposit` |
| `begin_checkout` | `field_completed` | `name`, `phone`, `address`, `city` |
| `begin_checkout` | `field_invalid` | `name`, `phone`, `address`, `city` |
| `begin_checkout` | `shipping_estimate` | `requested`, `ready`, `failed` |
| `begin_checkout` | `preflight_failed` | `shipping_estimate`, `payment_proof` |
| `begin_checkout` | `request_received`, `failed` | server-only; failures use a safe enum such as `empty_cart`, `item_unavailable`, or `internal_error` |

Never send field values, contact details, raw errors, addresses, IPs, or
payment data. `purchase` remains the one server-owned successful completion
event; no `checkout_completed` sub-event exists.

## Client tracker contract

Use one UUID per browser session. Store it in `sessionStorage`, include it as
`journey_id` on **every** client event, and send the same value as
`X-Juno-Journey-Id` on checkout requests. Existing clients without it remain
accepted during rollout, but they cannot be used for journey diagnostics.

Base funnel events have no `sub_event`; they are the only events included in
the stage totals. Diagnostics always have a `sub_event`, and are visible only
through the diagnostics and journey endpoints.

| User action | Event to send | Send once |
| --- | --- | --- |
| Product page opens | `view_item` with `product_id` | Once per product-route entry; never from a render or data refetch. |
| Product option selected | `view_item` / `variant_selected` | Each intentional option selection. |
| Size guide opens | `view_item` / `size_guide_opened` | Each explicit open. |
| Product/variant is unavailable | `view_item` / `unavailable_shown` | When the unavailable state becomes visible. |
| Add-to-bag control pressed | `add_to_cart` / `clicked` | Each user click. |
| Add succeeds | base `add_to_cart` with `product_id` | Once after the cart mutation succeeds. |
| Add cannot proceed | `add_to_cart` / `blocked` | Only for the safe reason returned by the UI. |
| Checkout page opens | base `begin_checkout` | Once per journey. Guard the route transition with `sessionStorage`; never emit from form state, recalculation, rerender, or submit. |
| Checkout form opens | `begin_checkout` / `form_started` | Once when the form becomes usable. |
| Field passes or fails client validation | `begin_checkout` / `field_completed` or `field_invalid` | Once per field-state transition; never send the value. |
| Shipping estimate changes state | `begin_checkout` / `shipping_estimate` | Send `requested`, then `ready` or `failed` for each explicit city/address change. |
| Payment choice/proof interaction | `begin_checkout` / `payment_method_selected`, `payment_proof_opened`, or `payment_proof_added` | On the explicit customer action only. |
| Checkout submit pressed | `begin_checkout` / `submit_clicked` | Each explicit submit attempt. The server separately records request receipt and safe failure reasons. |

This separates low intent (a view) from product friction (unavailable or no
variant), engagement (guide/options), and purchase intent (cart click). The
product-to-cart investigation is then: `view_item` → `add_to_cart/clicked` →
base `add_to_cart`, grouped by product and the diagnostic reason. Do not emit a
base `add_to_cart` for a blocked click.

Example client payloads:

```json
{"type":"view_item","journey_id":"8a3a07e3-b1ae-4fc7-9c9e-cb49c622483e","product_id":"prod_456"}
{"type":"add_to_cart","journey_id":"8a3a07e3-b1ae-4fc7-9c9e-cb49c622483e","product_id":"prod_456","sub_event":"clicked"}
{"type":"add_to_cart","journey_id":"8a3a07e3-b1ae-4fc7-9c9e-cb49c622483e","product_id":"prod_456"}
```

## API

This module owns both routes. The `admin` module defines no analytics routes.

`POST /api/v2/analytics/events` is public and accepts only client-owned events:
`page_view`, `download_page_view`, `store_visit`, `app_install`, `view_item`,
`add_to_cart`, and `begin_checkout`. Set `source` to `app` for app
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
  event. Each row includes first/last time, last event/sub-event/detail,
  products seen, event count, and outcome (`purchased` or `incomplete`). Use
  this as the portal list; `incomplete` is not an assertion of abandonment,
  only that no purchase has been recorded in the selected window. Use
  `next_after` as the cursor when present.
- `GET /api/v2/admin/analytics/journeys/{journeyID}` returns that journey's
  ordered, timestamped events. Render the list row first, then this timeline
  in the portal drawer; diagnostic events identify the last known friction.

Example checkout-journey row:

```json
{
  "journey_id": "8a3a07e3-b1ae-4fc7-9c9e-cb49c622483e",
  "started_at": "2026-08-02T08:57:54Z",
  "last_at": "2026-08-02T08:58:36Z",
  "last_event": "begin_checkout",
  "last_sub_event": "preflight_failed",
  "last_detail": "payment_proof",
  "outcome": "incomplete",
  "event_count": 12,
  "product_ids": ["prod_456"]
}
```

For checkout debugging, show `last_sub_event` and `last_detail` as the primary
reason, `outcome` as the result, and the ordered timeline as evidence. Do not
display or request any personal customer data in this view.

`funnel_events` retains its existing 90-day TTL. It also has a
`source + journey_id + created_at` index for the journey list and timeline.

`add_to_cart` is client-owned and must be emitted only after a successful user
action, not during optimistic-cart synchronization. `sign_up` and `purchase`
remain server-owned. The app must send
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
