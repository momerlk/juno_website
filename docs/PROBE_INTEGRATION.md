# Probe Analytics Integration Guide

**Date:** April 2, 2026  
**Module:** `src/hooks/useProbe.ts`

---

## Overview

Probe is Juno's end-to-end analytics engine that tracks user behavior, session data, and commerce events across the website. All usage data is automatically shared with the backend for real-time analytics and insights.

### Features

- **Automatic Session Management** - Creates and maintains user sessions with 30-minute timeout
- **Heartbeat Tracking** - Sends 30-second heartbeats to keep sessions alive
- **Page View Tracking** - Automatically tracks all route changes and screen views
- **Event Batching** - Queues events and flushes them in batches for performance
- **Device Fingerprinting** - Generates stable device IDs for cross-session tracking
- **Traffic Source Detection** - Automatically detects UTM parameters and referrers

---

## Installation

The Probe hook is already integrated in `App.tsx`. No additional setup required.

```tsx
// App.tsx - Already configured
import { useProbeAnalytics } from './hooks/useProbe';

function App() {
  useProbeAnalytics(); // Initializes analytics
  
  return <Router>...</Router>;
}
```

---

## Basic Usage

### Track Custom Events

```tsx
import { useProbe } from '../hooks/useProbe';

function MyComponent() {
  const { track } = useProbe();
  
  const handleClick = () => {
    track('interaction.like', {
      product_id: 'prod_123',
      liked_at: new Date().toISOString(),
    });
  };
  
  return <button onClick={handleClick}>Like</button>;
}
```

### Track Product Views

```tsx
import { useTrackProductView } from '../hooks/useProbe';

function ProductPage({ product }) {
  // Automatically tracks product.view event
  useTrackProductView(product.id, product.category_id);
  
  return <div>...</div>;
}
```

### Track Search

```tsx
import { useTrackSearch } from '../hooks/useProbe';

function SearchPage() {
  const { trackSearch, trackSearchClick, trackNoResults } = useTrackSearch();
  
  const handleSearch = (query, results) => {
    trackSearch(query, results.length);
    
    if (results.length === 0) {
      trackNoResults(query);
    }
  };
  
  const handleResultClick = (productId, position) => {
    trackSearchClick(productId, position);
  };
  
  return <div>...</div>;
}
```

### Track Commerce Events

```tsx
import { useProbeCommerce } from '../hooks/useProbe';

function Cart({ items }) {
  const { 
    trackAddToCart, 
    trackRemoveFromCart,
    trackCartView,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackCheckoutAbandon 
  } = useProbeCommerce();
  
  const handleAddToCart = (product) => {
    trackAddToCart(product.id, product.quantity, product.price);
  };
  
  const handleCheckout = async () => {
    trackCheckoutStart(cartTotal);
    
    try {
      const order = await checkout();
      trackCheckoutComplete(order.id, order.total);
    } catch {
      trackCheckoutAbandon('payment_failed', cartTotal);
    }
  };
  
  return <div>...</div>;
}
```

---

## Event Types

### Session Events
- `session.start` - When a new session begins
- `session.end` - When session ends (timeout or logout)
- `session.heartbeat` - Periodic heartbeat (every 30s)

### Screen Events
- `screen.view` - When user navigates to a screen
- `screen.exit` - When user leaves a screen

### Product Events
- `product.view` - Product detail page view
- `product.impression` - Product shown in listing
- `product.share` - Product shared
- `product.add_to_closet` - Added to wishlist/closet
- `product.remove_from_closet` - Removed from closet

### Search Events
- `search.query` - Search performed
- `search.result_click` - Search result clicked
- `search.no_results` - Search returned no results
- `search.filter_apply` - Filter applied

### Commerce Events
- `cart.add` - Item added to cart
- `cart.remove` - Item removed from cart
- `cart.view` - Cart page viewed
- `checkout.start` - Checkout initiated
- `checkout.complete` - Purchase completed
- `checkout.abandon` - Checkout abandoned

### Interaction Events
- `interaction.like` - Item liked
- `interaction.dislike` - Item disliked
- `interaction.save` - Item saved
- `interaction.share` - Item shared

---

## Session Management

### How Sessions Work

1. **Session Creation**: A new session is created on first page load
2. **Session ID**: Format: `sess_{timestamp}_{random}`
3. **Timeout**: Sessions expire after 30 minutes of inactivity
4. **Heartbeat**: Sent every 30 seconds to keep session alive
5. **Persistence**: Session data stored in localStorage

### Session Data

```typescript
interface SessionData {
  sessionId: string;
  userId?: string;          // Set after login
  startTime: number;
  lastActivity: number;
  pageCount: number;
  screenHistory: string[];  // All screens visited
}
```

