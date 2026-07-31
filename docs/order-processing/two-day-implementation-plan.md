# Two-Day Order Processing Implementation Plan

Status: Day 1 API implementation record and frontend hand-off, 31 July 2026

This plan is written for AI coding agents working with an API developer and a website/frontend developer.

It assumes the API and frontend lanes work in parallel and use AI agents for the bounded parts below. Each `A` or `B` part is intended to be one agent prompt and one reviewable commit.

- **Day 1:** Phase 1, before Daraz Open Platform access.
- **Day 2:** Phase 2, after Daraz Open Platform access.

The API and frontend work may run in parallel only after the API agent has written the endpoint contract in the module's `docs.md`.

## What should exist after two days

1. Each seller order is processed independently. `parent_orders` is not used for daily order work.
2. The backend creates a ready-to-copy ChatGPT prompt, records the reviewed result, lists missing information and creates a message staff can copy.
3. Brands receive packing instructions/receipt by email, with Juno CC'd.
4. Staff can obtain manual DEX booking rows, enter them into DEX themselves, upload an airway bill and enter tracking in Phase 1.
5. Brands upload the required product/parcel pictures before marking an order packed.
6. Juno tracks the saved DEX tracking number.
7. Staff can mark matching orders as DEX payment received.
8. Staff can create and pay one statement per brand, including DEX charges, commission, invoice and payment proof.
9. Phase 2 can replace the manual DEX booking/AWB/tracking steps through Daraz Open Platform without removing the Phase 1 fallback.
10. Every important action records the admin/seller account that performed it.

## Keep the implementation small

Do not build:

- a new backend module;
- a second order model;
- a workflow engine;
- a new scheduler package;
- a new file-upload system;
- a custom PDF engine when printable HTML is enough;
- a custom statutory financial-statement designer before Juno's accountant approves the account mappings;
- a second admin or seller portal.

Reuse:

- `internal/v2/modules/commerce/` for orders, notifications and tracking;
- `internal/v2/modules/admin/` for DEX exports, settlement and brand statements;
- existing `delivery_bookings` for tracking/AWB data;
- existing media upload endpoints for packing photos, statements, airway bills and payment proof;
- existing Excelize reader for DEX payment statements;
- existing Resend `SendWithCc` support;
- existing native background ticker pattern;
- existing admin/seller accounts and JWT actor IDs;
- existing frontend admin/seller order pages and API clients.

## Rules for every AI agent part

Each part below is one bounded task. The assigned agent must:

1. read the named files and current module `docs.md`;
2. implement only that part;
3. reuse existing helpers before adding code;
4. preserve old data and make new fields optional;
5. add one focused test for money, status, security or parsing logic;
6. run the smallest relevant tests/build;
7. report changed files and anything intentionally left out.

An agent must not refactor unrelated code while completing a part.

## Required `docs.md` format for API work

Every API part updates `internal/v2/modules/commerce/docs.md` or `internal/v2/modules/admin/docs.md` in the same change.

For each changed endpoint, document:

- purpose in one sentence;
- HTTP method and full path;
- required role: customer, seller or admin;
- request fields with required/optional labels;
- complete request JSON or multipart example;
- complete success response example;
- every new status/enum and what it means;
- common `400`, `401/403`, `404`, `409` and `500` errors;
- whether the action sends email or changes order status;
- which actor/time fields are saved;
- a short **Frontend notes** section explaining button state, validation and refresh behavior;
- a short **Rollback/fallback** note.

Do not regenerate Swagger unless separately requested. The module `docs.md` is the frontend contract for this sprint.

---

# Day 1 — Phase 1: Before Daraz Open Platform

Parts 0A–7A are implemented. The `B` parts below are the current frontend hand-off; their module `docs.md` contracts take precedence over older work items in this plan.

## Part 0A — API: Private uploads for order and payment evidence

**Owner:** API developer/agent  
**Depends on:** nothing  
**Main files:**

- existing `internal/v2/modules/media/` models, service and handler files
- `internal/v2/modules/media/docs.md`
- router wiring needed to give commerce/admin a signed-download helper

### Work

1. Extend the existing presigned/upload flow with `visibility: "private"`.
2. Private objects must not receive a public ACL. Save their object name and uploader, not a permanent public URL.
3. Add a small internal helper that creates a short-lived signed download URL.
4. The media helper exists; feature endpoints must check the logged-in admin or owning seller before calling it. This is complete only where a feature has an authorized download route.
5. Keep existing public product/media upload behavior unchanged.
6. Use private uploads for airway bills, packing photos, DEX statements and payment proof.
7. Document the private upload request, confirmation response, expiry and errors in `media/docs.md`.

### Required tests

