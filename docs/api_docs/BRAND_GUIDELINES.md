# Juno Brand Guidelines

## Overview

Juno is the premier curated marketplace for Pakistan's independent fashion labels. The brand identity is built around three pillars: **Indie Spirit**, **Cinematic Darkness**, and **Defiant Energy**. Every visual and typographic decision should evoke the feeling of discovering something underground and extraordinary — not a generic e-commerce platform.

**Keywords:** indie fashion, Pakistan, discovery, curated, editorial, dark luxury, brand-first, founder stories, movement

---

## Brand Voice

- **Bold, not loud.** Commands attention through precision, not volume.
- **Exclusive, not elitist.** A movement anyone can join, but not everyone knows about yet.
- **Cultural, not corporate.** Celebrates Pakistan's creative underground.
- **Direct.** "Home of Pakistan's Indie Brands." — not hedged, not qualified.

**Tone adjectives:** Defiant · Cinematic · Intimate · Urgent · Proud

---

## Logo

### Primary Logo
The Juno wordmark uses a **black-to-red gradient**, evoking dark origins bleeding into fiery energy.

**Gradient stops (left to right):**
| Stop | Hex | Role |
|------|-----|------|
| 0% | `#181516` | Near-black anchor |
| 33% | `#5F1021` | Deep crimson |
| 66% | `#C31630` | Mid red |
| 100% | `#D31935` | Vivid red terminus |

### Logo Usage
- **On dark backgrounds:** Use white `icon+text` variant from `public/juno_logos/`
- **On light/neutral backgrounds:** Use the gradient wordmark
- **Minimum clear space:** Equal to the cap-height of the "J" on all sides
- **Never** place the logo on busy imagery without a darkening overlay
- **Never** recolor, stretch, or add drop shadows to the logo

---

## Color System

### Core Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Brand Red** | Primary | `#FF1818` | CTAs, accents, active states, glows |
| **Brand Pink** | Secondary | `#FF4585` | Gradient terminus, hover states, highlights |
| **Background Deep** | `background.dark` | `#050505` | Page canvas on darkest surfaces |
| **Background Default** | `background` | `#0A0A0A` | Primary page background |
| **Background Surface** | `background.light` | `#121212` | Cards, panels, elevated surfaces |
| **Pure Black** | — | `#000000` | Hero canvas, full-bleed sections |
| **Pure White** | — | `#FFFFFF` | Primary CTA button fills, max-contrast text |

### Gradient System

**Primary Gradient (Red → Pink)** — the signature Juno gradient
```css
background: linear-gradient(to right, #FF1818, #FF4585);
```
Use on: headline accent words, CTA hover states, brand markers, selected UI elements.

**Logo Gradient (Black → Red)**
```css
background: linear-gradient(to right, #181516, #5F1021, #C31630, #D31935);
```
Use on: the Juno wordmark only. Do not repurpose for UI.

**Atmosphere Glows** — ambient depth, never solid
```css
/* Left/top glow */
background: rgba(255, 24, 24, 0.10);
filter: blur(140px);

/* Right/bottom glow */
background: rgba(255, 69, 133, 0.08);
filter: blur(140px);
```

**Body Background Texture**
```css
background-image:
  radial-gradient(circle at 25% 25%, rgba(255, 24, 24, 0.05) 0%, transparent 30%),
  radial-gradient(circle at 75% 75%, rgba(255, 69, 133, 0.05) 0%, transparent 30%);
```

### Text Colors

| Role | Value |
|------|-------|
| Primary text | `#E5E5E5` (neutral-200) |
| Body / secondary text | `#D4D4D4` (neutral-300) |
| Muted / tertiary | `rgba(255,255,255,0.38)` |
| Labels / monospace tags | `rgba(255,255,255,0.35)` |
| Disabled / placeholder | `rgba(255,255,255,0.18)` |
| Hairline dividers | `rgba(255,255,255,0.10)` |

### Semantic Colors

| Role | Hex |
|------|-----|
| Success | `#00D875` |
| Warning | `#FFB800` |
| Error / Destructive | `#FF3D3D` |
| Info (accent) | `#00E5FF` |

---

## Typography

Juno uses a **four-font system** with strict role assignments.

| Font | Role | Weights |
|------|------|---------|
| **Instrument Serif** | Editorial display, italic accents | Regular, Italic |
| **Poppins** | Seller-facing UI, dashboards, feature cards | 600, 700, 800, 900 |
| **Montserrat** | Sub-headings, section labels, caps | 700, 800, 900 |
| **Inter** | Body copy, UI prose, input fields | 300, 400, 500, 600 |

