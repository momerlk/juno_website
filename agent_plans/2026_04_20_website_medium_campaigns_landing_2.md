# 2026_04_20 Website Medium — Campaign Landing Pages (Plan 2 of 2)

## 1. Objective

Build isolated, SEO-friendly campaign landing pages on the Juno website. Each active campaign is reachable at `juno.com.pk/{slug}-campaign` and renders only products pre-selected for that campaign. Direct-to-product deep links `juno.com.pk/{slug}-campaign/{product_id}` render a product page scoped to the campaign. The global `/catalog` route must NOT be reachable from inside a campaign — all nav/logo clicks stay within the campaign view.

## 2. Surface

Website

## 3. Scale

Medium (Plan 2 of 2). Depends on Plan 1 API endpoints.

## 4. Scope

### Included
- Two new routes: `/{slug}-campaign` and `/{slug}-campaign/{product_id}`.
- A `CampaignLayout` component providing the isolated header/footer.
- Fetch logic that calls the public campaign API endpoints.
- Conditional nav: inside campaign scope, logo links to `/{slug}-campaign`, not `/`.
- 404 fallback for inactive or missing campaign.

### Not included
- API work (covered by Plan 1).
- Checkout flow changes — reuse existing checkout. Only the product CTA is campaign-aware.
- Admin dashboard changes.
- A/B testing, variant experiments.
- Mobile app.

## 5. Assumptions

- Website is a Next.js 14 App Router project in `/Users/omeralimalik/Documents/work/projects/juno_website` (adjust to actual path if different — search for `app/` directory).
- Existing API client lives at `lib/api.ts` or `src/lib/api.ts` with a base URL env var `NEXT_PUBLIC_API_BASE_URL`.
- Existing global `Header`, `Footer`, `ProductCard`, `ProductDetail` components. Reuse them.
- Tailwind CSS is in use.
- Required API endpoints from Plan 1 exist and follow the contract defined below.

### Dependencies
Requires (from Plan 1):
- `GET /api/v2/campaigns/slug/{slug}`
- `GET /api/v2/campaigns/slug/{slug}/products/{product_id}`

## 6. Step-by-Step Implementation

### Step 1 — API client helpers

File: `lib/api/campaigns.ts` (create).

```
export type PublicCampaign = {
  campaign: { id: string; slug: string; name: string; landing: any; status: string; };
  products: Array<{ id: string; name: string; price: number; image_url?: string; [k: string]: any }>;
  metrics: Record<string, number>;
};

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function fetchCampaignBySlug(slug: string): Promise<PublicCampaign | null> {
  const res = await fetch(`${BASE}/api/v2/campaigns/slug/${slug}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Campaign fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchCampaignProduct(slug: string, productId: string) {
  const res = await fetch(`${BASE}/api/v2/campaigns/slug/${slug}/products/${productId}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Campaign product fetch failed: ${res.status}`);
  return res.json();
}
```

### Step 2 — Route matcher for `{slug}-campaign`

Create catch-all route with a dynamic segment that enforces the `-campaign` suffix.

File: `app/[campaignSlug]/page.tsx` (create).

Logic:
- Route param `campaignSlug` comes in as e.g. `eid-drop-campaign`.
- If it does NOT end with `-campaign` → call `notFound()`.
- Strip the suffix: `const slug = campaignSlug.replace(/-campaign$/, "")`.
- Call `fetchCampaignBySlug(slug)`. If null → `notFound()`.
- Render `<CampaignLayout campaign={data.campaign}>` with `<CampaignProductGrid products={data.products} slug={slug} />`.

File: `app/[campaignSlug]/[productId]/page.tsx` (create).

Logic:
- Same suffix check on `campaignSlug`. Else `notFound()`.
- Call `fetchCampaignProduct(slug, productId)`. If null → `notFound()`.
- Render `<CampaignLayout campaign={data.campaign}>` with `<ProductDetail product={data.product} />` + a campaign-scoped "Add to Cart" CTA.

Add `export const dynamic = "force-dynamic"` only if `next.revalidate` is not acceptable; default to ISR as in Step 1.

### Step 3 — `CampaignLayout` component

File: `components/campaign/CampaignLayout.tsx` (create).

Purpose: isolated header/footer for campaign pages.

Behavior:
- Renders a header with the Juno logo; logo links to `/{slug}-campaign` (pulled from `campaign.slug`), NOT `/`.
- No main-nav links (no "Shop", "Catalog", "Brands", etc.).
- Renders campaign `landing.hero_image_url`, `headline`, `subheadline` if present.
- Footer keeps only legal links (Privacy, Terms, Contact) — no catalog links.

Props:
```
type Props = {
  campaign: { id: string; slug: string; name: string; landing: any };
  children: React.ReactNode;
};
```

### Step 4 — `CampaignProductGrid`

File: `components/campaign/CampaignProductGrid.tsx` (create).

Renders a responsive grid of product cards. Each card links to `/{slug}-campaign/{product.id}` (NOT `/product/{id}`).

```
type Props = {
  slug: string;
  products: Array<{ id: string; name: string; price: number; image_url?: string }>;
};
```

Empty state: if `products.length === 0` render centered text `"No products in this campaign yet."`.

### Step 5 — Campaign-scoped product CTA

In `app/[campaignSlug]/[productId]/page.tsx`:
- Reuse existing `<ProductDetail />` but override the "Add to Cart" CTA to pass `source: "campaign:{slug}"` as metadata so existing checkout analytics/attribution capture this.
- If the existing cart/add-to-cart hook accepts a `utm` or `source` arg, pass the campaign slug. If not, wrap `onClick` with a call to `window.sessionStorage.setItem("campaign_source", slug)` before delegating.

### Step 6 — Block `/catalog` navigation from campaign scope

Mechanism: client-side guard, not global routing.

- `CampaignLayout` sets a React context `CampaignScopeContext` with `{ slug }`.
- Create `components/campaign/CampaignLink.tsx` — a wrapper around `next/link` that checks this context: if active and target starts with `/catalog` or `/` (root), rewrite target to `/{slug}-campaign`.
- Do NOT edit the global header/footer — just make sure `CampaignLayout` does not render them.

### Step 7 — `not-found.tsx` for campaign routes

File: `app/[campaignSlug]/not-found.tsx` (create).

Renders centered copy: `"This campaign has ended or does not exist."` with a single button linking to `/` (plain root catalog — this is outside the campaign scope, so normal nav is fine).

### Step 8 — Local run + smoke test

```
npm run dev
```

Open `http://localhost:3000/eid-drop-campaign` and verify the manual test checklist in §11.