- Public uploads keep existing behavior.
- Private uploads do not set public ACL.
- An unauthorized user cannot receive a private download URL.

### Done when

- Later parts can store an object name and safely return a temporary URL after checking access.
- Existing storefront images still work.

### Easy rollback

Stop offering `visibility: "private"`; no public upload contract changes.

## Part 0B — Frontend: Shared private-file uploader

**Owner:** website/frontend developer/agent  
**Depends on:** Part 0A `media/docs.md`  
**Main files:**

- `src/api/shared.ts`
- shared API types if needed

### Work

1. Add one helper beside the existing upload helper that uploads a private file and returns its object name.
2. Accept allowed file types and size from the calling screen; do not create a new upload component library.
3. Do not save or display the temporary upload/download URL as a permanent URL.

### Done when

- Later admin/seller parts can call one helper for private images and supported documents.
- Existing public image upload helper remains unchanged.

**Current API contract:** private presign and confirm are available. A private upload returns `object_name`, never a permanent `public_url`; do not persist a temporary URL. Use the object name for supported private evidence such as bank proof.

**Current limitation:** the media allow-list does not yet accept `.xlsx`, so this helper cannot upload a DEX payment statement until the API allow-list is extended or a supported ingestion route is supplied.

### Easy rollback

Delete the new helper; existing public uploads are unaffected.

## Part 1A — API: Make seller orders the only working order

**Owner:** API developer/agent  
**Depends on:** nothing  
**Main files:**

- `internal/v2/modules/commerce/models.go`
- `internal/v2/modules/commerce/service.go`
- `internal/v2/modules/commerce/repository.go`
- `internal/v2/modules/commerce/handler.go`
- `internal/v2/modules/commerce/notifications.go`
- `internal/v2/modules/commerce/notifications_test.go`
- `internal/v2/modules/commerce/docs.md`
- `internal/v2/router/router.go`

### Work

1. Add a small checkout response containing:

   ```json
   {
     "checkout_id": "analytics-correlation-id",
     "orders": [{ "id": "order-id", "order_number": "ORD-...-A" }]
   }
   ```

2. Keep writing the existing parent record only for analytics/correlation. Do not read it to process an order.
3. Make customer order history, guest lookup, receipt, tracking, admin detail and cancellation work directly with seller orders.
4. Stop recomputing parent status after a seller order changes.
5. Make parent list/detail read-only analytics endpoints. Remove the parent cascade-cancel route from the active router; keep the code/data for an easy rollback during this sprint.
6. Send one customer confirmation email per seller order.
7. Update the existing brand email so it contains packing instructions and the seller processing receipt. Continue CC'ing Juno, but move the Juno address list from hardcoded code to `JUNO_OPERATIONS_EMAILS`.
8. Keep existing seller-order IDs, numbers, statuses and fields unchanged.

### Done when

- A checkout with two brands returns two orders.
- The customer receives two emails.
- Each brand receives only its order, packing instructions and receipt.
- Updating one order does not update another order or require a parent read.
- Existing one-brand checkout still works.
- `go test ./internal/v2/modules/commerce` and `go build -o main .` pass.

### Easy rollback

Restore the old checkout response/router calls. No parent data or old order fields are deleted.

## Part 1B — Frontend: Use independent orders everywhere

**Owner:** website/frontend developer/agent  
**Depends on:** Part 1A `commerce/docs.md` contract  
**Main files:**

- `src/api/api.types.ts`
- `src/api/commerceApi.ts`
- `src/api/adminApi.ts`
- `src/components/checkout/OrderConfirmationPage.tsx`
- `src/components/admin/ManageOrders.tsx`
- `src/components/admin/OrderDetailPage.tsx`

### Work

1. Add the documented checkout result type.
2. Show each created order separately on the confirmation page with its order number, brand, amount and tracking/receipt link.
3. Change admin order detail to load the selected seller order directly through the existing child-order endpoint.
4. Remove “Cancel parent” and parent/child wording from the active admin UI.
5. Keep customer/admin routes compatible with existing order URLs where possible.
6. Do not redesign the pages; change only the data source and labels.

### Done when

- A two-brand checkout shows two order cards.
- Opening or cancelling one order affects only that order.
- No active frontend order action sends a parent ID.
- `npm run build` passes.

### Easy rollback

The change is limited to API adapters and existing order pages. Revert those files to restore the old view.

## Part 2A — API: AI address formatting and copyable message

**Owner:** API developer/agent  
**Depends on:** Part 1A order model  
**Main files:**

- `config/config.go`
- `internal/v2/modules/commerce/models.go`
- `internal/v2/modules/commerce/service.go`
- `internal/v2/modules/commerce/repository.go`
- `internal/v2/modules/commerce/docs.md`
- existing admin order-customer handler/service files if the current update route needs extension