### Usage Hierarchy

**Hero & campaign headlines:**
- Font: `Instrument Serif` italic OR `Montserrat` Black
- Weight: 900 (Black) for sans; Italic Regular for serif
- Style: `uppercase`, `tracking-tighter`, `leading-[0.87]`
- Size range: `clamp(3.4rem, 6.5vw, 6.2rem)`
- Gradient accent on the differentiating line: `from-primary to-secondary`

**Section headings (H2):**
- Font: `Poppins` or `Montserrat` ExtraBold (800)
- Style: Tight tracking, uppercase or title-case
- Size: `clamp(2rem, 4vw, 3.5rem)`

**Feature / card headings (H3–H4):**
- Font: `Poppins` SemiBold–Bold (600–700)
- Size: `1.25rem – 1.75rem`

**Eyebrow labels:**
- Font: monospace (system) or `Inter` 500
- Style: `text-[10px]`, `tracking-[0.32em]`, `uppercase`, `text-white/35`
- Often preceded by a pulsing `•` dot in primary red

**Body text:**
- Font: `Inter` Light–Regular (300–400)
- Style: `italic` for taglines and brand descriptors; upright for functional copy
- Color: `text-neutral-400` (`#A3A3A3`)
- Max line width: `max-w-xs` to `max-w-prose`

**Monospace / data labels:**
- Font: system `monospace`
- Use for: city codes, tracking labels, technical metadata, SVG annotations
- Color: `rgba(255,255,255,0.35)` to `rgba(255,255,255,0.07)` depending on prominence

---

## Spacing & Layout

- **Max content width:** `max-w-7xl` (80rem)
- **Horizontal padding:** `px-6` standard; `px-4 md:px-6` on container utility
- **Section padding:** `pt-32 pb-20 lg:pt-36 lg:pb-24`
- **Grid:** Primarily `lg:grid-cols-[1.15fr_0.85fr]` for hero splits; 2-col mosaic for imagery
- **Gap rhythm:** `gap-2.5` (tight tiles), `gap-12 xl:gap-20` (section columns), `gap-16` (story sections)
- **Inter-section margin:** `mb-32` between major story blocks

---

## Component Patterns

### Glass Morphism
```css
/* .glass */
background: rgba(255,255,255,0.05);
backdrop-filter: blur(24px);
border: 1px solid rgba(255,255,255,0.10);
box-shadow: 0 20px 60px rgba(0,0,0,0.5);

/* .glass-dark */
background: rgba(0,0,0,0.20);
backdrop-filter: blur(24px);
border: 1px solid rgba(255,255,255,0.05);
```

### Buttons

**Primary CTA (white, high contrast):**
```css
padding: 1rem 2.25rem;
background: #FFFFFF;
color: #000000;
border-radius: 9999px;
font-weight: 900;
font-size: 1rem;
letter-spacing: -0.025em;
box-shadow: 0 10px 40px rgba(255,255,255,0.10);
transition: transform 150ms, background 150ms;
/* hover */ transform: scale(1.04); background: #F5F5F5;
/* active */ transform: scale(0.97);
```

**Secondary CTA (ghost):**
```css
padding: 1rem 2.25rem;
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.12);
color: #FFFFFF;
border-radius: 9999px;
font-weight: 900;
/* hover */ transform: scale(1.04);
```

**Pill / Badge:**
```css
padding: 0.5rem 1.5rem;
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.10);
border-radius: 9999px;
font-size: 0.875rem;
font-weight: 700;
color: #E5E5E5;
backdrop-filter: blur(8px);
```

### Brand Mosaic (Image Grid)
- 2-column asymmetric grid with `mt-10` offset on right column
- Rounded corners: `rounded-2xl`
- Overlay: `bg-gradient-to-t from-black/80 via-black/10 to-transparent`
- Hover: `scale(1.06)` over `700ms` on the `<img>`
- Red hover shimmer: `linear-gradient(135deg, rgba(255,24,24,0.12) 0%, transparent 60%)`
- Label: `text-[9px] font-mono tracking-[0.28em] uppercase text-white/45` pinned `bottom-0 left-0 p-3`

### Brand Avatar Strip
- Overlapping circles: `-space-x-2.5`, `w-9 h-9`, `border-2 border-black`
- Images: `grayscale` filter
- Count label: `text-[11px] font-mono`, count value at `text-white/75 font-bold`
- Divider: `h-5 w-px bg-white/10`

