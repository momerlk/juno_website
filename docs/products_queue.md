# Products Queue System Documentation

This document outlines the design and usage of the **Products Queue System**, a staging area for product ingestion that ensures data quality and isolates bad data from the main product catalog.

## Overview

All products coming from **Seller Portal Manual Uploads** or **Shopify Ingestion** must pass through the `products_queue` collection. No product is written directly to the `products` collection.

## Data Model

The `products_queue` collection stores items with the following structure:

```json
{
  "id": "uuid",
  "product": { ...full product object... },
  "status": "queued",
  "errors": ["Title is required", "Invalid UTF-8"],
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Lifecycle States

| State | Description | Transition Trigger |
| :--- | :--- | :--- |
| **queued** | Initial state upon upload/ingestion. | `AddToQueue` |
| **validation_pending** | Basic validation (UTF-8, required fields) failed or is in progress. Check `errors` array. | `Validate` |
| **enrichment_pending** | Basic validation passed, but business logic (e.g., gender inference, product type) requires manual input. | `Validate` -> Success but needs enrichment |
| **ready** | Product is valid and fully enriched. Ready for promotion. | `Validate` -> Success & Enriched |
| **failed** | Product has been rejected or has critical unrecoverable errors. | `Reject` or Critical Failure |

### Transitions

1.  **Ingestion**: `Seller/Shopify` -> `queued`.
2.  **Auto-Validation**: System immediately runs validation.
    *   If invalid -> `validation_pending` (with errors).
    *   If valid but incomplete (e.g., missing gender) -> `enrichment_pending`.
    *   If valid and complete -> `ready`.
3.  **Manual Update**: Seller updates fields via `PUT /products-queue/{id}` -> System re-runs validation -> Updates state.
4.  **Promotion**: Seller clicks "Publish" on a `ready` item -> Moves to `products` collection.
5.  **Rejection**: Seller clicks "Discard" -> State becomes `failed`.

## API Contracts

### List Queue Items
`GET /api/v1/seller/products-queue`

### Get Queue Item
`GET /api/v1/seller/products-queue/{id}`

### Update Enrichment
`PUT /api/v1/seller/products-queue/{id}`
Payload: JSON object with fields to update (e.g., `product_type`, `gender`, `sizing_guide`).

### Promote to Product
`POST /api/v1/seller/products-queue/{id}/promote`
*Requires status to be `ready`.*

### Reject Item
`POST /api/v1/seller/products-queue/{id}/reject`
Payload: `{"reason": "string"}`

## Shopify Ingestion Rules

*   **Stock Default**: If a variant is active (`available: true`) but `inventory_quantity` is `0` (or missing), the system enforces a default stock of **1**. This ensures products are purchasable even if stock tracking is disabled on Shopify.
*   **Duplicate Handling**: Ingestion uses `raw_id` (Shopify ID) to prevent duplicates. Re-ingesting updates the existing queue item (or resets it if it was already processed, depending on policy).

## Deactivation Rules

To ensure platform integrity, deactivation is enforced at the read layer:

1.  **Sellers**: If a Seller is `suspended` or `inactive`, **ALL** their products become invisible in `List`, `Search`, and `Get` endpoints.
2.  **Products**: Products with `status != active` are hidden from public views.
3.  **Users**: `inactive` or `suspended` users are blocked from:
    *   Adding items to cart.
    *   Checkout.
    *   Viewing their cart (access denied).

**Implication for Recommendation System**:
*   The recommendation engine must filter out products where `seller.status != active` OR `product.status != active`.
*   Users with `account_status != active` should not receive personalized recommendations (or system should treat them as guests).

## Seller Portal Expectations

*   The portal must show a "Drafts/Queue" tab separate from "Active Products".
*   Items in "Queue" should display their `status` and `errors`.
*   The portal must provide a UI to fix validation errors and provide enrichment data (e.g., dropdown for Gender if missing).
*   The "Publish" button must be disabled unless status is `ready`.

## Failure Handling

*   **Hard Failure Isolation**: Bad data (invalid UTF-8, missing price) stays in `products_queue`. It effectively "quarantines" garbage data preventing it from breaking the main storefront apps.
*   **Retry**: Sellers can fix errors and retry (update) indefinitely.
