# Plan 2 of 3 — Product Editor V2: Pricing Section + Shipping Section

## 1. Objective

Add two new sections to the redesigned ProductEditor:

**Section 2 — Pricing:** Starts with a single price field. Two toggle buttons reveal "Compare at price" and "Unit price" fields. A collapsible "Cost" badge at the bottom expands to show cost price input + a live profit/margin breakdown card. The breakdown applies 17.5% commission and Rs.99 shipping buffer. Connects to two new API endpoints.

**Section 3 — Shipping:** Single field for product weight in grams.

These two sections go inside the left main column, after Section 1 (Content) from Plan 1.

---

## 2. Surface

Website

---

## 3. Scale

Large (Plan 2 of 3)

---

## 4. Scope

**Included:**
- Section 2: Pricing with progressive disclosure (price → compare at → unit price)
- Cost price sub-section inside pricing (collapsible, toggled by a button)
- Profit breakdown card inside pricing (live-calculated, calls GET /seller/products/{id}/profit)
- Shipping included toggle calling PUT /seller/products/{id}/pricing
- Section 3: Shipping weight field
- Two new API functions in `src/api/sellerApi.ts`

**Not included:**
- Variants section (Plan 3)
- Layout or Section 1 changes (Plan 1)
- Sizing guide changes

---

## 5. Assumptions

- Plan 1 has been executed. The two-column layout exists. `<div id="main-col">` exists with Section 1 already inside it.
- File to edit: `src/components/seller/ProductEditor.tsx`
- API file to edit: `src/api/sellerApi.ts`
- `formData.pricing` already has `price`, `compare_at_price` fields
- `handlePricingChange` already exists and updates `formData.pricing`
- `seller.token` is available
- `product?.id` is the product ID when editing an existing product
- Required API endpoints are live:
  - `PUT /seller/products/{id}/pricing` — body: `{ shipping_included?: boolean, cost_price?: number }`
  - `GET /seller/products/{id}/profit?cost_price=X&subscription_fee=Y` — returns `{ brand_price, effective_brand_price, commission, seller_payout, cost_price, profit, margin_percent }`
- All existing imports (`useState`, `useEffect`, `DollarSign`, `fieldClassName`) are available

---

## 6. Step-by-Step Implementation

### Step 1: Add two new functions to `src/api/sellerApi.ts`

Add these two functions inside the `Seller` namespace, after the `UpdateProduct` function (after line 199):

```typescript
export async function UpdateProductPricing(
  token: string,
  productId: string,
  data: { shipping_included?: boolean; cost_price?: number }
): Promise<APIResponse<any>> {
  return await request(`/seller/products/${productId}/pricing`, 'PUT', data, token);
}

export async function GetProductProfit(
  token: string,
  productId: string,
  params: { cost_price?: number; subscription_fee?: number }
): Promise<APIResponse<any>> {
  const query = new URLSearchParams();
  if (params.cost_price !== undefined) query.set('cost_price', String(params.cost_price));
  if (params.subscription_fee !== undefined) query.set('subscription_fee', String(params.subscription_fee));
  const qs = query.toString();
  return await request(`/seller/products/${productId}/profit${qs ? `?${qs}` : ''}`, 'GET', undefined, token);
}
```

### Step 2: Add new state variables to `ProductEditor.tsx`

Add these inside the `ProductEditor` component, near the top of the component body with the other `useState` calls:

```typescript
const [showComparePrice, setShowComparePrice] = useState(false);
const [showUnitPrice, setShowUnitPrice] = useState(false);
const [showCostSection, setShowCostSection] = useState(false);
const [costPrice, setCostPrice] = useState<number | ''>('');
const [shippingIncluded, setShippingIncluded] = useState(false);
const [profitData, setProfitData] = useState<{
  brand_price: number;
  effective_brand_price: number;
  commission: number;
  seller_payout: number;
  cost_price: number;
  profit: number;
  margin_percent: number;
} | null>(null);
const [loadingProfit, setLoadingProfit] = useState(false);
```

### Step 3: Populate initial state from product when editing

Inside the existing `useEffect` that initialises `formData` (the one that depends on `[product]`), add after the `setFormData(initialState)` call:

```typescript
if (product?.pricing?.cost_price) {
  setCostPrice(product.pricing.cost_price);
  setShowCostSection(true);
}
if (product?.pricing?.shipping_included) {
  setShippingIncluded(product.pricing.shipping_included);
}
if (product?.pricing?.compare_at_price) {
  setShowComparePrice(true);
}
```

### Step 4: Add a helper to fetch profit breakdown

Add this function inside the `ProductEditor` component, below the state declarations:

```typescript
const fetchProfit = async () => {
  if (!product?.id || !seller?.token) return;
  const cp = typeof costPrice === 'number' ? costPrice : undefined;
  if (cp === undefined) return;
  setLoadingProfit(true);
  try {
    const res = await api.Seller.GetProductProfit(seller.token, product.id, { cost_price: cp });
    if (res.ok && res.body) {
      setProfitData(res.body);
    }
  } finally {
    setLoadingProfit(false);
  }
};
```

### Step 5: Add a handler for shipping included toggle

Add this function inside the `ProductEditor` component:

```typescript
const handleShippingIncludedToggle = async () => {
  const next = !shippingIncluded;
  setShippingIncluded(next);
  if (product?.id && seller?.token) {
    await api.Seller.UpdateProductPricing(seller.token, product.id, { shipping_included: next });
  }
};
```

### Step 6: Add the Pricing section JSX

Inside `<div id="main-col">` in the JSX, add this after Section 1 (the Content section):

