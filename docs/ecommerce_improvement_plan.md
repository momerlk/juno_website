# Juno E-Commerce Improvement Plan

## Current State Assessment

The e-commerce integration is functional — guest cart context, cart drawer, checkout, order confirmation, and order tracking are all wired up. The catalog pages (`CatalogPage.tsx`, `CatalogProductPage.tsx`) work but have significant room for improvement in design, UX, and conversion optimization.

### What Works
- Guest cart with optimistic updates and localStorage persistence
- Add-to-cart on PDP with quantity selector and variant selection
- Quick-add overlay on catalog grid cards
- One-page guest checkout with autosave
- Order confirmation and tracking pages
- Filter sidebar (category, color, size) with search

### What Needs Improvement

---

## Part 1: Catalog Page (`/catalog`) — Design Overhaul

The current catalog page is a **plain grid with a search bar and filters**. It loads directly into a uniform product grid with no visual hierarchy, no storytelling, and no conversion hooks. For a brand like Juno — which positions itself as the home of Pakistan's indie brands — this page should feel like walking into a curated concept store, not browsing a spreadsheet.

### Problem 1: No Visual Hierarchy on Initial Load

**Current:** User lands on `/catalog` and immediately sees a flat grid of identical product cards. There's no focal point, no featured content, no reason to stop scrolling.

**Fix:** Add a **hero zone** at the top of the catalog page that rotates between high-impact content before the grid starts:

- **Featured Collection Banner** — Full-width cinematic banner showcasing a curated collection (e.g., "Summer Essentials", "New Arrivals This Week"). Uses `Catalog.getCollections()` to pull the highest-priority active collection. Links to `/catalog?collection={slug}`.
- **Active Drop Countdown** — If a drop is `announced` or `live`, show a countdown/live banner with the drop image, brand name, and product count. Uses `Catalog.getDrops({ status: 'live' })`. Creates urgency.
- **Trending Searches Ribbon** — A horizontal scroll of trending search pills below the hero. Uses `Catalog.getTrendingSearches()`. Clicking a pill populates the search bar and filters results instantly.

**Files:** `src/components/catalog/CatalogPage.tsx` (modify), `src/components/catalog/CatalogHero.tsx` (new)

### Problem 2: No Curated Entry Points

**Current:** The only discovery mechanism is search + category filters. Users have to know what they want.

**Fix:** Add **curated discovery sections** above the main grid when no filters are active (i.e., on initial load of `/catalog`):

- **"Popular Right Now"** — Horizontal scrollable row of 8-12 products from `Catalog.getPopularProducts()`. Uses the same card style as CatchyProducts on the landing page (larger cards with brand story snippets).
- **Collections Grid** — 2-3 collection cards in a masonry/bento layout. Each card shows collection image, title, product count. Uses `Catalog.getCollections()`. Clicking filters the grid to that collection's products.
- **Brand Storefronts Shortcuts** — Small horizontal scroll of brand logos/avatars. Clicking one filters to `seller_id`. Uses brand data already available from products.

When any filter is active, these sections collapse and the full grid takes over. This creates a **two-mode** experience: browse mode (discovery) and search mode (intent).

**Files:** `src/components/catalog/CatalogDiscovery.tsx` (new), `src/components/catalog/CollectionCard.tsx` (new)

### Problem 3: Product Cards Lack Personality

**Current:** Every card is identical — image, brand name, title, category tags, price. There's no visual differentiation between a Rs 1,999 tee and a Rs 12,000 handcrafted jacket.

**Fix:**
- **Discount Badge** — Show percentage off when `pricing.discounted` is true, using `pricing.discount_value`. Red badge with bold text.
- **"New" Badge** — Show on products created within the last 7 days (compare `created_at` to current date if available, or use `is_featured` flag).
- **Brand Logo Micro-Avatar** — Small circular brand logo next to seller_name (use `seller_logo` field from CatalogProduct type).
- **Rating Stars** — Show if `rating` exists. Even partial stars (e.g., 4.2) add trust.
- **Free Shipping Tag** — Small tag if `shipping_details.free_shipping` is true.
- **Image Hover: Second Image** — On hover, swap to the second image in the `images` array if available. Gives a feel for the product without clicking.
- **Sold Out Overlay** — Semi-transparent overlay with "Sold Out" text when `inventory.in_stock === false`. Currently the quick-add button says "Out of Stock" but the card itself gives no visual signal.

