# Juno E-Commerce Integration Plan

## Context

The Juno website has a complete backend API for guest commerce (`GuestCommerce` namespace in `commerceApi.ts`) and a full product catalog (`catalogApi.ts`), but the frontend currently has **no shopping functionality** — no cart, no checkout, no order tracking. The catalog pages (`CatalogPage.tsx`, `CatalogProductPage.tsx`) exist but are browse-only with no add-to-cart buttons.

**Goal:** Turn the website into a functional guest e-commerce storefront optimized for conversion on performance marketing traffic. Follow the local-first, optimistic cart architecture described in `docs/client_implementation.md`.

---

## Architecture Summary

```
GuestCartProvider (context + localStorage persistence)
  ├── Navbar (cart icon + count badge)
  ├── CartDrawer (slide-out sheet, not full page)
  ├── CatalogProductPage (+ Add to Cart button)
  ├── CatalogPage (+ quick-add buttons on cards)
  ├── CheckoutPage (one-page guest checkout)
  ├── OrderConfirmationPage (thank-you)
  └── OrderTrackingPage (lookup by phone/email)
```

---

## Implementation Steps

### Step 1: Guest Cart Context & Local Storage Layer
**File:** `src/contexts/GuestCartContext.tsx`

Create the core cart state management following `docs/client_implementation.md`:

- **State:** `optimisticCart` (what UI renders), `persistedCart` (last server-confirmed), `operationQueue` (pending mutations), `syncState` (idle/dirty/syncing/error)
- **Persistence:** `localStorage` keys: `juno_guest_cart_id`, `juno_guest_cart_snapshot`, `juno_guest_cart_ops`
- **Cookie:** Set `guest_cart_id` as a first-party cookie (`SameSite=Lax`, `Secure` in prod, 14-day expiry) for cross-tab continuity
- **Actions exposed via context:**
  - `addItem(product_id, variant_id, quantity, price)` — optimistic update + queue op
  - `removeItem(product_id, variant_id)` — optimistic remove + queue op
  - `updateQuantity(product_id, variant_id, newQty)` — converted to add/remove delta
  - `clearCart()` — post-checkout cleanup
  - `itemCount` — derived from optimisticCart
  - `cartTotal` — derived optimistic total
  - `syncState` — for subtle UI indicators
- **Background sync:** Serialized flush worker with coalescing, exponential backoff retry, reconciliation after flush per the doc
- **API calls:** `GuestCommerce.addToCart`, `GuestCommerce.removeFromCart`, `GuestCommerce.getCart`

### Step 2: Add to Cart on Product Detail Page
**File:** `src/components/catalog/CatalogProductPage.tsx` (modify)

- Add a prominent "Add to Bag" button below the product options section
- Button uses `from-primary to-secondary` gradient, full-width on mobile
- On click: calls `addItem` from `GuestCartContext`, shows instant success feedback (checkmark animation), opens cart drawer
- Disable button if out of stock (`product.inventory?.in_stock === false`)
- Show selected variant price dynamically
- Add quantity selector (simple +/- stepper, default 1)

### Step 3: Cart Drawer (Slide-out Sheet)
**File:** `src/components/cart/CartDrawer.tsx` (new)

- Slide-in from right, dark glass-morphism panel matching existing design language (`bg-black/60 backdrop-blur-xl border-white/10 rounded-2xl`)
- Renders from `optimisticCart` — always instant
- Each item row: product image thumbnail, title, seller name, variant info, price, quantity stepper, remove button
- Footer: subtotal, item count, "Checkout" CTA button (gradient `from-primary to-secondary`), subtle sync indicator when `syncState !== 'idle'`
- Empty state: "Your bag is empty" with link back to catalog
- Animated with `framer-motion` (slide + fade)
- Controlled via `isCartOpen` / `setCartOpen` in GuestCartContext

### Step 4: Navbar Cart Icon
**File:** `src/components/Navbar.tsx` (modify)

- Add a `ShoppingBag` icon from lucide-react next to the existing CTA buttons
- Show item count badge (red dot with number) when `itemCount > 0`
- On click: toggle `CartDrawer`
- Badge animates on count change (scale pop via framer-motion)
- Also add "Shop" link to `navLinks` array pointing to `/catalog`

### Step 5: Quick Add on Catalog Grid
**File:** `src/components/catalog/CatalogPage.tsx` (modify)

- Add a small "Add to Bag" button overlay on each product card (appears on hover, always visible on mobile)
- Uses first variant as default — no variant selection needed for quick-add
- Shows brief toast/checkmark on success
- Keeps existing card layout, just layers the button on the image area

### Step 6: One-Page Guest Checkout
**File:** `src/components/checkout/CheckoutPage.tsx` (new)

Single-page layout with three sections stacked vertically:

**Section 1 — Order Summary**
- List of cart items (read-only, from optimisticCart)
- Subtotal, shipping estimate, total

