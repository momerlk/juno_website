# New API Endpoints - Modular Implementation

**Created:** April 2, 2026  
**Location:** `src/api/`

---

## Module Structure

The API is now organized into focused, modular files for easy maintenance and selective importing:

```
src/api/
├── api.ts              # Main barrel export (re-exports all modules)
├── api.types.ts        # Shared TypeScript type definitions
├── core.ts             # Core request utilities (existing)
├── shared.ts           # Shared utilities like file upload (existing)
├── analyticsApi.ts     # Analytics & Probe event ingestion
├── catalogApi.ts       # Public catalog + Admin catalog management
├── campaignsApi.ts     # Performance marketing campaigns
├── commerceApi.ts      # User cart/checkout + Guest commerce
├── eventsApi.ts        # Tournaments and events
├── shopifyApi.ts       # Shopify integration
├── sellerApi.types.ts  # Extended seller API functions
├── adminApi.types.ts   # Extended admin API functions
├── sellerApi.ts        # Original seller API (unchanged)
├── adminApi.ts         # Original admin API (unchanged)
├── userApi.ts          # Original user API (unchanged)
├── workApi.ts          # Original work API (unchanged)
└── chapterApi.ts       # Original chapter API (unchanged)
```

---

## Import Examples

```typescript
// Import specific modules
import { Analytics, Probe } from './api';
import { Catalog, AdminCatalog } from './api';
import { Commerce, GuestCommerce } from './api';
import { Campaigns } from './api';
import { Events } from './api';
import { Shopify } from './api';
import { SellerAPI } from './api';
import { AdminAPI } from './api';

// Import types
import type {
    Campaign,
    ProductStrategy,
    CatalogProduct,
    PlatformOverviewResponse,
    GuestCheckoutDetails,
} from './api';

// Import core utilities
import { request, API_BASE_URL, setAuthToken } from './api';
```

---

## API Modules Summary

### 📊 Analytics API (`analyticsApi.ts`)

**File:** `src/api/analyticsApi.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `Probe` | 2 | Public | Client event ingestion, session heartbeat |
| `Analytics` | 15 | Admin | Platform analytics, user metrics, commerce data |

**Key Functions:**
```typescript
// Event ingestion (public)
await Probe.ingestEvents({ session_id, events: [...] });
await Probe.heartbeat({ session_id, screen_name });

// Admin analytics
await Analytics.getOverview({ compare: 'previous_period' });
await Analytics.getUsers();
await Analytics.getCommerce({ start_time, end_time });
await Analytics.getFunnel();
await Analytics.getRealTime();
await Analytics.getProducts({ limit: 50 });
await Analytics.getSearch();
```

---

### 🛍️ Catalog API (`catalogApi.ts`)

**File:** `src/api/catalogApi.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `Catalog` | 18 | Public | Products, search, filters, collections, drops, brands |
| `AdminCatalog` | 13 | Admin | Collection/drop management, Shopify sync |

**Key Functions:**
```typescript
// Public catalog
const products = await Catalog.getProducts({ category, limit: 20 });
const product = await Catalog.getProduct(productId);
const results = await Catalog.searchProducts({ keyword: 'lawn' });
const filtered = await Catalog.filterProducts({ sizes: ['S', 'M'] });
const popular = await Catalog.getPopularProducts(12);
const related = await Catalog.getRelatedProducts(productId);
const trending = await Catalog.getTrendingSearches(10);
const suggestions = await Catalog.autocomplete('lawn');
const brand = await Catalog.getBrandStorefront(brandId);
const collections = await Catalog.getCollections();
const drops = await Catalog.getDrops({ status: 'live' });
await Catalog.setDropReminder(dropId, { channel: 'email' });

// Admin catalog
await AdminCatalog.createCollection({ title, slug, product_ids });
await AdminCatalog.updateCollection(id, { is_active: false });
await AdminCatalog.createDrop({ title, launch_at, product_ids });
await AdminCatalog.changeDropStatus(id, 'live');
await AdminCatalog.shopifySyncCollections(sellerId);
```

---

### 📢 Campaigns API (`campaignsApi.ts`)

**File:** `src/api/campaignsApi.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `Campaigns` | 8 | Admin | Campaign CRUD, status, metrics, landing resolution |

**Key Functions:**
```typescript
const campaigns = await Campaigns.listCampaigns({ status: 'active' });
const campaign = await Campaigns.getCampaign(campaignId);
const created = await Campaigns.createCampaign({
    name: 'Summer Sale',
    channel: 'meta',
    product_strategy: { method: 'bestsellers', max_products: 20 },
    landing_type: 'collection',
    collection_id: 'summer-2026',
    utm_source: 'facebook',
    utm_medium: 'paid_social',
    start_date: '2026-05-01',
});
await Campaigns.updateCampaign(id, { budget: { daily_budget: 5000 } });
await Campaigns.changeCampaignStatus(id, 'active');
const metrics = await Campaigns.getCampaignMetrics(id);
const landing = await Campaigns.resolveLandingTarget(id);
```

---

### 🛒 Commerce API (`commerceApi.ts`)

**File:** `src/api/commerceApi.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `Commerce` | 5 | User | User cart and checkout |
| `GuestCommerce` | 6 | Public | Guest cart, frictionless checkout |

