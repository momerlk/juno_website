# Commerce Client Implementation Guide

This document describes the recommended client architecture for the commerce module when the goal is a cart that feels instant even on slow or unstable networks.

The key rule is simple:

- Never make the UI wait on the network for cart interactions.
- Treat the client cart as the primary interactive state.
- Sync with the server in the background.

If this is implemented correctly, adding items, removing items, changing quantities, and opening the cart should all feel immediate.

---

## Goals

- Cart reads should be instant after app launch.
- Add/remove/update actions should complete visually in under one frame.
- Slow API responses should not block interaction.
- Temporary network failures should not lose cart intent.
- Server remains the source of truth for final pricing and checkout validation.

---

## Recommended Client Model

Use three layers of state:

1. `persistedCart`
The last cart state successfully confirmed by the server.

2. `optimisticCart`
The cart state after applying local user actions immediately.

3. `operationQueue`
A durable queue of pending cart mutations that still need server sync.

This gives the client two important properties:

- The UI always renders from `optimisticCart`, so interactions are immediate.
- The app can recover from app restarts or network loss because queued operations are persisted locally.

---

## Local Storage Strategy

Persist these keys locally per authenticated user:

- `commerce_cart_snapshot:{userId}`
- `commerce_cart_ops:{userId}`
- `commerce_cart_meta:{userId}`

Recommended contents:

### Cart Snapshot

```json
{
  "id": "user-id",
  "user_id": "user-id",
  "items": [
    {
      "product_id": "prod-1",
      "variant_id": "var-1",
      "quantity": 2,
      "price": 3500
    }
  ],
  "gift_details": null,
  "created_at": "2026-04-01T10:00:00Z",
  "updated_at": "2026-04-01T10:03:00Z"
}
```

### Operation Queue

```json
[
  {
    "id": "op-1",
    "type": "add_item",
    "payload": {
      "product_id": "prod-1",
      "variant_id": "var-1",
      "quantity": 1
    },
    "created_at": "2026-04-01T10:03:10Z"
  }
]
```

### Meta

```json
{
  "last_server_sync_at": "2026-04-01T10:03:12Z",
  "sync_in_flight": false,
  "version": 1
}
```

Use durable storage:

- iOS: SQLite, Core Data, or a durable key-value store
- Android: Room or SQLite
- Web: IndexedDB
- React Native / Flutter: SQLite-backed local persistence preferred over volatile memory-only stores

Do not rely only on in-memory state for cart data.

---

## API Usage Pattern

Current server endpoints:

- `GET /api/v2/commerce/cart`
- `POST /api/v2/commerce/cart`
- `DELETE /api/v2/commerce/cart/items`
- `POST /api/v2/commerce/checkout`
- `GET /api/v2/commerce/orders`

Because the API currently supports add and remove operations but not a dedicated batch mutation endpoint, the best client strategy is:

- Apply every mutation locally first.
- Coalesce repeated operations before syncing.
- Flush the queue sequentially in the background.
- Re-fetch the cart after a flush succeeds or when reconciliation is needed.

---

## Fast Cart Architecture

### 1. Hydrate Cart From Local Storage First

On app start or screen open:

- Load `commerce_cart_snapshot:{userId}` immediately.
- Render that cart without waiting for the network.
- Start a background `GET /commerce/cart` sync.

This avoids the slow-network blank state problem.

### 2. Apply Mutations Optimistically

When the user adds or removes an item:

- Update `optimisticCart` immediately.
- Persist the updated snapshot immediately.
- Append a mutation to `operationQueue`.
- Start or schedule background sync.

The UI should never wait for the HTTP response before showing the change.

### 3. Coalesce Repeated Mutations

Before sending the queue to the server, collapse redundant operations.

Examples:

- Three rapid adds of the same `product_id + variant_id` should become one add with summed quantity.
- An add followed by a remove of the same item can cancel out.
- A remove followed by another remove for the same item should remain one remove.

This reduces network traffic and helps the cart feel stable under rapid tapping.

### 4. Serialize Writes

Only allow one cart sync worker per user session.

If multiple write requests run concurrently, race conditions become likely because the API is mutation-based rather than version-based.

Recommended rule:

- one writer
- many readers
- background reconciliation after writes

### 5. Reconcile With Server After Flush

After queued operations are sent successfully:

- fetch the latest server cart
- replace `persistedCart`
- rebuild `optimisticCart` from that result plus any newly queued local actions that arrived during the sync

This keeps the client aligned with server-calculated pricing and stock outcomes.

---

## Suggested Client Flow

### App Launch / Session Resume

