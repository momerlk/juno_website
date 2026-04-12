# Seller Portal Testing Guide

A complete walkthrough of the seller flow from account creation to order fulfilment.

---

## Routes Reference

| Page | URL |
|------|-----|
| Studio Landing | `/studio` or `/seller` |
| Auth (Login / Register) | `/seller/auth` or `/studio/auth` |
| Dashboard Home | `/seller/dashboard` |
| Inventory | `/seller/dashboard/inventory` |
| Orders | `/seller/dashboard/orders` |
| Analytics | `/seller/dashboard/analytics` |
| Profile | `/seller/dashboard/profile` |

---

## Phase 1 — Account Creation & Onboarding

### 1.1 Landing Page
1. Navigate to `/studio`
2. Verify the Juno Studio landing page loads with brand messaging
3. Click **"Apply to Sell"** or **"Join Juno"** to proceed to auth

### 1.2 Registration
1. Navigate to `/seller/auth`
2. Select **Register** / **Sign Up** tab
3. Enter email and a strong password (strength indicator should appear)
4. Submit — you should be redirected to the onboarding flow

### 1.3 Seven-Step Onboarding Form

Work through each step. The form auto-saves a draft after Step 1 so you can resume if you leave.

| Step | Label | Key Fields |
|------|-------|------------|
| 01 | Your Access | Email, password |
| 02 | Your Story | Brand name, description, founding story |
| 03 | Your Territory | City / operating region |
| 04 | Your Identity | Brand logo, banner image (document uploads) |
| 05 | Your Earnings | Bank name, account title, account number, IBAN |
| 06 | The Commitment | Terms acknowledgement |
| 07 | Ready to Launch | Review & submit |

**Draft resume check:** Close the browser mid-form (after Step 1), return to `/seller/auth`, log back in — the app should offer to resume your draft from where you left off.

**Validation checks to test:**
- Leave required fields blank and click Next — step should not advance
- Enter a weak password — the strength meter should warn you
- Skip IBAN on Step 05 — form should block progression

### 1.4 Post-Submission (Pending Approval)
- After submitting, the seller lands in a **pending approval** state
- Dashboard should display a "waiting for approval" message
- Approval is handled via the Admin portal (`/admin`) — approve the seller there
- Expected approval time shown to seller: **48 hours**

---

## Phase 2 — First Login & Dashboard

1. Once approved, log in at `/seller/auth`
2. You should land on `/seller/dashboard` (SellerHome)
3. Verify the sidebar is visible with links: Home, Inventory, Orders, Analytics, Profile
4. Check that the welcome/home screen shows brand-level stats (not generic metrics)

---

## Phase 3 — Adding Products to the Queue

Products enter a **Product Queue** before going live. This is the staging area.

### 3.1 Manual Product Creation
1. Go to **Inventory** (`/seller/dashboard/inventory`)
2. The page defaults to the **Active** tab — switch to the **Queue** tab
3. Click **"Add Product"** (or equivalent CTA)
4. The **ProductEditor** opens — fill in:
   - Product name *(required)*
   - Price *(required)*
   - Quantity / stock *(required)*
   - Images, description, sizes *(optional but recommended)*
5. Save — the product should appear in the Queue with status `draft` or `embedding_pending`

### 3.2 Shopify Import (Alternative)
1. On the Inventory page look for **"Import from Shopify"**
2. If Shopify integration is connected, products sync automatically
3. If integration is not working, use **"Scrape from Shopify"** (direct scrape fallback via `ShopifyScrape`)
4. Imported products appear in the Queue for review before going live

### 3.3 Queue Status States

| Status | Meaning |
|--------|---------|
| `draft` | Saved but incomplete |
| `embedding_pending` | Being processed by AI enrichment |
| `enrichment_pending` | Metadata enrichment in progress |
| `ready` | All checks passed — eligible for promotion |
| `failed` | Missing required fields or API error |

**Check queue issues:** Cards with `failed` status should show a list of missing fields or API errors inline.

---

## Phase 4 — Promoting Products to Live Inventory

