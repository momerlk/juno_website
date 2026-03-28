# Seller Onboarding — Backend Requirements

**Date:** 2026-03-28
**Module:** `seller`, `admin`
**Priority:** High — blocks frontend onboarding redesign
**Author:** Frontend Team (Juno Website)

---

## Context

The seller onboarding experience is being redesigned from a transactional registration form into a "joining a movement" experience. This requires several backend changes to support the new flow:

1. Post-approval welcome email with Juno's mission and buyer profile
2. Onboarding status visibility for sellers in the `pending` state
3. Draft registration to prevent data loss during the multi-step form
4. Schema alignment between what the frontend collects and what the API accepts

### Current Flow (broken)
```
Register (all-or-nothing) → alert("check email") → redirect to /auth → seller has no visibility
```

### Target Flow
```
Register (with draft saves) → Pending Dashboard (polls status) → Admin approves →
Welcome email fires → First login → Guided welcome experience → Dashboard
```

---

## 1. Welcome Email on Seller Approval

**Module:** `admin` (trigger), `seller` (template context)
**Endpoint:** `PUT /api/v2/admin/sellers/{id}/approve` (existing — enhance)

### Requirement

When an admin approves a seller (`approved: true`), the backend must automatically send a rich welcome email to the seller's registered email address. This is not a verification email — it's a brand onboarding email.

### Email Content Requirements

The welcome email should contain:

| Section | Content |
|---------|---------|
| **Subject line** | "Welcome to Juno — Pakistan's Home for Indie Brands" |
| **Why Juno exists** | Brief mission statement: curated marketplace for Pakistan's independent labels, not another generic e-commerce platform |
| **Who buys on Juno** | Buyer demographic profile: young (18-30), urban, fashion-conscious Pakistanis who seek original designers over mass-market brands |
| **What makes Juno different from Instagram** | Discovery-first (brands are showcased, not buried in algorithms), built-in logistics, trust & payments handled, community of indie brands |
| **Next steps** | Link to log into Juno Studio, how to list their first product, link to connect Shopify (if applicable) |
| **Support contact** | Direct contact for seller support questions |

### Request Body (existing, no changes needed)
```json
{
  "approved": true,
  "note": "KYC verified"
}
```

