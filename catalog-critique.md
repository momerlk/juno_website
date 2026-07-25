# Critique — `/catalog` Discovery Surface

**Target:** `src/components/catalog/CatalogBrowsePage.tsx` (route `/catalog`)
**Date:** 2026-07-25
**Method:** dual-agent (A: design review · B: detector + browser evidence)
**Score:** 22/36 — Acceptable (61%)

> Note: the live route renders **`EditorialProductCard` + `CatalogSidebar`**. `ProductCard.tsx`, `CatalogFilters.tsx`, and `CatalogProductGrid.tsx` are **not imported on this route** — dead code. All judgments below are on what actually renders.

---

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Excellent skeleton→dimmed-grid→append orchestration. "of Y" count meaningless after eager fetch collapses X==Y. |
| 2 | Match System / Real World | 3 | On-voice ("Discover", Rs/en-PK). "In stock only" mis-filed under Price. |
| 3 | User Control and Freedom | 2 | Filter chips remove-on-click but no × affordance; empty/error states have no exit. |
| 4 | Consistency and Standards | 2 | 3 card impls + 2 filter impls; live grid card lacks the quick-add the dead card has. |
| 5 | Error Prevention | 3 | Price is draft-then-"Go"; legacy params stripped. Solid. |
| 6 | Recognition Rather Than Recall | 2 | Gender **and** product_group each controlled in two widgets that can desync. |
| 7 | Flexibility and Efficiency | 3 | Recent searches, autocomplete, URL-param shareable filtered views. |
| 8 | Aesthetic and Minimalist | 3 | Confident dark/Montserrat-900 system; docked for 9 filter groups at once. |
| 9 | Error Recovery | 1 | Zero-result = mono "No matches found," no clear-filters, no recs. Error = no retry. |
| 10 | Help and Documentation | n/a | Self-evident browse surface; inline help not expected. |
| **Total** | | **22/36** | **Acceptable (61%)** |

---

## Design Specificity Verdict — the headline finding

**LLM assessment:** An unrelated store could ship this catalog with a find-and-replace on the accent color. Structurally it's a textbook dark Shopify catalog: sticky search → left filter sidebar → responsive grid → infinite scroll. **Nothing in the architecture encodes "brands are the unit of discovery"** — Juno's entire thesis.

- The brand is a **checkbox** (one filter section). No brand rail, no brand card, no founder line — `brand_banners`/`brand_logos` (real, binding assets) go completely unused.
- A shopper can traverse the whole catalog and **never see a brand name rendered larger than 9px** (`EditorialProductCard.tsx:128`).
- The default H2 is **"All Products"** (`CatalogBrowsePage.tsx:700`) — the most generic string possible for "a movement, not a listings directory."
- The unfiltered surface **opens with a full-bleed "download the app" banner** (`:653-656`).

What *is* Juno-specific lives in the chrome and data, not the IA: cohesive `#050505` + Montserrat-900 + red/pink, and real Pakistani commerce vocabulary (Rs, "Pakistani Wear", "Pre-Loved/One of One", "Juno Best Seller"). **Verdict: generic filter+grid with a strong skin.**

**Deterministic scan:** detector ran clean — `[]`, exit 0, 0 findings across all 6 files, verified real (not a silent no-op). The detector is **blind to this critique's biggest problem** — it checks font/color/gradient anti-patterns, not information architecture. It also doesn't flag arbitrary values (`bg-[#0A0A0A]/95`, `transition-all` in `CatalogNavbar`) — out of scope, not misses.

**Visual overlays:** none. No browser-automation tool exposed (WebFetch is HTTP-only, not a renderer), so no overlay was produced — no screenshots fabricated.

---

## Overall Impression

Well-engineered, well-skinned, strategically hollow. The loading/refresh code is genuinely above-tier; the visual identity is confident and non-generic. But the one page that must *prove* brand-first curation instead proves the opposite — it's a product grid where the brand is filter #4. Biggest opportunity: make the brand a first-class discovery object on this surface.

---

## What's Working

1. **Loading orchestration is genuinely premium.** Skeleton → dimmed grid (`opacity-45`) + floating "Updating results" pill → append spinner, all race-guarded by `requestIdRef` so stale responses can't flicker in. Above most catalogs' tier.
2. **Color-as-swatches for fashion** (`CatalogSidebar.tsx:166`) with real hex map + gradient fallback for "multicolor" — context-specific, on-brand, faster to scan than checkboxes.
3. **Typographic commitment** — Montserrat 900 / `-0.04em` / uppercase, missing-image gradient tiles that read as intentional.