1. In the **Queue** tab, find a product with status **`ready`** (green badge)
2. Click **"Promote"** on the product card
3. The product should disappear from the Queue and appear in the **Active** tab
4. On the Active tab verify the product status shows as `active`

**Edge cases to test:**
- Try promoting a `draft` or `failed` product — the Promote button should be disabled
- Edit a `failed` product to fix missing fields, save, and confirm status flips to `ready`
- Delete a product from the queue using the Reject/Delete action

### 4.1 Product Status on Active Tab

| Status | Display |
|--------|---------|
| `active` | Green badge — visible to buyers |
| `draft` | Grey badge — not yet live |
| `archived` | Muted — hidden from catalog |
| `inactive` | No metadata attached |

---

## Phase 5 — Managing Live Inventory

1. Stay on the **Active** tab of Inventory
2. Test **search** — filter products by name
3. Test **status filter** — toggle between active, draft, archived
4. Test **stock filter** — filter low stock / out of stock
5. Click **Edit** on a live product — ProductEditor should open pre-filled
6. Update price or stock, save — changes should reflect immediately
7. Test **archive** action on an active product — it should move to archived state

---

## Phase 6 — Managing Orders

Navigate to **Orders** (`/seller/dashboard/orders`).

### 6.1 Order Status Tabs

Filter orders using the status pills at the top:

| Filter | Description |
|--------|-------------|
| All | Every order |
| Pending | New orders awaiting action |
| Shipped | Dispatched, awaiting delivery confirmation |
| Delivered | Completed |
| Cancelled | Cancelled by seller or buyer |

### 6.2 Order Actions

Each order card exposes a **primary action** based on its current status:

| Current Status | Available Actions |
|---------------|-------------------|
| `pending` | **Fulfil** (mark as shipped) + Cancel |
| `shipped` | **Mark Delivered** + Cancel |
| `delivered` | No further actions |
| `cancelled` | No further actions |

**Test the full order lifecycle:**
1. Find a `pending` order — click **Fulfil** → status should change to `shipped`
2. Find the same order now `shipped` — click **Mark Delivered** → status becomes `delivered`
3. Find a `pending` order — click **Cancel** → status becomes `cancelled`

### 6.3 Order Detail Check
- Expand an order card to see: buyer info, product details, payment status (`paid` / `unpaid`), and order timestamp
- Payment status badge should be green for `paid`, amber for `unpaid`

---

## Phase 7 — Analytics

Navigate to **Analytics** (`/seller/dashboard/analytics`).

Verify the following surfaces load without error:
- [ ] Profile visit count
- [ ] Product saves / wishlist adds
- [ ] Story / brand narrative performance
- [ ] Browsing demographics (age, city breakdown)

---

## Phase 8 — Profile Management

Navigate to **Profile** (`/seller/dashboard/profile`).

- [ ] Edit brand name and description — save and confirm update persists on refresh
- [ ] Upload a new brand logo — verify it updates in the sidebar/header
- [ ] Upload a new banner — verify it displays correctly
- [ ] Update bank details — confirm fields save

---

## Quick Sanity Checklist

Use this before each testing session:

- [ ] Can register a new seller account
- [ ] Onboarding draft saves and resumes correctly
- [ ] Admin can approve the seller
- [ ] Seller can log in post-approval
- [ ] Can add a product manually and see it in the Queue
- [ ] Queue correctly flags `failed` items with missing field details
- [ ] `ready` products can be promoted to Active inventory
- [ ] Live products can be edited and archived
- [ ] Orders cycle through pending → shipped → delivered correctly
- [ ] Cancellation works from `pending` and `shipped` states
- [ ] Analytics page loads without error
- [ ] Profile edits persist after page refresh

---

## Known Flows to Verify After Code Changes

- **Shopify scrape fallback** — if Shopify OAuth integration is broken, the direct scrape path (`ShopifyScrape` component) must still import products into the queue
- **Product deletion from queue** — deleting from the queue should not affect any already-promoted active products
- **Onboarding draft resume** — draft recovery prompt should only appear if a draft exists at a step > 0