**Section 2 — Delivery Details**
- Required: `full_name`, `phone_number`, `address_line1`, `city`
- Optional: `email` (marked as "for receipt"), `address_line2`, `province`, `postal_code`
- Country defaults to Pakistan (hidden field)
- Debounced autosave to `GuestCommerce.saveCustomerDetails` (500ms debounce)
- Local persistence of form draft on every keystroke

**Section 3 — Place Order CTA**
- Payment method: COD (Cash on Delivery) as primary — this is standard for Pakistan e-commerce
- Single "Place Order" button — the ONLY blocking network call
- Flow: flush cart queue → flush customer details → `GuestCommerce.checkout` → redirect to confirmation
- Inline validation, no multi-step wizard

**Route:** `/checkout`

### Step 7: Order Confirmation Page
**File:** `src/components/checkout/OrderConfirmationPage.tsx` (new)

- Shown immediately after successful checkout
- Displays order ID, items ordered, total, delivery address
- "Track Your Order" link to `/track`
- "Continue Shopping" link to `/catalog`
- Confetti or subtle success animation
- Data rendered from locally persisted order (not a network fetch)

**Route:** `/checkout/confirmation`

### Step 8: Order Tracking Page
**File:** `src/components/checkout/OrderTrackingPage.tsx` (new)

- Simple form: phone number input (primary), email fallback toggle
- Calls `GuestCommerce.lookupOrders`
- Displays order cards with status, items, date, total
- Prefills from last checkout phone/email if available in localStorage

**Route:** `/track`

### Step 9: Route Registration & Provider Wiring
**File:** `src/App.tsx` (modify)

- Wrap `RoutedApp` content with `<GuestCartProvider>`
- Add routes: `/checkout`, `/checkout/confirmation`, `/track`
- Add `<CartDrawer />` inside the provider (renders globally)

### Step 10: Landing Page Integration
**File:** `src/components/landing/CatchyProducts.tsx` (modify, if applicable)

- If this component shows real products from the catalog API, add quick-add buttons
- Link "Shop All" CTA to `/catalog`

---

## Files Modified (existing)
| File | Change |
|------|--------|
| `src/App.tsx` | Add GuestCartProvider, CartDrawer, new routes |
| `src/components/Navbar.tsx` | Add cart icon + badge + "Shop" link |
| `src/components/catalog/CatalogProductPage.tsx` | Add to cart button, quantity selector |
| `src/components/catalog/CatalogPage.tsx` | Quick-add overlay on product cards |

## Files Created (new)
| File | Purpose |
|------|---------|
| `src/contexts/GuestCartContext.tsx` | Cart state, persistence, sync engine |
| `src/components/cart/CartDrawer.tsx` | Slide-out cart sheet |
| `src/components/checkout/CheckoutPage.tsx` | One-page guest checkout |
| `src/components/checkout/OrderConfirmationPage.tsx` | Post-purchase thank-you |
| `src/components/checkout/OrderTrackingPage.tsx` | Guest order lookup |

---

## Design Language Reference
All new components follow the established Juno aesthetic:
- **Background:** `bg-background` (#0A0A0A), glass cards with `bg-white/[0.03] border-white/10 rounded-[1.6rem]`
- **Labels:** `text-[10px] font-mono uppercase tracking-[0.22em] text-white/35`
- **Headings:** `font-black uppercase tracking-[-0.04em]`
- **Primary CTA:** `bg-gradient-to-r from-primary to-secondary` rounded-full
- **Secondary CTA:** `border-white/10 bg-white/[0.04]` rounded-full
- **Animations:** framer-motion `initial/animate` patterns with staggered delays
- **Cards:** `rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5`

---

## API Endpoints Used
| Endpoint | Method | Used In |
|----------|--------|---------|
| `GuestCommerce.getCart` | GET | Cart hydration on load |
| `GuestCommerce.addToCart` | POST | PDP, catalog quick-add |
| `GuestCommerce.removeFromCart` | DELETE | Cart drawer |
| `GuestCommerce.saveCustomerDetails` | PUT | Checkout autosave |
| `GuestCommerce.checkout` | POST | Checkout submit |
| `GuestCommerce.lookupOrders` | POST | Order tracking |
| `Catalog.getProduct` | GET | PDP |
| `Catalog.getProducts` | GET | Catalog grid |
| `Catalog.filterProducts` | POST | Catalog filtering |
| `Catalog.getFilters` | GET | Filter sidebar |

---

## Verification
1. `npm run dev` — app loads without errors
2. Browse `/catalog`, click a product, select options, click "Add to Bag" — cart drawer opens with item
3. Add multiple items from different brands, verify count badge in navbar
4. Refresh page — cart persists from localStorage
5. Open `/checkout` — form renders with cart summary, fill details, place order (COD)
6. Confirmation page shows order details
7. `/track` — enter phone number, see order
8. Test on mobile viewport — responsive layout, sticky CTAs
