# Plan 2: Catalog Visual Redesign — ProductGrid Cards & BrandList

## 1. Objective

The hero at `/catalog` sets a strong brand tone (dark, editorial, red-pink gradient, bold Montserrat). After navigating to `/catalog/women` or `/catalog/men`, the product cards and brand sidebar feel generic and mismatched. This plan rewrites both to match the brand guidelines established in the hero and the main `ProductCard` component.

**Two components to fix:**
1. `ProductGrid.tsx` — the inline `ProductCard` is a basic 3-line text card with no visual character
2. `BrandList.tsx` — plain text list with no visual identity, no logos, no brand-first design

---

## 2. Surface

Website

---

## 3. Scale

Medium (Plan 2 of 2)

---

## 4. Scope

**Included:**
- Full redesign of the inline `ProductCard` inside `ProductGrid.tsx`
- Full redesign of `BrandList.tsx`

**Not included:**
- Layout or routing changes (covered in Plan 1)
- `CatalogProductPage.tsx`
- `CatalogDiscovery.tsx`
- `ProductCard.tsx` (main catalog card — already matches brand guidelines)

---

## 5. Assumptions

- Plan 1 has already been applied (sidebar is `hidden lg:block`, mobile chips are in place)
- `GenderOverviewProduct` type has these fields: `id`, `images: string[]`, `title`, `seller_name`, `pricing: { price: number, discounted: boolean, discounted_price?: number, compare_at_price?: number }`
- `GenderBrand` type has: `id`, `name`, `logo?: string`, `product_count?: number`
- Brand guidelines: Red-to-Pink gradient = `from-primary to-secondary`, dark background = `bg-[#0A0A0A]` / `bg-white/[0.04]`, high-contrast bold Montserrat headlines
- `framer-motion` and `lucide-react` are installed

---

## 6. Step-by-Step Implementation

### Step 1 — Rewrite the `ProductCard` inside `ProductGrid.tsx`

File: `src/components/catalog/gender/ProductGrid.tsx`

**Replace the entire `ProductCard` component (lines 53–102) with the following:**

