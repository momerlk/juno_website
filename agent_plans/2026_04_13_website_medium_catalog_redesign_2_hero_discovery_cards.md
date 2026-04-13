# Catalog Redesign — Part 2: Hero, Discovery Sections & Product Cards

## 1. Objective

After Part 1 establishes the editorial gender landing, Part 2 upgrades the **main catalog hero**, the **discovery sections**, the **product cards**, and the **catalog navbar** (adds gender navigation pills). The goal: every surface of the catalog feels like a curated fashion publication — not a generic e-commerce grid. Target emotion: Gen-Z excitement, indie identity, "this brand gets me."

---

## 2. Surface

Website

---

## 3. Scale

Medium (Part 2 of 2)

**Prerequisite:** Part 1 must be complete (fonts Montserrat + Instrument Serif must be loaded in `index.html`)

---

## 4. Scope

**Included:**
- `src/components/catalog/CatalogHero.tsx` — rewrite the hero banner styling
- `src/components/catalog/CatalogDiscovery.tsx` — rewrite section headers + collection cards
- `src/components/catalog/ProductCard.tsx` — refine card aesthetics
- `src/components/catalog/CatalogNavbar.tsx` — add Men / Women gender nav pills to desktop nav links row

**Not included:**
- Any API logic changes
- Routing changes
- GenderLandingPage / GenderHeader (done in Part 1)
- CatalogPage.tsx layout changes

---

## 5. Assumptions

- Part 1 fonts are loaded (`Montserrat`, `Instrument Serif`)
- Framer Motion available
- Tailwind configured with `from-primary to-secondary` gradient tokens
- `bg-background` ≈ `#0A0A0A`
- CatalogHero already handles data fetching — we are only changing the JSX/styling
- CatalogDiscovery already handles data fetching — we are only changing the JSX/styling
- ProductCard already handles cart and wishlist logic — we are only changing the JSX/styling
- CatalogNavbar already has a `navLinks` array — we are adding two new links

---

## 6. Step-by-Step Implementation

---

### Step 1: Update `CatalogNavbar.tsx` — Add Gender Nav Pills

**File:** `src/components/catalog/CatalogNavbar.tsx`

**Change only the `navLinks` array** (around line 106). Find:

```tsx
const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: 'Drops', href: '/drops' },
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
];
```

Replace with:

```tsx
const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Women', href: '/catalog/women' },
    { name: 'Men', href: '/catalog/men' },
    { name: 'Collections', href: '/collections' },
    { name: 'Drops', href: '/drops' },
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
];
```

**Then**, in the Desktop Nav Links section (around line 267), find the map over `navLinks`:

```tsx
{navLinks.map((link) => (
    <Link
        key={link.name}
        to={link.href}
        className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
    >
        {link.icon && <link.icon size={14} />}
        {link.name}
    </Link>
))}
```

Replace with:

```tsx
{navLinks.map((link) => {
    const isGender = link.name === 'Women' || link.name === 'Men';
    const isActive = location.pathname === link.href;
    return (
        <Link
            key={link.name}
            to={link.href}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 flex items-center gap-2 ${
                isGender
                    ? isActive
                        ? 'bg-gradient-to-r from-primary to-secondary text-white font-bold tracking-wide'
                        : 'text-white font-bold tracking-wide border border-white/20 hover:border-white/40 hover:bg-white/5'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
            }`}
        >
            {link.icon && <link.icon size={14} />}
            {link.name}
        </Link>
    );
})}
```

---

### Step 2: Rewrite `CatalogHero.tsx` — Editorial Banner

**File:** `src/components/catalog/CatalogHero.tsx`

Keep ALL data fetching logic unchanged (the `useEffect` that loads `featuredCollection`, `liveDrop`, `trendingSearches`).

Replace only the **return JSX** section. Find the `return (` statement (around line 94) and replace everything from `return (` to the closing `);` with:

```tsx
    return (
        <div className="mt-20 space-y-5 md:space-y-6">
            {/* ── HERO BANNER ────────────────────────────────────── */}
            {(featuredCollection || liveDrop) && (
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2.4rem] bg-black"
                    style={{ minHeight: '280px' }}
                >
                    {/* Grain texture overlay for editorial feel */}
                    <div
                        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* Red-pink gradient background mesh */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-secondary/20" />
                    <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/15 blur-[100px]" />
                    <div className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-secondary/15 blur-[80px]" />

                    {liveDrop ? (
                        <Link to={`/drops/${liveDrop.slug}`} className="relative z-20 block p-8 md:p-12 lg:p-16 group">
                            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                                <div>
                                    {/* Live pill */}
                                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                        </span>
                                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-red-400">
                                            Live Drop
                                        </span>
                                    </div>

                                    {/* Drop title in Bebas Neue */}
                                    <h2
                                        className="leading-none text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 900,
                                            fontSize: 'clamp(2.8rem, 6vw, 6rem)',
                                        }}
                                    >
                                        {liveDrop.title}
                                    </h2>

                                    <p
                                        className="mt-3 text-base italic text-white/50"
                                        style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                                    >
                                        {liveDrop.product_ids?.length || 0} exclusive pieces from independent labels
                                    </p>

                                    {/* Countdown timer */}
                                    {timeLeft && (
                                        <div className="mt-6 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-white/40" />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                    Ends in
                                                </span>
                                            </div>
                                            {[
                                                { val: timeLeft.hours, label: 'H' },
                                                { val: timeLeft.minutes, label: 'M' },
                                                { val: timeLeft.seconds, label: 'S' },
                                            ].map(({ val, label }) => (
                                                <div key={label} className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                                                        {String(val).padStart(2, '0')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/30">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 transition-all group-hover:bg-white/10 group-hover:border-white/30 self-start md:self-auto">
                                    <span
                                        className="text-sm font-bold uppercase tracking-[0.2em] text-white"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        Shop Drop
                                    </span>
                                    <ArrowRight size={16} className="text-white transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ) : featuredCollection ? (
                        <Link
                            to={`/catalog?collection=${featuredCollection.id}`}
                            className="relative z-20 block p-8 md:p-12 lg:p-16 group"
                        >
                            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p
                                        className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40"
                                    >
                                        Featured Collection
                                    </p>

                                    <h2
                                        className="leading-none text-white"
                                        style={{
                                            fontFamily: 'Montserrat, sans-serif',
                                            fontWeight: 900,
                                            fontSize: 'clamp(2.8rem, 6vw, 6rem)',
                                        }}
                                    >
                                        {featuredCollection.title}
                                    </h2>

                                    {featuredCollection.description && (
                                        <p
                                            className="mt-3 max-w-lg text-base italic text-white/50 line-clamp-2"
                                            style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 300 }}
                                        >
                                            {featuredCollection.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 transition-all group-hover:bg-white/10 group-hover:border-white/30 self-start md:self-auto">
                                    <span
                                        className="text-sm font-bold uppercase tracking-[0.2em] text-white"
                                        style={{ fontFamily: 'Instrument Serif, serif' }}
                                    >
                                        Explore
                                    </span>
                                    <ArrowRight size={16} className="text-white transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ) : null}
                </motion.div>
            )}

            {/* ── TRENDING SEARCHES ──────────────────────────────── */}
            {trendingSearches.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="rounded-[1.8rem] border border-white/8 bg-white/[0.025] px-6 py-5"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Flame size={16} className="text-primary" />
                        <p
                            className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40"
                        >
                            Trending Now
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((search, index) => (
                            <motion.button
                                key={search.term}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => handleTrendingClick(search.term)}
                                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                            >
                                {search.term}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
```

**Important:** Do NOT remove any import or any state/effect logic. Only replace the `return (...)` JSX block.

---

### Step 3: Rewrite `CatalogDiscovery.tsx` — Section Headers

**File:** `src/components/catalog/CatalogDiscovery.tsx`

Keep ALL data fetching logic. Only change the following two parts:

#### Part A — Section header for "Popular Right Now"

Find:
```tsx
<div className="mb-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
        <Sparkles size={20} className="text-primary" />
        <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
                Discovery
            </p>
            <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
                Popular Right Now
            </h2>
        </div>
    </div>
```

Replace with:
```tsx
<div className="mb-6 flex items-center justify-between">
    <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            Discovery
        </p>
        <h2
            className="leading-none text-white"
            style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
            Popular Right Now
        </h2>
    </div>
```

#### Part B — Section header for "Shop by Collection"

Find:
```tsx
<div className="mb-6 flex items-center gap-3">
    <Layers size={20} className="text-primary" />
    <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
            Curated
        </p>
        <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
            Shop by Collection
        </h2>
    </div>
</div>
```

Replace with:
```tsx
<div className="mb-6">
    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
        Curated
    </p>
    <h2
        className="leading-none text-white"
        style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}
    >
        Shop by Collection
    </h2>
</div>
```

#### Part C — Section header for "Shop by Brand"

Find:
```tsx
<div className="mb-6 flex items-center gap-3">
    <Store size={20} className="text-primary" />
    <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
            Brands
        </p>
        <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white">
            Shop by Brand
        </h2>
    </div>
</div>
```

Replace with:
```tsx
<div className="mb-6">
    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
        Brands
    </p>
    <h2
        className="leading-none text-white"
        style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)' }}
    >
        Shop by Brand
    </h2>
</div>
```

#### Part D — CollectionCard component

Find the `CollectionCard` return JSX. Find:
```tsx
<Link
    to={`/catalog?collection=${collection.id}`}
    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-white/20"
>
```

Replace with:
```tsx
<Link
    to={`/catalog?collection=${collection.id}`}
    className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/10 via-black to-secondary/10 p-6 transition-all hover:-translate-y-1 hover:border-primary/30"
>
```

Find inside CollectionCard:
```tsx
<h3 className="mt-2 text-xl md:text-2xl font-black uppercase tracking-[-0.03em] text-white">
    {collection.title}
</h3>
```

Replace with:
```tsx
<h3
    className="mt-2 leading-none text-white"
    style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}
>
    {collection.title}
</h3>
```

---

### Step 4: Refine `ProductCard.tsx`

**File:** `src/components/catalog/ProductCard.tsx`

Only two targeted changes. Do NOT change any logic.

#### Change A — Seller name typography

Find:
```tsx
<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
    {product.seller_name || 'Juno Label'}
</p>
```

Replace with:
```tsx
<p
    className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80"
    style={{ fontFamily: 'Instrument Serif, serif', letterSpacing: '0.25em' }}
>
    {product.seller_name || 'Juno Label'}
</p>
```

#### Change B — Product title font

Find:
```tsx
<h2 className="mt-2 line-clamp-2 text-lg md:text-xl font-black uppercase tracking-[-0.03em] text-white">
    {product.title}
</h2>
```

Replace with:
```tsx
<h2
    className="mt-1 line-clamp-2 text-white"
    style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
        lineHeight: 1.05,
        letterSpacing: '0.01em',
    }}
>
    {product.title}
</h2>
```

---

## 7. Exact Logic Specification

### CatalogNavbar gender pills
- Women/Men links: `href="/catalog/women"` and `href="/catalog/men"`
- Active state: detected via `location.pathname === link.href`
- Active: gradient background `from-primary to-secondary`, white text, bold
- Inactive: border `border-white/20`, white text, bold, hover border `white/40`

### CatalogHero banner
- Minimum height `280px`
- Grain texture: inline SVG `feTurbulence` data URI, `opacity-[0.04]`
- Collection title: Bebas Neue, `clamp(2.8rem, 6vw, 6rem)`
- Description: Cormorant Garamond italic, weight 300
- Countdown: Bebas Neue digits, Cormorant labels

### CatalogDiscovery section headers
- All three sections: Bebas Neue `clamp(2rem, 4vw, 3rem)`, `leading-none`
- Eyebrow label: `text-[10px]`, `tracking-[0.3em]`, `text-white/30`
- Remove all Lucide icons from section headers (Sparkles, Layers, Store)

### ProductCard typography
- Seller name: Cormorant Garamond, `text-[10px]`, `tracking-[0.25em]`, `text-primary/80`
- Product title: Bebas Neue, `clamp(1.15rem, 2.2vw, 1.5rem)`, `line-height: 1.05`

---

## 8. UI Specification

### Navbar gender pills
- Render between "Home" and "Collections" in the desktop sub-nav row
- "Women" pill left, "Men" pill right of Women
- When active (on `/catalog/women` or `/catalog/men`): gradient pill

### Hero banner
- Dark base with red-pink gradient light mesh — no solid background fill
- Grain texture overlay for editorial magazine feel
- Collection title in Bebas Neue — large, condensed, dramatic
- Descriptive text in Cormorant Garamond italic — elegant contrast
- CTA pill: ghost button style (border + slight blur), slides right on hover

### Discovery sections
- Section labels: all-caps tiny eyebrow + Bebas Neue headline
- No Lucide icons in section headers (removed)
- CollectionCard: gradient border tint using primary/secondary instead of pure white

### Product cards
- Seller name: editorial typewriter feel (Cormorant + wide tracking)
- Product title: condensed Bebas Neue — fashion editorial not retail

---

## 9. Edge Cases

- If `featuredCollection` is null AND `liveDrop` is null: hero banner section does not render (existing behavior preserved)
- If `trendingSearches` is empty: trending section does not render (existing behavior preserved)
- If collections or popular products are empty: `CatalogDiscovery` returns null (existing behavior preserved)
- On mobile, navbar gender pills appear in the mobile menu via the existing `navLinks` map — no extra work needed
- ProductCard: `line-clamp-2` preserved so long titles don't break layout

---

## 10. Testing Instructions

1. Open `http://localhost:5173/catalog`
2. Verify Bebas Neue and Cormorant Garamond fonts load (check network tab — no 404 on font URLs)
3. Check the catalog hero section: if a collection or drop exists, headline should be in Bebas Neue, large, dramatic
4. Check desktop navbar sub-row: "Women" and "Men" pills should appear between Home and Collections
5. Click "Women" pill — should navigate to `/catalog/women`, pill should show gradient active state
6. On discovery mode, verify section headings ("Popular Right Now", "Shop by Collection") are in Bebas Neue
7. Verify product cards: seller name in Cormorant/small, product title in Bebas Neue condensed
8. Check mobile (375px): no overflow, product grid still 2 columns, all fonts readable

---

## 11. Definition of Done

- [ ] "Women" and "Men" nav pills appear in desktop catalog navbar
- [ ] Active gender pill shows gradient (primary → secondary)
- [ ] Hero banner uses Bebas Neue for headline, Cormorant for description
- [ ] Discovery section headers use Bebas Neue
- [ ] CollectionCard uses Bebas Neue for title, gradient border tint
- [ ] ProductCard seller name: Cormorant, wide tracking
- [ ] ProductCard title: Bebas Neue, condensed
- [ ] No broken layout on mobile
- [ ] No new npm dependencies added
- [ ] No console errors

---

## 12. Constraints

- Do NOT change any data fetching or state logic in any file
- Do NOT modify `CatalogPage.tsx`, `GenderCatalogPage.tsx`, `BrandList.tsx`, `ProductGrid.tsx`
- Do NOT add new npm packages
- Do NOT change routing
- Changes are styling-only (JSX structure, className, style props)
