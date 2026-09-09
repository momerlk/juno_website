# Recsys Events Module

## Scope

The Recsys Events module owns recommendation feedback, impression attribution,
suggestion analytics, lightweight user profile updates, and user history.

Implementation: event collections, indexes, cache invalidation, and routes in
`recsys_core/system.py`.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/v1/events` | Preferred batch event ingestion. |
| `POST /api/v1/interactions` | Single-event compatibility endpoint. |
| `GET /api/v1/suggest` | Deterministic Recsys suggestion text. |
| `POST /api/v1/suggest/events` | Suggestion shown/tapped/dismissed analytics. |
| `POST /api/v1/users` | Upsert lightweight user profile fields. |
| `GET /api/v1/users/{user_id}/history` | Paginated interaction history. |

## Batch events

```json
{
  "user_id": "usr_123",
  "session_id": "sess_abc",
  "events": [{
    "kind": "impression",
    "product_id": "prod_123",
    "request_id": "req_123",
    "position": 0,
    "sequence": 18
  }]
}
```

Supported kinds are `impression`, `view`, `save`, `dislike`, `add_to_cart`,
`purchase`, `suggestion-shown`, `suggestion-tapped`, and
`suggestion-dismissed`.

Product events require `product_id`. Suggestion events require `suggestion_id`.
`sequence` is optional but, when supplied, must be a non-negative integer. The
response is `{success, count, event_sequence}` where `event_sequence` echoes the
highest accepted sequence in the batch. Events receive server ids and timestamps
and expire after the configured 90-day TTL.

Client rules:

- use the batch endpoint for new integrations;
- never block swipe/card animation on event ingestion;
- preserve event order within a session;
- assign a monotonically increasing sequence and ignore stale client refreshes;
- include recommendation `request_id` and item `position` for attribution;
- send high-intent events reliably: save, cart, purchase, and dislike;
- do not convert an impression into a view without an actual user action.

## Interaction compatibility endpoint

```json
{
  "user_id": "usr_123",
  "product_id": "prod_123",
  "action_type": "view",
  "rating": 0.3,
  "session_id": "sess_abc",
  "request_id": "req_123",
  "city": "Lahore"
}
```

`interaction_type` is accepted when `action_type` is absent. New clients should
prefer `/events` so multiple impressions/actions can share one request.

Both event endpoints invalidate cached user embeddings after behavioral writes.
The next recommendation request includes the new behavior.

## Recsys suggestions

`GET /api/v1/suggest` requires `user_id` and accepts optional `city` and
`module`. It chooses a deterministic template from stored brand/category/city
facts. A successful suggestion includes text, target module, and suggestion id;
no available template may return HTTP `204`.

Send suggestion outcomes to `/api/v1/suggest/events` with `user_id`,
`suggestion_id`, and event type `shown`, `tapped`, or `dismissed`.

## Users and history

`POST /api/v1/users` upserts a document containing an `id` and lightweight
profile fields. `GET /api/v1/users/{id}/history?offset=0&limit=20` returns recent
events enriched with current product snapshots.

These routes currently trust the supplied user id. Public clients should access
them through the authenticated Juno API boundary until Recsys request auth is
added.

Update this file whenever event kinds, attribution, retention, user cache
invalidation, suggestions, user fields, or history responses change.
