# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: shoppers.** People in Pakistan browsing for original fashion from independent labels — discovering brands and their stories, then buying. The storefront and curated discovery are the product's center of gravity.

**Secondary: indie sellers/founders.** Independent Pakistani labels who manage inventory, orders, analytics, and brand presence through the "Studio" seller portal. The marketplace exists to give them a stage; the seller experience is enabling infrastructure for the shopper-facing product.

**Operational roles:** admins (platform/order/logistics management), ambassadors/campus leads, and internal employees ("Work" dashboard).

## Product Purpose

Juno is the curated marketplace for Pakistan's independent labels. It connects shoppers with original creators through a unified, brand-first discovery experience. Success is a shopper discovering an indie brand's story and converting — and an indie label reaching buyers it could not on Instagram DMs. AI-driven features and a "swipe-to-shop" interface are secondary conversion tools, not the primary discovery mechanism.

## Positioning

Curation and brand-story-first discovery for Pakistani indie fashion. Neighboring platforms sell products from a search box; Juno makes the *brand* and its founder narrative the unit of discovery (cinematic brand showcases, campaign imagery, community wall). It is a movement to join, not a listings directory.

## Operating Context

- **Storefront:** landing, catalog (`/catalog`, women/men/all), product detail, wishlist, cart, checkout with confirmation and order tracking (`/track/:token`), size quiz.
- **Seller "Studio":** onboarding, inventory, orders, analytics, profile (`/studio`, `/seller`).
- **Admin:** orders, sellers, products (incl. imports), invites, notifications, analytics.
- **Also:** MDX blog (founder stories), brand reel, app download redirect, policy pages, Shopify import path.
- Event-based analytics (add_to_cart / begin_checkout), Microsoft Clarity. Pakistan-local delivery logistics.

## Capabilities and Constraints

- **Stack:** React 19, Vite, TypeScript, Tailwind 3, react-router-dom 7, Framer Motion, Recharts, lucide-react. API in `src/api.tsx`. Role-based auth via React Context.
- **Design systems in play:** storefront/seller/checkout have an established Red→Pink/Orange gradient identity; Astryx design system is scoped to admin-portal UI only.
- **Analytics:** simple event-based system (not probe). Page views limited to `/catalog` routes.
- Instant single-item "Buy Now" checkout exists alongside standard cart flow.

## Brand Commitments

- **Name:** Juno. Voice: bold, indie-spirited, movement-driven — "Home of Pakistan's Indie Brands."
- **Identity:** strict Red + Pink gradient (`from-primary to-secondary`); avoid blues/greens in main UI. High-contrast Black/ExtraBold headline typography.
- **Assets:** Juno logos `public/juno_logos/**` (white icon+text for dark backgrounds); brand logos `public/brand_logos/**`; brand banners `public/brand_banners/**`; partner logos `public/dark_logos/**`.
- **Seller-portal philosophy:** joining a movement, not admin paperwork. Foreground brand-story analytics (saves, profile visits, story performance) over spreadsheet reporting. Inventory should feel brutally simple. Education + community (WhatsApp groups, tips) are part of the product.

## Evidence on Hand

- **Real and binding — never fabricate or alter:** partner brand names, logos, and banners (`public/brand_logos/**`, `public/brand_banners/**`); community-wall / testimonial quotes (`TestimonialsSection`) are from real people.
- **Not confirmed real:** ecosystem/partner logos (`public/dark_logos/**`) may be placeholder and can be replaced.

## Product Principles

1. **Brand-first, always.** Prioritize brand campaign imagery and founder narratives over generic platform features.
2. **Curation as the product.** Discovery is editorial, not a search box; the brand/story is the unit.
3. **Shopper conversion is the goal; sellers are the supply.** Center shopper delight; make the seller stage worthy of pride.
4. **Movement over marketplace.** Both sides should feel they joined something, not signed up for a tool.
5. **Pakistan-native.** Local brands, currency, delivery, and cultural context — no global generic defaults.

## Accessibility & Inclusion

No product-specific standard established beyond baseline web accessibility.
```