1. Load local cart snapshot.
2. Render immediately.
3. If network is available, fetch server cart in background.
4. Merge server cart into local state only if there are no unsynced local mutations, or rebase queued mutations on top of the server cart.

### Add To Cart

1. Update local quantity immediately.
2. Show success UI immediately.
3. Queue `add_item`.
4. Flush queue after a short debounce such as `150ms` to `400ms`.

### Remove From Cart

1. Remove item locally immediately.
2. Queue `remove_item`.
3. Flush in background.

### Cart Screen Open

1. Use local cart instantly.
2. Refresh prices and stock in background if last sync is stale.
3. Show a subtle syncing indicator, not a blocking spinner.

### Checkout

Checkout is different from cart interactions.

- Do not allow checkout to rely on stale local assumptions.
- Always flush the cart queue before checkout.
- Always require fresh server validation before final purchase confirmation.

Recommended checkout flow:

1. Pause new cart writes.
2. Flush all pending cart mutations.
3. Fetch fresh cart if needed.
4. Submit `POST /commerce/checkout`.
5. If successful, clear local cart snapshot and operation queue.

---

## Conflict Handling

The server is authoritative for:

- stock availability
- variant validity
- latest prices
- address validation
- final order totals

The client is authoritative only for immediate interaction intent.

When server sync rejects an operation:

- rollback only the affected optimistic mutation
- keep unrelated local mutations
- show a precise user message

Examples:

- item is out of stock
- variant no longer exists
- quantity exceeds available inventory

Do not wipe the entire cart because one mutation fails.

---

## UI Behavior Recommendations

To make the experience feel smooth on poor networks:

- Use optimistic badges and counters immediately.
- Show item-level pending state, not full-screen loading.
- Keep checkout button enabled unless sync or validation makes checkout unsafe.
- Use subtle “Syncing…” or “Saved” indicators.
- Avoid spinner-heavy flows for cart actions.

Good UX pattern:

- tap `Add to cart`
- cart count updates instantly
- mini-cart updates instantly
- background sync runs silently
- only show an error if reconciliation fails

Bad UX pattern:

- tap `Add to cart`
- button disables
- spinner appears
- count updates only after network response

That pattern will feel broken on slow mobile networks.

---

## Data Freshness Rules

Recommended freshness policy:

- cart screen: background refresh if last sync older than `15-30s`
- product detail page: local cart count updates immediately from store
- checkout screen: always flush queue and validate fresh state
- order history: network-first with local cache fallback

Pricing displayed in cart can be optimistic, but the client should treat checkout totals as provisional until the server confirms them.

---

## Suggested Operation Types

Even though the API currently exposes only add/remove semantics, model client actions explicitly:

- `add_item`
- `remove_item`
- `set_quantity`
- `clear_cart`

Internally, convert unsupported actions into supported API calls.

Example:

- `set_quantity` from `1 -> 4` can become one `add_item(quantity=3)`
- `set_quantity` from `4 -> 0` can become one `remove_item`

This gives the client a better internal model without requiring the backend contract to change immediately.

---

## Retry Policy

Use automatic retries for transient failures:

- exponential backoff
- jitter
- max retry cap

Recommended defaults:

- first retry: `1s`
- second retry: `2s`
- third retry: `4s`
- then slower retries up to a bounded max

Pause retries when offline. Resume when connectivity returns or the app becomes active again.

Do not spam the server with immediate repeated writes.

---

## Recommended State Machine

Use a simple cart sync state machine:

- `idle`
- `dirty`
- `syncing`
- `error`

Definitions:

- `idle`: local and server state are aligned
- `dirty`: local changes exist and are queued
- `syncing`: queue is being flushed
- `error`: one or more queued actions failed and need reconciliation

This is enough for stable UX and easy debugging.

---

## Best-Practice Merge Rules

When a fresh server cart arrives:

1. Replace `persistedCart` with the server response.
2. Start from that server cart.
3. Replay any still-pending local operations onto it.
4. Store the result as the new `optimisticCart`.

This is safer than trying to partially patch the local cart with ad hoc rules.

---

## Analytics And Observability

Track these client metrics:

- time from user tap to visible cart update
- time from mutation queued to server ack
- cart sync failure rate
- checkout failure rate caused by stale cart or stock mismatch
- number of queued operations per session

If the first metric is not near-instant, the client is waiting too much on the network.

---

## What Clients Should Avoid

- Do not fetch the cart before every local render.
- Do not block cart UI on `POST /commerce/cart`.
- Do not discard queued operations on app restart.
- Do not keep multiple simultaneous cart sync workers.
- Do not assume cart prices are final until checkout succeeds.
- Do not clear the full cart locally because one server mutation fails.