### Set User ID (After Login)

```tsx
import { setProbeUser, clearProbeSession } from '../hooks/useProbe';

// After successful login
const handleLogin = async () => {
  const user = await login(credentials);
  setProbeUser(user.id);  // Link session to user
};

// On logout
const handleLogout = () => {
  clearProbeSession();  // Ends session and clears data
  logout();
};
```

---

## Device Information

Probe automatically collects:

```typescript
{
  device_id: "uuid",           // Stable across sessions
  platform: "web" | "ios" | "android" | "windows" | "macos" | "linux",
  app_version: "1.0.0",        // Website version
  os_version: "10.0" | "17.4" | etc,
  locale: "en-US" | "en-PK" | etc
}
```

---

## Traffic Source Detection

Automatically detects:

- **UTM Parameters**: `utm_source`, `utm_medium`, `utm_campaign`
- **Search Engines**: Google, Bing, etc.
- **Social Media**: Facebook, Instagram, Twitter, TikTok
- **Direct Traffic**: No referrer

Example:
```
URL: /product/123?utm_source=facebook&utm_medium=paid_social
→ Tracked as: source = "facebook"
```

---

## Performance

### Event Batching

Events are batched and flushed every 1 second to reduce network requests.

**Exceptions** (flushed immediately):
- `checkout.complete` - Critical for conversion tracking
- `session.start` - Important for session analytics

### Retry Logic

Failed events are re-queued and retried on the next flush.

---

## Screen Name Mapping

Automatic screen name detection from routes:

| Route Pattern | Screen Name |
|---------------|-------------|
| `/` | `home` |
| `/product/:id` | `product_detail` |
| `/brand/:name` | `brand_page` |
| `/blog` | `blog_index` |
| `/blog/:slug` | `blog_post` |
| `/search` | `search_results` |
| `/cart` | `cart` |
| `/checkout` | `checkout` |
| `/seller/*` | `seller_portal` |
| `/admin/*` | `admin_dashboard` |

---

## Examples

### Complete Product Page

```tsx
import React, { useEffect } from 'react';
import { useTrackProductView, useProbe, useProbeCommerce } from '../hooks/useProbe';

function ProductPage({ product }) {
  // Track product view automatically
  useTrackProductView(product.id, product.category_id);
  
  const { track } = useProbe();
  const { trackAddToCart } = useProbeCommerce();
  
  const handleAddToCart = () => {
    trackAddToCart(product.id, 1, product.price);
    
    // Also track custom event
    track('product.add_to_closet', {
      product_id: product.id,
      variant_id: selectedVariant.id,
    });
  };
  
  const handleShare = () => {
    track('product.share', {
      product_id: product.id,
      share_method: 'copy_link',
    });
  };
  
  return (
    <div>
      <h1>{product.title}</h1>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <button onClick={handleShare}>Share</button>
    </div>
  );
}
```

### Search Page with Analytics

```tsx
import React, { useState } from 'react';
import { useTrackSearch } from '../hooks/useProbe';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { trackSearch, trackSearchClick, trackNoResults } = useTrackSearch();
  
  const handleSearch = async (searchQuery) => {
    const searchResults = await search(searchQuery);
    trackSearch(searchQuery, searchResults.length);
    
    if (searchResults.length === 0) {
      trackNoResults(searchQuery);
    }
    
    setResults(searchResults);
  };
  
  const handleResultClick = (product, index) => {
    trackSearchClick(product.id, index);
  };
  
  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      <button onClick={() => handleSearch(query)}>Search</button>
      
      {results.map((product, index) => (
        <div 
          key={product.id}
          onClick={() => handleResultClick(product, index)}
        >
          {product.title}
        </div>
      ))}
    </div>
  );
}
```

### Checkout Flow with Analytics

```tsx
import React, { useState } from 'react';
import { useProbeCommerce } from '../hooks/useProbe';

function CheckoutFlow({ cart }) {
  const [step, setStep] = useState('shipping');
  const { 
    trackCheckoutStart, 
    trackCheckoutComplete, 
    trackCheckoutAbandon 
  } = useProbeCommerce();
  
  useEffect(() => {
    // Track checkout start when component mounts
    trackCheckoutStart(cart.total);
  }, []);
  
  const handleStepChange = (newStep) => {
    // Track if user abandons at each step
    if (step === 'shipping' && newStep === 'payment') {
      // User proceeded from shipping to payment
    } else if (step === 'payment' && !newStep) {
      // User abandoned at payment step
      trackCheckoutAbandon('payment', cart.total);
    }
    
    setStep(newStep);
  };
  
  const handleComplete = async () => {
    try {
      const order = await placeOrder();
      trackCheckoutComplete(order.id, order.total);
    } catch (error) {
      trackCheckoutAbandon('error', cart.total);
    }
  };
  
  return (
    <div>
      {step === 'shipping' && <ShippingForm onNext={() => handleStepChange('payment')} />}
      {step === 'payment' && <PaymentForm onComplete={handleComplete} />}
    </div>
  );
}
```

