# Plan: Product Page Redesign — Brand Guidelines Alignment

## 1. Objective

`CatalogProductPage` currently looks like a SaaS dashboard — stacked glass cards, generic layout, no editorial character. The hero at `/catalog` sets a strong visual tone (Montserrat 900 headlines, Instrument Serif subtitles, red-pink gradient, cinematic imagery). This plan rewrites the product page to feel like a fashion editorial, not a product form.

---

## 2. Surface

Website

---

## 3. Scale

Small

---

## 4. Scope

**Included:**
- Full layout restructure of `CatalogProductPage.tsx`
- Image gallery: vertical thumbnail strip (desktop), horizontal scroll (mobile)
- Typography overhaul: Montserrat 900 titles, Instrument Serif descriptions
- Inline product facts (no separate info cards)
- Brand identity block with link to brand's catalog
- Tighter Add to Cart integration (no extra card wrapper)
- Related products section visual upgrade

**Not included:**
- Any API changes
- `SizeGuideModal.tsx`
- Routing or navigation logic
- Cart drawer

---

## 5. Assumptions

- `framer-motion`, `lucide-react` are installed
- CSS variables `--color-primary` (red) and `--color-secondary` (pink) exist as Tailwind `primary` / `secondary`
- `Montserrat` and `Instrument Serif` are loaded in the project (already used in other components)
- The `CatalogProduct` type fields are unchanged: `title`, `seller_name`, `seller_logo`, `seller_id`, `description`, `short_description`, `images`, `pricing`, `options`, `variants`, `tags`, `categories`, `inventory`, `shipping_details`, `rating`, `review_count`, `product_type`, `is_featured`, `is_trending`

---

## 6. Step-by-Step Implementation

### Step 1 — Replace the main layout grid

File: `src/components/catalog/CatalogProductPage.tsx`

**Current:**
```tsx
<div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr]">
```

**Replace with:**
```tsx
<div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12 xl:gap-16">
```

Reason: `xl:` only kicks in at 1280px. `lg:` gives the two-column layout at 1024px (tablets in landscape).

---

### Step 2 — Redesign the image gallery (left column)

**Current structure:**
```
[main image box]
[4-column thumbnail row]
```

**Replace with:**
```
desktop: [vertical thumbnail strip LEFT] + [main image RIGHT]  
mobile:  [main image full width] + [horizontal thumbnail scroll below]
```

Replace the entire left column `motion.div` (currently lines ~173–188) with:

```tsx
<motion.div
  initial={{ opacity: 0, x: -24 }}
  animate={{ opacity: 1, x: 0 }}
  className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-4"
>
  {/* Main Image */}
  <div className="relative flex-1 overflow-hidden rounded-[2.4rem] border border-white/10 bg-black/40">
    <img
      src={selectedImage || getProductImage(product)}
      alt={product.title}
      className="aspect-[3/4] w-full object-cover lg:aspect-auto lg:h-full"
    />
    {/* Sold out overlay */}
    {!product.inventory?.in_stock && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <span className="rounded-full border border-white/30 bg-black/80 px-6 py-2.5 text-sm font-black uppercase tracking-[0.22em] text-white">
          Sold Out
        </span>
      </div>
    )}
    {/* Trending badge */}
    {product.is_trending && (
      <div className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-primary/30">
        Trending
      </div>
    )}
  </div>

  {/* Thumbnails — vertical strip on desktop, horizontal scroll on mobile */}
  {asArray(product.images).length > 1 && (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-0 lg:w-[72px]">
      {asArray(product.images).map((image) => (
        <button
          key={image}
          onClick={() => setSelectedImage(image)}
          className={`flex-shrink-0 overflow-hidden rounded-[1rem] border-2 transition-all ${
            selectedImage === image
              ? 'border-primary opacity-100'
              : 'border-transparent opacity-50 hover:opacity-80'
          }`}
          style={{ width: 64, height: 80 }}
        >
          <img src={image} alt={product.title} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  )}
</motion.div>
```

---

### Step 3 — Redesign the right column: product info

Replace the entire right column `motion.div` content (all the stacked cards) with a single flat editorial layout. No stacked glass cards.

