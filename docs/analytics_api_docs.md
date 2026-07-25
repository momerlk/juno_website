# Customer funnel analytics

Analytics is deliberately one small event log for the website and app. It has
no SDK, sessions, heartbeat, device/IP profiling, queues, rollups, retention,
seller analytics, or real-time dashboards.

## Events

Only these event types are stored. Each action has one owner, which prevents
the website/app and API from double-counting it:

| Event | Owner | Send when |
| --- | --- | --- |
| `page_view` | Website/app | A customer opens a page or screen |
| `view_item` | Website/app | A product detail opens |
| `add_to_cart` | Website/app | An item is added to the bag |
| `begin_checkout` | Website/app | Checkout begins |
| `purchase` | Commerce API | An order is successfully created |

`product_id` and a small `properties` object may be included. Do not send PII.
The website and app send the first four events; the API records `purchase`
only after the order succeeds, so it cannot be spoofed or double-counted.

## API

This module owns both routes. The `admin` module defines no analytics routes.

`POST /api/v2/analytics/events` is public and accepts one client-owned event:

```json
{"type":"add_to_cart","product_id":"prod_456","properties":{"quantity":1}}
```

The request body is limited to 16 KB. Valid client types are `page_view`,
`view_item`, `add_to_cart`, and `begin_checkout`; `purchase` is rejected from
this endpoint and is created by Commerce after checkout succeeds. Responses
are `202 {"accepted":true}` or a validation error. `properties` is optional,
should remain small, and must not include customer personal data.

`GET /api/v2/admin/analytics/funnel?from=<RFC3339>&to=<RFC3339>` returns the
five counts and each step's conversion from the prior step. Omitting the dates
uses the last 30 days. It requires admin authentication and uses the compound
`type, created_at` index; events expire after 90 days.

Example response:

```json
{"stages":[{"event":"page_view","count":1200,"conversion":0},{"event":"view_item","count":640,"conversion":0.533}]}
```

Events are retained for 90 days in `funnel_events`. The old Probe collections
are not read or written by this module.
