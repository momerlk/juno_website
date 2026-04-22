# Interactive Order Tracking — Feature Plan

**Date:** 2026-04-22
**Owner:** Commerce + Logistics modules
**Goal:** Replace flat order-status display with a full-screen map + animated timeline that makes order tracking feel alive, even without real-time rider GPS.

---

## 1. Problem & Constraints

- Current `commerce.OrderStatus` is a flat enum: `pending / confirmed / shipped / delivered / cancelled / returned`. It tells the user *what* but not *where*.
- We do **not** have live rider GPS coordinates from courier partners (Bykea, PostEx, Leopards, Trax, CallCourier).
- We **do** have:
  - Seller pickup location (`seller.SellerLocation` — lat/lng + city).
  - Customer delivery location (`location.Address` — lat/lng).
  - Warehouse location — courier-partner city hub; known *only* once courier scans the parcel in.
- Writes must be scoped: admin full access, seller only to their own orders.

---

## 2. Redesigned Status Model

Replace the single flat enum with a **granular milestone timeline** that maps cleanly to what the user/seller/admin actually knows.

### 2.1 New `OrderStatus` values (in `commerce/models.go`)

| Status                  | Set by        | Meaning                                                                            |
|-------------------------|---------------|------------------------------------------------------------------------------------|
| `pending`               | system        | Order placed, awaiting seller                                                      |
| `confirmed`             | seller/admin  | Seller accepted                                                                    |
| `packed`                | seller/admin  | Ready for pickup (fun: unlocks "your parcel is packed" animation)                  |
| `handed_to_rider`       | seller/admin  | Seller released to courier pickup rider                                            |
| `at_warehouse`          | admin         | Courier warehouse scan-in (admin has courier dashboard access)                     |
| `out_for_delivery`      | admin         | Final-leg rider has the parcel                                                     |
| `delivered`             | admin/courier | Customer received                                                                  |
| `delivery_attempted`    | admin         | Rider attempted, will retry (displays nicely, doesn't regress UX)                  |
| `cancelled`             | seller/admin  | Pre-dispatch cancellation                                                          |
| `returned`              | admin         | Post-delivery return                                                               |

Keep legacy values readable via a `LegacyStatusMap` so existing orders don't break. Migration: one-shot script that maps `shipped → at_warehouse` conservatively.

### 2.2 New tracking sub-document on `ParentOrder`

```go
type OrderTracking struct {
    CurrentStatus     OrderStatus        `bson:"current_status"`
    EstimatedDelivery time.Time          `bson:"estimated_delivery,omitempty"`
    Timeline          []TrackingMilestone `bson:"timeline"`
    Anchors           TrackingAnchors    `bson:"anchors"` // fixed map points
}

type TrackingMilestone struct {
    Status     OrderStatus `bson:"status"`
    Label      string      `bson:"label"`         // e.g. "Packed by Zara Closet"
    Note       string      `bson:"note,omitempty"`
    OccurredAt time.Time   `bson:"occurred_at"`
    SetBy      string      `bson:"set_by"`        // user_id of seller/admin
    Location   *GeoPoint   `bson:"location,omitempty"`
}

type TrackingAnchors struct {
    Seller    GeoPoint  `bson:"seller"`
    Warehouse *GeoPoint `bson:"warehouse,omitempty"` // filled at at_warehouse
    Customer  GeoPoint  `bson:"customer"`
}

type GeoPoint struct {
    Lat   float64 `bson:"lat"`
    Lng   float64 `bson:"lng"`
    Label string  `bson:"label,omitempty"` // "Lahore Warehouse"
    City  string  `bson:"city,omitempty"`
}
```

Anchors are captured at checkout (seller + customer) and mutated only when warehouse scan-in happens.

---

## 3. The "Fake-Live" Map UX

Since we have no rider GPS, we simulate progress deterministically so the parcel **appears to move** but never lies.

### 3.1 Route segments

Three fixed polylines (fetched once, cached on the order document):

1. **Seller → Warehouse** — drawn when `handed_to_rider` fires.
2. **Warehouse → Customer** — drawn when `out_for_delivery` fires.
3. **Seller → Customer** (fallback) — for courier partners that skip warehouse.

Polylines fetched via Google **Routes API** (preferred) or legacy Directions API. Encoded polyline string cached on `OrderTracking` to avoid re-billing per open.

### 3.2 Animated parcel position

Client interpolates the parcel marker along the active polyline using:

```
progress = min(0.95, (now - segment_started_at) / expected_duration_for_status)
```

- Capped at `0.95` so the marker never crosses the next anchor before the backend confirms it.
- Snaps to exactly `1.0` when the next milestone fires.
- If status stalls (e.g. 24h at warehouse), a gentle "resting at warehouse" pulse animation plays on the warehouse marker.

Expected durations per status are config-driven (`config/tracking.go`) per courier partner — admins can tune them.

### 3.3 Full-screen map features

- Animated pulsing circle on parcel marker (Lottie or native shimmer).
- Traveled polyline: solid branded gradient. Remaining: dashed light.
- Three persistent markers: seller (store icon), warehouse (depot icon, only after scan-in), customer (home icon, "You").
- Tap parcel → timeline bottom-sheet with all `TrackingMilestone` entries.
- Live ETA countdown computed from `EstimatedDelivery`.
- Confetti + haptic burst on `delivered`.
- "Share tracking" — generates public signed URL `GET /track/{token}` (no auth, read-only, expires after delivery + 30d).

### 3.4 Fun micro-moments

| Status              | Animation                                                            |
|---------------------|----------------------------------------------------------------------|
| `confirmed`         | Store icon waves, checkmark pop                                      |
| `packed`            | Box wraps itself                                                     |
| `handed_to_rider`   | Rider emoji zips off store icon, parcel starts moving                |
| `at_warehouse`      | Parcel "lands" at warehouse, stamp animation                         |
| `out_for_delivery`  | Rider icon picks up parcel, starts final leg                         |
| `delivered`         | Confetti, "Delivered!" banner, CTA to rate                           |
| `delivery_attempted`| Parcel bounces back to warehouse with note card                      |

---

## 4. Google Maps APIs to Enable

Enable these in **Google Cloud Console → APIs & Services → Library** for the Juno GCP project:

1. **Maps SDK for iOS** — required by `react-native-maps` when `provider="google"` on iOS.
2. **Maps SDK for Android** — required by `react-native-maps` on Android (always Google).
3. **Maps JavaScript API** — web (Vite app: customer tracking + seller dashboard + admin ops).
4. **Routes API** — polyline + ETA between anchors (replaces Directions + Distance Matrix; use this one). Server-side only.
5. **Geocoding API** — convert seller/warehouse textual addresses to lat/lng. Server-side only.
6. **Places API (New)** — customer address autocomplete at checkout + admin editing warehouse locations. Called from web + RN via session tokens.
7. **Map Tiles API** *(optional)* — custom styled tiles later.

### 4.1 API key split

| Key                             | Restriction                                                 | Consumers                            |
|---------------------------------|-------------------------------------------------------------|--------------------------------------|
| `GOOGLE_MAPS_IOS_KEY`           | iOS bundle id (`com.juno.app`)                              | react-native-maps iOS                |
| `GOOGLE_MAPS_ANDROID_KEY`       | Android package + SHA-1 (debug + release)                   | react-native-maps Android            |
| `GOOGLE_MAPS_WEB_KEY`           | HTTP referrer (`*.juno.com.pk/*`, localhost:5173 for dev)   | Vite web app, Places autocomplete    |
| `GOOGLE_MAPS_SERVER_KEY`        | IP allowlist (GCP Cloud Run egress)                         | Go API — Routes + Geocoding          |

Go API keeps only `GOOGLE_MAPS_SERVER_KEY` in env (rename existing `GOOGLE_MAPS_API_KEY` → `GOOGLE_MAPS_SERVER_KEY` for clarity; keep old name as fallback during migration).

Quotas day-one: Routes ~20k/day, Geocoding ~5k/day, Places ~10k sessions/day, Maps JS ~50k loads/day. Alert at 80%.

---

## 4a. Client Stack — Expo SDK 55 (RN) + React + Vite

### 4a.1 Mobile (Expo SDK 55, bare-ish managed workflow)

**Deps:**
```json
{
  "react-native-maps": "^1.20.0",
  "@mapbox/polyline": "^1.2.1",
  "expo-haptics": "~14.0.0",
  "lottie-react-native": "^7.0.0",
  "react-native-reanimated": "~3.17.0",
  "expo-location": "~18.0.0"
}
```

**`app.json` config plugin:**
```json
{
  "expo": {
    "ios": { "config": { "googleMapsApiKey": "$GOOGLE_MAPS_IOS_KEY" } },
    "android": { "config": { "googleMaps": { "apiKey": "$GOOGLE_MAPS_ANDROID_KEY" } } },
    "plugins": [
      ["react-native-maps", {}],
      ["expo-location", { "locationAlwaysAndWhenInUsePermission": "Allow Juno to show you on the tracking map." }]
    ]
  }
}
```

Force Google on iOS too: `<MapView provider={PROVIDER_GOOGLE} />` — consistent styling both platforms.

**Animation approach (RN):**
- Decode polyline string with `@mapbox/polyline` → array of `{lat, lng}`.
- Compute cumulative segment lengths once; store in `useMemo`.
- Drive `progress` via `useSharedValue` + `withTiming` (Reanimated 3).
- `useDerivedValue` picks interpolated `LatLng` from polyline; pass to `<Marker.Animated coordinate={...}>` via `AnimatedRegion` or directly via animated prop.
- Cap progress at `0.95` with `Math.min`; snap to `1.0` + spring when backend confirms milestone (via poll or push).
- Confetti: `react-native-reanimated` + emitter, or `lottie-react-native` burst.
- Haptic on `delivered`: `Haptics.notificationAsync(NotificationFeedbackType.Success)`.

**Real-time updates:** poll `GET /orders/{id}/tracking` every 30s while screen focused (cheap — tracking doc is small). No sockets needed for v1. Upgrade to push-triggered refetch via existing notifications deep-link.

### 4a.2 Web (React + Vite)

**Deps:**
```json
{
  "@vis.gl/react-google-maps": "^1.5.0",
  "@mapbox/polyline": "^1.2.1",
  "framer-motion": "^11.0.0",
  "canvas-confetti": "^1.9.0"
}
```

Use `@vis.gl/react-google-maps` (the Google-endorsed successor to `@react-google-maps/api` — cleaner hooks, better `AdvancedMarker` support, tree-shakeable).

**Vite env:**
```
VITE_GOOGLE_MAPS_WEB_KEY=...
VITE_GOOGLE_MAPS_MAP_ID=...   # required for AdvancedMarker
```

Never ship `GOOGLE_MAPS_SERVER_KEY` to the browser. All Routes/Geocoding calls go through Go API.

**Animation approach (web):**
- Same polyline decode.
- `framer-motion` drives `progress` (`useMotionValue` + `useTransform`).
- Render parcel with `<AdvancedMarker>` + custom HTML (easier to animate with CSS/Framer than bitmap markers).
- Pulsing ring: pure CSS `@keyframes`.
- `canvas-confetti` on delivered.
- Dashed remaining polyline: two `<Polyline>` layers, one solid (0→progress), one dashed (progress→1) using `icons` prop with `geodesic`.

### 4a.3 Shared types

Generate from Swagger (`swag init` output) via `openapi-typescript` into a `@juno/api-types` workspace package consumed by both apps. Single source of truth for `OrderTracking`, `TrackingMilestone`, `GeoPoint`, `OrderStatus`.

### 4a.4 Shared polyline/interpolation helper

Extract `decodePolyline(str) → LatLng[]` and `interpolateAlong(points, progress) → LatLng` into `@juno/tracking-core` (pure TS, no RN/web deps). Import from both. Prevents drift between platforms.

---

## 5. API Endpoints

All writes protected by `RequireSellerAuth` OR `RequireAdminAuth`. For seller routes, service layer must verify `order.seller_id == ctx.seller_id` — reject with `apperrors.Forbidden` otherwise.

### 5.1 Seller-scoped (own orders only)

| Method | Path                                         | Purpose                                    |
|--------|----------------------------------------------|--------------------------------------------|
| PATCH  | `/seller/orders/{id}/status`                 | confirm, pack, hand_to_rider, cancel       |
| GET    | `/seller/orders/{id}/tracking`               | read full tracking doc                     |

### 5.2 Admin-scoped (all orders)

| Method | Path                                              | Purpose                                       |
|--------|---------------------------------------------------|-----------------------------------------------|
| PATCH  | `/admin/orders/{id}/status`                       | any status transition                         |
| POST   | `/admin/orders/{id}/tracking/milestone`           | append arbitrary milestone (note, location)   |
| PUT    | `/admin/orders/{id}/tracking/warehouse`           | set warehouse anchor (lat/lng/label/city)     |
| PATCH  | `/admin/orders/{id}/tracking/eta`                 | override ETA                                  |

### 5.3 User-scoped (read)

| Method | Path                               | Purpose                                                 |
|--------|------------------------------------|---------------------------------------------------------|
| GET    | `/orders/{id}/tracking`            | tracking doc + anchors + active polyline                |
| GET    | `/orders/{id}/tracking/polyline`   | encoded polyline for active segment (cached)            |
| GET    | `/track/{token}`                   | public share link, no auth, read-only                   |

### 5.4 Status transition rules

Enforced in service layer with a state machine (`allowedTransitions map[OrderStatus][]OrderStatus`). Illegal transitions return `apperrors.BadRequest("invalid status transition")`. Example: can't go from `pending` directly to `delivered` — forces the fun timeline.

---

## 6. Backend Wiring

### 6.1 Files touched

- `internal/v2/modules/commerce/models.go` — new statuses, `OrderTracking`, `TrackingMilestone`, `GeoPoint`
- `internal/v2/modules/commerce/service.go` — transition state machine, `UpdateOrderStatus`, `AppendMilestone`, `SetWarehouseAnchor`, `GetTracking`; auto-fire notifications per milestone
- `internal/v2/modules/commerce/repository.go` — atomic `$push` to `tracking.timeline`, indexed query by `seller_id + current_status`
- `internal/v2/modules/commerce/handler.go` — new endpoints + swag comments
- `internal/v2/modules/commerce/notifications.go` — per-milestone push templates
- `internal/v2/router/router.go` — register routes under seller + admin + user subrouters
- `internal/v2/modules/logistics/service.go` — bridge: when `DeliveryBooking.Status` changes, call `commerce.AppendMilestone` so logistics partner webhooks flow into tracking UI
- **New:** `internal/v2/modules/commerce/tracking_polyline.go` — thin Google Routes client, polyline cache, ETA compute
- **New:** `internal/v2/modules/commerce/tracking_fsm.go` — allowed transitions map + validator
- `config/config.go` — `GOOGLE_MAPS_SERVER_KEY`, `TRACKING_CACHE_TTL`

### 6.2 Share-link tokens

`POST /orders/{id}/tracking/share` issues a signed token (JWT with `order_id`, `exp`, aud=`tracking-share`). `GET /track/{token}` validates and returns the same shape as authenticated tracking but without PII (mask customer phone/email).

### 6.3 Notifications

Hook into existing notifications module. One push per major status change:

- `confirmed`: "🎉 {seller_name} confirmed your order"
- `handed_to_rider`: "📦 Your parcel is on the move — tap to watch it live"
- `at_warehouse`: "🏭 Arrived at {city} warehouse"
- `out_for_delivery`: "🛵 Rider is bringing it to you — ETA {eta}"
- `delivered`: "✅ Delivered! Tap to rate"

All push deep-link to the tracking map screen.

---

## 7. Phased Rollout

### Phase 1 — Backend foundation (week 1)
- [ ] New statuses + `OrderTracking` struct + repo updates
- [ ] Transition state machine
- [ ] Seller + admin status-update endpoints
- [ ] Migration script for existing orders
- [ ] Unit tests for FSM + ownership checks

### Phase 2 — Geo + polyline (week 1-2)
- [ ] Google Routes API client (server-side)
- [ ] Polyline caching on order document
- [ ] Geocoding fallback for sellers missing lat/lng
- [ ] Admin warehouse-anchor endpoint
- [ ] ETA computation

### Phase 3 — User-facing tracking API (week 2)
- [ ] `GET /orders/{id}/tracking` + polyline endpoint
- [ ] Share-link tokens + `/track/{token}` public route
- [ ] Swagger docs + module `docs.md` + `postman.md`

### Phase 4 — Client map UI (week 2-3, client team)
- [ ] Full-screen map screen with three anchors
- [ ] Animated parcel marker with interpolation
- [ ] Timeline bottom-sheet
- [ ] Per-status Lottie animations
- [ ] Confetti + haptics on delivered
- [ ] Share-sheet integration

### Phase 5 — Courier webhook bridge (week 3)
- [ ] Map logistics `BookingStatus` → commerce milestones
- [ ] Auto-append milestone on webhook from Bykea/PostEx/etc.

### Phase 6 — Observability (week 3)
- [ ] Probe events: `tracking.viewed`, `tracking.shared`, `tracking.milestone_set`
- [ ] Dashboard: avg time-per-status, stuck-at-warehouse alerts

---

## 8. Open Questions

1. Should `delivery_attempted` auto-revert the parcel marker to warehouse on the map, or hold position? (Leaning: hold + show dashed line back to warehouse.)
2. Do we want per-seller custom map markers (their logo)? Nice polish; +1 Maps SDK cost.
3. Share links: expire at delivery + 30d or delivery + 7d? (Leaning: 30d for reorder/reference.)
4. Warehouse anchors: per-courier static list, or admin-set per order? Static list is cheaper (no Geocoding call per order) but less accurate if courier uses multiple hubs per city.