```jsx
<Section id="pricing" title="Pricing" eyebrow="Step 2" icon={<DollarSign size={16} />}>
  <div className="space-y-4">

    {/* Base price */}
    <div>
      <label htmlFor="price" className="block text-xs font-medium text-neutral-400 mb-1">
        Price <span className="text-white/30 font-normal">(PKR)</span>
      </label>
      <input
        type="number"
        name="price"
        id="price"
        value={formData.pricing?.price || ''}
        onChange={handlePricingChange}
        className={fieldClassName}
        placeholder="0"
        required
      />
    </div>

    {/* Progressive disclosure: Compare at price */}
    {showComparePrice && (
      <div>
        <label htmlFor="compare_at_price" className="block text-xs font-medium text-neutral-400 mb-1">
          Compare-at price <span className="text-white/30 font-normal">(original / struck-through)</span>
        </label>
        <input
          type="number"
          name="compare_at_price"
          id="compare_at_price"
          value={formData.pricing?.compare_at_price || ''}
          onChange={handlePricingChange}
          className={fieldClassName}
          placeholder="0"
        />
      </div>
    )}

    {/* Progressive disclosure: Unit price */}
    {showUnitPrice && (
      <div>
        <label htmlFor="unit_price" className="block text-xs font-medium text-neutral-400 mb-1">
          Unit price <span className="text-white/30 font-normal">(price per unit for bulk listings)</span>
        </label>
        <input
          type="number"
          name="unit_price"
          id="unit_price"
          value={(formData.pricing as any)?.unit_price || ''}
          onChange={handlePricingChange}
          className={fieldClassName}
          placeholder="0"
        />
      </div>
    )}

    {/* Toggle buttons row */}
    <div className="flex flex-wrap gap-2">
      {!showComparePrice && (
        <button
          type="button"
          onClick={() => setShowComparePrice(true)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 hover:border-primary/30 hover:text-white transition-colors"
        >
          + Compare-at price
        </button>
      )}
      {!showUnitPrice && (
        <button
          type="button"
          onClick={() => setShowUnitPrice(true)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 hover:border-primary/30 hover:text-white transition-colors"
        >
          + Unit price
        </button>
      )}
    </div>

    {/* Shipping included toggle */}
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-white/80">Shipping included in price</p>
        <p className="text-[11px] text-white/40 mt-0.5">
          If on, the Rs. 99 buffer is already in your listed price and won't be added at checkout.
        </p>
      </div>
      <button
        type="button"
        onClick={handleShippingIncludedToggle}
        className={`relative h-5 w-9 rounded-full transition-colors ${shippingIncluded ? 'bg-primary' : 'bg-white/10'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${shippingIncluded ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>

    {/* Cost price section — collapsible */}
    {!showCostSection ? (
      <button
        type="button"
        onClick={() => setShowCostSection(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/50 hover:border-primary/20 hover:text-white/80 transition-colors"
      >
        <span className="rounded-sm bg-white/10 px-1 py-0.5 text-[9px] uppercase tracking-wider">Cost</span>
        Add cost price to see profit & margin
      </button>
    ) : (
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Cost & Profit</p>
          <p className="text-[10px] text-white/30">Not shown to customers</p>
        </div>

        {/* Cost price input */}
        <div>
          <label htmlFor="cost_price" className="block text-xs font-medium text-neutral-400 mb-1">
            Cost price <span className="text-white/30 font-normal">(PKR)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              id="cost_price"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              onBlur={fetchProfit}
              className={fieldClassName}
              placeholder="What you paid to make or source this"
            />
          </div>
        </div>

        {/* Profit breakdown — shown after fetching */}
        {loadingProfit && (
          <div className="text-[11px] text-white/40 flex items-center gap-2">
            <Loader size={12} className="animate-spin" />
            Calculating...
          </div>
        )}

        {profitData && !loadingProfit && (() => {
          const sellingPrice = formData.pricing?.price || 0;
          // Apply Rs.99 shipping buffer if not included
          const displayPrice = shippingIncluded ? sellingPrice : sellingPrice + 99;
          const commission = Math.round(displayPrice * 0.175);
          const payout = displayPrice - commission;
          const cp = typeof costPrice === 'number' ? costPrice : 0;
          const profit = payout - cp;
          const margin = payout > 0 ? ((profit / payout) * 100).toFixed(1) : '0.0';

          return (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/40">Display price</p>
                  <p className="font-semibold text-white mt-1">Rs {displayPrice.toLocaleString()}</p>
                  {!shippingIncluded && <p className="text-white/30 text-[10px]">incl. Rs 99 buffer</p>}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/40">Commission (17.5%)</p>
                  <p className="font-semibold text-white mt-1">− Rs {commission.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/40">Your payout</p>
                  <p className="font-semibold text-white mt-1">Rs {payout.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white/40">Cost price</p>
                  <p className="font-semibold text-white mt-1">− Rs {cp.toLocaleString()}</p>
                </div>
              </div>
              <div className={`rounded-xl border p-3 flex items-center justify-between ${profit >= 0 ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-red-400/20 bg-red-500/10'}`}>
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">Profit</p>
                  <p className={`text-lg font-black mt-0.5 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Rs {profit.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">Margin</p>
                  <p className={`text-lg font-black mt-0.5 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {margin}%
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-white/25 text-center">
                Profit = payout after 17.5% commission {!shippingIncluded ? '+ Rs 99 shipping buffer ' : ''}minus your cost
              </p>
            </div>
          );
        })()}

        {/* If product?.id is falsy, show a note that live calc only works on saved products */}
        {!product?.id && (
          <p className="text-[11px] text-white/35">
            Save the product first to get a live profit calculation from the API.
          </p>
        )}
      </div>
    )}

  </div>
</Section>
```

### Step 7: Add Section 3 — Shipping

Add this immediately after the Pricing section inside `<div id="main-col">`:

```jsx
<Section id="shipping" title="Shipping" eyebrow="Step 3" icon={<Package size={16} />}>
  <div>
    <label htmlFor="weight" className="block text-xs font-medium text-neutral-400 mb-1">
      Product weight <span className="text-white/30 font-normal">(grams)</span>
    </label>
    <input
      type="number"
      name="weight"
      id="weight"
      value={(formData as any).weight || ''}
      onChange={handleChange}
      className={fieldClassName}
      placeholder="e.g. 350"
    />
    <p className="mt-1.5 text-[11px] text-white/35">
      Used to calculate shipping rates accurately.
    </p>
  </div>
</Section>
```

### Step 8: Add `Package` to lucide-react imports

In the import line at the top of `ProductEditor.tsx`, find:
```
import { X, Plus, Trash2, Upload, DollarSign, Tag, Image as ImageIcon, Paperclip, Settings2, Ruler, ArrowLeft, ArrowRight, Video, Loader } from 'lucide-react';
```

Add `Package` to the list:
```
import { X, Plus, Trash2, Upload, DollarSign, Tag, Image as ImageIcon, Paperclip, Settings2, Ruler, ArrowLeft, ArrowRight, Video, Loader, Package } from 'lucide-react';
```

### Step 9: Add import for new API functions

The new `api.Seller.UpdateProductPricing` and `api.Seller.GetProductProfit` functions added to `sellerApi.ts` are already accessible via the existing `import * as api from '../../api/sellerApi'` — no import change needed.

---

## 7. Exact Logic Specification

**Profit calculation (client-side, for live preview without fetching):**
```
displayPrice = shippingIncluded ? price : price + 99
commission = Math.round(displayPrice * 0.175)
payout = displayPrice - commission
profit = payout - costPrice
margin = (profit / payout) * 100
```

**When to call `fetchProfit`:**
- Call on `onBlur` of the cost price input field
- Only call if `product?.id` is truthy AND `costPrice` is a number (not empty string)
- If `product?.id` is falsy, calculate profit client-side without the API call (use the formula above directly)

**`profitData` display fallback:**
- If `product?.id` is falsy OR API call fails, fall through to client-side calculation
- Display `profitData` from API when available; otherwise compute inline

**Shipping included toggle:**
- Calls `api.Seller.UpdateProductPricing` only when `product?.id` is truthy
- If no `product?.id` (new product), just toggle local state — it will be applied when the product is saved

---

## 8. UI Specification

- "Compare-at price" and "Unit price" buttons only show when the respective field is hidden
- Once a field is shown, it stays shown for the session (no hide button needed)
- The Cost badge button: pill shape, small text, `text-[11px]`
- Profit/margin breakdown: two-column 2×2 grid of small info cards, then a final highlighted row for profit + margin
- Profit card: green (`emerald`) if profit ≥ 0, red if profit < 0
- Shipping toggle: small pill toggle (`h-5 w-9`), slides right when `shippingIncluded` is true
- "Not shown to customers" label sits top-right of the cost section in `text-[10px] text-white/30`

---

## 9. Edge Cases

- `costPrice` is `''` (empty string) → do not call fetchProfit, do not show breakdown
- `formData.pricing?.price` is 0 or undefined → disable fetchProfit (nothing to calculate)
- API returns error on `GetProductProfit` → `setProfitData(null)`, do not show breakdown
- `shippingIncluded` toggled on new product (no `product?.id`) → only update local state, don't call API
- `margin_percent` from API could be 0 → show "0.0%" not undefined

---

## 10. Testing Instructions

1. Open product editor for an existing product
2. Section 2 "Pricing" appears after Section 1 "Product"
3. Price field is visible by default. Compare-at and Unit price fields are hidden
4. Click "+ Compare-at price" → compare-at field appears. Button disappears.
5. Click "+ Unit price" → unit price field appears. Button disappears.
6. Verify shipping included toggle: toggle on → switch slides right, background turns red/primary
7. Click "Add cost price to see profit & margin" badge → cost section expands
8. Enter a cost price, click outside the field (blur) → profit breakdown appears with Rs values and % margin
9. Section 3 "Shipping" appears after Section 2 with a single weight field
10. Verify: profit card is green when profit > 0, red when cost > payout

---

## 11. Definition of Done

- Section 2 Pricing renders with progressive disclosure working
- Profit breakdown calculates correctly: `(price + 99 buffer if not included) − 17.5% commission − cost`
- Profit shows in Rs, margin shows in %
- Shipping included toggle works (calls API on existing products)
- Section 3 Shipping renders with weight field
- No TypeScript compile errors

---

## 12. Constraints

- Do not modify the Variants section (Plan 3)
- Do not modify layout or Section 1 (Plan 1)
- Do not modify any files except `src/components/seller/ProductEditor.tsx` and `src/api/sellerApi.ts`
- Do not add new npm packages
- The note "Not shown to customers" must be visible in the UI at all times when the cost section is open