**Files:** `src/components/catalog/CatalogPage.tsx` (modify), `src/components/catalog/ProductCard.tsx` (new — extract card into its own component for reuse)

### Problem 4: Search Is Basic

**Current:** Search is a plain text input with no autocomplete. User types, entire product list reloads on every keystroke (via `useSearchParams` changes triggering the effect).

**Fix:**
- **Autocomplete Dropdown** — Use `Catalog.autocomplete(q)` with a 200ms debounce. Show a dropdown of suggestions below the search bar. Selecting one applies it as the search query.
- **Debounced Search** — Currently every keystroke in the search input triggers `updateSearchParam('q', ...)` which triggers the product fetch effect. Add a 400ms debounce before updating the URL param, to avoid hammering the API on fast typing.
- **Search Result Count in Real-Time** — Show "Searching..." while debounce is active, then "42 results" when loaded.
- **Recent Searches** — Store last 5 searches in localStorage. Show them in the autocomplete dropdown when the input is focused but empty.

**Files:** `src/components/catalog/CatalogPage.tsx` (modify), `src/components/catalog/SearchBar.tsx` (new)

### Problem 5: No Pagination / Infinite Scroll

**Current:** Hardcoded `limit: 48`. If there are more than 48 products, the user never sees them.

**Fix:**
- **Infinite Scroll** — Use `IntersectionObserver` on a sentinel element at the bottom of the grid. When visible, fetch the next page (`page` param +1) and append to the products array.
- **"Load More" Button Fallback** — Below the grid, show a manual "Load More" button for users who prefer explicit control.
- **Page Counter** — "Showing 48 of 312 products" in the results summary bar.

**Files:** `src/components/catalog/CatalogPage.tsx` (modify)

### Problem 6: Mobile Filter UX Is Clunky

**Current:** Mobile filters open as a full-screen overlay with no animation, no backdrop click-to-close, and the panel takes the entire screen width.

**Fix:**
- **Animated Slide-In** — Use framer-motion `AnimatePresence` for the mobile filter panel (slide from left, fade backdrop).
- **Applied Filters Preview** — Show active filter chips below the search bar on mobile so users can see and remove filters without opening the panel.
- **Filter Counts** — Show product count next to each filter option (e.g., "Black (23)"). Requires backend support or client-side counting from loaded products.

**Files:** `src/components/catalog/CatalogPage.tsx` (modify)

---

## Part 2: Product Detail Page (`/catalog/:productId`) — Conversion Optimization

### Problem 7: No Social Proof

**Current:** No reviews, no ratings display, no "X people bought this" indicators.

**Fix:**
- **Rating Display** — Show star rating and review count prominently near the price if `rating` and `review_count` fields are populated.
- **"X people are viewing this"** — Fake or real social proof indicator (common e-commerce pattern). Can be randomized client-side for now.
- **Brand Trust Badge** — Link to brand storefront page using `Catalog.getBrandStorefront(seller_id)`. Show "Verified Indie Brand on Juno" badge.

**Files:** `src/components/catalog/CatalogProductPage.tsx` (modify)

### Problem 8: No Sticky Add-to-Cart on Mobile

**Current:** The "Add to Bag" button is inside a card that scrolls out of view as the user reads the description.

**Fix:**
- **Sticky Bottom Bar (Mobile)** — On viewports < 1024px, show a fixed bottom bar with: price, "Add to Bag" button. Appears when the main CTA scrolls out of the viewport (use IntersectionObserver).
- **Compact Variant Selector in Sticky Bar** — If the product has size options, show a compact size selector in the sticky bar so users don't have to scroll back up.

**Files:** `src/components/catalog/CatalogProductPage.tsx` (modify)

### Problem 9: Image Gallery Is Bare

**Current:** Single large image with thumbnail row below. No zoom, no fullscreen, no swipe on mobile.

**Fix:**
- **Pinch-to-Zoom / Click-to-Zoom** — On click, open a fullscreen lightbox with the image. On mobile, support swipe between images.
- **Image Counter** — "2 / 5" indicator on the main image area.
- **Video Support** — If any item in `images` array is a video URL, render it as an auto-playing muted video thumbnail.

**Files:** `src/components/catalog/CatalogProductPage.tsx` (modify), `src/components/catalog/ImageGallery.tsx` (new)

### Problem 10: No Size Guide

**Current:** No size guide anywhere on the PDP.