### Work

1. Add optional address review fields to each order:

   ```json
   {
     "original_address": "...",
     "formatted_address": "...",
     "missing_fields": ["house_or_building", "area"],
     "customer_message": "Hi ...",
     "format_status": "ready",
     "customer_confirmed": false,
     "formatted_at": "...",
     "confirmed_at": null,
     "confirmed_by": ""
   }
   ```

2. Create a ready-to-copy ChatGPT prompt from the saved order data. There is no `ADDRESS_FORMATTER_URL`, token, external request or automatic formatting.
3. Staff paste ChatGPT's `formatted_address`, `missing_fields` and `customer_message` into the existing admin customer endpoint. Only the documented missing-field names are accepted.
4. Creating an order or changing its address creates a new `manual_review` prompt; it never blocks order creation.
5. `POST /api/v2/admin/orders/{orderID}/address/format` creates a fresh prompt. `PATCH /api/v2/admin/orders/{orderID}/customer` saves the reviewed result or a customer correction and records the acting admin.
6. Never mark the address confirmed until an admin records the customer's confirmation and the review is `ready` with no missing fields.

### Required tests

- Prompt contains the order context and no invented address fields.
- A customer correction creates a fresh prompt.
- Only an empty, ready review can be confirmed.

### Done when

- Every new order has a manual address-review prompt.
- No missing address value is invented.
- `commerce/docs.md` contains the exact update/response contract and missing-field names.

### Easy rollback

New fields are optional. Hide the frontend panel; normal address fields continue to work.

## Part 2B — Frontend: Address review panel

**Owner:** website/frontend developer/agent  
**Depends on:** Part 2A `commerce/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/components/admin/OrderDetailPage.tsx`

### Work

1. Add one address panel showing original address, formatted address and missing fields.
2. Add **Copy Customer Message** using `navigator.clipboard`.
3. Add simple structured inputs for the customer's corrected address.
4. Submit the correction, replace the panel with the returned review and show remaining missing fields.
5. Add **Customer Confirmed Address** only when the returned review is `ready` and no required field is missing; show who confirmed it and when.
6. Replace “retry formatter” with **Create ChatGPT prompt**. The browser never calls ChatGPT.

### Done when

- Staff can copy the message in one click.
- Staff can paste the customer's reply into fields and save it without leaving the order page.
- The UI never calls AI directly from the browser.
- `npm run build` passes.

### Easy rollback

Remove/hide the address-review panel; the existing customer-address editor remains.

## Part 3A — API: Correct DEX Excel rows and manual airway/tracking

**Owner:** API developer/agent  
**Depends on:** Part 1A  
**Main files:**

- `internal/v2/modules/admin/models.go`
- `internal/v2/modules/admin/service.go`
- `internal/v2/modules/admin/repository.go`
- `internal/v2/modules/admin/handler.go`
- `internal/v2/modules/admin/service_pricing_test.go` or one new focused test in the module
- `internal/v2/modules/admin/docs.md`

### Work

1. Use `GET /api/v2/admin/logistics/orders/{orderID}/booking-data?carrier=dex` or `POST /api/v2/admin/logistics/booking-data/bulk`.
2. The API returns staff-copyable DEX field rows in `carrier_payload.rows`; it does not generate, upload or download a DEX workbook. `POST /api/v2/admin/logistics/exports` rejects DEX.
3. One product produces one row. The full order COD is on the first row only; later product rows have zero COD. Weight and dimensions are deliberately blank for staff to enter in DEX.
4. Extend manual booking with optional `airway_bill_url`, tracking URL and tracking number. One tracking number cannot belong to two active orders.

### Done when

- One-order and bulk DEX booking-data requests work.
- Staff can enter the returned fields into the official DEX workbook.
- Staff can save an uploaded airway bill URL and tracking number.
- Existing Smartlane/manual booking behavior still works.
- `go test ./internal/v2/modules/admin` passes.

### Easy rollback

Booking data and manual-booking fields are additive. No DEX workbook is generated by this API.

## Part 3B — Frontend: DEX export, airway bill and tracking controls

**Owner:** website/frontend developer/agent  
**Depends on:** Part 3A `admin/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/api/shared.ts`
- `src/components/admin/ManageOrders.tsx`
- `src/components/admin/OrderDetailPage.tsx`

### Work

1. Add row selection to the existing admin order list if it is not already available.
2. Add **Get DEX booking details** for one or many selected orders; render/copy `carrier_payload.rows` for staff to enter into the official DEX workbook.
3. Show validation errors by order before allowing copy.
4. On the order page, use the private-file upload helper from Part 0B for the airway bill.
5. Add tracking number and optional tracking URL inputs, then call the existing manual booking endpoint.
6. Show the saved airway bill link, tracking number, who saved it and when.
7. Do not add a separate logistics page.

