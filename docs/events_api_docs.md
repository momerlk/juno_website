# Events Module

Fashion tournament/competition management. Browsing is public; registration requires user auth; creation is admin-only.

---

## Endpoints

### List Tournaments _(public)_
`GET /api/v2/tournaments`

Returns all tournaments.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "Juno Style Clash S1",
    "description": "Show off your best outfit and win!",
    "rules": "Submit one outfit per participant...",
    "banner_image_url": "https://cdn.example.com/banner.jpg",
    "start_date": "2024-02-01T00:00:00Z",
    "end_date": "2024-02-28T23:59:59Z",
    "registration_fee": 0,
    "prize": "PKR 50,000 + Brand Vouchers",
    "status": "upcoming",
    "max_participants": 500,
    "participant_count": 142,
    "tags": ["fashion", "outfit"],
    "organizer": "Juno Team"
  }
]
```
`status` values: `upcoming`, `active`, `completed`, `cancelled`.

---

### Get Tournament _(public)_
`GET /api/v2/tournaments/{id}`

**Response `200`** — full `Tournament` object. `404` if not found.

---

### Register for Tournament _(auth required)_
`POST /api/v2/tournaments/{id}/register`

Registers the authenticated user for a tournament.

**Response `200`** `{ "message": "Registered successfully" }`

**Error `400`** — already registered or tournament is full/closed.

---

### Get Leaderboard _(public)_
`GET /api/v2/tournaments/{id}/leaderboard`

Returns the current rankings for a tournament based on outfit scores.

**Response `200`**
```json
{
  "id": "uuid",
  "tournament_id": "uuid",
  "rankings": [
    { "outfit_id": "uuid", "user_id": "uuid", "rank": 1, "score": 98.5 },
    { "outfit_id": "uuid", "user_id": "uuid", "rank": 2, "score": 94.2 }
  ],
  "last_calculated": "2024-02-10T14:00:00Z"
}
```

---

### Create Tournament _(admin only — no separate auth check in route, ensure admin JWT)_
`POST /api/v2/tournaments`

**Body**
```json
{
  "name": "Juno Style Clash S1",
  "description": "Show off your best outfit and win!",
  "start_date": "2024-02-01T00:00:00Z",
  "end_date": "2024-02-28T23:59:59Z",
  "registration_fee": 0,
  "prize": "PKR 50,000 + Brand Vouchers"
}
```
Required: `name`, `start_date`, `end_date`.

**Response `201`** — `Tournament` object.
