# Waitlist Module

Early access waitlist for new users. No authentication required.

---

## Endpoints

### Join Waitlist
`POST /api/v2/waitlist`

Registers a user for early access and assigns them a spot number.

**Body**
```json
{
  "name": "Ayesha Khan",
  "phone_number": "+923001234567",
  "institute": "LUMS"
}
```
All fields optional but `phone_number` is the primary identifier.

**Response `201`**
```json
{
  "id": "uuid",
  "name": "Ayesha Khan",
  "phone_number": "+923001234567",
  "institute": "LUMS",
  "spot": 142,
  "created_at": "..."
}
```

---

### Get Total Waitlist Count
`GET /api/v2/waitlist/spots`

Returns the total number of people currently on the waitlist.

**Response `200`**
```json
{ "spots": 1423 }
```

---

### Check Waitlist Position
`GET /api/v2/waitlist/status`

Returns a specific user's waitlist entry including their spot number.

**Query Parameters**

| Param | Required | Description |
|-------|----------|-------------|
| `phone_number` | yes | User's phone number |

**Response `200`** — `WaitlistEntry` object. `404` if phone number not found.
