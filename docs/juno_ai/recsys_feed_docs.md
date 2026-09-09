# Recsys Feed Module

## Scope

The Recsys Feed module owns personalized shelves, cursor feeds, compact agent
retrieval, candidate generation, ranking, diversity, exposure, and feed caching.

Implementation:

- serving and routes in `recsys_core/system.py`;
- ranking in `recsys_core/ranking/ranker.py`;
- Agent grounding adapter in `agent_core/services/recsys.py`.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/feed` | Main cursor-paginated personalized feed. |
| `POST /api/v1/recommendations` | Finite personalized shelf. |
| `POST /api/v1/retrieve` | Compact retrieval for Agent/client grounding. |

## `POST /api/v1/feed`

```json
{
  "user_id": "usr_123",
  "page_size": 24,
  "cursor": null,
  "session_id": "sess_abc",
  "refresh": false,
  "compact": true,
  "query": null,
  "city": "Lahore",
  "filters": {"gender": "women", "price_max": 10000}
}
```

```json
{
  "success": true,
  "items": [],
  "cursor": "next-cursor-or-null",
  "is_cold_start": false,
  "request_id": "req_123",
  "feed_revision": "req_123",
  "pagination_degraded": false
}
```

Client rules:

- keep `user_id`, `session_id`, query, and filters unchanged while following a
  cursor;
- stop when cursor is null;
- use `refresh: true` only for a new top-level shelf;
- preserve `request_id` and item `_meta.position` for event attribution;
- treat `feed_revision` as the version for the initial page and every cursor
  page that follows it; discard an older revision after a refresh;
- dedupe cards by product id;
- prefetch before the visible deck is exhausted;
- when `pagination_degraded` is true, do not expect a cursor until Redis returns.

Set `compact: true` for card/deck surfaces. Each item then contains only `id`,
`title`, `seller_name`, `pricing.effective_price`, `available`, `image`, and
`_meta`; full product documents remain the default for backward compatibility.
`compact` must be a JSON boolean.

The cursor is bound to user, session, filters, query, and catalog version. Feed
lists are stored in Redis for ten minutes. Exposure sets prevent immediate
repetition across refreshes.

## Performance baseline

Measure a deployed compact feed before and after a performance change:

```bash
python3 scripts/evaluation/feed_performance_baseline.py \
  --base-url https://ai.juno.com.pk --user-id deployment-smoke-test
```

The command emits fresh-feed status counts plus p50/p95 latency and response
bytes. Use a dedicated non-customer user id because normal feed requests log
impressions.

## `POST /api/v1/recommendations`

```json
{
  "user_id": "usr_123",
  "num_products": 10,
  "session_id": "sess_abc",
  "surface": "home_shelf",
  "refresh": false,
  "query": "summer dresses",
  "filters": {"price_max": 8000}
}
```

Returns `products`, `is_cold_start`, and `request_id`. Use this endpoint for a
finite shelf; use `/feed` for infinite scroll.

## `POST /api/v1/retrieve`

```json
{
  "user_id": "usr_123",
  "query": "wedding guest outfit",
  "filters": {"price_max": 15000},
  "k": 8,
  "session_id": "sess_abc",
  "city": "Karachi"
}
```

Returns compact card items with ranking metadata. `k` is capped at 50.

## Recommendation execution

All three endpoints call the shared `recommend_products()` path:

1. Read one bounded user interaction snapshot.
2. Build a user vector from recent weighted behavior or the stored taste
   profile.
3. Generate semantic, text, metadata, co-occurrence, fresh, trending, and
   exploration candidates when available.
4. Merge source evidence by product id.
5. Rank using semantic, metadata, behavioral, commercial, trend/freshness, and
   exploration signals.
6. Apply availability, explicit filters, family deduplication, exposure rules,
   and filter-aware diversity.

The Agent must use this shared path through `agent_core/services/recsys.py`; it
must not implement a separate ranking algorithm.

## Event dependency

Recommendation changes depend on behavior recorded by the Recsys Events module.
Impressions are never treated as positive preference. Likes, saves, cart events,
purchases, views, and dislikes have bounded weights and time decay.

## Failure behavior

- Missing user id: HTTP `400`.
- Invalid filter or cursor: HTTP `400` with a stable error payload.
- Query retrieval unavailable: HTTP `500`; explicit query meaning is never
  silently dropped.
- Redis unavailable: the first page still works but pagination degrades.

Update this file whenever feed inputs, cursor rules, candidate sources, scoring,
diversity, caching, response metadata, or Agent grounding changes.