### Done when

- Staff can copy the selected orders' DEX field rows; there is no generated workbook download.
- Staff can upload an airway bill and save tracking without leaving the order page.
- An order-level error does not hide successful bulk rows.
- `npm run build` passes.

### Easy rollback

Hide the new buttons/panel. Existing backend exports and manual booking remain usable.

## Part 4A — API: Seller packing pictures and ready email

**Owner:** API developer/agent  
**Depends on:** Parts 0A and 1A  
**Main files:**

- `internal/v2/modules/commerce/models.go`
- `internal/v2/modules/commerce/service.go`
- `internal/v2/modules/commerce/repository.go`
- `internal/v2/modules/commerce/handler.go`
- `internal/v2/modules/commerce/notifications.go`
- `internal/v2/modules/commerce/notifications_test.go`
- `internal/v2/modules/commerce/docs.md`
- `internal/v2/router/router.go`

### Work

1. Add optional packing evidence to an order:

   ```json
   {
     "item_photos": [{ "order_item_id": "item-1", "url": "..." }],
     "packed_parcel_photo_url": "...",
     "submitted_by": "seller-id",
     "submitted_at": "..."
   }
   ```

2. Add one seller action, for example `POST /api/v2/commerce/seller/orders/{id}/packing`, that submits evidence and marks the order packed in one request.
3. Require at least one photo for every order-item row and one final parcel/AWB photo.
4. Verify the order belongs to the logged-in seller.
5. Prevent the generic seller status endpoint from moving to `packed` without this evidence.
6. Keep an admin override only through the existing admin status action, requiring a note/reason.
7. After success, email Juno operations that the order is ready and CC the brand. Include the order number and portal link, not large image attachments.
8. Save the seller actor/time and normal tracking milestone.

### Done when

- Missing item/parcel photos return a clear `400`.
- Another seller receives `403`.
- A valid submission changes the order to packed and sends one email.
- Retrying the same complete request does not send duplicate ready emails.

### Easy rollback

Hide the seller packing action and allow the previous status route again. Existing optional evidence stays harmless.

## Part 4B — Frontend: Seller packing screen

**Owner:** website/frontend developer/agent  
**Depends on:** Part 4A `commerce/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/sellerApi.ts`
- `src/components/seller/OrderDetailPage.tsx`
- optionally the expanded order section in `src/components/seller/ManageOrders.tsx`

### Work

1. Reuse the private-file upload helper from Part 0B.
2. Show one upload slot next to each order-item row.
3. Show one final **Packed parcel with airway bill** upload.
4. Disable **Mark Packed** until every required upload succeeds.
5. Submit the returned private upload object names in the existing `url` fields and show the saved evidence after success. Do not turn a signed URL into a permanent saved value.
6. Remove/disable the old direct `packed` transition that bypasses evidence.
7. Keep the current seller-portal design; do not redesign the whole order page.

### Done when

- A two-item order requires three photos.
- Refreshing the page keeps the submitted evidence visible.
- The seller cannot submit another seller's order.
- `npm run build` passes.

### Easy rollback

Remove the evidence section and restore the old status button. No product/order data is lost.

## Part 5A — API: Track the manually entered DEX number

**Owner:** API developer/agent  
**Depends on:** Part 3A manual booking  
**Main files:**

- `internal/v2/modules/commerce/logistics_models.go`
- `internal/v2/modules/commerce/logistics_repository.go`
- `internal/v2/modules/commerce/logistics_service.go`
- `internal/v2/modules/commerce/logistics_handler.go`
- `internal/v2/modules/commerce/docs.md`
- `internal/v2/router/router.go`
- application startup file where the existing ticker pattern is started

### Work

1. Extend the existing delivery booking with optional DEX raw status, last checked time and tracking history. Do not create a second shipment collection.
2. Add a small DEX tracking HTTP function using Go standard library and an injectable base URL for tests.
3. Map only the known useful states: picked up, travelling, out for delivery, attempted, delivered and returned. Save unknown raw values without guessing.
4. Add `POST /api/v2/admin/logistics/orders/{orderID}/refresh-tracking` for an admin manual refresh.
5. Reuse the existing native ticker to refresh non-final DEX bookings every 30 minutes when `DEX_TRACKING_POLL_ENABLED=true`.
6. Default the flag to false until DEX permits the current public tracking response. Manual refresh may use the same flag.
7. Prevent duplicate history entries and never move an order backward.
8. Save whether an event came from DEX polling or an admin correction.

### Required tests

