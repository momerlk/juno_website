# Identity Module

User registration, authentication, and profile management. Auth responses return two clearly separated credentials:

- `access_token`: short-lived JWT used in `Authorization: Bearer <access_token>` for protected API requests.
- `refresh_token`: long-lived opaque token used only with `POST /api/v2/auth/refresh` to rotate the session.

---

## Auth Endpoints

### Register
`POST /api/v2/auth/register`

Creates a new user account and returns an access token plus a refresh token.

**Body**
```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "secret123",
  "phone_number": "+923001234567"
}
```
`name`, `email`, and `password` required. `phone_number` is optional for new accounts and remains supported for legacy compatibility.

**Response `201`**
```json
{
  "access_token": "<short_lived_jwt>",
  "refresh_token": "<opaque_refresh_token>",
  "user": { "id": "...", "name": "Ayesha Khan", "email": "ayesha@example.com", ... }
}
```

---

### Login
`POST /api/v2/auth/login`

**Body**
```json
{ "email": "ayesha@example.com", "password": "secret123" }
```
Legacy phone login remains supported:
```json
{ "phone_number": "+923001234567", "password": "secret123" }
```

**Response `200`** — same shape as Register (`access_token`, `refresh_token`, and `user`).

---

### Refresh Token
`POST /api/v2/auth/refresh`

Rotates a valid refresh token and returns a new access token plus a replacement refresh token. The old refresh token is revoked immediately and cannot be reused.

**Body**
```json
{ "refresh_token": "<opaque_refresh_token>" }
```

**Response `200`**
```json
{
  "access_token": "<new_short_lived_jwt>",
  "refresh_token": "<new_opaque_refresh_token>",
  "user": { "id": "...", "name": "Ayesha Khan", "email": "ayesha@example.com", ... }
}
```

---

### Send OTP
`POST /api/v2/auth/send-otp`

Sends a verification OTP to the user's email address. `phone_number` is still accepted for legacy phone-only accounts.
If a fresh OTP was already issued in the last minute, the API returns success without generating or sending a second code.

**Body**
```json
{ "email": "ayesha@example.com" }
```

**Response `200`** `{ "message": "OTP sent successfully" }`

---

### Verify Account
`POST /api/v2/auth/verify`

Marks an account as verified using the OTP received via email. `phone_number` is still accepted for legacy phone-only accounts.
Calling this endpoint again after the account is already verified is treated as a successful no-op.

**Body**
```json
{ "email": "ayesha@example.com", "otp": "123456" }
```

**Response `200`** `{ "message": "Account verified successfully" }`

---

### Request Password Reset
`POST /api/v2/auth/reset-password/request`

Sends a password reset OTP to the user's email address. `phone_number` is still accepted for legacy phone-only accounts.

**Body**
```json
{ "email": "ayesha@example.com" }
```

**Response `200`** `{ "message": "Password reset OTP sent successfully" }`

---

### Reset Password
`POST /api/v2/auth/reset-password`

Resets the password using a valid OTP.

**Body**
```json
{ "email": "ayesha@example.com", "otp": "123456", "new_password": "newsecret123" }
```

**Response `200`** `{ "message": "Password reset successfully" }`

---

### Change Password _(auth required)_
`POST /api/v2/auth/change-password`

Changes the password for the currently authenticated user.

**Body**
```json
{ "old_password": "secret123", "new_password": "newsecret123" }
```
`new_password` must be at least 8 characters.

**Response `200`** `{ "message": "Password changed successfully" }`

---

## Profile Endpoints _(all require auth)_

### Get Profile
`GET /api/v2/me`

Returns the full profile of the authenticated user.

**Response `200`**
```json
{
  "id": "uuid",
  "name": "Ayesha Khan",
  "phone_number": "+923001234567",
  "email": "ayesha@example.com",
  "role": "user",
  "account_status": "active",
  "verification_status": "verified",
  "profile_completion": 80,
  "avatar": "https://...",
  "gender": "female",
  "institute": "LUMS",
  "preferences": { ... },
  "measurement_profile": { ... },
  "created_at": "...",
  "updated_at": "..."
}
```

---

### Update Profile
`PATCH /api/v2/me`

Updates one or more profile fields. All fields optional.

**Body**
```json
{
  "name": "Ayesha K.",
  "avatar": "https://cdn.example.com/avatar.png",
  "gender": "female",
  "institute": "LUMS",
  "preferences": {
    "favorite_categories": ["Dresses"],
    "favorite_brands": ["Khaadi"],
    "preferred_sizes": { "top": "S", "bottom": "M" },
    "color_preferences": ["White", "Beige"],
    "style_preferences": ["Casual"],
    "price_range_min": 500,
    "price_range_max": 5000
  }
}
```

**Response `200`** — updated `User` object.

---

### Update Measurements
`PUT /api/v2/me/measurements`

Replaces the user's body measurement profile used for fit predictions.

**Body**
```json
{
  "height": 165,
  "weight": 55,
  "bust": 86,
  "waist": 68,
  "hip": 94,
  "shoulder": 38,
  "inseam_length": 76,
  "shoe_size": 38,
  "shoe_size_system": "EU",
  "preferred_fit": "regular"
}
```
All fields optional.

**Response `200`** — updated `User` object.

---

### OAuth Sign-In
`POST /api/v2/auth/oauth`

Sign in or register using a Google or Apple ID token. No auth header required.
On first sign-in, a new account is created automatically. If the provider email
matches an existing phone-registered account, the OAuth ID is auto-linked.

**Body**
```json
{
  "provider": "google",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "name": "Ali Malik"
}
```
`provider` required: `"google"` or `"apple"`.
`id_token` required: raw ID token from the provider SDK.
`name` optional: only needed for Apple first sign-in (Apple sends name once client-side).

**Response `200`**
```json
{
  "access_token": "<short_lived_jwt>",
  "refresh_token": "<opaque_refresh_token>",
  "user": { "id": "...", "name": "Ali Malik", "email": "ali@example.com", "google_id": "...", "phone_number": "", ... }
}
```

**Error responses**
| Code | Condition |
|------|-----------|
| `400 BAD_REQUEST` | Unsupported provider, missing required fields |
| `401 UNAUTHORIZED` | Invalid or expired ID token |
| `500 INTERNAL_SERVER_ERROR` | Provider service unavailable (Google 5xx / Apple JWKS 5xx) |

---

### Link OAuth Provider _(auth required)_
`POST /api/v2/me/oauth`

Connects a Google or Apple account to the currently authenticated user.

**Body**
```json
{
  "provider": "google",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response `200`** — updated `User` object with `google_id` or `apple_id` populated.

**Error responses**
| Code | Condition |
|------|-----------|
| `400 BAD_REQUEST` | Unsupported provider, missing required fields |
| `401 UNAUTHORIZED` | Missing/invalid auth token, or invalid provider ID token |
| `409 CONFLICT` | Provider already linked to this account or to a different account |

---

## Error Responses

| Code | Meaning |
|------|---------|
| `400 INVALID_BODY` | Malformed JSON |
| `400 INVALID_PASSWORD` | New password < 8 chars |
| `401 UNAUTHORIZED` | Missing/invalid/expired access token or invalid refresh token |
| `404 NOT_FOUND` | Phone number not registered |
| `409 CONFLICT` | Phone number already registered |