---

## Priority Issues

### [P1] Brand-as-unit-of-discovery is absent — the surface contradicts the positioning
**Why:** your whole thesis is brand/founder as the discovery primitive; here brands are a checkbox and the binding banner/logo assets go unused. You built a listings directory while claiming not to be one.
**Fix:** add a brand-led module on the unfiltered surface (a "Labels to know" rail using `brand_logos`/`brand_banners`, mirroring the existing `CategoryShop` pattern); make `seller_name` a prominent tappable link on the card; replace "All Products" with an authored curated headline.
**Command:** `/impeccable bolder`

### [P1] Eager full-catalog fetch + redundant infinite scroll = long first valley
**Why:** `loadProducts` runs `while (pagination.has_more)` (`:410`) accumulating the *entire* catalog before first render, then *also* mounts an infinite-scroll sentinel. Large catalog = long skeleton hold + huge DOM pop + wasted bandwidth.
**Fix:** render page 1 immediately, let the existing IntersectionObserver append the rest. Delete the eager loop — smaller diff *and* faster.
**Command:** `/impeccable optimize`

### [P1] Filtered-empty and error states are dead ends
**Why:** over-filter → mono "No matches found," no clear-filters, no fallback recs; API error → no retry. Highest-friction moments, zero recovery. (Drives H9=1.)
**Fix:** empty state gets a "Clear filters" button + popular products (you already have `getPopularProducts`); error state gets a retry calling `loadProducts(false)`.
**Command:** `/impeccable onboard` or `/impeccable harden`

### [P2] Duplicate controls for gender and product_group
**Why:** two widgets write the same URL param (rail toggle vs. sidebar section) — force recall, can desync visually.
**Fix:** rail = quick pick; remove the redundant sidebar Gender section, or bind both to one shared state. One control per param.
**Command:** `/impeccable clarify` or `/impeccable layout`

### [P2] Pervasive low-contrast small text
**Why:** count label `text-white/40`@12px, filter meta `white/35`, chip labels `white/60`@10px fail WCAG AA on near-black. Hurts Casey in daylight.
**Fix:** floor secondary at ~`white/60`, tertiary at `white/70`; bump 9–10px labels to ≥11px.
**Command:** `/impeccable audit` (a11y) then `/impeccable typeset`

---

## Persona Red Flags

**Casey (one-handed mobile):** full-height portrait download banner is the entire first screen before any product; **no quick-add on the grid card** — every add is a PDP round-trip; Filters/cart/sort all top-anchored (hard-to-reach zone). Only the category rail is thumb-friendly.

**Riley (stress tester):** over-filter → dead-end empty state; gender rail vs. sidebar can desync; eager full-catalog fetch is exactly what "clear all filters on a big catalog" stresses.

**Jordan (first-timer):** lands on "All Products" + an app-download ad + ~5 filtering surfaces. **Nothing** signals this is curated indie Pakistani labels vs. any dark storefront. The "movement" promise is entirely absent from the page meant to prove it.

---

## Minor Observations

- **No size filter exists** — unusual for fashion; legacy `sizes` param is stripped but never replaced.
- Infinite scroll has no "end of results" terminus — silently stops.
- Sort has 8 options; sidebar shows 9 filter groups at once.
- `humanizeCatalogValue` defined identically in 3 files.
- Sold-out items render in-grid; only hide path is the buried in-stock toggle (mis-filed under Price).
- Dead code: `ProductCard.tsx`, `CatalogFilters.tsx`, `CatalogProductGrid.tsx` — decide and delete.

---

## Questions to Consider

1. If a shopper never touches a filter, what makes this feel like *Juno* and not any dark Shopify theme — beyond one accent color and the word "Discover"?
2. Why is the first element on your flagship discovery surface a button to *leave* it?
3. Brands are your unit of discovery — so why can a shopper reach every product without seeing a single brand's name, logo, or story larger than 9px?

---

## Recommended Action Plan

Scope chosen: **all three P1s**. App-download banner **stays as-is** — brand-first work adds a module elsewhere on the surface, does not touch the banner.

1. **`/impeccable bolder`** — Brand-first discovery (P1): brand rail + tappable `seller_name` + authored headline. Banner untouched.
2. **`/impeccable optimize`** — Perf (P1): delete eager loop, render page 1, append on scroll.
3. **`/impeccable onboard`** — Dead-end states (P1): clear-filters + recs on empty, retry on error, end-of-results terminus.
4. **`/impeccable polish`** — Fold in P2s (duplicate controls, low-contrast text) + minors (dead-code deletion, "In stock only" placement).