- Use `httptest.Server`; do not call live DEX in tests.
- Repeating one DEX event creates one history row.
- Delivered is not moved back to travelling.

### Done when

- An order with a saved DEX tracking number can be refreshed.
- Its existing order tracking timeline updates.
- Polling can be disabled with one environment variable.

### Easy rollback

Disable the environment flag. Manual tracking/status tools continue to work.

## Part 5B — Frontend: Show DEX tracking and manual refresh

**Owner:** website/frontend developer/agent  
**Depends on:** Part 5A `commerce/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/api/logisticsApi.ts`
- `src/components/admin/OrderDetailPage.tsx`
- `src/components/seller/OrderDetailPage.tsx`
- `src/components/checkout/OrderTrackingPage.tsx`

### Work

1. Show tracking number, current status, last check and simple timeline.
2. Add **Refresh DEX Tracking** to admin only.
3. Show the DEX tracking link as a fallback.
4. Do not expose raw unknown status codes to customers; show “Delivery update received” and keep raw detail in admin.
5. Refresh the order after a successful manual check. Add **Correct DEX status** separately: it requires the chosen status and a non-empty reason, and is only for correcting DEX data.

### Done when

- Admin, seller and customer see the same useful status.
- Only admin sees refresh/errors/raw details.
- `npm run build` passes.

### Easy rollback

Hide the refresh/timeline additions; the saved tracking link remains.

## Part 6A — API: Record DEX payment received

**Owner:** API developer/agent  
**Depends on:** Parts 0A, 1A and 3A  
**Main files:**

- `internal/v2/modules/admin/models.go`
- `internal/v2/modules/admin/service.go`
- `internal/v2/modules/admin/repository.go`
- `internal/v2/modules/admin/handler.go`
- `internal/v2/modules/admin/docs.md`
- `internal/v2/router/router.go`

### Work

1. Reuse Excelize to read the supplied DEX statement `.xlsx`.
2. Add one `dex_payment_batches` record containing original file URL/name/hash, statement number, totals, selected order IDs, parsed tracking rows, bank reference/proof and acting admin/time.
3. Add `dex_payment_status`, batch ID, received time and received-by fields to the selected orders or their existing booking/financial snapshot.
4. Add `POST /api/v2/admin/financials/dex-payments` for **Mark DEX Payment Received**. Use either one multipart request or the private object name plus JSON, and document the exact choice.
5. Before writing anything, require:

   - no duplicate file hash/statement number;
   - every selected order belongs to a parsed tracking row;
   - every parsed tracking number matches one order;
   - COD values and totals match within PKR 0.01;
   - the source statement calculation balances.

6. If validation fails, return `409` with per-order errors and write nothing.
7. Use the supplied three-order fixture in one parser/calculation test:

   - COD PKR 8,696.00;
   - delivery PKR 420.00;
   - VAT PKR 67.20;
   - income tax PKR 173.92;
   - sales tax PKR 173.92;
   - DEX paid PKR 7,860.96.

8. Extend the existing financial-order endpoint with `dex_payment_status` filtering.

### Done when

- Staff can select one or many matching orders and mark them received with one DEX statement.
- Unmatched/duplicate/wrong totals do not partially update orders.
- The responsible admin and source file remain visible.

### Easy rollback

Stop showing/using the new status. Existing orders and finance rows are unchanged; batches are additive records.

## Part 6B — Frontend: DEX payment received action

**Owner:** website/frontend developer/agent  
**Depends on:** Part 6A `admin/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/components/admin/ManageOrders.tsx`
- private-file upload helper from Part 0B

### Work

1. Add **Mark DEX Payment Received** for selected orders eligible in the API response; do not infer eligibility from the browser.
2. Ask for the DEX statement file and optional bank reference/proof; upload private files through Part 0B.
3. Show the selected order count and COD total before submission.
4. Show validation errors next to each order.
5. Refresh the list and show the saved status, admin and date.
6. Do not let the frontend calculate or override DEX totals.

**Current limitation:** this screen depends on a private `.xlsx` object, but the current private media allow-list rejects `.xlsx`. Keep the action hidden until that API gap is resolved; a browser-side workaround would bypass the agreed private-file contract.

### Done when

- Staff can complete a valid batch without leaving the order list.
- A failed batch changes no selected row.
- `npm run build` passes.

### Easy rollback

Hide the bulk action/status column. The API records remain available.

## Part 7A — API: Brand statement, invoice and payment proof

**Owner:** API developer/agent  
**Depends on:** Parts 0A and 6A  
**Main files:**

- `internal/v2/modules/admin/models.go`
- `internal/v2/modules/admin/service.go`
- `internal/v2/modules/admin/repository.go`
- `internal/v2/modules/admin/handler.go`
- `internal/v2/modules/admin/docs.md`
- `internal/v2/modules/commerce/docs.md` for the seller read/download contract
- `internal/v2/router/router.go`
- seller repository/store adapter only if needed to read verified bank details

