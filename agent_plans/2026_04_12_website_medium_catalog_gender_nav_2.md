# Website Plan: Catalog Gender Navigation

## 1. Objective

Add a gender-based catalog navigation to the website so that users first choose
between Men and Women, then see a product grid and brand list for their chosen
category — matching the navigation pattern common on fashion websites.

---

## 2. Surface

Website

---

## 3. Scale

Medium

---

## 4. Scope

**Included**
- Gender selection landing page (Men / Women toggle or split)
- Gender catalog page showing products grid + brands list
- URL routing: `/catalog/men` and `/catalog/women`
- Client-side filtering within the gender catalog page (price, category)

**Not included**
- API implementation (covered in plan 1)
- Authentication or user-account features
- Mobile app

---

## 5. Dependencies

Requires plan 1 to be fully implemented and deployed first.

**API endpoints used:**
- `GET /api/v2/catalog/gender/{gender}` — returns `{ gender, products, brands, total }`
- `GET /api/v2/catalog/gender/{gender}?page=N&limit=20&sort=X&order=Y&min_price=X&max_price=Y&category=ID`

**API contract reference:**
```
GET /api/v2/catalog/gender/men
GET /api/v2/catalog/gender/women

Response:
{
  "gender": "men",
  "products": [
    {
      "id": "uuid",
      "title": "string",
      "seller_name": "string",
      "seller_logo": "string (URL)",
      "pricing": { "price": number, "currency": "PKR", "discounted": bool, "discounted_price": number },
      "images": ["string (URL)"],
      "tags": ["male" | "female" | "unisex"],
      "status": "active"
    }
  ],
  "brands": [
    { "id": "uuid", "name": "string" }
  ],
  "total": number
}
```

---

## 6. Assumptions

- Website is built with **Next.js** (App Router) and **React**
- CSS framework: **Tailwind CSS** (utility classes)
- API base URL is available as environment variable `NEXT_PUBLIC_API_URL`
- No authentication required for the catalog pages (public routes)
- Routing uses Next.js file-based routing under `app/` directory
- `fetch` is used for data fetching (no extra HTTP client library)
- Required API endpoints exist and follow the contract defined in plan 1

---

## 7. Step-by-Step Implementation

### Step 1: Create the gender selection page

**File:** `app/catalog/page.tsx`

This is the `/catalog` route. It shows a full-screen split between Men and Women.

```tsx
import Link from "next/link";

export default function CatalogLandingPage() {
  return (
    <div className="flex h-screen w-full">
      {/* Men side */}
      <Link
        href="/catalog/men"
        className="flex w-1/2 items-center justify-center bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
      >
        <span className="text-4xl font-semibold tracking-widest uppercase">Men</span>
      </Link>

      {/* Women side */}
      <Link
        href="/catalog/women"
        className="flex w-1/2 items-center justify-center bg-white text-neutral-900 hover:bg-neutral-100 transition-colors border-l border-neutral-200"
      >
        <span className="text-4xl font-semibold tracking-widest uppercase">Women</span>
      </Link>
    </div>
  );
}
```

---

### Step 2: Create the API fetch function

**File:** `lib/catalog.ts`

If this file does not exist, create it. If it exists, add the following function
without removing existing content.

```ts
export type Product = {
  id: string;
  title: string;
  seller_name: string;
  seller_logo: string;
  pricing: {
    price: number;
    currency: string;
    discounted: boolean;
    discounted_price: number;
  };
  images: string[];
  tags: string[];
};

export type Brand = {
  id: string;
  name: string;
};

export type GenderOverview = {
  gender: string;
  products: Product[];
  brands: Brand[];
  total: number;
};

export type GenderFilterParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  min_price?: number;
  max_price?: number;
  category?: string;
};

export async function fetchGenderOverview(
  gender: "men" | "women",
  params: GenderFilterParams = {}
): Promise<GenderOverview> {
  const url = new URL(
    `/api/v2/catalog/gender/${gender}`,
    process.env.NEXT_PUBLIC_API_URL
  );

  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.order) url.searchParams.set("order", params.order);
  if (params.min_price !== undefined)
    url.searchParams.set("min_price", String(params.min_price));
  if (params.max_price !== undefined)
    url.searchParams.set("max_price", String(params.max_price));
  if (params.category) url.searchParams.set("category", params.category);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch gender overview: ${res.status}`);
  return res.json();
}
```

---

### Step 3: Create the gender catalog page

**File:** `app/catalog/[gender]/page.tsx`

This is the `/catalog/men` and `/catalog/women` route.

```tsx
import { notFound } from "next/navigation";
import { fetchGenderOverview } from "@/lib/catalog";
import ProductGrid from "@/components/catalog/ProductGrid";
import BrandList from "@/components/catalog/BrandList";
import GenderHeader from "@/components/catalog/GenderHeader";

type Props = {
  params: { gender: string };
  searchParams: { page?: string; sort?: string; order?: string };
};

