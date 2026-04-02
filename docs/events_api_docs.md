# Events Module

Tournament and competition management for fashion events. Browsing endpoints are public, registration requires user auth, and creation should be restricted to admin-authenticated clients.

Route groups and auth:

- `GET /api/v2/tournaments` — public
- `GET /api/v2/tournaments/{id}` — public
- `GET /api/v2/tournaments/{id}/leaderboard` — public
- `POST /api/v2/tournaments/{id}/register` — user auth required
- `POST /api/v2/tournaments` — intended for admin use

---

## Shared Schemas

### `TournamentStatus`

Allowed values:

- `upcoming`
- `active`
- `completed`
- `cancelled`

### `Tournament`

```json
{
  "id": "uuid",
  "name": "Juno Style Clash S1",
  "description": "Show off your best outfit and win!",
  "rules": "Submit one outfit per participant...",
  "banner_image_url": "https://cdn.example.com/banner.jpg",
  "start_date": "2026-04-01T00:00:00Z",
  "end_date": "2026-04-30T23:59:59Z",
  "registration_fee": 0,
  "prize": "PKR 50,000 + Brand Vouchers",
  "status": "upcoming",
  "max_participants": 500,
  "participant_count": 142,
  "registered_users": ["user-1", "user-2"],
  "featured_outfits": ["outfit-1"],
  "tags": ["fashion", "outfit"],
  "organizer": "Juno Team",
  "created_at": "2026-03-31T12:00:00Z",
  "updated_at": "2026-03-31T12:00:00Z"
}
```

Field types:

| Field | Type | Notes |
|------|------|------|
| `id` | `string` | UUID |
| `name` | `string` | Tournament title |
| `description` | `string` | Optional description |
| `rules` | `string` | Optional rules copy |
| `banner_image_url` | `string` | Optional banner asset URL |
| `start_date` | `string<RFC3339>` | Event start |
| `end_date` | `string<RFC3339>` | Event end |
| `registration_fee` | `float64` | Optional fee amount |
| `prize` | `string` | Prize description |
| `status` | `TournamentStatus` | One of the allowed status values |
| `max_participants` | `int` | Optional participant cap |
| `participant_count` | `int` | Current registration count |
| `registered_users` | `string[]` | User IDs of registrants |
| `featured_outfits` | `string[]` | Outfit IDs highlighted for the event |
| `tags` | `string[]` | Search/filter tags |
| `organizer` | `string` | Display name of organizer |
| `created_at` | `string<RFC3339>` | Record creation time |
| `updated_at` | `string<RFC3339>` | Last update time |

### `CreateTournamentRequest`

```json
{
  "name": "Juno Style Clash S1",
  "description": "Show off your best outfit and win!",
  "start_date": "2026-04-01T00:00:00Z",
  "end_date": "2026-04-30T23:59:59Z",
  "registration_fee": 0,
  "prize": "PKR 50,000 + Brand Vouchers"
}
```

| Field | Type | Required | Notes |
|------|------|----------|------|
| `name` | `string` | yes | Tournament title |
| `description` | `string` | no | Optional description |
| `start_date` | `string<RFC3339>` | yes | Tournament start |
| `end_date` | `string<RFC3339>` | yes | Tournament end |
| `registration_fee` | `float64` | no | Fee amount |
| `prize` | `string` | no | Prize description |

### `RankingEntry`

```json
{
  "outfit_id": "outfit-1",
  "user_id": "user-1",
  "rank": 1,
  "score": 98.5
}
```

### `Leaderboard`

```json
{
  "id": "uuid",
  "tournament_id": "uuid",
  "rankings": [
    {
      "outfit_id": "outfit-1",
      "user_id": "user-1",
      "rank": 1,
      "score": 98.5
    }
  ],
  "last_calculated": "2026-04-10T14:00:00Z"
}
```

| Field | Type | Notes |
|------|------|------|
| `id` | `string` | UUID |
| `tournament_id` | `string` | Parent tournament ID |
| `rankings` | `RankingEntry[]` | Ordered leaderboard rows |
| `last_calculated` | `string<RFC3339>` | Last recompute timestamp |

---

## Endpoints

### List Tournaments
`GET /api/v2/tournaments`

Auth: public

Returns all tournaments.

**Response `200`**

```json
[
  {
    "id": "uuid",
    "name": "Juno Style Clash S1",
    "status": "upcoming",
    "participant_count": 142,
    "start_date": "2026-04-01T00:00:00Z",
    "end_date": "2026-04-30T23:59:59Z"
  }
]
```

Response shape: `Tournament[]`

---

### Get Tournament
`GET /api/v2/tournaments/{id}`

Auth: public

Returns the full tournament record.

**Path params**

- `id` — `string`, required tournament ID

**Response `200`**: [`Tournament`](#tournament)

**Common errors**

- `404 NOT_FOUND` — tournament does not exist

---

### Register for Tournament
`POST /api/v2/tournaments/{id}/register`

Auth: user token required

Registers the authenticated user for a tournament.

**Path params**

- `id` — `string`, required tournament ID

**Body**

No request body.

**Response `200`**

```json
{
  "message": "Registered successfully"
}
```

**Common errors**

- `400 BAD_REQUEST` — registration is closed, tournament is full, or user is already registered
- `401 UNAUTHORIZED` — missing or invalid user token
- `404 NOT_FOUND` — tournament does not exist

---

### Get Leaderboard
`GET /api/v2/tournaments/{id}/leaderboard`

Auth: public

Returns the current leaderboard for a tournament.

**Path params**

- `id` — `string`, required tournament ID

**Response `200`**: [`Leaderboard`](#leaderboard)

If no leaderboard has been calculated yet, the API may return an empty leaderboard object with the requested `tournament_id`.

---

### Create Tournament
`POST /api/v2/tournaments`

Auth: intended for admin use

Creates a new tournament. Newly created tournaments start with status `upcoming`.

**Body**: [`CreateTournamentRequest`](#createtournamentrequest)

**Response `201`**: [`Tournament`](#tournament)

**Common errors**

- `400 INVALID_BODY` — malformed JSON
- `400 BAD_REQUEST` — invalid request values

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON request body |
| `400 BAD_REQUEST` | Registration closed, invalid input, already registered, or tournament constraints failed |
| `401 UNAUTHORIZED` | Missing or invalid user token |
| `404 NOT_FOUND` | Tournament not found |
