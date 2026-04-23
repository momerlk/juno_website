# Project Overview

## Context & Understanding
- **Always** use the `graphify` skill (or query the graph if already built) to understand the codebase and project structure before reading any raw files. This ensures efficient, context-aware navigation.
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