```tsx
<motion.div
  initial={{ opacity: 0, x: 24 }}
  animate={{ opacity: 1, x: 0 }}
  className="flex flex-col gap-8"
>
  {/* ── BRAND + TYPE ── */}
  <div className="flex items-center gap-3">
    <a
      href={`/catalog/women?brand=${product.seller_id}`}
      className="group flex items-center gap-2.5"
    >
      {product.seller_logo ? (
        <img
          src={product.seller_logo}
          alt={product.seller_name}
          className="h-8 w-8 rounded-full object-cover border border-white/10"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
          <span className="text-[10px] font-black text-primary">
            {product.seller_name?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span
        className="text-sm font-bold uppercase tracking-[0.2em] text-primary/80 group-hover:text-primary transition-colors"
        style={{ fontFamily: 'Instrument Serif, serif' }}
      >
        {product.seller_name}
      </span>
    </a>
    {product.product_type && (
      <>
        <span className="text-white/20">·</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
          {product.product_type}
        </span>
      </>
    )}
  </div>

  {/* ── TITLE ── */}
  <div>
    <h1
      className="leading-[0.92] text-white"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 900,
        fontSize: 'clamp(2.2rem, 4vw, 4rem)',
        letterSpacing: '-0.03em',
      }}
    >
      {product.title}
    </h1>

    {/* Rating inline under title */}
    {product.rating && (
      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={star <= Math.round(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-white/50">
          {product.rating.toFixed(1)} · {product.review_count || 0} reviews
        </span>
      </div>
    )}
  </div>

  {/* ── PRICE ── */}
  <div className="flex items-baseline gap-3">
    <p
      className="font-black text-white"
      style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}
    >
      {formatCurrency(selectedVariant?.price ?? product.pricing.discounted_price ?? product.pricing.price)}
    </p>
    {product.pricing.compare_at_price && (
      <p className="text-lg text-neutral-500 line-through">
        {formatCurrency(product.pricing.compare_at_price)}
      </p>
    )}
    {product.pricing.discounted && product.pricing.compare_at_price && (
      <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-black text-red-400">
        {Math.round(((product.pricing.compare_at_price - (product.pricing.discounted_price || product.pricing.price)) / product.pricing.compare_at_price) * 100)}% off
      </span>
    )}
  </div>

  {/* ── DIVIDER ── */}
  <div className="h-px bg-white/8" />

  {/* ── DESCRIPTION ── */}
  {(product.short_description || product.description) && (
    <p
      className="text-base leading-relaxed text-white/65"
      style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.05rem' }}
    >
      {product.short_description || product.description}
    </p>
  )}

  {/* ── OPTIONS ── */}
  {asArray(product.options).length > 0 && (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/40">Options</p>
        <button
          onClick={() => setShowSizeGuide(true)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:text-white"
        >
          <Ruler size={13} />
          Size Guide
        </button>
      </div>
      {asArray(product.options).map((option) => (
        <div key={option.name}>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-white/70">{option.name}</p>
          <div className="flex flex-wrap gap-2">
            {asArray(option.values).map((value) => {
              const isActive = selectedOptions[option.name] === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelectedOptions((curr) => ({ ...curr, [option.name]: value }))}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {isActive && <Check size={13} />}
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )}

  {/* ── QUANTITY + ADD TO BAG ── */}
  <div ref={mainCTARef} className="space-y-4">
    {/* Quantity */}
    <div className="flex items-center gap-4">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/40">Qty</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center text-xl font-black text-white">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors hover:bg-white/10"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>

    {/* Add to Bag */}
    <button
      onClick={handleAddToCart}
      disabled={!product.inventory?.in_stock || isAdding}
      className="relative inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <AnimatePresence mode="wait">
        {showAddedFeedback ? (
          <motion.span key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Check size={18} /> Added to Bag
          </motion.span>
        ) : (
          <motion.span key="add" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <ShoppingBag size={18} /> {isAdding ? 'Adding…' : 'Add to Bag'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>

    {showAddedFeedback && (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShowAddedFeedback(false)}
        className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        Continue Shopping
      </motion.button>
    )}

    {!product.inventory?.in_stock && (
      <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-red-400">
        Currently out of stock
      </p>
    )}
  </div>

  {/* ── INLINE FACTS (no cards) ── */}
  <div className="h-px bg-white/8" />
  <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
    <div>
      <dt className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Availability</dt>
      <dd className="mt-1.5 text-sm font-bold text-white">
        {product.inventory?.in_stock
          ? `In stock · ${product.inventory.available_quantity ?? 0} left`
          : 'Out of stock'}
      </dd>
    </div>
    <div>
      <dt className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Shipping</dt>
      <dd className="mt-1.5 text-sm font-bold text-white">
        {product.shipping_details?.free_shipping
          ? 'Free shipping'
          : product.shipping_details?.estimated_delivery_days
          ? `${product.shipping_details.estimated_delivery_days}d delivery`
          : 'Standard'}
      </dd>
    </div>
    {asArray(product.categories).length > 0 && (
      <div>
        <dt className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Category</dt>
        <dd className="mt-1.5 text-sm font-bold text-white">{product.categories[0].name}</dd>
      </div>
    )}
  </dl>

  {/* ── TAGS ── */}
  {asArray(product.tags).length > 0 && (
    <div className="flex flex-wrap gap-2">
      {asArray(product.tags).slice(0, 6).map((tag) => (
        <span key={tag} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
          {tag}
        </span>
      ))}
    </div>
  )}

  {/* ── SOCIAL PROOF ── */}
  <div className="flex items-center gap-2 text-sm text-green-400/80">
    <Users size={14} />
    <span className="font-semibold">{viewersCount} people viewing this right now</span>
  </div>
</motion.div>
```