---

## Debugging

### View Session Data

```javascript
// In browser console
const session = JSON.parse(localStorage.getItem('probe_session'));
console.log(session);

// View device ID
console.log(localStorage.getItem('probe_device_id'));
```

### Enable Debug Logging

The Probe hook logs warnings for failed events. To enable verbose logging:

```typescript
// Add to useProbe.ts (development only)
const DEBUG = true;

function trackEvent(...) {
  if (DEBUG) {
    console.log('[Probe] Tracking event:', type, properties);
  }
  // ...
}
```

---

## Privacy Considerations

- **No PII**: Probe does not track personally identifiable information
- **Device ID**: Anonymous UUID, resettable by clearing browser data
- **Session Timeout**: Sessions automatically expire after 30 minutes
- **Opt-out**: Users can clear `probe_session` and `probe_device_id` from localStorage

---

## Troubleshooting

### Events Not Being Tracked

1. Check that `useProbeAnalytics()` is called in `App.tsx`
2. Verify localStorage is enabled in the browser
3. Check browser console for errors
4. Verify network requests in DevTools Network tab

### Session Expires Too Quickly

- Sessions expire after 30 minutes of **inactivity**
- Heartbeats are sent every 30 seconds while the tab is open
- Check if the page is being unloaded/reloaded frequently

### Device ID Changes

- Device ID is stored in localStorage
- It changes if user clears browser data
- It's different in incognito/private browsing

---

## API Reference

### Hooks

| Hook | Description |
|------|-------------|
| `useProbeAnalytics()` | Initialize analytics (call once in App) |
| `useProbe()` | Get `track()` function and session data |
| `useTrackProductView(productId, categoryId)` | Auto-track product views |
| `useTrackSearch()` | Get search tracking functions |
| `useProbeCommerce()` | Get commerce tracking functions |

### Functions

| Function | Description |
|----------|-------------|
| `trackEvent(type, properties, session, context)` | Track an event |
| `setProbeUser(userId)` | Link session to user |
| `clearProbeSession()` | End session and clear data |
| `getOrCreateSession()` | Get current session or create new |

### Types

```typescript
type ProbeEventType = 
  | 'session.start' | 'session.end' | 'session.heartbeat'
  | 'screen.view' | 'screen.exit'
  | 'product.view' | 'product.impression' | 'product.share'
  | 'search.query' | 'search.result_click' | 'search.no_results'
  | 'cart.add' | 'cart.remove' | 'cart.view'
  | 'checkout.start' | 'checkout.complete' | 'checkout.abandon'
  | 'interaction.like' | 'interaction.save' | 'interaction.share';

interface ProbeEventProperties {
  [key: string]: any;
}

interface ProbeEventContext {
  screen_name?: string;
  referrer?: string;
  source?: string;
  user_agent?: string;
  ip_address?: string;
}
```

---

## Backend Integration

Events are sent to: `POST /api/v2/probe/events/ingest`

Request format:
```json
{
  "session_id": "sess_123",
  "user_id": "user_123",
  "device": {
    "device_id": "device_123",
    "platform": "web",
    "app_version": "1.0.0",
    "os_version": "Chrome 120",
    "locale": "en-US"
  },
  "events": [
    {
      "type": "product.view",
      "product_id": "prod_456",
      "timestamp": "2026-04-02T10:30:00Z",
      "properties": {
        "viewed_at": "2026-04-02T10:30:00Z"
      },
      "context": {
        "screen_name": "product_detail",
        "source": "organic"
      }
    }
  ]
}
```

---

## Summary

Probe provides comprehensive analytics tracking for the Juno website:

✅ **Automatic Tracking**
- Session management with heartbeat
- Page views and screen navigation
- Device fingerprinting
- Traffic source detection

✅ **Event Tracking**
- Product views and impressions
- Search queries and clicks
- Cart and checkout events
- User interactions

✅ **Performance**
- Event batching (1s intervals)
- Retry on failure
- Minimal network overhead

✅ **Privacy**
- No PII tracking
- Anonymous device IDs
- Automatic session expiry

All usage data is shared with the backend for real-time analytics and insights.
