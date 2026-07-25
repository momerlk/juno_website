---
target: catalog / discovery (CatalogBrowsePage.tsx)
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 3
timestamp: 2026-07-25T02-02-10Z
slug: src-components-catalog-catalogbrowsepage-tsx
---
## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Excellent skeleton->dimmed-grid->append orchestration. "of Y" count meaningless after eager fetch collapses X==Y. |
| 2 | Match System / Real World | 3 | On-voice (Discover, Rs/en-PK). "In stock only" mis-filed under Price. |
| 3 | User Control and Freedom | 2 | Filter chips remove-on-click but no x affordance; empty/error states have no exit. |
| 4 | Consistency and Standards | 2 | 3 card impls + 2 filter impls; live grid card lacks the quick-add the dead card has. |
| 5 | Error Prevention | 3 | Price is draft-then-Go; legacy params stripped. Solid. |
| 6 | Recognition Rather Than Recall | 2 | Gender AND product_group each controlled in two widgets that can desync. |
| 7 | Flexibility and Efficiency | 3 | Recent searches, autocomplete, URL-param shareable filtered views. |
| 8 | Aesthetic and Minimalist | 3 | Confident dark/Montserrat-900 system; docked for 9 filter groups at once. |
| 9 | Error Recovery | 1 | Zero-result = mono "No matches found," no clear-filters, no recs. Error = no retry. |
| 10 | Help and Documentation | n/a | Self-evident browse surface; inline help not expected. |
| Total | | 22/36 | Acceptable (61%) |

## Design Specificity Verdict

The live route renders EditorialProductCard + CatalogSidebar. ProductCard.tsx, CatalogFilters.tsx, CatalogProductGrid.tsx are NOT imported on this route (dead code).

An unrelated store could ship this catalog with a find-and-replace on the accent color. Structurally it's a textbook dark Shopify catalog: sticky search -> left filter sidebar -> responsive grid -> infinite scroll. Nothing in the architecture encodes "brands are the unit of discovery" (Juno's thesis).
- Brand is a checkbox (one filter section). No brand rail/card/founder line; brand_banners/brand_logos (real binding assets) unused.
- Shopper can traverse whole catalog and never see a brand name larger than 9px (EditorialProductCard.tsx:128).
- Default H2 is "All Products" (CatalogBrowsePage.tsx:700).
- Unfiltered surface opens with a full-bleed "download the app" banner (:653-656).
What is Juno-specific lives in chrome/data not IA: #050505 + Montserrat-900 + red/pink; Pakistani vocabulary (Rs, Pakistani Wear, Pre-Loved/One of One, Juno Best Seller). Verdict: generic filter+grid with a strong skin.

Deterministic scan: detector clean ([], exit 0, 0 findings across 6 files, verified real). Detector is blind to IA (checks font/color/gradient anti-patterns only); does not flag arbitrary values (bg-[#0A0A0A]/95, transition-all in CatalogNavbar) - out of scope, not misses.

Visual overlays: none. No browser-automation tool exposed; no overlay produced.

## Overall Impression

Well-engineered, well-skinned, strategically hollow. Loading/refresh code above-tier; visual identity confident/non-generic. But the one page that must prove brand-first curation proves the opposite - a product grid where brand is filter #4. Biggest opportunity: make the brand a first-class discovery object.

## What's Working

1. Loading orchestration genuinely premium: skeleton -> dimmed grid opacity-45 + floating "Updating results" pill -> append spinner, race-guarded by requestIdRef.
2. Color-as-swatches for fashion (CatalogSidebar.tsx:166) with real hex map + gradient fallback for multicolor.
3. Typographic commitment - Montserrat 900 / -0.04em / uppercase, intentional missing-image gradient tiles.

## Priority Issues

[P1] Brand-as-unit-of-discovery is absent - surface contradicts positioning. Brands are a checkbox, binding banner/logo assets unused. Fix: brand-led module on unfiltered surface (Labels to know rail using brand_logos/brand_banners, mirroring CategoryShop); seller_name as prominent tappable card link; replace "All Products" with authored headline. Command: /impeccable bolder.

[P1] Eager full-catalog fetch + redundant infinite scroll = long first valley. loadProducts while(pagination.has_more) (:410) accumulates entire catalog before first render, then also mounts infinite-scroll sentinel. Fix: render page 1 immediately, IntersectionObserver appends rest, delete eager loop. Command: /impeccable optimize.

[P1] Filtered-empty and error states are dead ends. Over-filter -> mono "No matches found" no clear-filters/recs; API error -> no retry (drives H9=1). Fix: empty state gets Clear filters + popular products (getPopularProducts exists); error state gets retry. Command: /impeccable onboard or /impeccable harden.

[P2] Duplicate controls for gender and product_group. Two widgets write same URL param (rail vs sidebar), can desync. Fix: rail = quick pick, remove redundant sidebar Gender section or bind to shared state. Command: /impeccable clarify.

[P2] Pervasive low-contrast small text. count text-white/40@12px, filter meta white/35, chip labels white/60@10px fail WCAG AA on near-black. Fix: floor secondary ~white/60, tertiary white/70; bump 9-10px labels to >=11px. Command: /impeccable audit then /impeccable typeset.

## Persona Red Flags

Casey (one-handed mobile): full-height portrait download banner is entire first screen; no quick-add on grid card (every add is PDP round-trip); Filters/cart/sort top-anchored. Only category rail thumb-friendly.
Riley (stress tester): over-filter -> dead-end empty; gender rail vs sidebar desync; eager fetch stressed by clear-all-filters on big catalog.
Jordan (first-timer): "All Products" + app-download ad + ~5 filtering surfaces; nothing signals curated indie Pakistani labels vs any dark storefront.

## Minor Observations

- No size filter exists (unusual for fashion; legacy sizes stripped, never replaced).
- Infinite scroll has no "end of results" terminus.
- Sort has 8 options; sidebar shows 9 filter groups at once.
- humanizeCatalogValue defined identically in 3 files.
- Sold-out items render in-grid; only hide path is buried in-stock toggle (mis-filed under Price).
- Dead code: ProductCard.tsx, CatalogFilters.tsx, CatalogProductGrid.tsx.

## Questions to Consider

1. If a shopper never touches a filter, what makes this feel like Juno vs any dark Shopify theme beyond one accent color and the word "Discover"?
2. Why is the first element on your flagship discovery surface a button to leave it?
3. Brands are your unit of discovery - so why can a shopper reach every product without seeing a single brand's name/logo/story larger than 9px?
