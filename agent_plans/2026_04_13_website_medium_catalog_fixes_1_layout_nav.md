# Plan 1: Catalog Layout & Navigation Fixes

## 1. Objective

Fix two structural bugs in the catalog:
1. Back button on the product detail page always sends users to `/catalog` (the landing), destroying their navigation context (e.g., if they came from `/catalog/women`, they should return there).
2. The brand sidebar in `GenderCatalogPage` has no mobile handling — `w-56` sidebar sits alongside the product grid on phones, crushing the layout.

---

## 2. Surface

Website

---

## 3. Scale

Medium (Plan 1 of 2)

---

## 4. Scope

**Included:**
- Fix back button in `CatalogProductPage` to use browser history
- Hide sidebar on mobile in `GenderCatalogPage`
- Add mobile brand filter row (horizontal scrollable chips) above the product grid on `<lg` screens

**Not included:**
- Visual redesign of BrandList or ProductCard (covered in Plan 2)
- Any API changes
- Pagination or sort controls

---

## 5. Assumptions

- `react-router-dom` v6 is installed (`useNavigate` is available)
- Tailwind CSS responsive prefix `lg:` maps to 1024px breakpoint
- `GenderOverviewProduct` and `GenderBrand` types exist in `src/api/api.types.ts`
- The existing `BrandList` component is only shown on `lg+` in the sidebar; a new inline chip row replaces it on mobile

---

## 6. Step-by-Step Implementation

### Step 1 — Fix back button in `src/components/catalog/CatalogProductPage.tsx`

**Current code (line 3 imports):**
```tsx
import { Link, useParams } from 'react-router-dom';
```

**Change to:**
```tsx
import { Link, useParams, useNavigate } from 'react-router-dom';
```

**Current code (inside `CatalogProductPage` component, after the `useGuestCart` line, around line 30):**
```tsx
const { addItem, setCartOpen } = useGuestCart();
```

**Add after that line:**
```tsx
const navigate = useNavigate();
```

**Current code (line 163 — the back button):**
```tsx
<Link to="/catalog" className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white">
  <ArrowLeft size={14} />
  Back to catalog
</Link>
```

**Replace with:**
```tsx
<button
  onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/catalog'))}
  className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
>
  <ArrowLeft size={14} />
  Back
</button>
```

> Note: The error-state `Link to="/catalog"` at line 151 stays unchanged — there is no history context to return to in error state.

---

### Step 2 — Make `GenderCatalogPage` responsive

File: `src/components/catalog/gender/GenderCatalogPage.tsx`

**Current layout block (around line 139–154):**
```tsx
<div className="flex gap-8">
    {/* Sidebar */}
    <aside className="w-56 flex-shrink-0">
        {!isLoading && overview && (
            <BrandList brands={overview.brands} gender={validGender} />
        )}
    </aside>

    {/* Main content */}
    <main className="flex-1">
        <ProductGrid
            products={overview?.products ?? []}
            isLoading={isLoading}
        />
    </main>
</div>
```

**Replace the entire block with:**
```tsx
<div>
    {/* Mobile brand filter chips — only on < lg */}
    {!isLoading && overview && overview.brands.length > 0 && (
        <div className="mb-4 lg:hidden">
            <MobileBrandChips brands={overview.brands} gender={validGender} />
        </div>
    )}

    <div className="flex gap-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
            {!isLoading && overview && (
                <BrandList brands={overview.brands} gender={validGender} />
            )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
            <ProductGrid
                products={overview?.products ?? []}
                isLoading={isLoading}
            />
        </main>
    </div>
</div>
```

---

### Step 3 — Add `MobileBrandChips` component inside `GenderCatalogPage.tsx`

Add this component at the **bottom of the file**, before `export default GenderCatalogPage`:

```tsx
const MobileBrandChips: React.FC<{ brands: GenderBrand[]; gender: 'men' | 'women' }> = ({
    brands,
    gender,
}) => {
    const [searchParams] = useSearchParams();
    const activeBrandId = searchParams.get('brand');

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
                to={`/catalog/${gender}`}
                className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                    !activeBrandId
                        ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white'
                        : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:border-white/20 hover:text-white'
                }`}
            >
                All
            </Link>
            {brands.map((brand) => {
                const isActive = activeBrandId === brand.id;
                return (
                    <Link
                        key={brand.id}
                        to={`/catalog/${gender}?brand=${brand.id}`}
                        className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                            isActive
                                ? 'border-primary bg-gradient-to-r from-primary to-secondary text-white'
                                : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {brand.name}
                    </Link>
                );
            })}
        </div>
    );
};
```

**Add required imports** at the top of `GenderCatalogPage.tsx`:

Check if `useSearchParams` is already imported. If not, add it to the `react-router-dom` import line:
```tsx
import { useParams, useSearchParams, Link } from 'react-router-dom';
```

---

## 7. Exact Logic Specification

### Back button logic
- If `window.history.length > 2`: call `navigate(-1)` — go back to wherever they came from (e.g., `/catalog/women`)
- Else: call `navigate('/catalog')` — safe fallback when page was opened directly

### Mobile chips logic
- Render only when `!isLoading && overview && overview.brands.length > 0`
- "All" chip links to `/catalog/${gender}` with no query param
- "All" chip is active (gradient) when `activeBrandId` is null
- Brand chip is active (gradient) when `activeBrandId === brand.id`
- Chips scroll horizontally; no wrapping

---

## 8. UI Specification

### Back button
- Element: `<button>` (not `<Link>`)
- Icon: `ArrowLeft` size 14
- Text: "Back"
- Style: unchanged from original (text-xs font-bold uppercase tracking text-white/60 hover:text-white)

### Mobile brand chips (< lg breakpoint)
- Horizontal scrollable row, `pb-2 scrollbar-hide`
- Each chip: `rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]`
- Inactive: `border-white/10 bg-white/[0.04] text-neutral-300`
- Active: `border-primary bg-gradient-to-r from-primary to-secondary text-white`
- First chip: "All" — always present, links to gender root without query

### Desktop sidebar
- Unchanged visually; now wrapped in `hidden lg:block`
- Main content gets `min-w-0` to prevent overflow

---

## 9. Edge Cases

- `window.history.length` is 1 when user opens product URL directly (deep link) → fallback to `/catalog` 
- `window.history.length` is 2 when user opens a new tab from catalog → still shows "All Products" page, which is reasonable
- `overview.brands` is empty → `MobileBrandChips` is not rendered at all (condition: `overview.brands.length > 0`)
- `isLoading` is true → chips not rendered (no brands data yet)

---

## 10. Testing Instructions

1. Open `/catalog/women`
2. Click any product card → product detail page opens
3. Click "Back" → verify it returns to `/catalog/women` (not `/catalog`)
4. Open a product URL directly (new tab) → click "Back" → verify it goes to `/catalog`
5. Resize browser to mobile width (< 1024px) on `/catalog/women`
6. Verify sidebar is NOT visible
7. Verify horizontal brand chips appear above the product grid
8. Click a brand chip → verify it filters (URL updates to `?brand=...`)
9. Click "All" chip → verify filter is cleared (URL has no `brand` param)

---

## 11. Definition of Done

- [ ] Back button returns user to previous page, not always `/catalog`
- [ ] No sidebar visible on screens narrower than 1024px
- [ ] Horizontal brand chips visible on mobile
- [ ] Active chip highlights in red-to-pink gradient
- [ ] Desktop layout unchanged (sidebar visible at lg+)
- [ ] No TypeScript errors in modified files

---

## 12. Constraints

- Do NOT modify `BrandList.tsx`, `ProductCard.tsx`, or `ProductGrid.tsx` in this plan
- Do NOT add any new npm dependencies
- Do NOT modify any API files