---

## Recommended Backend Enhancements

The current API can support a fast client, but these additions would make clients even smoother and simpler:

- `PATCH /api/v2/commerce/cart/items` for direct quantity updates
- `POST /api/v2/commerce/cart/sync` for batched cart mutations
- cart versioning or revision numbers for stronger conflict handling
- server responses that include mutation results plus full normalized cart state

If these are added later, clients should still keep the same optimistic local-first architecture.

---

## Guest Website Sales Channel

This section applies to:

- website checkout
- performance marketing landing pages
- paid acquisition funnels
- guest users who do not create an account before purchase

For this channel, the client should use the guest commerce endpoints instead of the authenticated user cart endpoints.

Current guest endpoints:

- `GET /api/v2/commerce/guest/cart`
- `POST /api/v2/commerce/guest/cart`
- `DELETE /api/v2/commerce/guest/cart/items`
- `PUT /api/v2/commerce/guest/cart/customer`
- `POST /api/v2/commerce/guest/checkout`
- `POST /api/v2/commerce/guest/orders/lookup`

### Core Rule

The website must create and persist a durable `guest_cart_id` as early as possible.

Use the `X-Guest-Cart-Id` header on every guest commerce request. The backend also returns this value in the response body and response header when a new guest cart is created.

Recommended storage:

- primary: first-party cookie
- secondary: `localStorage`

The cookie is important for:

- checkout continuity across landing pages
- session recovery after refresh
- attribution continuity during paid traffic flows
- smoother recovery when users open multiple tabs

### Recommended Guest Funnel

The highest-converting flow is:

1. user lands on PDP, collection page, or campaign landing page
2. user taps `Add to cart`
3. client updates the mini-cart instantly
4. client calls `POST /commerce/guest/cart`
5. client stores returned `guest_cart_id`
6. user opens a frictionless one-page checkout
7. client collects only minimal delivery details
8. client saves those details with `PUT /commerce/guest/cart/customer`
9. client submits `POST /commerce/guest/checkout`

Do not force:

- account creation
- password setup
- OTP verification before purchase
- address-book management
- unnecessary form steps

Those are conversion killers for performance marketing traffic.

### Guest Cart Token Handling

If the website does not yet have a `guest_cart_id`:

- send `POST /commerce/guest/cart` without the header
- read `guest_cart_id` from the response
- persist it immediately
- reuse it for the rest of the session and future visits until checkout completes or the cart is intentionally cleared

The client should treat `guest_cart_id` as the anonymous cart identity.

Recommended cookie attributes:

- `SameSite=Lax`
- `Secure` in production
- expiry long enough to support return visits, for example `7-30 days`

### Guest Cart Performance Strategy

For website and paid traffic, the same local-first rules still apply:

- optimistic cart UI immediately
- background sync after the visual update
- durable local cart snapshot
- one serialized sync worker

Recommended local keys:

- `commerce_guest_cart_id`
- `commerce_guest_cart_snapshot:{guestCartId}`
- `commerce_guest_cart_ops:{guestCartId}`

The mini-cart, sticky cart CTA, and checkout summary should all read from the same local guest cart store.

### Minimal Guest Checkout Details

The guest checkout flow is designed to minimize friction.

Required fields:

- `full_name`
- `phone_number`
- `address_line1`
- `city`

Optional fields:

- `email`
- `address_line2`
- `province`
- `postal_code`
- `country`

If `country` is omitted, the backend defaults it to `Pakistan`.

Recommended UX:

- keep all required fields above the fold
- mark email optional
- avoid splitting name into first/last unless absolutely necessary
- avoid long address forms
- avoid forcing province if city is enough for the first conversion pass

### Best Website Checkout Pattern

For performance marketing, prefer a one-page checkout:

- contact section
- address section
- order summary
- payment CTA

Recommended interaction pattern:

1. user edits fields locally
2. client debounces save of guest details
3. client calls `PUT /commerce/guest/cart/customer` in background
4. UI shows lightweight saved state
5. final CTA only blocks on the final checkout call

Do not make every field blur trigger a blocking spinner.

### Suggested Save Strategy For Guest Details

Use a debounced autosave for guest details:

- `300ms` to `800ms` debounce after field changes
- immediate local persistence on each keystroke
- background save to `PUT /commerce/guest/cart/customer`

If the autosave fails:

- keep local values
- retry in background
- show a subtle inline warning only if the user is about to place the order

This keeps the checkout feeling stable on weak networks.

### Guest Checkout Submission

Recommended submit flow:

1. flush pending guest cart mutations
2. flush pending guest customer-detail save
3. ensure required fields are still present locally
4. call `POST /commerce/guest/checkout`
5. if successful, clear local guest cart snapshot and operation queue
6. keep order confirmation data locally for immediate thank-you-page rendering

Only the final submission should be truly blocking.

### Order Tracking For Guest Users

After checkout, the website should support order lookup without requiring login.

Current lookup endpoint:

- `POST /api/v2/commerce/guest/orders/lookup`

It supports:

- `phone_number`
- `email`

Recommended website behavior:

- default to phone number as the primary lookup method
- allow email as fallback
- prefill the tracking form from the value used during checkout when possible

Suggested post-purchase flow:

1. show thank-you page immediately after checkout
2. store the last used phone/email locally
3. on the tracking page, prefill that value
4. call guest order lookup only when the user explicitly checks status

### Conversion-Focused UX Recommendations

For the website sales channel:

- keep the primary CTA visible at all times on mobile
- show the cart count instantly after add-to-cart
- use drawer or bottom-sheet cart patterns instead of full page jumps where possible
- keep checkout on a single page
- defer non-essential upsells until after the main form is complete
- use phone number as the main identifier because it is usually lower-friction than account creation
- ask for email as optional for receipts and tracking convenience, not as a gate

### Guest Flow Pseudocode

```ts
async function addToGuestCart(input: {
  productId: string;
  variantId: string;
  quantity: number;
}) {
  guestCart.optimistic = applyAdd(guestCart.optimistic, input);
  renderCartInstantly();

  const guestCartId = loadGuestCartId();
  const response = await api.addToGuestCart(input, guestCartId);

  saveGuestCartId(response.guest_cart_id);
  persistGuestCartSnapshot(response.cart);
  guestCart.persisted = response.cart;
  guestCart.optimistic = response.cart;
}

async function saveGuestDetails(details: GuestDetailsForm) {
  persistGuestDraft(details);

  const guestCartId = loadGuestCartId();
  await api.saveGuestCheckoutDetails(details, guestCartId);
}

async function submitGuestCheckout(paymentMethod: string) {
  await flushGuestCartQueue();
  await flushGuestDetailsSave();

  const guestCartId = loadGuestCartId();
  const order = await api.guestCheckout({ payment_method: paymentMethod }, guestCartId);

  clearGuestCartState();
  persistRecentGuestOrder(order);
  return order;
}
```

### Final Recommendation For Website And Performance Marketing

For the website sales channel, the best implementation is:

- anonymous cart identity via `guest_cart_id`
- cookie-backed persistence
- optimistic add-to-cart
- one-page guest checkout
- minimal required address/contact fields
- debounced background save for guest details
- one blocking step only at final order placement
- post-purchase tracking by phone or email

That is the highest-conversion path supported by the current backend while keeping the experience smooth on slow networks and low-intent paid traffic sessions.

---

## Reference Pseudocode

```ts
type CartOp =
  | { id: string; type: "add_item"; productId: string; variantId: string; quantity: number }
  | { id: string; type: "remove_item"; productId: string; variantId: string };

async function addToCart(productId: string, variantId: string, quantity: number) {
  optimisticCart = applyAdd(optimisticCart, { productId, variantId, quantity });
  await persistSnapshot(optimisticCart);

  queue.push({
    id: createId(),
    type: "add_item",
    productId,
    variantId,
    quantity,
  });

  await persistQueue(queue);
  scheduleFlush();
}

async function flushQueue() {
  if (syncState === "syncing" || queue.length === 0) return;

  syncState = "syncing";
  const ops = coalesce(queue);

  try {
    for (const op of ops) {
      if (op.type === "add_item") {
        await api.addToCart({
          product_id: op.productId,
          variant_id: op.variantId,
          quantity: op.quantity,
        });
      }

      if (op.type === "remove_item") {
        await api.removeFromCart(op.productId, op.variantId);
      }
    }

    queue = [];
    const serverCart = await api.getCart();
    persistedCart = serverCart;
    optimisticCart = serverCart;
    await persistSnapshot(serverCart);
    await persistQueue(queue);
    syncState = "idle";
  } catch (error) {
    syncState = "error";
    scheduleRetry();
  }
}
```

---

## Final Recommendation

For this commerce module, the best client implementation is:

- local-first cart state
- durable queued mutations
- optimistic UI for all cart interactions
- one serialized background sync worker
- server reconciliation after flush
- strict fresh validation before checkout

That combination gives the fastest perceived performance and the most resilient behavior on weak networks without sacrificing correctness at checkout time.
