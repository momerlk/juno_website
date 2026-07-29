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

`add_to_cart` is client-owned so optimistic cart syncing does not inflate the
funnel. `sign_up` and `purchase` remain server-owned. The app must send
`X-Juno-Client: app` on registration and checkout requests; omitted or website
traffic is counted in the website funnel.

Example response:

```json
{"stages":[{"event":"page_view","count":1200,"conversion":0},{"event":"view_item","count":640,"conversion":0.533}]}
```

Events are retained for 90 days in `funnel_events`. The old Probe collections
are not read or written by this module.
