# Project Overview

## Context & Understanding
- Review the repository docs before reading any raw files so context stays accurate and focused.
- Only read raw files when explicitly instructed to do so for code modification or specific, detailed file investigation.

Juno is a curated marketplace for Pakistan's independent fashion labels. The platform is designed to prioritize **indie brands** and their stories as the primary discovery mechanism, with AI-driven features and a "swipe-to-shop" interface serving as secondary tools for conversion.

The application serves as the main ecosystem hub, connecting shoppers with original creators through a unified experience.

**Main Technologies:**

*   **Frontend:** React, Vite, TypeScript, Tailwind CSS
*   **Routing:** `react-router-dom`
*   **Animation:** Framer Motion (used for brand showcases, marquees, and interactions)
*   **State Management:** React Context API for role-based authentication
*   **API Communication:** Configured in `src/api.tsx`.

**Architecture:**

The application is modular and role-oriented:

*   **Main Website:** A high-impact, brand-first landing page featuring brand showcases, curated discovery, and community testimonials.
*   **Blog:** MDX-powered section for founder stories and fashion discovery articles.
*   **Seller Dashboard:** A specialized "Studio" for labels to manage inventory, analytics, and brand presence.
*   **Admin Dashboard:** Platform management for orders, sellers, users, and delivery logistics.
*   **Ambassador Dashboard:** Tracking for brand ambassadors and campus leads.
*   **Work Dashboard:** Internal management for employee operations.

# Building and Running

**Prerequisites:**

*   Node.js and npm

**Installation:**

```bash
npm install
```

**Development:**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
```

# Development Conventions

*   **Brand-First Design:** All visual updates must prioritize brand campaign imagery and founder narratives over generic platform features.
*   **Styling Standards:**
    *   **Colors:** Use the standardized Red-to-Pink/Orange gradient for primary actions and accents.
    *   **Gradients:** Use `from-primary to-secondary` (Red to Pink) consistently across the site. Avoid mixing with other colors (blues/greens) in main UI components.
    *   **Typography:** Use high-contrast font weights (Black/ExtraBold) for headlines to maintain the "Indie Spirit" aesthetic.
*   **Components:** Organized by domain (e.g., `seller`, `admin`, `shared`).
*   **Assets:**
    *   Juno Logos: `public/juno_logos/**` (Use white `icon+text` for dark backgrounds).
    *   Brand Logos: `public/brand_logos/**`.
    *   Brand Banners: `public/brand_banners/**` (Used for the cinematic Brand Showcase).
    *   Partner Logos: `public/dark_logos/**` (Used for the Ecosystem section).

## Gemini Added Memories
- **[REBRAND]** Executed a complete marketing pivot: shifted the mission from "swipe-to-shop app" to "Home of Pakistan's Indie Brands."
- Standardized styling to a strict Red + Pink gradient and high-contrast typography.
- Implemented the `BrandShowcase` (marquee campaign imagery) and `TestimonialsSection` (Community Wall).
- Redesigned the `Hero`, `BrandsSection` (logo ticker), and `JunoApp` (ecosystem partners) to align with the new brand-first strategy.
- Implemented 'Buy Now' button feature in Juno app (Feed and Product Details screens) allowing instant single-item checkout using Orders.CreateOrder.
- **[SELLER PORTAL PHILOSOPHY]** The seller portal should feel like joining a movement, not filling out admin paperwork. Use `src/components/seller/SellerOnboarding.tsx` and `src/components/seller/JunoStudioLanding.tsx` as the design reference for portal upgrades.
- The first approved-seller touchpoint should explain why Juno exists, who the buyers are, and why this is better than selling through Instagram DMs. Make sellers feel proud to be on the platform.
- Analytics should look and feel more like Instagram-style brand intelligence than spreadsheet reporting. Prioritize saves, profile visits, story performance, browsing geography, and audience signals.
- Inventory UX should stay brutally simple. The minimum viable listing is product name, price, and quantity. Size guide is optional, but the portal should visibly reward it because it improves buyer confidence.
- The portal should teach as it operates. Add short educational guidance for product photography, product descriptions, and drop strategy directly inside seller flows.
- Seller community is part of retention. Make room in the portal for invite-only WhatsApp or private-channel touchpoints, weekly tips, collaboration, and support between brands.

<!-- ASTRYX:START -->
Astryx v0.1.8 · 90+ components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SCOPE — Use Astryx only for admin-portal UI work or when the user explicitly asks for it. Do not introduce Astryx into storefront, seller, checkout, or existing shared UI; preserve their established design systems.

SETUP (only when using Astryx, in the relevant app entry) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — for in-scope Astryx UI only, discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   90+ components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
