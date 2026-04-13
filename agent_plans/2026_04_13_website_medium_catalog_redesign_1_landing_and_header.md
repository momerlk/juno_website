# Catalog Redesign — Part 1: Gender Landing Page & Section Header

## 1. Objective

Redesign the gender selection landing (`GenderLandingPage.tsx`) and the in-section header (`GenderHeader.tsx`) so that Gen-Z female shoppers feel a **visceral emotional pull** the instant they arrive. The design must communicate "youth fashion revolution + indie spirit" — not e-commerce. Think editorial fashion zine, not Daraz.

---

## 2. Surface

Website

---

## 3. Scale

Medium (Part 1 of 2)

---

## 4. Scope

**Included:**
- Full rewrite of `src/components/catalog/gender/GenderLandingPage.tsx`
- Full rewrite of `src/components/catalog/gender/GenderHeader.tsx`
- Import of Google Fonts via `index.html` or existing `index.css`

**Not included:**
- Any API changes
- ProductCard, CatalogHero, CatalogNavbar (those are Part 2)
- The main CatalogPage.tsx

---

## 5. Assumptions

- `public/Rakh.png` exists and is a high-quality men's fashion editorial image
- `public/kara2.webp` exists and is a high-quality women's fashion editorial image
- Framer Motion is installed (`motion` is importable from `framer-motion`)
- Tailwind CSS is configured with the project's color tokens (`from-primary`, `to-secondary`, etc.)
- The existing dark background color is `bg-background` (near-black `#0A0A0A`)
- The project's red-pink gradient uses CSS classes `from-primary to-secondary`
- Google Fonts can be added to `index.html` or `src/index.css` via `@import`

---

## 6. Step-by-Step Implementation

### Step 1: Add Fonts

**File:** `index.html` (root of project)