### Expected Behavior
- When `approved: true` → set seller status to `active` AND send welcome email
- When `approved: false` → set seller status to `suspended`, send rejection/suspension email with reason from `note`
- Email should be sent asynchronously (don't block the API response)
- Email delivery failures should be logged but not cause the approval to fail

### Response (existing, no changes)
```json
{ "message": "Seller approved" }
```

### Optional Enhancement
Add a field to the response confirming email was queued:
```json
{ "message": "Seller approved", "welcome_email_queued": true }
```

---

## 2. Seller Onboarding Status Endpoint

**Module:** `seller`
**Endpoint:** `GET /api/v2/seller/onboarding/status` (new)
**Auth:** Seller token required (works for `pending` sellers too)

### Requirement

Sellers in `pending` status currently have zero visibility into their application. This endpoint lets the frontend show a "Pending Dashboard" with real-time status.

### Response `200`
```json
{
  "status": "pending",
  "steps_completed": {
    "registration": true,
    "kyc_submitted": true,
    "kyc_verified": false,
    "bank_verified": false,
    "approved": false
  },
  "submitted_at": "2026-03-28T14:30:00Z",
  "estimated_review_hours": 48,
  "rejection_reason": null,
  "next_action": "Your application is under review. We'll email you within 48 hours.",
  "can_edit_profile": true
}
```

### Status Values

| `status` | Meaning |
|----------|---------|
| `pending` | Registration complete, awaiting admin review |
| `under_review` | Admin has started reviewing (optional, if you want granularity) |
| `approved` | Seller is active — redirect to dashboard |
| `rejected` | Application rejected — show `rejection_reason` |
| `suspended` | Previously active seller has been suspended |

### `steps_completed` Fields

| Field | How it's determined |
|-------|-------------------|
| `registration` | Always `true` if the seller record exists |
| `kyc_submitted` | `true` if `kyc_documents.cnic_front` AND `kyc_documents.cnic_back` are non-null |
| `kyc_verified` | `true` if admin has verified KYC documents (needs internal flag) |
| `bank_verified` | `true` if admin has verified bank details (needs internal flag) |
| `approved` | `true` if seller status is `active` |

### `can_edit_profile`
- `true` while status is `pending` — allows the seller to update their profile before approval
- `false` once approved (profile changes go through normal `PATCH /seller/profile`)

### Error Responses
| Code | Condition |
|------|-----------|
| `401` | Missing or invalid seller token |

### Notes
- This endpoint must work for sellers in ALL statuses (pending, active, suspended, rejected)
- The `estimated_review_hours` can be a configurable constant (default 48)
- `rejection_reason` is populated from the `note` field when admin sets `approved: false`

---

## 3. Draft Registration (Save & Resume)

**Module:** `seller`
**Endpoints:** 2 new endpoints

### Requirement

The onboarding form has 7 steps. Currently it's all-or-nothing — if the user closes the browser at step 5, everything is lost. This kills conversion. We need the ability to save partial progress and resume.

### 3a. Save Draft

`POST /api/v2/seller/auth/register/draft`

**Auth:** None (pre-registration)

**Request Body**
```json
{
  "email": "ahmed@mybrand.pk",
  "step": 3,
  "draft_data": {
    "email": "ahmed@mybrand.pk",
    "business_name": "Raza Fabrics",
    "legal_name": "Raza Textiles Pvt Ltd",
    "description": "Premium lawn and silk fabrics...",
    "short_description": "Lahore's finest fabric house",
    "contact": {
      "contact_person_name": "Ahmed Raza",
      "phone_number": "+923001234567"
    },
    "location": {
      "address": "12 Main Gulberg",
      "city": "Lahore",
      "state": "Punjab",
      "postal_code": "54000",
      "country": "Pakistan"
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Used as the unique key for the draft |
| `step` | int | yes | The last completed step (0-indexed) |
| `draft_data` | object | yes | Partial form data — any subset of the full registration payload |

**Response `200`**
```json
{
  "message": "Draft saved",
  "draft_id": "uuid",
  "step": 3,
  "updated_at": "2026-03-28T14:30:00Z"
}
```

**Response `409`** — if email is already registered (not a draft, a full account)
```json
{ "error": "Email already registered. Please log in." }
```

**Behavior:**
- Upserts by email — if a draft exists for this email, overwrite it
- Drafts expire after 7 days (configurable)
- No password should be stored in draft — password is only captured on final submission
- `draft_data` should NOT contain `password` or `confirmPassword` — strip these if sent

### 3b. Resume Draft

`GET /api/v2/seller/auth/register/draft`

**Auth:** None (pre-registration)

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | The email to look up |

**Response `200`**
```json
{
  "draft_id": "uuid",
  "email": "ahmed@mybrand.pk",
  "step": 3,
  "draft_data": { ... },
  "created_at": "2026-03-28T12:00:00Z",
  "updated_at": "2026-03-28T14:30:00Z",
  "expires_at": "2026-04-04T12:00:00Z"
}
```

**Response `404`** — no draft found for this email
```json
{ "error": "No draft found for this email" }
```

### Security Considerations
- Drafts should NOT store passwords
- Rate-limit draft creation/lookup to prevent email enumeration
- Draft data may contain uploaded file URLs (CNIC, logo) — these should still be valid when resumed
- Consider requiring an email verification code before returning draft data (prevents enumeration)

---

## 4. Register Endpoint — Schema Alignment

**Module:** `seller`
**Endpoint:** `POST /api/v2/seller/auth/register` (existing — verify/extend)

### Requirement

The frontend collects fields that may or may not be accepted by the register endpoint. Please confirm or add support for these fields:

### Fields to Confirm/Add

| Field | Currently in API docs? | Frontend sends it? | Action needed |
|-------|----------------------|-------------------|---------------|
| `description` | No | Yes | **Add to register** — brand description for the storefront |
| `short_description` | No | Yes | **Add to register** — tagline/one-liner for cards and previews |
| `logo_url` | No (only on PATCH profile) | Yes | **Add to register** — so logo is set from day one |
| `banner_url` | No | Yes | **Add to register** — store banner image |
| `banner_mobile_url` | No | Yes | **Add to register** — mobile-optimized banner |
| `contact.support_email` | Yes | Yes | Confirmed |
| `contact.alternate_phone_number` | Yes | Yes | Confirmed |
| `contact.whatsapp` | Yes | Yes | Confirmed |
| `contact.business_hours` | No | Yes | **Add to register** |
| `location.latitude` | Yes | Yes | Confirmed |
| `location.longitude` | Yes | Yes | Confirmed |
| `location.neighborhood` | No | Yes | **Add to register** |
| `location.store_directions` | No | Yes | **Add to register** |
| `location.pickup_available` | No | Yes | **Add to register** |
| `location.pickup_hours` | No | Yes | **Add to register** |
| `business_details.number_of_employees` | No | Yes | **Add to register** |
| `business_details.business_subcategory` | Yes | Yes | Confirmed |
| `business_details.founded_year` | Yes | Yes | Confirmed |
| `bank_details.branch_code` | No | Yes | **Add to register** |
| `bank_details.branch_address` | No | Yes | **Add to register** |
| `bank_details.swift_code` | No | Yes | **Add to register** |
| `bank_details.payment_schedule` | No | Yes | **Add to register** |
| `bank_details.payment_threshold` | No | Yes | **Add to register** |

### Fields the Frontend Sends That Should Be Ignored

These are UI-only fields that the frontend currently sends via `JSON.stringify(formData)`. The backend should either ignore them or the frontend will strip them before sending (frontend fix in progress):

- `formErrors` — validation state object
- `confirmPassword` — UI-only password confirmation
- `contract_agreed` — UI-only checkbox state
- `status` — should be set by backend, not client
- `verified` — should be set by backend, not client
- `shipping_settings` — not collected during registration (post-approval setup)
- `return_policy` — not collected during registration (post-approval setup)
- `categories` — not collected during registration
- `tags` — not collected during registration

**Recommendation:** The backend should strip/ignore unknown fields rather than returning `400`. This prevents frontend changes from breaking registration.

---

## 5. Rejection Email on Seller Suspension

**Module:** `admin`
**Endpoint:** `PUT /api/v2/admin/sellers/{id}/approve` (existing — enhance)

### Requirement

When an admin rejects a seller (`approved: false`), a rejection email should be sent with the reason.

### Email Content Requirements

| Section | Content |
|---------|---------|
| **Subject line** | "Update on your Juno application" |
| **Reason** | The `note` field from the admin request, presented professionally |
| **Next steps** | What the seller can do to fix the issue (e.g., resubmit KYC, update bank details) |
| **Support contact** | How to reach the Juno team for questions |
| **Reapply link** | Link to update their profile and resubmit (if `can_edit_profile` is true) |

### Expected Behavior
- When `approved: false` and `note` is provided → send rejection email with the note as the reason
- When `approved: false` and `note` is empty → send generic "application not approved at this time" email
- Store `note` as `rejection_reason` on the seller record (used by `GET /seller/onboarding/status`)

---

## 6. Seller Profile Edit While Pending

**Module:** `seller`
**Endpoint:** `PATCH /api/v2/seller/profile` (existing — extend behavior)

### Requirement

Currently, it's unclear whether `pending` sellers can update their profile. They should be able to — for example, to fix a blurry CNIC upload or correct their bank details before approval.

### Expected Behavior
- `pending` sellers CAN use `PATCH /seller/profile` to update any field
- `suspended` sellers can update profile fields to address rejection feedback
- All profile fields from the registration schema should be updatable via PATCH (not just `name`, `business_name`, `logo_url`, `website` as currently documented)

### Fields to Add to PATCH /seller/profile

The current PATCH only accepts:
```json
{ "name", "business_name", "website", "logo_url" }
```

It should also accept:
```json
{
  "legal_name": "...",
  "description": "...",
  "short_description": "...",
  "banner_url": "...",
  "banner_mobile_url": "...",
  "contact": { ... },
  "location": { ... },
  "business_details": { ... },
  "kyc_documents": { ... },
  "bank_details": { ... }
}
```

All fields optional — only provided fields are updated (PATCH semantics).

---

## Summary of All Changes

### New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v2/seller/onboarding/status` | Seller token | Returns onboarding progress and application status |
| `POST` | `/api/v2/seller/auth/register/draft` | None | Saves partial registration progress |
| `GET` | `/api/v2/seller/auth/register/draft?email=...` | None | Retrieves saved draft by email |

### Modified Endpoints

| Method | Path | Change |
|--------|------|--------|
| `PUT` | `/api/v2/admin/sellers/{id}/approve` | Add welcome email trigger (approve) and rejection email trigger (suspend) |
| `POST` | `/api/v2/seller/auth/register` | Accept additional fields: `description`, `short_description`, `logo_url`, `banner_url`, `banner_mobile_url`, extended `contact`/`location`/`bank_details` fields. Ignore unknown UI fields. |
| `PATCH` | `/api/v2/seller/profile` | Accept all registration fields (not just the current 4). Allow `pending`/`suspended` sellers to edit. |

### New Internal Fields (Seller Model)

| Field | Type | Description |
|-------|------|-------------|
| `rejection_reason` | string (nullable) | Populated from `note` when admin rejects. Cleared on re-approval. |
| `kyc_verified` | bool | Internal flag set by admin during review |
| `bank_verified` | bool | Internal flag set by admin during review |

### New Database Table

| Table | Fields | Description |
|-------|--------|-------------|
| `seller_registration_drafts` | `id`, `email`, `step`, `draft_data` (JSONB), `created_at`, `updated_at`, `expires_at` | Stores partial registration progress. TTL: 7 days. |

---

## Implementation Priority

1. **Welcome email on approval** — highest impact, enables the "joining a movement" experience
2. **Onboarding status endpoint** — unblocks the pending dashboard UI
3. **Register schema alignment** — prevents silent data loss on registration
4. **PATCH profile for pending sellers** — lets sellers fix issues before approval
5. **Draft registration** — conversion optimization, can ship after initial launch
6. **Rejection email** — important but lower urgency than approval flow
