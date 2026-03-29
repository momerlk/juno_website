# Project Overview

Juno is the premier curated marketplace for Pakistan's independent labels. The platform is designed to prioritize **indie brands** and their stories as the primary discovery mechanism, with AI-driven features and a "swipe-to-shop" interface serving as secondary tools for conversion.

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

## Claude Added Memories
- **[REBRAND]** Executed a complete marketing pivot: shifted the mission from "swipe-to-shop app" to "Home of Pakistan's Indie Brands."
- Standardized styling to a strict Red + Pink gradient and high-contrast typography.
- Implemented the `BrandShowcase` (marquee campaign imagery) and `TestimonialsSection` (Community Wall).
- Redesigned the `Hero`, `BrandsSection` (logo ticker), and `JunoApp` (ecosystem partners) to align with the new brand-first strategy.
- Implemented 'Buy Now' button feature in Juno app (Feed and Product Details screens) allowing instant single-item checkout using Orders.CreateOrder.
- **[SELLER PORTAL PHILOSOPHY]** The seller portal should feel like joining a movement, not filling out admin paperwork. Use `src/components/seller/SellerOnboarding.tsx` and `src/components/seller/JunoStudioLanding.tsx` as the style reference for portal upgrades.
- The first post-approval touchpoint should explain why Juno exists, who the buyers are, and why selling here is different from Instagram DMs. Sellers should feel proud to be on Juno.
- Seller dashboards should prioritize brand story analytics over spreadsheet-style reporting: saves, profile visits, story performance, and browsing demographics should be foregrounded whenever possible.
- Inventory management should feel brutally simple. Minimum viable listing inputs are product name, price, and quantity. Size guide is optional but should be visibly incentivized with trust/conversion cues.
- Education belongs inside the portal. Include short guidance surfaces for photography, product descriptions, and drop strategy because better seller inputs directly improve buyer trust and GMV.
- Community is part of the product. Seller-facing surfaces should make room for invite-only community touchpoints like WhatsApp groups, weekly tips, and collaborative founder support.


## Frontend design aesthetics
DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""
