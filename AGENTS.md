# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the React application. Keep domain UI in `src/components/` (for example, `seller/` and `admin/`), shared state in `src/contexts/`, API clients in `src/api/` and `src/api.tsx`, and reusable helpers in `src/hooks/` and `src/utils/`.
- `src/data/` and `src/constants/` hold local content and configuration. Put public, directly served assets in `public/`; brand assets belong in `public/brand_logos/`, `public/brand_banners/`, and `public/juno_logos/`.
- Product and API references live in `PRODUCT.md` and `docs/`. Treat generated `dist/` output as build-only.

## Build, Lint, and Development

- `npm install` installs dependencies.
- `npm run dev` starts Vite for local development (bound to the network host).
- `npm run lint` runs ESLint across the repository.
- `npm run build` type-checks through Vite's build pipeline and writes the production bundle to `dist/`.
- `npm run preview` serves the built bundle for a final local check.

Run `npm run lint && npm run build` before opening a pull request. No automated test runner is currently configured; add focused tests only when introducing non-trivial, testable logic and include the command needed to run them.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Match existing file formatting: two-space indentation, single quotes, and semicolons. Name components in PascalCase (`ProductCard.tsx`), hooks as `useX` (`useCart.ts`), and utilities in camelCase. Prefer existing helpers and API types over new abstractions.

The storefront and seller UI use the Juno red-to-pink/orange gradient (`from-primary to-secondary`) and high-contrast headings. Do not introduce Astryx outside admin-portal UI; admin work must follow the Astryx workflow documented in the project instructions.

## Commits & Pull Requests

Use concise, scoped, imperative commits, following the existing history: `feat (checkout): improve city selector` or `fix (cart): preserve checkout navigation`. Keep each commit focused.

PRs should explain the user-visible change, link the relevant issue when available, list validation performed, and include screenshots or a short recording for visual changes. Call out API, checkout, pricing, or asset changes explicitly.

## Configuration & Safety

Do not commit secrets or production credentials. Preserve real partner brand names, logos, banners, and testimonial content; these are binding product assets. Verify cart, checkout, and order-tracking changes against the documented API contracts in `docs/api_docs/`.

## Repository Scope

Work only in this `juno_website` repository. Do not modify the separate API codebase or any other repository, even when a request would benefit from a backend change; refuse that portion and explain that it requires work in the owning repository.