### Eyebrow Indicator
```jsx
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
<span className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/35">
  Pakistan · Indie · Now Live
</span>
```

---

## Motion & Animation

All animation uses **Framer Motion** for React components.

### Page Load Sequence (Hero)
```
Eyebrow     → delay: 0.00s, y: 14→0, opacity: 0→1, duration: 0.50s
H1          → delay: 0.08s, y: 28→0, opacity: 0→1, duration: 0.65s
Tagline     → delay: 0.18s, y: 14→0, opacity: 0→1, duration: 0.60s
CTAs        → delay: 0.26s, y: 14→0, opacity: 0→1, duration: 0.60s
Brand strip → delay: 0.42s, opacity: 0→1, duration: 0.70s
Mosaic      → delay: 0.10s, x: 28→0, opacity: 0→1, duration: 0.80s
Tiles       → delay: 0.18–0.48s, y: 18→0, opacity: 0→1, duration: 0.70s
```

### Scroll-Triggered Sections
```js
initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
whileInView={{ opacity: 1, x: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
```

### Principles
- Stagger reveals: never animate everything at once
- Use `once: true` for scroll triggers — don't re-animate on scroll-up
- Easing: default Framer easing (spring-like) preferred over linear
- Keep durations between `0.5s – 0.8s` for UI elements; `0.7s – 1.0s` for imagery
- SVG pulse animations for data glows: `values="7;14;7"` radius, `values="0.6;0;0.6"` opacity

---

## Imagery & Visual Style

### Brand Banners
- Source: `public/brand_banners/`
- Style: Editorial campaign photography, high contrast, fashion-forward
- Ratio variety in mosaic: `2/3`, `16/9`, `3/4`, `3/2` for visual rhythm
- Apply dark gradient overlay — raw photography without overlay is not acceptable

### Brand Logos
- Source: `public/brand_logos/`
- Display: `grayscale` in avatar strips and secondary contexts
- Full color only in dedicated brand feature moments

### SVG Data Graphics
- Background: `radial-gradient` dark with `rgba(255,X,X,0.08)` red/pink tint
- Connections: `rgba(255,255,255,0.035–0.10)` dim lines
- Hot paths: `url(#grad)` from `#FF1818` to `#FF4585`
- Node pulses: pulsing ring `rgba(255,24,24,0.35)` + solid core `#FF1818` + white center dot

---

## Shadow & Glow System

| Name | Value |
|------|-------|
| `glow-primary` | `0 0 15px 2px rgba(200, 3, 33, 0.30)` |
| `glow-secondary` | `0 0 15px 2px rgba(255, 69, 133, 0.30)` |
| `glow-accent` | `0 0 15px 2px rgba(0, 229, 255, 0.30)` |
| Atmosphere blob (primary) | `blur(140px)`, `rgba(255,24,24,0.10)`, `w-[55vw] h-[65vh]` |
| Atmosphere blob (secondary) | `blur(140px)`, `rgba(255,69,133,0.08)`, `w-[50vw] h-[55vh]` |

---

## Don'ts

- **No blue or green** in primary UI — these are semantic/utility colors only
- **No light backgrounds** on main consumer-facing pages — Juno is a dark-mode-first brand
- **No flat colors** for backgrounds — always layer gradients or glows for depth
- **No thin font weights** for headlines — minimum 700, prefer 800–900 Black
- **No generic gradients** (purple → blue, teal → green) — the Red → Pink palette is non-negotiable
- **No full-opacity solid fills** on overlay surfaces — always use transparency + blur (glass)
- **No unbranded imagery** — all campaign imagery must carry the gradient overlay and brand label

---

## Quick Reference Card

```
BACKGROUND    #050505 / #0A0A0A / #121212
PRIMARY RED   #FF1818  →  dark: #a00219
SECONDARY     #FF4585  →  dark: #E03A73
LOGO GRADIENT #181516 → #5F1021 → #C31630 → #D31935
WHITE TEXT    #E5E5E5 primary · #A3A3A3 muted · rgba(255,255,255,0.35) dim

DISPLAY FONT  Instrument Serif (italic accents) · Montserrat Black (all-caps headlines)
UI FONT       Poppins (seller/dashboard) · Inter (body/prose)
MONO          system monospace (labels, tags, codes)

BORDER RADIUS  rounded-2xl (tiles) · rounded-3xl (panels) · rounded-full (pills/buttons)
GLASS          bg-white/5 backdrop-blur-xl border-white/10
```