### Work

1. Add one `brand_statements` record. Store snapshots so later price/bank changes do not rewrite an old statement.
2. Add `POST /api/v2/admin/financials/brand-statements` accepting selected order IDs and either one commission rate or an order-ID-to-rate map.
3. Require every order to:

   - belong to the same brand;
   - have `DEX Payment Received`;
   - not already belong to an active/paid statement;
   - have the current API's immutable `rows[].brand_price` snapshot. In the delivered implementation this value is sourced from `order.financials.subtotal`; it is not an independently saved product brand-price field.
   - have a matching DEX statement row.

4. Calculate commission from `rows[].brand_price` only; the frontend must display that returned snapshot and must not recalculate it.
5. Show each DEX amount separately and calculate:

   `DEX received − Juno commission − approved charges/refunds + credits = brand transfer amount`.

6. Fail if the brand has no verified bank details.
7. Add admin list/detail routes under `/api/v2/admin/financials/brand-statements`. The delivered seller route is list-only: `GET /api/v2/commerce/seller/statements`. It returns only that seller's records and cannot change statements. Seller statement/invoice/proof downloads are not yet exposed and must not be implemented against an admin URL.
8. Add printable HTML endpoints ending in `/statement` and `/invoice`. Reuse receipt HTML patterns; do not add a PDF library.
9. Add `POST /api/v2/admin/financials/brand-statements/{id}/pay` requiring payment proof object name, bank reference and payment date. Only this action marks the statement paid.
10. Save created-by, paid-by and timestamps from existing admin accounts.
11. Provide a simple CSV/XLSX finance export from statement rows for Juno's accountant. Do not implement a custom statutory report builder in this sprint.

### Required tests

- Commission uses brand price, not customer total.
- Mixed-brand selection fails.
- An order cannot be paid twice.
- Missing proof cannot mark paid.

### Done when

- A valid statement shows selected orders, DEX values, commission, bank snapshot and transfer amount.
- Seller access is restricted to the owning brand.
- Paid statement includes proof/reference/date/admin.

### Easy rollback

Disable statement creation routes/UI. Records are additive; existing seller payout fields continue to work.

## Part 7B — Frontend: Admin payment screen and seller statements

**Owner:** website/frontend developer/agent  
**Depends on:** Part 7A `admin/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/api/sellerApi.ts`
- `src/components/admin/ManageOrders.tsx`
- one small admin statement page/drawer under `src/components/admin/`
- one small seller statements page under `src/components/seller/`
- existing admin/seller route and sidebar files

### Work

1. Let admin select DEX-paid orders and choose **Create Brand Statement**.
2. Group/stop mixed brands before submission.
3. Show one commission-rate input with optional per-order override.
4. Display the server calculation; never duplicate finance maths in TypeScript.
5. Show verified seller bank details and amount to transfer.
6. Add printable statement/invoice links for admin only.
7. After payment, upload proof through the private-file helper, enter reference/date and submit **Mark Paid**.
8. Add a seller page showing only that brand's statement list and status. Do not show document download buttons until seller-owned statement/invoice/proof routes are added.

### Done when

- Admin can go from eligible orders to a paid statement.
- Seller can view only its statement list and status; document downloads remain an API follow-up.
- Refreshing the page keeps the server calculation and proof.
- `npm run build` passes.

### Easy rollback

Remove the statement routes/sidebar links and bulk action. Existing order pages remain unchanged.

## Day 1 end check

Run:

```bash
# API
go test ./internal/v2/modules/commerce ./internal/v2/modules/admin
go build -o main .

# Website
cd ../juno_website
npm run build
```

Manually test one order with two product rows and one checkout with two brands.

Do not start Day 2 until the Phase 1 manual DEX booking data, AWB/tracking and payment paths work. They are the permanent fallback.

---

# Day 2 — Phase 2: After Daraz Open Platform Access

## Day 2 precondition

The API developer must have:

- official Daraz Open Platform/DEX API documentation;
- sandbox/production base URLs;
- application/client credentials;
- approved callback URLs and signing rules;
- confirmation of booking, airway-bill, tracking and statement endpoints Juno may use.

If these are not available, do not guess or scrape private Daraz pages. Complete only the disabled client shell and fixture tests, leave `DARAZ_OPEN_PLATFORM_ENABLED=false`, and keep Phase 1 live.

## Part 8A — API: Small Daraz Open Platform client

**Owner:** API developer/agent  
**Depends on:** official Daraz documentation and Day 1  
**Main files:**