---

### Step 4 — Redesign related products section

Replace the related products section (currently lines ~393–415) with:

```tsx
{related.length > 0 && (
  <section className="mt-20 border-t border-white/8 pt-16">
    <div className="mb-8">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">You may also like</p>
      <h2
        className="leading-none text-white"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}
      >
        Related Pieces
      </h2>
    </div>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {related.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
        >
          <Link
            to={`/catalog/${item.id}`}
            className="group block overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
          >
            <div className="relative overflow-hidden">
              <img
                src={getProductImage(item)}
                alt={item.title}
                className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-3.5">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80"
                style={{ fontFamily: 'Instrument Serif, serif' }}
              >
                {item.seller_name}
              </p>
              <h3
                className="mt-1 line-clamp-2 text-white"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '1rem', lineHeight: 1.1 }}
              >
                {item.title}
              </h3>
              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
                <span className="text-sm font-black text-white">
                  {formatCurrency(item.pricing.discounted_price ?? item.pricing.price)}
                </span>
                <ArrowRight size={13} className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white/70" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </section>
)}
```

---

### Step 5 — Remove the unused `Search` import

The `Search` icon from `lucide-react` is no longer used after the options section rewrite. Remove it from the import line:

```tsx
// Remove Search from this import:
import { ArrowLeft, ArrowRight, Check, Store, ShoppingBag, Minus, Plus, Star, Users, Ruler } from 'lucide-react';
```