**Fix:**
- **Size Guide Modal** — A "Size Guide" link next to the size selector that opens a modal with a simple table (S/M/L/XL mapped to chest/length measurements). Initially can be a generic guide; later can be brand-specific.

**Files:** `src/components/catalog/SizeGuideModal.tsx` (new)

---

## Part 3: Conversion & Engagement Features

### Problem 11: No Wishlist / Save for Later

**Current:** No way to bookmark products without adding to cart.

**Fix:**
- **Heart Icon on Product Cards** — Toggle saves product ID to localStorage. Show filled heart when saved.
- **"/wishlist" Page** — Simple page that loads saved product IDs from localStorage and fetches their details from `Catalog.getProduct()`.
- **Persistent across sessions** — localStorage-backed, no auth required.

**Files:** `src/components/catalog/WishlistButton.tsx` (new), `src/components/catalog/WishlistPage.tsx` (new)

### Problem 12: No "You May Also Like" on Cart Drawer

**Current:** Cart drawer shows items and checkout button. No upsell.

**Fix:**
- **Related Products Row** — In the cart drawer, below the items list, show 2-3 related products based on the first cart item. Uses `Catalog.getRelatedProducts()`. Small horizontal scroll with "Add" buttons.

**Files:** `src/components/cart/CartDrawer.tsx` (modify)

### Problem 13: No Collections or Drops Pages

**Current:** The backend supports collections and drops with full CRUD, but there are no dedicated frontend pages for browsing them.

**Fix:**
- **`/collections` Page** — Grid of all active collections with images, titles, product counts. Uses `Catalog.getCollections()`.
- **`/collections/:slug` Page** — Collection detail with banner, description, and filtered product grid. Uses `Catalog.getCollection(slug)` and `Catalog.getCollectionProducts(slug)`.
- **`/drops` Page** — All active/upcoming drops with status badges (Announced, Live, Ended). Uses `Catalog.getDrops()`.
- **`/drops/:slug` Page** — Drop detail with countdown timer (if announced), products, and reminder signup. Uses `Catalog.getDrop(slug)` and `Catalog.setDropReminder()`.

**Files:** `src/components/catalog/CollectionsPage.tsx` (new), `src/components/catalog/CollectionDetailPage.tsx` (new), `src/components/catalog/DropsPage.tsx` (new), `src/components/catalog/DropDetailPage.tsx` (new)

### Problem 14: CatchyProducts Landing Section Uses Hardcoded Data

**Current:** `CatchyProducts.tsx` has 12 hardcoded products with Shopify CDN URLs, static prices, and hand-written brand stories. The "Discover" button doesn't link anywhere. The "Join the Community" CTA links to `/download`.