- `config/config.go`
- existing admin/commerce service files that own DEX booking/tracking
- module tests using `httptest.Server`
- `internal/v2/modules/admin/docs.md`
- `internal/v2/modules/commerce/docs.md`

### Work

1. Add only the required configuration:

   - `DARAZ_OPEN_PLATFORM_ENABLED`;
   - base URL;
   - app/client key and secret/token;
   - callback/signing value required by the official docs.

2. Use Go standard `net/http`; do not add an SDK unless Daraz requires its signing code and the SDK is official.
3. Implement only methods needed by the next parts: create booking, get airway bill, get tracking and optionally get settlement statement.
4. Add timeouts and return simple typed errors.
5. Do not create a generic carrier framework. Keep the client behind the existing DEX booking/tracking service functions.
6. Test every method with saved official/sandbox JSON fixtures; no live calls in tests.

### Done when

- Disabled mode makes no Daraz requests.
- Client tests cover success, authentication error, timeout and duplicate/idempotent response.
- Both module docs explain configuration and fallback behavior.

### Easy rollback

Set `DARAZ_OPEN_PLATFORM_ENABLED=false`. No route or Phase 1 behavior is removed.

## Part 8B — Frontend: Show integration availability

**Owner:** website/frontend developer/agent  
**Depends on:** Part 8A documented capability response  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/components/admin/OrderDetailPage.tsx`
- `src/components/admin/ManageOrders.tsx`

### Work

1. Read `daraz_open_platform_enabled` from the existing `GET /api/v2/admin/logistics/operational-config` response.
2. If enabled, show **Create DEX Booking** as the main action.
3. Always keep **Get DEX booking details** as the fallback action.
4. Do not use a frontend environment variable as the source of truth.

### Done when

- The server flag changes the main button without rebuilding the website.
- Manual Excel remains reachable in both modes.
- `npm run build` passes.

### Easy rollback

Disable the server capability; the UI automatically returns to the Phase 1 path.

## Part 9A — API: Create booking and save airway bill automatically

**Owner:** API developer/agent  
**Depends on:** Part 8A  
**Main files:**

- existing admin logistics models/service/repository/handler
- existing commerce delivery booking model/repository if fields are missing
- `internal/v2/modules/admin/docs.md`
- `internal/v2/router/router.go`

### Work

1. Add `POST /api/v2/admin/logistics/orders/{orderID}/dex-booking` to create a DEX booking for an existing order.
2. Reuse the same validated carrier payload used by the Phase 1 DEX export.
3. Use the order ID as the idempotency/reference key required by Daraz.
4. Before creating, check the existing delivery booking. Return it if already booked.
5. Save official Daraz/DEX order reference, tracking number, airway-bill URL/file, raw response ID, booked time and acting admin.
6. Never overwrite an existing different tracking number without a documented admin correction.
7. If Daraz fails, return the error and leave the order unbooked so staff can use Excel.
8. Add admin and seller authorized airway-bill download/read actions if the stored Daraz URL cannot be shared directly.

### Required tests

- Repeating the request creates one booking.
- Daraz failure creates no partial booking.
- Another seller cannot read the airway bill.

### Done when

- One admin click books DEX and saves tracking/AWB.
- Seller/admin can download the airway bill.
- Phase 1 manual booking still works.

### Easy rollback

Disable the integration flag. Existing automated records remain normal delivery bookings; future orders use Excel.

## Part 9B — Frontend: Automatic booking and airway-bill download

**Owner:** website/frontend developer/agent  
**Depends on:** Part 9A `admin/docs.md`  
**Main files:**

- `src/api/api.types.ts`
- `src/api/adminApi.ts`
- `src/api/sellerApi.ts`
- `src/components/admin/OrderDetailPage.tsx`
- `src/components/admin/ManageOrders.tsx`
- `src/components/seller/OrderDetailPage.tsx`

### Work

1. Add **Create DEX Booking** to eligible confirmed orders.
2. Disable the button while submitting and after a booking exists.
3. On success, show tracking number and **Download Airway Bill**.
4. Add **Download Airway Bill** to the owning seller's order page.
5. On failure, show the server message and a **Use Excel Instead** action.

### Done when

- Double-click/retry does not create a second booking.
- Seller sees only its airway bill.
- Manual fallback is one click away.
- `npm run build` passes.

### Easy rollback

Disable the server feature flag; the UI returns to Excel/manual AWB.

## Part 10A — API: Switch tracking to the official Daraz source

**Owner:** API developer/agent  
**Depends on:** Parts 8A and 9A  
**Main files:**

- existing commerce logistics service/repository/model files
- background ticker startup
- `internal/v2/modules/commerce/docs.md`

### Work

1. Make the existing DEX tracking function use the official Daraz endpoint when enabled.
2. Keep the Phase 1 public/manual tracker as a disabled fallback, not a second tracking record.
3. Store raw official status and map it to the same simple Juno statuses.
4. Keep event deduplication and no-backward-status rules.
5. If official webhooks are available, handle them through one signed endpoint and reuse the same event-saving function used by polling.
6. If webhooks are not available, continue the existing 30-minute ticker.
7. Do not send duplicate customer updates for the same event.

### Done when

- Official fixture events update the same booking/order timeline.
- Switching the flag changes the source, not the stored data shape.
- Invalid webhook signatures are rejected.

### Easy rollback

Disable the integration flag. Existing manual tracking number/history remains usable.

## Part 10B — Frontend: Display official source without redesign

**Owner:** website/frontend developer/agent  
**Depends on:** Part 10A  
**Main files:** existing admin, seller and customer tracking components

### Work

1. Keep the same status/timeline UI from Day 1.
2. In admin only, show source as `Daraz Open Platform`, `DEX fallback` or `manual`.
3. Do not create a second tracking tab.

### Done when

- Customers/sellers see no unnecessary change.
- Admin can tell which source supplied an event.
- `npm run build` passes.

### Easy rollback

No UI rollback is normally needed; source is an optional label.

## Part 11A — API: Optional DEX statement sync

**Owner:** API developer/agent  
**Depends on:** official API actually providing statement data and Part 8A  
**Main files:** existing admin financial models/service/repository/handler and `admin/docs.md`

### Work

1. Implement this part only if the official API exposes the same order-level money fields needed by Day 1.
2. Add **Sync DEX Statement** that imports into the exact same `dex_payment_batches` parser/validation path.
3. Do not create a second statement or calculation model.
4. Staff must still confirm that money reached the Juno bank account before orders become `DEX Payment Received`.
5. If the official API lacks complete statement data, document “not supported” and keep upload as the only path.

### Done when

- API sync and manual upload create the same saved data shape.
- Duplicate statement numbers/hashes remain blocked.
- Bank confirmation remains a human action.

### Easy rollback

Disable the integration flag and upload the DEX workbook manually.

## Part 11B — Frontend: Optional statement sync button

**Owner:** website/frontend developer/agent  
**Depends on:** Part 11A capability documented as supported  
**Main files:** existing admin finance/order page and API client/types

### Work

1. Show **Sync DEX Statement** only when the server says it is supported.
2. Keep **Upload DEX Statement** beside it as fallback.
3. After sync, use the same review/confirm screen as Day 1.

### Done when

- Unsupported servers show no dead button.
- Synced and uploaded statements look identical to staff.

### Easy rollback

Turn off the server capability; only upload remains.

## Part 12 — API and frontend: Final regression and documentation handoff

**Owner:** one API agent followed by one frontend agent  
**Depends on:** all completed parts

### API work

1. Read both module docs from top to bottom and remove contradictions/old parent-order instructions from active workflows.
2. Add a short two-phase table to both docs showing manual and automated DEX behavior.
3. Confirm every new field is optional for old records.
4. Run focused tests and build.
5. Test with flags both off and on using fixtures.

### Frontend work

1. Test admin, seller and customer flows with integration disabled and enabled.
2. Confirm every frontend request matches the final `docs.md` examples.
3. Remove temporary casts/duplicate calculations added during the sprint.
4. Run the production build.

### Final acceptance journey

1. Place one checkout containing products from two brands.
2. Confirm separate orders/emails.
3. Format/correct one address through the copyable message flow.
4. Create one order through manual DEX booking/AWB and one through Daraz API.
5. Upload packing evidence and mark packed.
6. Track both orders.
7. Import/sync DEX statement and confirm bank receipt.
8. Create one brand statement, pay it and upload proof.
9. Log in as the seller and view its statement list and payment status. Document-download checks wait for the seller-owned document routes.
10. Confirm every admin/seller action shows the correct actor and time.

### Whole-system rollback

Set these flags off/hide the new frontend entry points:

- `DARAZ_OPEN_PLATFORM_ENABLED=false`
- `DEX_TRACKING_POLL_ENABLED=false`

Then use the Day 1 manual booking path. No old orders, parent analytics records, delivery bookings or financial records need to be deleted.

## Work explicitly left for later

- Final FBR digital-invoice integration after accountant/lawyer approval.
- Final statutory chart of accounts and automatic Companies Act statement layouts.
- Advanced return warehouse/QC tools beyond the approved return/refund/exchange workflow.
- Automatic bank-feed matching.
- Removing old parent-order code/data after the migration has been stable long enough.

These items are intentionally outside the two-day plan because they add risk and are not needed to prove the new order flow.