## 7. Exact Logic Specification

- Slug validation: route matches only if URL segment ends with `-campaign`. Otherwise 404 via `notFound()`.
- Product page validation: the product MUST be returned by the API (API enforces product-in-campaign); frontend never loads products from the global catalog for campaign routes.
- Navigation guard: any in-app link beginning with `/catalog` or `/` while inside `CampaignLayout` is rewritten to `/{slug}-campaign`.
- SEO: set `<title>` to `{campaign.name} | Juno` and `<meta name="robots" content="index,follow">` on active campaign pages.
- Page revalidation: ISR 60 seconds (`next: { revalidate: 60 }`).

## 8. API Contract Reference

API used:
- `GET /api/v2/campaigns/slug/{slug}`
- `GET /api/v2/campaigns/slug/{slug}/products/{product_id}`

See Plan 1 (§8) for exact request/response shapes.

## 9. UI Specification

### `/{slug}-campaign` (grid page)

- Header: Juno logo left-aligned, click → `/{slug}-campaign`. No other nav links.
- Hero section: full-width image (`landing.hero_image_url`), overlaid headline + subheadline centered. If no image, render headline on a flat brand-color background.
- Product grid: 2 columns on mobile, 3 on tablet, 4 on desktop. Each card shows image, name, price. Click → product page within campaign.
- Footer: Privacy, Terms, Contact only.
- Empty state: centered copy `"No products in this campaign yet."`.

### `/{slug}-campaign/{product_id}` (product page)

- Same `CampaignLayout`.
- Image gallery left, product info right (desktop) or stacked (mobile).
- "Add to Cart" button — on click: call existing cart hook with `{ productId, source: "campaign:" + slug }`. Show toast `"Added to cart"` on success; show toast with error message on failure.
- Back link: `"← Back to {campaign.name}"` → `/{slug}-campaign`.

### 404 page

- Centered copy `"This campaign has ended or does not exist."`.
- Single CTA button `"Go to Juno"` → `/`.

## 10. Edge Cases

- URL segment missing `-campaign` suffix → 404.
- API returns 404 (inactive/missing campaign) → render `not-found.tsx`.
- API 5xx → render an inline error banner: `"Something went wrong. Please try again."` with retry button.
- Empty products array → empty-state copy; page still renders (do NOT 404).
- Deep link to product not in campaign → 404 (handled by API).
- User manually types `/catalog` → goes to global catalog (that is acceptable — the isolation rule covers in-app nav only).

## 11. Testing Instructions

Pre-reqs: Plan 1 deployed; an active campaign exists with slug `eid-drop` and at least one product.

Manual steps:
- Open `http://localhost:3000/eid-drop-campaign` → hero, grid, products appear. No global nav.
- Click Juno logo → URL stays `/eid-drop-campaign`.
- Click a product card → URL becomes `/eid-drop-campaign/{product_id}`, product page renders inside `CampaignLayout`.
- Click "Add to Cart" → toast appears, cart count increments.
- Go to `http://localhost:3000/eid-drop-campaign/not-a-real-id` → 404 page appears.
- Go to `http://localhost:3000/does-not-exist-campaign` → 404 page appears.
- Go to `http://localhost:3000/eid-drop` (no `-campaign` suffix) → 404 page appears.
- Change campaign status to `paused` in admin, refresh the page → 404 page appears.
- Open network tab: only `/api/v2/campaigns/slug/...` endpoints are called for product data (no calls to `/api/v2/catalog/...`).

## 12. Definition of Done

- All manual checks in §11 pass.
- `npm run build` completes with zero errors.
- Lighthouse performance score ≥ 80 on the grid page.
- No console errors on any campaign route.
- No regressions on `/` or `/catalog` for non-campaign visitors.

## 13. Constraints

- Do not modify the global `Header`/`Footer`.
- Do not modify checkout internals — only add `source` metadata.
- Do not add new third-party runtime deps.
- Do not rename existing routes.
- Do not fetch from any endpoint other than the two listed in §8.