```tsx
const ProductCard: React.FC<{ product: GenderOverviewProduct; index: number }> = ({
    product,
    index,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const image = product.images?.[0] ?? '';
    const secondImage = product.images?.[1] ?? '';
    const price = product.pricing.discounted
        ? (product.pricing.discounted_price ?? product.pricing.price)
        : product.pricing.price;
    const comparePrice = product.pricing.compare_at_price;
    const discountPct = comparePrice && comparePrice > price
        ? Math.round(((comparePrice - price) / comparePrice) * 100)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.18) }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-full"
        >
            <Link
                to={`/catalog/${product.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
            >
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                    {image ? (
                        <>
                            <img
                                src={image}
                                alt={product.title}
                                loading="lazy"
                                className={`h-full w-full object-cover transition-all duration-700 ${
                                    isHovered && secondImage ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                                }`}
                            />
                            {secondImage && (
                                <img
                                    src={secondImage}
                                    alt={product.title}
                                    loading="lazy"
                                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                                        isHovered ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                                    }`}
                                />
                            )}
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5">
                            <ShoppingBag size={40} className="text-white/20" />
                        </div>
                    )}

                    {/* Discount badge */}
                    {discountPct > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-500/30">
                            -{discountPct}%
                        </span>
                    )}

                    {/* Gradient scrim for text legibility on hover */}
                    <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1.5 p-3.5 md:p-4">
                    <p
                        className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80"
                        style={{ fontFamily: 'Instrument Serif, serif' }}
                    >
                        {product.seller_name}
                    </p>
                    <h3
                        className="line-clamp-2 text-white"
                        style={{
                            fontFamily: 'Montserrat, sans-serif',
                            fontWeight: 900,
                            fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
                            lineHeight: 1.1,
                        }}
                    >
                        {product.title}
                    </h3>
                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/10 pt-3">
                        <div>
                            <p className="text-base font-black text-white md:text-lg">
                                Rs {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(price)}
                            </p>
                            {comparePrice && comparePrice > price && (
                                <p className="text-xs text-neutral-500 line-through">
                                    Rs {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(comparePrice)}
                                </p>
                            )}
                        </div>
                        <ArrowRight
                            size={14}
                            className="mb-0.5 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white/70"
                        />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
```

**Update the imports at the top of `ProductGrid.tsx`** to add the missing hooks/icons:

```tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import type { GenderOverviewProduct } from '../../../api/api.types';
```

> Remove the old `import { ShoppingBag } from 'lucide-react'` if it already exists — just consolidate into this one import line.

---

### Step 2 — Rewrite `BrandList.tsx`

File: `src/components/catalog/gender/BrandList.tsx`

**Replace the entire file contents with:**

```tsx
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { GenderBrand } from '../../../api/api.types';

type Props = {
    brands: GenderBrand[];
    gender: 'men' | 'women';
};

const BrandList: React.FC<Props> = ({ brands, gender }) => {
    const [searchParams] = useSearchParams();
    const activeBrandId = searchParams.get('brand');

    if (brands.length === 0) return null;

    return (
        <div className="sticky top-28 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">
                    Brands
                </p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/40">
                    {brands.length}
                </span>
            </div>

            {/* All link */}
            <Link
                to={`/catalog/${gender}`}
                className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                    !activeBrandId
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
            >
                <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        !activeBrandId ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'
                    }`}
                >
                    ∞
                </span>
                <span>All Brands</span>
            </Link>

            {/* Brand list */}
            <ul className="space-y-0.5">
                {brands.map((brand) => {
                    const isActive = activeBrandId === brand.id;
                    const initials = brand.name
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase() ?? '')
                        .join('');

                    return (
                        <li key={brand.id}>
                            <Link
                                to={`/catalog/${gender}?brand=${brand.id}`}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                                    isActive
                                        ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-white font-bold border border-primary/30'
                                        : 'text-neutral-400 hover:bg-white/5 hover:text-white font-medium border border-transparent'
                                }`}
                            >
                                {/* Logo or initials avatar */}
                                <div
                                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border ${
                                        isActive
                                            ? 'border-primary/50 bg-primary/10'
                                            : 'border-white/10 bg-white/5'
                                    }`}
                                >
                                    {brand.logo ? (
                                        <img
                                            src={brand.logo}
                                            alt={brand.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span
                                            className={`text-[9px] font-black ${isActive ? 'text-primary' : 'text-white/40'}`}
                                        >
                                            {initials}
                                        </span>
                                    )}
                                </div>

                                {/* Name */}
                                <span className="min-w-0 flex-1 truncate">{brand.name}</span>

                                {/* Product count */}
                                {brand.product_count !== undefined && brand.product_count > 0 && (
                                    <span
                                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            isActive
                                                ? 'bg-white/15 text-white/80'
                                                : 'bg-white/5 text-white/30'
                                        }`}
                                    >
                                        {brand.product_count}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default BrandList;
```

---

## 7. Exact Logic Specification

### ProductCard (in ProductGrid)
- Image crossfade: if `product.images[1]` exists AND `isHovered` is true → show second image, fade out first
- Discount badge: only render if `comparePrice > price && discountPct > 0`
- Price display: if `pricing.discounted === true`, show `discounted_price`; else show `price`
- Compare price (strikethrough): only show if `compare_at_price` exists AND is greater than final price
- Animation delay: `Math.min(index * 0.03, 0.18)` — cap at 180ms to avoid long waits on large grids

### BrandList
- "All Brands" row: active (gradient) when `searchParams.get('brand')` is null
- Brand row: active (gradient tint + border) when `activeBrandId === brand.id`
- Avatar: show `brand.logo` image if it exists; else show uppercase initials (max 2 chars from first two words of name)
- Product count badge: only render if `brand.product_count !== undefined && brand.product_count > 0`
- Sidebar is `sticky top-28` to stay in view while scrolling (28 = 112px, clears the fixed navbar height)

---

## 8. UI Specification

### ProductCard (in ProductGrid)
- Container: `rounded-[2rem] border border-white/10 bg-white/[0.04]` — matches main catalog card
- Image aspect ratio: `3/4`
- Image crossfade on hover (same mechanism as main `ProductCard.tsx`)
- Gradient scrim bottom: `h-24 bg-gradient-to-t from-black/70` — appears on hover only
- Discount badge: `rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]`
- Brand name: `Instrument Serif, serif` font, `text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80`
- Product title: `Montserrat font-weight:900`, clamped to 2 lines, size `clamp(0.95rem, 1.8vw, 1.2rem)`
- Price: `text-base font-black text-white md:text-lg`
- Bottom row: price left, ArrowRight icon right, separated by `border-t border-white/10`

### BrandList
- Container: `sticky top-28 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4`
- Section header: `text-[10px] font-black uppercase tracking-[0.26em] text-white/40` + count badge
- "All Brands" row: slightly taller treatment, ∞ symbol avatar
- Active brand row: `bg-gradient-to-r from-primary/20 to-secondary/20` tint + `border border-primary/30`
- Inactive brand row: `text-neutral-400 hover:bg-white/5 hover:text-white`
- Avatar circles: `h-7 w-7 rounded-full border` — logo image or 2-char initials
- Product count badge: subtle pill on the right

---

## 9. Edge Cases

- `product.images` is empty array → show `<ShoppingBag>` placeholder icon, no crossfade
- `product.images` has only 1 image → no crossfade (condition: `isHovered && secondImage`)
- `brand.logo` is undefined or empty string → show initials avatar
- `brand.name` is one word (e.g., "Khaadi") → initials = "K"
- `brand.product_count` is 0 or undefined → count badge not rendered
- `brands` array is empty → `BrandList` returns null (already handled)

---

## 10. Testing Instructions

1. Navigate to `/catalog/women`
2. Verify product cards have:
   - Rounded `[2rem]` corners
   - Dark glass background (`bg-white/[0.04]`)
   - Montserrat bold product title
   - Brand name in small uppercase primary-colored text
   - Price at bottom with divider line
   - ArrowRight icon that shifts right on hover
3. Hover a product card with 2+ images → verify second image fades in
4. Hover a product card with 1 image → verify it does NOT flicker or disappear
5. Find a discounted product → verify red `-XX%` badge is visible
6. Check the brand sidebar (desktop):
   - Has rounded container, sticky positioning
   - "All Brands" row visible at top with ∞ avatar
   - Each brand row has avatar circle (logo or initials)
   - Active brand row glows with gradient tint
   - Product counts visible where data exists
7. Click a brand in sidebar → active state updates immediately
8. Resize to < 1024px → sidebar disappears (Plan 1 handles this)

---

## 11. Definition of Done

- [ ] `ProductGrid.tsx` product cards visually match main catalog brand style
- [ ] Image crossfade works on hover for multi-image products
- [ ] Discount badge renders correctly for sale items
- [ ] `BrandList.tsx` has brand avatars (logo or initials), product counts, active gradient state
- [ ] Sidebar is sticky and does not overflow
- [ ] No TypeScript errors in `ProductGrid.tsx` or `BrandList.tsx`
- [ ] No console errors

---

## 12. Constraints

- Do NOT modify `CatalogProductPage.tsx`, `CatalogDiscovery.tsx`, or `GenderCatalogPage.tsx`
- Do NOT import the main `ProductCard.tsx` into `ProductGrid.tsx` — the types differ (`GenderOverviewProduct` vs `CatalogProduct`)
- Do NOT add new npm dependencies
- Do NOT change any API files