**Key Functions:**
```typescript
// User commerce
const cart = await Commerce.getCart();
await Commerce.addToCart({ product_id, variant_id, quantity: 1 });
await Commerce.removeFromCart(productId, variantId);
const order = await Commerce.checkout({ address_id, payment_method: 'cod' });
const orders = await Commerce.getOrders();

// Guest commerce (performance marketing)
const guestCart = await GuestCommerce.addToCart({
    product_id,
    variant_id,
    quantity: 1
});
await GuestCommerce.saveCustomerDetails({
    full_name: 'Sara Ahmed',
    phone_number: '+923001234567',
    address_line1: '12 Main Gulberg',
    city: 'Lahore'
}, guestCart.body.guest_cart_id);
const order = await GuestCommerce.checkout({
    payment_method: 'cod'
}, guestCart.body.guest_cart_id);
const orders = await GuestCommerce.lookupOrders({
    phone_number: '+923001234567'
});
```

---

### 🏆 Events API (`eventsApi.ts`)

**File:** `src/api/eventsApi.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `Events` | 5 | Mixed | Tournaments, leaderboards, registration |

**Key Functions:**
```typescript
const tournaments = await Events.listTournaments();
const tournament = await Events.getTournament(tournamentId);
const leaderboard = await Events.getLeaderboard(tournamentId);
await Events.register(tournamentId); // user auth
await Events.createTournament({ // admin auth
    name: 'Style Clash S1',
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    prize: 'PKR 50,000'
});
```

---

### 🔌 Shopify API (`shopifyApi.ts`)

**File:** `src/api/shopifyApi.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `Shopify` | 7 | Mixed | OAuth, product/collection sync, admin sync |

**Key Functions:**
```typescript
// Seller Shopify integration
const url = Shopify.getAuthUrl(token, 'mystore.myshopify.com');
const status = await Shopify.getStatus();
await Shopify.syncProducts();
await Shopify.syncCollections();
await Shopify.disconnect();

// Admin Shopify management
await Shopify.adminSyncProducts(sellerId);
await Shopify.adminSyncCollections(sellerId);
```

---

### 🏪 Seller API Extended (`sellerApi.types.ts`)

**File:** `src/api/sellerApi.types.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `SellerAPI` | 10 | Seller | Drops, inventory, fulfillment |

**Key Functions:**
```typescript
const drops = await SellerAPI.getDrops({ status: 'draft' });
await SellerAPI.createDrop({ title, product_ids, launch_at });
const drop = await SellerAPI.getDrop(dropId);
await SellerAPI.updateDrop(dropId, { status: 'announced' });
const analytics = await SellerAPI.getDropAnalytics(dropId);
const pending = await SellerAPI.getPendingEmbeddings();
const lowStock = await SellerAPI.getLowStock(10);
const categories = await SellerAPI.getInventoryCategories();
await SellerAPI.bulkUpdateInventory([
    { product_id, variant_id, quantity_change: 50, reason: 'restock' }
]);
await SellerAPI.bookDelivery(orderId);
const pdf = await SellerAPI.getAirwayBill(orderId);
```

---

### 👤 Admin API Extended (`adminApi.types.ts`)

**File:** `src/api/adminApi.types.ts`

| Namespace | Endpoints | Auth | Description |
|-----------|-----------|------|-------------|
| `AdminAPI` | 20 | Admin | Sellers, users, orders, notifications, system |

**Key Functions:**
```typescript
// Seller management
const sellers = await AdminAPI.getSellers();
const seller = await AdminAPI.getSellerDetails(sellerId);
await AdminAPI.approveSeller(sellerId);
await AdminAPI.updateSeller(sellerId, { status: 'suspended' });

// User management
const users = await AdminAPI.getUsers();
const user = await AdminAPI.getUserDetails(userId);

// Orders
const orders = await AdminAPI.getOrders();
const order = await AdminAPI.getOrderById(orderId);
await AdminAPI.updateOrder(orderId, { status: 'delivered' });
const carts = await AdminAPI.getCarts();

// System
const queue = await AdminAPI.getProductQueue();
const waitlist = await AdminAPI.getWaitlist();
const health = await AdminAPI.getSystemHealth();

// Notifications
await AdminAPI.broadcastNotification('Sale!', '50% off everything');
await AdminAPI.sendNotificationToUser(userId, 'Order Shipped', 'Your order is on the way');