**Fix:**
- **Hybrid Approach** — Keep the editorial stories (they're good), but link each card to its actual PDP: `/catalog/{product_id}`. Add product IDs to the hardcoded data.
- **"Shop Now" CTA** — Change the bottom CTA from "Join the Community → /download" to "Shop All → /catalog".
- **Quick Add** — Add the same quick-add button from the catalog grid to these cards.
- **Future:** Replace with dynamic data from a "Featured" collection that editorial can manage via admin.

**Files:** `src/components/landing/CatchyProducts.tsx` (modify)

---

## Part 4: Backend Improvements (API Enhancements)

These are suggestions for backend changes that would significantly improve the frontend experience:

### B1: Search Autocomplete with Product Previews
**Current:** `GET /catalog/search/autocomplete?q=` returns `string[]` (just keywords).
**Improvement:** Return `{ suggestions: string[], products: CatalogProduct[] }` — the top 3-4 matching products alongside keyword suggestions. This enables a rich search dropdown with product thumbnails.

### B2: Cart Item Enrichment
**Current:** Cart items from `GuestCommerce.getCart()` return `{ product_id, variant_id, quantity, price }` with no product metadata. The frontend has to store `seller_name`, `product_title`, `variant_title`, `image_url` locally in the optimistic cart.
**Improvement:** Enrich cart responses with product metadata (title, image, seller_name, variant_title). This makes cart hydration from server more reliable and removes the need for client-side metadata caching.

### B3: Batch Cart Mutations
**Current:** No batch endpoint. Each add/remove is a separate HTTP call.
**Improvement:** `POST /commerce/guest/cart/sync` accepting an array of operations. Reduces network round-trips when the queue has multiple coalesced operations.

### B4: Product Count on Filter Options
**Current:** `GET /catalog/products/filters` returns filter values but not how many products match each value.
**Improvement:** Return counts alongside each filter option: `{ name: "Black", count: 23 }`. Enables filter counts in the sidebar without a separate request per filter.

### B5: Collection Product Count
**Current:** Collections don't include a `product_count` field.
**Improvement:** Add `product_count` to the Collection response. Avoids needing a separate request just to show "24 products" on a collection card.

### B6: Quantity Update Endpoint
**Current:** No `PATCH` for quantity. Client must calculate delta and send add/remove.
**Improvement:** `PATCH /commerce/guest/cart/items` with `{ product_id, variant_id, quantity }` for direct quantity set. Simplifies client logic.

### B7: Recently Viewed Tracking
**Current:** No endpoint to track or retrieve recently viewed products.
**Improvement:** `POST /catalog/products/{id}/view` (already tracked via probe) and `GET /catalog/products/recently-viewed` using session/guest identity. Enables a "Recently Viewed" section.

---

## Priority Order

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P0 | Catalog hero zone + curated discovery sections | High — transforms first impression | Medium |
| P0 | Product card improvements (badges, hover image, sold out) | High — instant visual upgrade | Low |
| P0 | Sticky add-to-cart on mobile PDP | High — direct conversion impact | Low |
| P1 | Search autocomplete with debounce | Medium — reduces friction | Low |
| P1 | Infinite scroll / pagination | Medium — unlocks full catalog | Low |
| P1 | Mobile filter animation + applied chips | Medium — mobile UX | Low |
| P1 | Extract ProductCard component | Medium — code quality, reuse | Low |
| P2 | Collections page + detail page | Medium — unlocks curated shopping | Medium |
| P2 | Drops page + detail page with countdown | Medium — creates urgency | Medium |
| P2 | Wishlist / save for later | Medium — engagement | Low |
| P2 | Image gallery zoom + fullscreen | Low-Medium — trust building | Medium |
| P2 | Cart drawer upsell row | Low — incremental AOV | Low |
| P3 | Size guide modal | Low — reduces returns | Low |
| P3 | CatchyProducts linking to real PDPs | Low — connects landing to shop | Low |
| P3 | Backend: autocomplete with previews (B1) | Medium — rich search | Backend |
| P3 | Backend: cart enrichment (B2) | Medium — reliability | Backend |
| P3 | Backend: batch cart sync (B3) | Low — performance | Backend |
| P3 | Backend: filter counts (B4) | Low — UX polish | Backend |

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/catalog/CatalogHero.tsx` | Hero zone with featured collection, active drop, trending searches |
| `src/components/catalog/CatalogDiscovery.tsx` | Popular products, collections grid, brand shortcuts |
| `src/components/catalog/ProductCard.tsx` | Extracted reusable product card with badges, hover image, rating |
| `src/components/catalog/CollectionCard.tsx` | Collection preview card for bento grid |
| `src/components/catalog/SearchBar.tsx` | Autocomplete-enabled search with debounce and recent searches |
| `src/components/catalog/ImageGallery.tsx` | Zoom, fullscreen, swipe image gallery for PDP |
| `src/components/catalog/SizeGuideModal.tsx` | Generic size guide modal |
| `src/components/catalog/WishlistButton.tsx` | Heart toggle with localStorage persistence |
| `src/components/catalog/WishlistPage.tsx` | Saved products page |
| `src/components/catalog/CollectionsPage.tsx` | `/collections` browse page |
| `src/components/catalog/CollectionDetailPage.tsx` | `/collections/:slug` detail page |
| `src/components/catalog/DropsPage.tsx` | `/drops` browse page |
| `src/components/catalog/DropDetailPage.tsx` | `/drops/:slug` detail with countdown + reminder |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/catalog/CatalogPage.tsx` | Hero zone, discovery sections, infinite scroll, debounced search, animated mobile filters, product card extraction |
| `src/components/catalog/CatalogProductPage.tsx` | Sticky mobile CTA, social proof, brand trust badge, image gallery upgrade |
| `src/components/cart/CartDrawer.tsx` | Related products upsell row |
| `src/components/landing/CatchyProducts.tsx` | Link cards to real PDPs, quick-add, update bottom CTA |
| `src/App.tsx` | New routes: `/collections`, `/collections/:slug`, `/drops`, `/drops/:slug`, `/wishlist` |