Also remove the `Store` icon if `related` section no longer uses it (check — the new related section doesn't use `Store`). Remove `Store` too.

Final import:
```tsx
import { ArrowLeft, ArrowRight, Check, ShoppingBag, Minus, Plus, Star, Users, Ruler } from 'lucide-react';
```

---

## 7. Exact Logic Specification

### Image gallery
- Desktop: `flex-row-reverse` — thumbnails are a `w-[72px]` vertical strip on the LEFT, main image fills the rest on the RIGHT
- Mobile: `flex-col` — main image full width on top, thumbnails in horizontal scroll row below
- Thumbnail active state: `border-primary opacity-100`, inactive: `border-transparent opacity-50`
- Main image: `aspect-[3/4]` on mobile, `h-full` (fills the lg grid row) on desktop

### Price + discount
- Show discount pill only if `pricing.discounted && pricing.compare_at_price` both exist
- Discount percentage formula: `Math.round(((compare_at_price - final_price) / compare_at_price) * 100)`

### Options
- Active option: gradient button (`from-primary to-secondary`)
- Inactive: ghost button (`border-white/10 bg-white/5`)
- Check icon only when active

### Inline facts
- `grid-cols-2 sm:grid-cols-3` — no separate card boxes
- Availability: shows unit count if in stock: "In stock · 4 left"
- Shipping: "Free shipping" if `free_shipping` true, else `Xd delivery` if days exist, else "Standard"
- Category: only renders the 3rd fact if `categories[0]` exists

---

## 8. UI Specification

### Overall
- No stacked glass cards on the right column — flat editorial layout with divider lines (`h-px bg-white/8`)
- Typography hierarchy: brand name (Instrument Serif small caps) → title (Montserrat 900 large) → price (Montserrat 900 medium) → description (Instrument Serif body) → facts (uppercase mono labels + bold values)

### Image column
- Main image: `rounded-[2.4rem] border border-white/10`
- Thumbnails: `rounded-[1rem]` with `border-2 border-primary` active, `border-transparent opacity-50` inactive
- Sold Out overlay: `bg-black/60 backdrop-blur-sm` with centered pill badge

### Brand block
- Avatar circle `h-8 w-8 rounded-full` — logo image or initial letter on `bg-primary/10`
- Brand name: Instrument Serif small, primary color, hover darkens

### Add to Bag button
- Full width, `rounded-full`, `bg-gradient-to-r from-primary to-secondary`
- `py-4` (slightly less than current `py-5` — more proportional)
- `hover:scale-[1.02]` keep the lift effect

### Related products
- `grid-cols-2 md:grid-cols-4`
- Section header: eyebrow label + Montserrat 900 "Related Pieces"
- Cards: same style as ProductGrid redesign (Plan 2)

---

## 9. Edge Cases

- `product.images` empty → main image falls back to `getProductImage()` → `/juno_app_icon.png`; thumbnail strip not rendered (condition: `asArray(product.images).length > 1`)
- `product.options` empty → options section not rendered
- `product.seller_logo` missing → initials avatar
- `product.rating` is null/undefined → rating row not rendered
- `product.categories` empty → 3rd fact cell not rendered
- `product.pricing.compare_at_price` missing → no strikethrough price, no discount pill
- `product.tags` empty → tags section not rendered
- `related` empty → related section not rendered (unchanged)

---

## 10. Testing Instructions

1. Open any product page (e.g. `/catalog/[some-product-id]`)
2. Verify on desktop (≥1024px):
   - Two-column layout (image left, info right)
   - Thumbnail strip is vertical on the left side of the main image
   - Main image is tall, fills the row height
   - No stacked glass cards on the right — flat layout with divider lines
   - Brand name + avatar at the top with primary color
   - Title in large Montserrat 900
   - Price bold, discount pill shown for sale items
   - Option buttons use gradient when active
   - Inline facts grid (no separate info cards)
3. Verify on mobile (< 768px):
   - Single column
   - Main image full width with `aspect-[3/4]`
   - Thumbnail strip is a horizontal scroll row below main image
   - All content scrolls naturally
   - Sticky "Add to Bag" bar appears when CTA scrolls off screen
4. Click a thumbnail → main image updates
5. Select an option → button turns gradient red-pink
6. Click "Add to Bag" → gradient button shows "Added to Bag" with check icon
7. Scroll related products → verify 2-column mobile, 4-column desktop grid

---

## 11. Definition of Done

- [ ] No stacked glass card boxes on the product info column
- [ ] Brand identity block (avatar + name) at top of info column
- [ ] Montserrat 900 product title
- [ ] Instrument Serif description text
- [ ] Vertical thumbnail strip on desktop, horizontal scroll on mobile
- [ ] Active option uses red-pink gradient
- [ ] Inline facts (no info cards)
- [ ] Related products use brand-aligned card style
- [ ] No TypeScript errors
- [ ] No unused imports (`Search`, `Store` removed)

---

## 12. Constraints

- Do NOT modify `SizeGuideModal.tsx`
- Do NOT modify any API files or hooks
- Do NOT add new npm dependencies
- Do NOT change routing, navigation, or cart logic