// Ambassador
await AdminAPI.createAmbassadorTask({ title, description, due_date });
```

---

## Type Exports

All types are exported from `api.types.ts` and re-exported from the main `api.ts`:

### Analytics Types
- `PlatformOverviewResponse`
- `UserAnalyticsResponse`
- `CommerceAnalyticsResponse`
- `FunnelAnalytics`
- `RealTimeResponse`
- `ProbeEvent`
- `RetentionMetrics`
- `SearchAnalyticsResponse`
- `CategoryMetric`
- `OperationalAnalyticsResponse`
- `SellerOperationsResponse`
- `FeedbackAnalyticsResponse`
- `LogisticsAnalyticsResponse`
- `TopProduct`
- `ProductDeepDiveResponse`
- `GraphDataPoint`
- `QueryComparison`

### Catalog Types
- `CatalogProduct`
- `ProductPricing`
- `ProductVariant`
- `ProductOption`
- `ProductCategory`
- `FilterOptions`
- `ProductFilterRequest`
- `Collection`
- `Drop`
- `CreateDropRequest`
- `UpdateDropRequest`
- `BrandStorefront`
- `TrendingSearch`

### Campaign Types
- `Campaign`
- `CampaignMetrics`
- `CreateCampaignRequest`
- `UpdateCampaignRequest`
- `ChangeCampaignStatusRequest`
- `CampaignPersona`
- `ProductStrategy`
- `LandingConfig`
- `BudgetConfig`
- `LandingTargetResponse`

### Commerce Types
- `Cart`
- `CartItem`
- `GiftDetails`
- `GuestCart`
- `GuestCartResponse`
- `GuestCheckoutDetails`
- `ParentOrder`
- `CheckoutRequest`
- `GuestCheckoutRequest`
- `GuestOrderLookupRequest`

### Events Types
- `Tournament`
- `CreateTournamentRequest`
- `Leaderboard`
- `RankingEntry`

### Shopify Types
- `ShopifyConnectionStatus`
- `ShopifySyncResponse`
- `ShopifyCollectionSyncResponse`

---

## Implementation Status

✅ **Fully Implemented:**

| Module | File | Functions | Types |
|--------|------|-----------|-------|
| Analytics/Probe | `analyticsApi.ts` | 17 | 15 |
| Catalog | `catalogApi.ts` | 31 | 13 |
| Campaigns | `campaignsApi.ts` | 8 | 10 |
| Commerce | `commerceApi.ts` | 11 | 10 |
| Events | `eventsApi.ts` | 5 | 4 |
| Shopify | `shopifyApi.ts` | 7 | 3 |
| Seller Extended | `sellerApi.types.ts` | 10 | - |
| Admin Extended | `adminApi.types.ts` | 20 | - |
| Shared Types | `api.types.ts` | - | 55+ |
| Barrel Export | `api.ts` | All re-exports | All re-exports |

**Total:** 120+ new API functions with full TypeScript types

---

## Migration Guide

### From Old to New Structure

The existing `sellerApi.ts` and `adminApi.ts` files remain unchanged for backward compatibility.

**Old pattern (still works):**
```typescript
import { Seller, Products, Orders } from './sellerApi';
import { Auth as AdminAuth, GetAllOrders } from './adminApi';
```

**New pattern (recommended):**
```typescript
import { Commerce, Catalog, Campaigns, Analytics } from './api';
import { SellerAPI, AdminAPI } from './api';
import type { Campaign, CatalogProduct } from './api';
```

### Token Management

The new modules use internal token helpers:
- `getAdminToken()` - Admin endpoints
- `getSellerToken()` - Seller endpoints  
- `getUserToken()` - User endpoints
- Public endpoints pass `undefined` or `true` for isPublic

Manual token passing still works:
```typescript
await Commerce.getCart(customToken);
await Analytics.getOverview(); // uses localStorage automatically
```

---

## Best Practices

1. **Import only what you need:**
   ```typescript
   import { Catalog } from './api'; // Just catalog
   import { Analytics, Probe } from './api'; // Analytics only
   ```

2. **Use types for type safety:**
   ```typescript
   import type { Campaign, ProductStrategy } from './api';
   
   const strategy: ProductStrategy = { method: 'manual' };
   ```

3. **Handle errors consistently:**
   ```typescript
   const resp = await Catalog.getProduct(id);
   if (!resp.ok) {
       // Handle error
       return;
   }
   const product = resp.body; // Type: CatalogProduct
   ```

4. **Guest cart persistence:**
   ```typescript
   // Store guest_cart_id in cookie + localStorage
   const cart = await GuestCommerce.addToCart(item);
   const guestCartId = cart.body.guest_cart_id;
   localStorage.setItem('guest_cart_id', guestCartId);
   document.cookie = `guest_cart_id=${guestCartId}; path=/; max-age=604800`;
   ```