export default async function GenderCatalogPage({ params, searchParams }: Props) {
  const { gender } = params;

  if (gender !== "men" && gender !== "women") {
    notFound();
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams.sort ?? "created_at";
  const order = searchParams.order ?? "desc";

  const overview = await fetchGenderOverview(gender as "men" | "women", {
    page,
    limit: 20,
    sort,
    order,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <GenderHeader gender={gender} total={overview.total} />

      <div className="mt-6 flex gap-8">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <BrandList brands={overview.brands} gender={gender} />
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <ProductGrid products={overview.products} />
        </main>
      </div>
    </div>
  );
}
```

---

### Step 4: Create the GenderHeader component

**File:** `components/catalog/GenderHeader.tsx`

```tsx
type Props = {
  gender: string;
  total: number;
};

export default function GenderHeader({ gender, total }: Props) {
  const label = gender === "men" ? "Men" : "Women";
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-4">
      <h1 className="text-2xl font-semibold">{label}&apos;s Collection</h1>
      <span className="text-sm text-neutral-500">{total} products</span>
    </div>
  );
}
```

---

### Step 5: Create the ProductGrid component

**File:** `components/catalog/ProductGrid.tsx`

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/catalog";

type Props = {
  products: Product[];
};

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-neutral-400">No products found.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? "";
  const price = product.pricing.discounted
    ? product.pricing.discounted_price
    : product.pricing.price;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-neutral-100">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="h-full w-full bg-neutral-200" />
        )}
        {product.pricing.discounted && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs text-white">
            Sale
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 space-y-0.5">
        <p className="text-xs text-neutral-500">{product.seller_name}</p>
        <p className="truncate text-sm font-medium">{product.title}</p>
        <p className="text-sm font-semibold">
          {product.pricing.currency} {price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
```

---

### Step 6: Create the BrandList component

**File:** `components/catalog/BrandList.tsx`

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Brand } from "@/lib/catalog";

type Props = {
  brands: Brand[];
  gender: string;
};

export default function BrandList({ brands, gender }: Props) {
  const searchParams = useSearchParams();
  const activeBrandId = searchParams.get("brand");

  if (brands.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">
        Brands
      </h2>
      <ul className="space-y-1">
        {brands.map((brand) => {
          const isActive = activeBrandId === brand.id;
          return (
            <li key={brand.id}>
              <Link
                href={`/catalog/${gender}?brand=${brand.id}`}
                className={`block rounded px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {brand.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

### Step 7: Add navigation link to the global nav bar

**File:** wherever the site's top navigation component is defined (e.g.,
`components/layout/Navbar.tsx` or `components/Nav.tsx`).

Find the existing navigation links list. Add a link to `/catalog`:

```tsx
<Link href="/catalog" className="text-sm font-medium hover:underline">
  Shop
</Link>
```

If a "Shop" link already exists, change its `href` to `/catalog`.
Do not add a second "Shop" link.

---

## 8. UI Specification

### `/catalog` (gender selection page)

- Full viewport height split 50/50 left–right
- Left half: dark background (`bg-neutral-900`), white text, label "MEN"
- Right half: white background, dark text, label "WOMEN"
- Clicking either half navigates to `/catalog/men` or `/catalog/women`
- Hover state: slight color change (defined in component)

### `/catalog/men` and `/catalog/women`

- Page header: gender label ("Men's Collection" / "Women's Collection") + product count on the right
- Layout: left sidebar (224px) + main content area (fluid)
- Sidebar: list of brand names; clicking a brand filters the current page by brand
- Main area: 4-column product grid on large screens, 3 on medium, 2 on small
- Product card shows: product image (3:4 aspect ratio), brand name (small, muted), product title, price
- Sale badge: red chip top-left of image when `pricing.discounted = true`
- Image hover: subtle scale-up
- Empty state: centered text "No products found." when products array is empty

### Loading and error states

- While data is loading (server component): Next.js will handle with Suspense
- If API returns error: page shows "Failed to load products. Please try again."
  — implement this by wrapping the page in a try/catch and returning an error UI

---

## 9. Edge Cases

- `/catalog/kids` or any unknown gender path → `notFound()` → 404 page
- API response `products: []` → show empty state text, not an error
- `images` array is empty → show grey placeholder div instead of `<Image>`
- `pricing.discounted = false` → show `pricing.price`, not `pricing.discounted_price`
- Product title longer than one line → truncate with CSS (`truncate` class)
- Brand list has 0 brands → do not render the sidebar brands section at all

---

## 10. Testing Instructions

Start the dev server before testing.

1. Open `http://localhost:3000/catalog`
   - Verify: full-screen split with "MEN" (dark) and "WOMEN" (light)
   - Click "MEN" → navigates to `/catalog/men`
   - Go back → click "WOMEN" → navigates to `/catalog/women`

2. On `/catalog/men`:
   - Verify: header shows "Men's Collection" and a product count
   - Verify: product cards are visible in a grid
   - Verify: brand list appears in the left sidebar
   - Click a brand → URL updates with `?brand=<id>` (visual highlight changes)

3. On `/catalog/women`:
   - Verify: header shows "Women's Collection"
   - Verify: products are different from men's (or some overlap from unisex)

4. Navigate to `/catalog/kids`
   - Verify: 404 page is shown

5. Verify "Shop" link in navigation bar points to `/catalog`

---

## 11. Definition of Done

- `/catalog` renders the gender split page with no JS errors in console
- `/catalog/men` loads and displays products and brands
- `/catalog/women` loads and displays products and brands
- `/catalog/kids` shows 404
- Product cards link to `/products/{id}`
- Brand list in sidebar is visible with at least one brand
- Sale badge shows on discounted products
- Empty product state shows "No products found." text
- Navigation "Shop" link points to `/catalog`
- No TypeScript type errors (`tsc --noEmit` passes)

---

## 12. Constraints

- Do not modify any existing page that is unrelated to catalog navigation
- Do not add new npm packages
- Do not add authentication checks to catalog pages (they are public)
- Do not implement server-side brand filtering (brand filter is a URL param only
  for phase 1; backend support can be added later if needed)
