# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev           # Vite dev server (bound to network host, --host)
npm run lint           # ESLint across repo
npm run build           # tsc build + Vite production bundle -> dist/
npm run preview          # serve the built dist/ bundle
```

No test runner is configured. Run `npm run lint && npm run build` before opening a PR — the build step is also the type-check.

## Architecture

Single-page React app (Vite + TS + react-router-dom 7), one `App.tsx` mounting **four role-oriented surfaces** behind one router, split by lazy `import()` per route (`lazyWithRetry` wrapper, `src/utils/lazyWithRetry.ts`) so each surface's JS only loads when visited:

- **Storefront** — `/`, `/catalog`, `/catalog/:productId`, `/wishlist`, `/checkout*`, `/track*`, `/size-quiz/:token`, policy pages. Components in `src/components/catalog/`, `src/components/checkout/`, `src/components/cart/`, `src/components/landing/`, `src/components/policies/`.
- **Seller "Studio"** — `/studio`, `/seller/*` and `/studio/*` are parallel route trees mounting the *same* dashboard components (`SellerDashboard` nested routes: inventory, orders, order-processing, statements, analytics, profile). Auth/session via `SellerAuthContext`; a separate `JunoStudioContext` wraps studio-specific state. `ProtectedRoute` gates the dashboard.
- **Admin** — `/admin/*`, gated by `AdminProtectedRoute` + `AdminAuthContext`. This is the **only** surface allowed to use the Astryx design system (`@astryxdesign/core`) — see Astryx rules below. Never introduce Astryx into storefront/seller/checkout.
- **Ambassador/Work dashboards** — referenced in product docs but not present as routes in `App.tsx` at present; verify before assuming they exist.

All four auth/session providers (`AdminAuthProvider`, `SellerAuthProvider`, `JunoStudioProvider`, `GuestCartProvider`) wrap the entire routed tree in `App.tsx`, not per-surface — state for a role is available everywhere, so guard access at the route/component level via the `ProtectedRoute` components, not at the provider level.

Route path also drives page `<title>` (`getPageTitle` in `App.tsx`) and analytics tagging (Microsoft Clarity via `src/utils/clarity.ts`, funnel page views via `src/hooks/useFunnelAnalytics.ts`) — new routes need entries in both if they should get correct titles/analytics.

Backend is external; this repo is a pure client. `src/api/` holds per-domain API clients (e.g. `sellerApi.ts`); request/response contracts are documented per-domain in `docs/api_docs/*.md` (commerce, catalog, seller, admin, identity, analytics, sizing, media, notifications, interactions, closet) — check the relevant doc before changing a call shape. `docs/order-processing/` and `docs/schemas/` hold operational/process docs (refund/return/exchange policy, order processing, accounting).

## Design systems (two, strictly scoped)

- **Storefront/seller/checkout**: hand-rolled Tailwind, Red→Pink/Orange gradient identity (`from-primary to-secondary`, colors defined in `tailwind.config.js`), high-contrast Black/ExtraBold headline typography. Avoid blue/green accents in these surfaces.
- **Admin only**: Astryx (`@astryxdesign/core`, invoked via `npx astryx <cmd>`). No raw `<div>` layout, no raw hex/px, no `style={{}}` — components + token-backed Tailwind utilities only. Before writing admin UI, run `astryx build "<idea>"` to discover the right kit; run `astryx component <Name>` for props. Full workflow/rules are embedded in `AGENTS.md`.

Do not mix the two systems across surface boundaries.

## Content and brand assets are binding

Partner brand names, logos (`public/brand_logos/**`), banners (`public/brand_banners/**`), and testimonial/community-wall quotes are real and must never be fabricated or altered. `public/dark_logos/**` (ecosystem/partner logos) is the one asset set that may be placeholder. Juno's own logos live in `public/juno_logos/**` (use the white icon+text variant on dark backgrounds).

## Conventions

TypeScript, React function components, two-space indent, single quotes, semicolons. PascalCase components (`ProductCard.tsx`), `useX` hooks, camelCase utilities. Prefer existing helpers/API types in `src/hooks/`, `src/utils/`, `src/api/` over new abstractions. Commits: `feat (scope): message` / `fix (scope): message`, following existing `git log` style.

See `AGENTS.md` for the full contributor guide and `PRODUCT.md` for product positioning/principles.