Add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
```

- `Instrument Serif` — editorial display serif; used in italic for taglines, brand copy, and descriptive accents
- `Montserrat` — Black sans-serif (weight 900) for all-caps display headlines; the brand's primary campaign typeface

---

### Step 2: Rewrite `GenderLandingPage.tsx`

**File:** `src/components/catalog/gender/GenderLandingPage.tsx`

**Complete replacement.** Delete all existing content and replace with the following:

```tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GenderLandingPage: React.FC = () => {
    const [hoveredSide, setHoveredSide] = useState<'men' | 'women' | null>(null);

    return (
        <div className="relative flex min-h-screen w-full overflow-hidden bg-black">
            {/* ── WOMEN SIDE ─────────────────────────────────────── */}
            <motion.div
                className="relative flex-1 overflow-hidden cursor-pointer"
                animate={{
                    flex: hoveredSide === 'women' ? 1.35 : hoveredSide === 'men' ? 0.65 : 1,
                }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                onMouseEnter={() => setHoveredSide('women')}
                onMouseLeave={() => setHoveredSide(null)}
            >
                <Link to="/catalog/women" className="block h-full w-full">
                    {/* Background Image */}
                    <motion.img
                        src="/kara2.webp"
                        alt="Women's Collection"
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        animate={{ scale: hoveredSide === 'women' ? 1.06 : 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />

                    {/* Dark gradient overlay — stronger at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                    {/* Right edge fade to blend with men's side */}
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-black/60" />

                    {/* Top-left corner label */}
                    <div className="absolute left-8 top-8">
                        <p
                            className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                        >
                            Juno / Women
                        </p>
                    </div>

                    {/* Centre content */}
                    <div className="absolute inset-0 flex flex-col items-start justify-end pb-16 pl-10">
                        {/* Eyebrow text */}
                        <motion.p
                            className="mb-3 text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                            animate={{ opacity: hoveredSide === 'women' ? 1 : 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            The Feminine Revolution
                        </motion.p>

                        {/* Main headline — split into two lines */}
                        <h2
                            className="leading-none text-white"
                            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(3.4rem, 6.5vw, 6.2rem)' }}
                        >
                            <span className="block">Women</span>
                        </h2>

                        {/* Italic serif sub-headline */}
                        <p
                            className="mt-3 text-lg italic text-white/70"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            Wear what you mean
                        </p>

                        {/* CTA pill — only fully visible on hover */}
                        <motion.div
                            className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3"
                            animate={{
                                opacity: hoveredSide === 'women' ? 1 : 0,
                                y: hoveredSide === 'women' ? 0 : 12,
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <span
                                className="text-sm font-bold uppercase tracking-[0.22em] text-white"
                            >
                                Shop Women
                            </span>
                            <span className="text-white/60">→</span>
                        </motion.div>
                    </div>
                </Link>
            </motion.div>

            {/* ── DIVIDER LINE ───────────────────────────────────── */}
            <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white/20" />

            {/* ── MEN SIDE ───────────────────────────────────────── */}
            <motion.div
                className="relative flex-1 overflow-hidden cursor-pointer"
                animate={{
                    flex: hoveredSide === 'men' ? 1.35 : hoveredSide === 'women' ? 0.65 : 1,
                }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                onMouseEnter={() => setHoveredSide('men')}
                onMouseLeave={() => setHoveredSide(null)}
            >
                <Link to="/catalog/men" className="block h-full w-full">
                    {/* Background Image */}
                    <motion.img
                        src="/Rakh.png"
                        alt="Men's Collection"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                        animate={{ scale: hoveredSide === 'men' ? 1.06 : 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                    {/* Left edge fade */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-l from-transparent to-black/60" />

                    {/* Top-right corner label */}
                    <div className="absolute right-8 top-8">
                        <p
                            className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                        >
                            Juno / Men
                        </p>
                    </div>

                    {/* Centre content — right-aligned */}
                    <div className="absolute inset-0 flex flex-col items-end justify-end pb-16 pr-10">
                        {/* Eyebrow text */}
                        <motion.p
                            className="mb-3 text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                            animate={{ opacity: hoveredSide === 'men' ? 1 : 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            New Wave Menswear
                        </motion.p>

                        {/* Main headline */}
                        <h2
                            className="leading-none text-white text-right"
                            style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(3.4rem, 6.5vw, 6.2rem)' }}
                        >
                            <span className="block">Men</span>
                        </h2>

                        {/* Italic serif sub-headline */}
                        <p
                            className="mt-3 text-lg italic text-white/70 text-right"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            Dressed with intent
                        </p>

                        {/* CTA pill */}
                        <motion.div
                            className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3"
                            animate={{
                                opacity: hoveredSide === 'men' ? 1 : 0,
                                y: hoveredSide === 'men' ? 0 : 12,
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <span className="text-white/60">←</span>
                            <span
                                className="text-sm font-bold uppercase tracking-[0.22em] text-white"
                            >
                                Shop Men
                            </span>
                        </motion.div>
                    </div>
                </Link>
            </motion.div>

            {/* ── CENTRE BADGE (always visible) ───────────────────── */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    <img
                        src="/juno_logos/icon+text_white.png"
                        alt="Juno"
                        className="h-8 w-auto object-contain opacity-90"
                    />
                    <p
                        className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                    >
                        Select your world
                    </p>
                </motion.div>
            </div>

            {/* ── PAGE ENTER ANIMATION OVERLAY ────────────────────── */}
            <motion.div
                className="pointer-events-none absolute inset-0 bg-black z-30"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            />
        </div>
    );
};

export default GenderLandingPage;
```

---

### Step 3: Rewrite `GenderHeader.tsx`

**File:** `src/components/catalog/gender/GenderHeader.tsx`

**Complete replacement:**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

type Props = {
    gender: 'men' | 'women';
    total: number;
};

const WOMEN_CONFIG = {
    headline: 'Women',
    subline: 'Wear what you mean',
    image: '/kara2.webp',
    objectPosition: 'object-center',
    eyebrow: 'The Feminine Revolution',
};

const MEN_CONFIG = {
    headline: 'Men',
    subline: 'Dressed with intent',
    image: '/Rakh.png',
    objectPosition: 'object-top',
    eyebrow: 'New Wave Menswear',
};

const GenderHeader: React.FC<Props> = ({ gender, total }) => {
    const config = gender === 'women' ? WOMEN_CONFIG : MEN_CONFIG;

    return (
        <div className="mb-10">
            {/* Back link */}
            <Link
                to="/catalog"
                className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
            >
                <ArrowLeft size={14} />
                All Products
            </Link>

            {/* Editorial header banner */}
            <motion.div
                className="relative h-[260px] md:h-[340px] w-full overflow-hidden rounded-[2rem]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Background image */}
                <img
                    src={config.image}
                    alt={config.headline}
                    className={`absolute inset-0 h-full w-full object-cover ${config.objectPosition}`}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Text content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <p
                        className="mb-2 text-[10px] font-mono tracking-[0.32em] uppercase text-white/35"
                    >
                        {config.eyebrow}
                    </p>

                    <h1
                        className="leading-none text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                        }}
                    >
                        {config.headline}
                    </h1>

                    <div className="mt-3 flex items-center gap-4">
                        <p
                            className="text-base italic text-white/60"
                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                        >
                            {config.subline}
                        </p>
                        <span className="h-px flex-1 max-w-[80px] bg-white/20" />
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                            {total} pieces
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default GenderHeader;
```

---

## 7. Exact Logic Specification

### GenderLandingPage flex behavior
- Default state: both sides `flex: 1` (50/50 split)
- On hover `women`: women side `flex: 1.35`, men side `flex: 0.65`
- On hover `men`: men side `flex: 1.35`, women side `flex: 0.65`
- Transition: `duration: 0.6s`, cubic bezier `[0.25, 0.46, 0.45, 0.94]`
- Image scale on hover: `1.06` (subtle zoom-in)
- CTA pill: `opacity: 0, y: 12` default → `opacity: 1, y: 0` on hover of own side
- Page enter animation: full-black overlay fades out over `0.7s`

### GenderHeader image mapping
- `gender === 'women'` → image: `/kara2.webp`, `object-center`
- `gender === 'men'` → image: `/Rakh.png`, `object-top`
- Height: `260px` on mobile, `340px` on `md+`
- Rounded corners: `rounded-[2rem]`

---

## 8. UI Specification

### GenderLandingPage
- Full viewport height (`min-h-screen`)
- No scrollbar, no padding — completely immersive
- Image `object-cover` fills the entire half
- Montserrat Black headline: `clamp(3.4rem, 6.5vw, 6.2rem)`, `fontWeight: 900` — brand hero headline spec
- Women side: text left-aligned, bottom-left position
- Men side: text right-aligned, bottom-right position
- Divider: `1px` white line at `left: 50%` with `20%` opacity
- Centre badge: Juno logo + "Select your world" label floats in the centre
- Mobile: no hover states (mouse events don't apply) — still shows full-bleed imagery with text

### GenderHeader
- Cinematic banner: `260px` mobile / `340px` desktop
- Left-to-right gradient overlay (dark left, transparent right) so text is readable
- Bottom-to-top gradient overlay (dark bottom, transparent top)
- Headline: Montserrat Black (fontWeight 900), `clamp(3rem, 6vw, 5.5rem)`
- Sub-line: Instrument Serif italic, weight 300 (brand editorial accent font)
- Product count shown as `{total} pieces` not `{total} products`

---

## 9. Edge Cases

- If `total === 0`: show `0 pieces` — do not hide the header
- If image fails to load: the gradient overlays remain, text is still readable against the dark background
- On very narrow mobile screens (`< 375px`): the Montserrat Black font scales down via `clamp` automatically
- GenderLandingPage: if JavaScript is disabled, `<Link>` still navigates (no JS dependency for navigation)

---

## 10. Testing Instructions

1. Open `http://localhost:5173/catalog` (or wherever the dev server runs)
2. If there is a gender selection step, navigate to it — it should be at `/catalog` root showing the split screen
3. Verify the split screen shows: left = women (kara2.webp), right = men (Rakh.png)
4. Hover over the women side — it should expand, image zooms slightly, CTA pill appears
5. Hover over the men side — same effect mirrored
6. Click women side — should navigate to `/catalog/women`
7. On `/catalog/women`: verify the header banner shows kara2.webp with "Women" headline and "Wear what you mean" subline
8. On `/catalog/men`: verify the header banner shows Rakh.png with "Men" headline and "Dressed with intent" subline
9. Check mobile (375px viewport): images must be visible and text must not overflow

---

## 11. Definition of Done

- [ ] GenderLandingPage shows full-bleed split imagery with Rakh.png and kara2.webp
- [ ] Hover flex animation works smoothly on desktop
- [ ] Montserrat Black + Instrument Serif fonts render correctly
- [ ] Page enter fade-from-black animation plays on load
- [ ] GenderHeader shows the gender-specific image as a cinematic banner
- [ ] No console errors
- [ ] No layout overflow or broken responsive behavior on mobile

---

## 12. Constraints

- Do NOT modify `GenderCatalogPage.tsx`, `ProductGrid.tsx`, `BrandList.tsx`
- Do NOT add new npm packages
- Do NOT change routing logic
- Only modify the two files listed in Scope
- Only add fonts via `<link>` tag in `index.html` — do not install a font package
