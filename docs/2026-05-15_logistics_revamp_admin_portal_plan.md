# Logistics Revamp: Admin Portal Booking, Smartlane, and DEX

Date: 2026-05-15  
Owner: Juno operations, admin portal, backend  
Status: Planning  

## Goal

Remove manual copying from the admin portal into courier portals by making Juno generate carrier-ready booking data for every order. Admins should be able to review an order once, select Smartlane or Daraz Express (DEX), export the exact spreadsheet or payload needed by the carrier, and track booking state inside Juno.

The first release supports both Smartlane and DEX. Smartlane remains supported for bulk booking. DEX is added as a direct courier path. Automatic booking should be introduced only after the carrier APIs or integration process is stable; until then, the admin portal must make manual carrier entry nearly copy-free and auditable.

## Problems To Solve

- Admins currently read order details in Juno and manually type them into courier portals.
- Variant details such as size and color are easy to miss or mistype on airway bills.
- Seller SKUs are not enforced as operational identifiers.
- Order IDs are readable but not date-aware.
- There is no structured seller wallet for returns, penalties, and settlement deductions.
- Juno does not yet expose order-level or date-range financials for GMV, revenue, take rate, courier cost, gross income, and seller payout.
- Shipping costs are currently modeled as generic rates instead of explicit Smartlane and DEX rates.
- Pickup failures are not formalized into a strike and delisting workflow.
- Internal docs, seller contracts, cancellation rules, and return rules are not tied to operational system behavior.

## Scope

### In Scope

- Admin portal logistics workspace for unbooked, booked, failed, and exception orders.
- Smartlane and DEX carrier support from a shared parcel model.
- Exportable Smartlane bulk booking spreadsheet.
- Exportable DEX booking spreadsheet generated from `docs/bulk_orders_sample_dex.xlsx`.
- DEX province/district/ward auto-suggestion from workbook lookup sheets with mandatory human verification before final bulk spreadsheet generation.
- Endpoints that return booking-ready parcel data for Smartlane and DEX.
- Product display names that include title and variant info for courier labels and airway bills.
- Required seller SKU per variant.
- Date-based short order number format.
- Seller wallet ledger for payouts, returns, and penalties.
- Admin financial reporting for GMV, take rate, commission revenue, shipping revenue, courier cost, gross income, and seller payout.
- Carrier-specific courier cost snapshots for Smartlane and DEX bookings.
- Clean pricing enforcement so customer-facing product prices and final order payable amounts end in `9`.
- Pickup strike system with temporary delisting after three failed pickups.
- Customer receipt and address confirmation workflow.
- Operational documentation plan.

### Out Of Scope For First Release

- Full real-time rider GPS.
- Automated debit/credit settlement with banks.
- Fully automated carrier API booking if Smartlane or DEX API credentials and contracts are not finalized.
- Shopify sizing extension implementation, except for reserving billing/product-plan requirements.

## Carrier Strategy

Juno should support both carriers behind a common logistics abstraction.

| Carrier | Use Case | First Release Mode | Later Mode |
|---|---|---|---|
| Smartlane | Bulk booking and existing ops process | Generate bulk spreadsheet and booking payload | Auto-book through Smartlane integration if reliable |
| DEX | Direct courier flow | Generate DEX spreadsheet/payload and admin copy view | Auto-book through DEX API or agreed integration |

Carrier choice should be made at the parcel level, not globally. This allows ops to route some orders through Smartlane and others through DEX based on city, seller, weight, service quality, or escalation.

### DEX Pickup Threshold And Seller Center Dispatch

DEX pickup has an operational minimum of `5` parcels per seller pickup request. Juno should not schedule a DEX rider pickup for a seller if that seller has fewer than `5` DEX-ready parcels in the pickup batch.

Rules:

- If a seller has `5` or more DEX-ready parcels, ops can schedule DEX pickup from the seller location.
- If a seller has fewer than `5` DEX-ready parcels, the seller must take the parcels to the nearest DEX seller center and dispatch them directly.
- Sub-threshold parcels should remain visible in the logistics dashboard with dispatch mode `seller_center_dropoff`.
- Late delivery caused by the seller not dropping off sub-threshold parcels should be attributed to the seller, not Juno operations.
- The same pickup strike system applies when a seller fails to dispatch eligible `seller_center_dropoff` parcels within the required window.
- Smartlane rules remain separate; this threshold applies specifically to DEX unless Smartlane introduces a similar carrier minimum.

The system should track urgency for every unpicked or undropped parcel:

- `ready_for_dispatch_at`: when the parcel first became ready for carrier booking or seller-center dropoff.
- `days_waiting_for_pickup`: full days elapsed since `ready_for_dispatch_at` while status is not `picked_up`, `in_transit`, `delivered`, `returned`, or `cancelled`.
- `pickup_urgency`: derived status, for example `normal`, `aging`, `urgent`, `breached`.
- `seller_dispatch_due_at`: deadline for seller-center dropoff when DEX parcels are below the pickup threshold.
- `seller_dispatch_overdue`: true when the due time has passed and no carrier scan/booking confirmation exists.

Suggested urgency bands:

| Waiting Time | Urgency | Operational Meaning |
|---|---|---|
| 0-1 day | `normal` | No escalation. |
| 2 days | `aging` | Show warning in logistics dashboard. |
| 3 days | `urgent` | Notify seller/admin and prioritize follow-up. |
| 4+ days or missed due time | `breached` | Eligible for strike/penalty review. |

Implemented operational defaults:

- DEX pickup threshold defaults to `5` parcels and can be changed with `DEX_PICKUP_THRESHOLD`.
- Seller-center dropoff SLA defaults to `24` hours from `ready_for_dispatch_at` and can be changed with `DEX_SELLER_CENTER_DROPOFF_SLA_HOURS`.
- Active pickup/dropoff strikes expire after `30` days by default and can be changed with `SELLER_PICKUP_STRIKE_EXPIRY_DAYS`.
- Seller auto-suspension defaults to `3` active strikes and can be changed with `SELLER_PICKUP_STRIKE_SUSPENSION_THRESHOLD`.
- Penalty amounts are explicit runtime config, defaulting to `0` until finance/legal approves amounts: `SELLER_PICKUP_FAILURE_PENALTY_PKR`, `SELLER_LATE_DISPATCH_PENALTY_PKR`, and `SELLER_CENTER_DROPOFF_PENALTY_PKR`.
- Nearest DEX seller centers are loaded from `docs/logistics/dex_seller_centers.csv` by default. Staging/production can point to an ops-maintained file with `DEX_SELLER_CENTERS_CSV`. If the file is unavailable, the backend falls back to a compiled static seed and marks unresolved cities for ops review.
- Threshold overrides that force `carrier_pickup` or `manual_override` while the seller is below the DEX parcel threshold require `approval_reference`; `approved_by` defaults to the acting admin if omitted.
- The admin portal can fetch the current backend policy via `GET /api/v2/admin/logistics/operational-config`.

### Carrier Cost Constants

Update `pkg/pricing/pricing.go` to split generic courier rates into carrier-specific rates:

| Carrier | Within City Cost | Out Of City Cost |
|---|---:|---:|
| Smartlane | Rs. 140 | Rs. 241 |
| DEX | Rs. 174 | Rs. 290 |

Backward compatibility:

- Previous orders were booked using Smartlane, so any historical order or booking record without an explicit carrier should default to Smartlane for financial reporting.
- Existing generic rate names may remain as legacy aliases, but they should point to Smartlane defaults until all callers are migrated to explicit carrier rates.
- New booking records must snapshot the selected carrier, whether the shipment is within-city or out-of-city, and the courier cost used at booking time.

## Pricing And Financial Rules

### Clean Pricing

All customer-facing prices should end in `9`.

Product display price rule:

- Compute the normal display price using the existing pricing model.
- If the resulting value does not end in `9`, round it up to the next whole-rupee value ending in `9`.
- Example: brand price `1699` plus Rs. `99` shipping buffer becomes `1798`, then rounds up to `1799`.
- Never round down, because that silently reduces the seller/Juno expected price.

Final order total rule:

- After item prices and shipping estimate are computed, the final payable amount must end in `9`.
- If the item subtotal already uses clean prices but the subtotal plus shipping ends in another digit, increase the customer shipping estimate by the minimum amount needed.
- Example: `1799 + 1799 + 200 = 3798`, so the shipping estimate becomes `201` and the final total becomes `3799`.
- Free shipping should remain explicit: if an order qualifies for free shipping, do not add a hidden Rs. `1` fee just to clean the final total unless product decides that clean total has higher priority than the free-shipping promise.

### Seller Payout And Juno Revenue

Use the existing seller payout pricing model as the source of truth:

- Effective brand price is the brand price after removing any embedded shipping buffer.
- Commission rate is `17.5%` unless updated in `pkg/pricing/pricing.go`.
- Juno commission revenue per item is `effective_brand_price * commission_rate`.
- Seller payout per item is `effective_brand_price * (1 - commission_rate)`.
- Seller payout snapshots must be stored at order time so later commission-rate changes do not rewrite historical financials.

Date-range financial reporting should expose:

| Metric | Definition |
|---|---|
| Gross Merchandise Value (GMV) | Sum of final order totals for included, non-cancelled Juno orders. |
| Commission Rate | Configured commission percentage used for seller payout calculations. |
| Commission Revenue | Sum of Juno commission across all included order items. |
| Shipping Revenue | Sum of customer shipping fees charged on included orders. |
| Revenue Generated | Commission revenue plus shipping revenue, plus any other explicit Juno platform fees if introduced later. |
| Take Rate | `revenue_generated / GMV`. |
| Courier Shipping Cost | Sum of booked courier costs using the booking snapshot. If carrier is missing on historical data, assume Smartlane. |
| Gross Income | `revenue_generated - courier_shipping_cost`. |
| Seller Payout | Sum payable to sellers after Juno commission, before wallet deductions unless the report explicitly asks for net payout. |

The financial dashboard should support filters by date range, carrier, city lane, seller, order status, payment method, and booked/unbooked logistics state.

## Admin Portal Experience

### 1. Logistics Dashboard

Add an admin portal section: `Logistics`.

Core tabs:

- `Ready To Book`: confirmed orders that have complete customer address, seller pickup data, SKU data, and parcel dimensions/weight.
- `Needs Review`: orders missing SKU, address, phone, dimensions, seller pickup data, or payment value.
- `Booked`: orders already exported or booked with a carrier.
- `Pickup Exceptions`: orders with failed pickup attempts or seller issues.
- `Returns`: return shipments, customer return status, wallet deductions.
- `Carrier Exports`: generated spreadsheet files and booking batches.

Each row should show:

- Juno order number.
- Parent order number if the order was split across sellers.
- Customer name, phone, city, address completeness status.
- Seller/brand name and seller pickup location.
- Item count and parcel value.
- Carrier recommendation.
- Dispatch mode: carrier pickup or seller-center dropoff.
- For DEX, seller's current DEX-ready parcel count and whether the `5` parcel pickup threshold is met.
- Courier cost estimate and whether it is Smartlane or DEX based.
- Order financial summary: GMV/order total, Juno revenue, courier cost, gross income, seller payout.
- Current logistics status.
- Days waiting for pickup/dropoff and urgency state.
- SKU completeness.
- Variant completeness.
- Pickup strike count for seller.
- Last booking/export attempt.

### 2. Order Booking Detail View

The admin should be able to open an order and see a carrier-ready booking panel.

Required sections:

- `Customer`: recipient name, phone in `+92` format, email, full address, city.
- `Seller Pickup`: seller name, contact person, phone, pickup address, pickup hours.
- `Dispatch Requirement`: carrier pickup eligibility, DEX seller-center dropoff requirement if the seller has fewer than `5` DEX-ready parcels, nearest seller center if known, dispatch due time, and days waiting.
- `Parcel`: order number, weight, dimensions, parcel value, COD amount, payment method.
- `Items`: product title, variant display, seller SKU, quantity, unit price, item weight, item dimensions.
- `Carrier`: Smartlane or DEX selector.
- `DEX Location`: suggested province, district, ward, specific address, confidence, candidates, and verification state when DEX is selected.
- `Financials`: order total, item subtotal, shipping charged to customer, commission revenue, seller payout, estimated courier cost, gross income.
- `Validation`: missing fields and warnings.
- `Actions`: export selected order, add to batch, mark manually booked, enter consignment number, upload airway bill, retry booking, cancel shipment.

### 3. Validation Before Export

The admin portal must block export unless all required carrier fields are present.

Hard blockers:

- Missing customer name.
- Missing customer phone.
- Phone not normalized to `+92`.
- Missing detailed address.
- Missing parcel value.
- Missing seller SKU on any variant.
- Missing variant display name when product has size/color/options.
- Missing quantity.
- Missing unit price.
- Missing seller pickup contact.
- DEX parcel is below pickup threshold and has no seller-center dropoff instruction.

Warnings:

- Missing parcel weight; default can be used but must be visibly marked.
- Missing parcel dimensions; default can be used but must be visibly marked.
- Address looks incomplete, for example city only or under a minimum length.
- Customer has not confirmed address.
- Seller has two pickup strikes.
- Parcel has waited more than one day since becoming ready for pickup/dropoff.
- DEX seller-center dropoff is approaching or past its due time.

## Shared Parcel Model

Create a normalized internal booking model that feeds both Smartlane and DEX.

### `LogisticsParcel`

```json
{
  "order_id": "uuid",
  "order_number": "ORD-150526-0001",
  "parent_order_id": "uuid",
  "carrier": "smartlane",
  "booking": {
    "status": "unbooked",
    "consignment_number": "",
    "airway_bill_number": "",
    "booked_at": null
  },
  "recipient": {
    "name": "Sara Ahmed",
    "phone": "+923001234567",
    "email": "sara@example.com",
    "address": "12 Main Gulberg, Lahore",
    "city": "Lahore"
  },
  "sender": {
    "seller_id": "uuid",
    "seller_name": "Brand Name",
    "contact_person": "Ali Khan",
    "phone": "+923211112222",
    "pickup_address": "Brand warehouse address",
    "city": "Karachi"
  },
  "parcel": {
    "weight_kg": 1.0,
    "dimensions_cm": {
      "length": 30,
      "width": 20,
      "height": 8
    },
    "value": 4999,
    "cod_amount": 4999,
    "payment_method": "cod",
    "special_handling": false
  },
  "financials": {
    "item_subtotal": 4999,
    "shipping_charged": 200,
    "order_total": 5199,
    "commission_rate": 0.175,
    "commission_revenue": 857.5,
    "seller_payout": 4141.5,
    "courier_cost": 140,
    "revenue_generated": 1057.5,
    "gross_income": 917.5
  },
  "items": [
    {
      "product_name": "Contrast Reglan Ribbed | Black | Medium",
      "base_product_title": "Contrast Reglan Ribbed",
      "variant_display": "Black | Medium",
      "seller_sku": "BRAND-CRR-BLK-M",
      "quantity": 1,
      "unit_price": 4999,
      "weight_kg": 1.0,
      "dimensions_cm": {
        "length": 30,
        "width": 20,
        "height": 8
      }
    }
  ]
}
```

### Product Name Rule

Every courier-facing product name must include variant info.

Format:

```text
{Product Title} | {Color} | {Size}
```

Examples:

- `Contrast Reglan Ribbed | Black | Medium`
- `Linen Co-ord Set | Ivory | Small`
- `Classic Shirt | Blue | 15.5 Collar`

If a product has custom variant options, append values in a stable option order:

```text
{Product Title} | {Option 1 Value} | {Option 2 Value} | {Option 3 Value}
```

This same display string should be used in:

- Smartlane spreadsheet `Product` or `Description`.
- DEX product list `Product Name`.
- Airway bill details.
- Admin portal booking preview.
- Seller order view.
- Customer receipt.

## Smartlane Export

The existing `bulk_booking_sample.xlsx` fields are:

```text
Amount, Weight, Product, Description, Product Count, City, Name, Payment Method, Order No., Email, Phone No., Special Handling, Address, Warehouse
```

### Smartlane Field Mapping

| Smartlane Field | Juno Source | Rule |
|---|---|---|
| `Amount` | Parcel COD amount or order total | Use COD amount for COD orders; prepaid can be `0` if required by Smartlane |
| `Weight` | Parcel weight | Use measured/default weight in kg |
| `Product` | Courier product summary | Join item names and SKUs, e.g. `Contrast Reglan Ribbed | Black | Medium (BRAND-CRR-BLK-M) x1` |
| `Description` | Full item detail | Include product title, variant info, SKU, quantity, and order notes |
| `Product Count` | Sum of quantities | Total units in parcel |
| `City` | Customer city | Normalized city name |
| `Name` | Customer name | Recipient full name |
| `Payment Method` | Order payment method | `cod` or carrier-required value |
| `Order No.` | Juno order number | `ORD-150526-0001` |
| `Email` | Customer email | Blank allowed only if carrier allows |
| `Phone No.` | Customer phone | Smartlane sample uses `923...`; store internally as `+92`, export as required |
| `Special Handling` | Parcel flag | `0` default, `1` for fragile/special handling |
| `Address` | Customer full address | Detailed address, not city-only |
| `Warehouse` | Juno/seller warehouse code | Configured per seller or Juno warehouse |

### Smartlane Admin Actions

- Export selected orders to Smartlane `.xlsx`.
- Export all filtered `Ready To Book` orders to Smartlane `.xlsx`.
- Preview row values before export.
- Mark exported batch as `exported_to_smartlane`.
- Upload returned Smartlane airway bill/tracking numbers against exported rows.
- Mark a Smartlane order as booked with consignment number, airway bill number, tracking URL, booked timestamp, and booking admin.
- Re-export failed rows without duplicating already booked rows.

## DEX Export

DEX export must use the actual bulk booking workbook template at:

```text
docs/bulk_orders_sample_dex.xlsx
```

The workbook has multiple sheets and must be treated as a template, not as a flat one-sheet spreadsheet.

| Sheet | Purpose |
|---|---|
| `TEMP` | Main upload sheet. Juno writes order/product rows starting at row 5. |
| `Province_list` | Allowed province values. |
| `City_list` | Allowed district/city values, keyed by province. |
| `Postcode_list` | Allowed ward/area values, keyed by concatenated province + district. |
| `TEMP_MY` | Localized template metadata. Do not write operational rows here. |
| `TEMP_hide` | Hidden template metadata, sender-address options, and Y/N option values. |
| `global_hide` | Template system metadata. Preserve unchanged. |

DEX upload columns on `TEMP` are:

```text
Order number, Sender address, Recipient's name, Recipient phone number,
Province, District, Wards, Specific address, Product's name, Unit price,
Quantity, Weight, Length, Width, Height, COD,
COD amount collected on behalf, Open box, Fail delivery storage, Delivery note
```

The template notes that `Order number` is used to combine multiple products into one order. Products with the same order number will be combined into one DEX order. If `Order number` is blank, DEX creates a new order for that product row.

Therefore Juno must export one row per product line, not one row per order, and must repeat the same Juno order number across all product rows belonging to the same parcel.

DEX single order format, for admin copy panels and API preview:

Parcel fields:

- Recipient's name.
- Contact number in `+92` format.
- Detail address.
- External contact number.
- Parcel weight.
- Parcel dimensions.
- Parcel value.

Product fields:

- Product Name.
- Seller SKU.
- Weight.
- Parcel Dimensions.
- Quantity.
- Unit Price.

### DEX Bulk Field Mapping

| DEX `TEMP` Column | Juno Source | Rule |
|---|---|---|
| `Order number` | Juno child order number | Required for multi-product merge. Repeat exactly for every item row in the same parcel. |
| `Sender address` | Configured DEX sender address label | Required. Must match one of the sender options in `TEMP_hide`, for example `Test WH`, `* Junaid FF`, `LHR WH`, or `Daraz`, until ops config replaces these. |
| `Recipient's name` | Customer name | Required; under 200 chars. |
| `Recipient phone number` | Customer phone | Required. DEX template says max 10 digits, so export local Pakistan format without `+92` when needed, e.g. `3001234567`. Store internally as `+92...`. |
| `Province` | Resolved DEX province | Optional in the template but should be populated when confidently resolved and verified. Must come from `Province_list`. |
| `District` | Resolved DEX district/city | Required. Must come from `City_list` for the selected province. |
| `Wards` | Resolved DEX ward/area | Optional. Must come from `Postcode_list` for selected province + district when populated. |
| `Specific address` | Remaining detailed address | Required. House, street, building, area detail under 500 chars. Should not be only city/province. |
| `Product's name` | Courier product display | Required; include product title and variant info. Under 200 chars. |
| `Unit price` | Order item unit price | Required; number > 0. |
| `Quantity` | Order item quantity | Required; number > 0. |
| `Weight` | Item or parcel weight | Required; kg > 0. Use default with warning if no product weight exists. |
| `Length` | Item or parcel length | Required; cm > 0. Use default with warning if missing. |
| `Width` | Item or parcel width | Required; cm > 0. Use default with warning if missing. |
| `Height` | Item or parcel height | Required; cm > 0. Use default with warning if missing. |
| `COD` | Payment method | Required. `Y` for COD, `N` for prepaid/non-COD. |
| `COD amount collected on behalf` | Order total | Optional by template. For merged multi-product DEX orders, put the full COD amount on the first row for the order and leave subsequent rows blank. |
| `Open box` | Carrier service flag | Required by English template row. Default `N` unless Juno enables open-box service. |
| `Fail delivery storage` | Carrier service flag | Required by English template row. Default `N` unless ops enables it. |
| `Delivery note` | Order notes / ops notes | Optional; under 256 chars. |

### DEX Location Resolution Algorithm

Juno should auto-suggest DEX `Province`, `District`, and `Wards` from the customer shipping address, but bulk spreadsheet generation must require human verification before final export.

Reference data:

- `Province_list`: 8 allowed province values.
- `City_list`: 1,073 province/district rows. District values are scoped to a province.
- `Postcode_list`: 11,358 ward rows. Column A is the concatenated key `{Province}{District}` and column B is the ward/area.

Algorithm:

1. Normalize input address fields:
   - Lowercase for matching only.
   - Remove punctuation and duplicate whitespace.
   - Normalize common spellings, for example `isloo` -> `islamabad`, `khi` -> `karachi`, `lhr` -> `lahore`.
   - Preserve original address text for export after removing any confidently extracted province/district/ward tokens.
2. Build lookup indexes from the workbook:
   - `province_by_name`.
   - `districts_by_province`.
   - `province_candidates_by_district`.
   - `wards_by_province_district`.
   - Alias table for common Pakistani city and area spellings controlled by ops.
3. Resolve district first:
   - Prefer exact match against the order city field.
   - Then exact match against tokens in address line.
   - Then alias match.
   - Then fuzzy match with a conservative threshold.
   - If multiple districts match, keep candidates and mark `requires_human_verification=true`.
4. Resolve province:
   - If the matched district exists under exactly one province, select that province.
   - If the district exists under multiple provinces, use explicit province text in address if present.
   - If still ambiguous, mark for human verification.
5. Resolve ward:
   - Use only wards under the selected `{province,district}` key.
   - Prefer longest exact phrase match in address line.
   - Then alias match.
   - Then fuzzy match with conservative threshold.
   - If no ward is found, leave blank with warning because `Wards` is optional in the template.
6. Produce a `location_resolution` object per parcel:

```json
{
  "province": "Punjab",
  "district": "Lahore",
  "ward": "Gulberg",
  "specific_address": "House 12 Main Boulevard",
  "confidence": 0.92,
  "requires_human_verification": true,
  "candidates": {
    "province": ["Punjab"],
    "district": ["Lahore"],
    "ward": ["Gulberg", "Gulberg III"]
  },
  "source": {
    "province": "district_lookup",
    "district": "order_city_exact",
    "ward": "address_phrase_match"
  }
}
```

Human verification rules:

- DEX bulk spreadsheet export must be blocked until every row has `location_verified=true`.
- Admin UI should show suggested province, district, ward, specific address, confidence, and alternatives.
- Admin can accept the suggestion or manually choose from the DEX lookup lists.
- Admin changes must be stored as an override keyed by normalized address/city and optionally by customer/order, so future exports can reuse verified mappings.
- If district is unresolved, the order remains in `Needs Review`; district is required by DEX.
- If province is unresolved but district is unique, auto-fill province and still require verification.
- If ward is unresolved, export can proceed after human verification with blank ward.

Data model additions for DEX resolution:

- `dex_location_reference`: imported workbook reference version, province, district, ward, normalized keys.
- `dex_location_overrides`: normalized address/city hash, selected province, district, ward, verified by, verified at, source order ID.
- `logistics_bookings.location_resolution`: suggested and verified DEX province/district/ward for audit.

### DEX Field Mapping

| DEX Field | Juno Source | Rule |
|---|---|---|
| `Recipient's name` | Customer name | Required |
| `Contact number` | Customer phone | Must be `+92...` |
| `Detail address` | Customer address | Required, full address |
| `External contact number` | Juno support or seller support phone | Prefer Juno ops number for customer-facing consistency |
| `Parcel weight` | Parcel weight | Required; default allowed with warning |
| `Parcel dimensions` | Parcel dimensions | Format according to DEX template, e.g. `30x20x8 cm` |
| `Parcel value` | Order total or item subtotal | Use COD/order value agreed with DEX |
| `Product Name` | Courier product display | Must include title and variant info |
| `Seller SKU` | Variant SKU | Required |
| `Weight` | Item or parcel weight | Item-level if available, otherwise parcel default |
| `Parcel Dimensions` | Item or parcel dimensions | Item-level if available, otherwise parcel default |
| `Quantity` | Order item quantity | Required |
| `Unit Price` | Order item unit price | Required |

### DEX Admin Actions

- Export selected order to DEX spreadsheet.
- Export selected orders to DEX batch spreadsheet using `docs/bulk_orders_sample_dex.xlsx` as the template.
- Preserve all DEX lookup/hidden sheets while writing only operational rows into `TEMP` from row 5 onward.
- Repeat the same order number across item rows so DEX combines multiple products into one order.
- Require human verification of DEX province/district/ward suggestions before generating the final workbook.
- Open DEX copy panel with one-click copy values grouped by parcel and products.
- Mark order as `prepared_for_dex`.
- Show whether the seller has at least `5` DEX-ready parcels for rider pickup.
- For sellers below the `5` parcel DEX pickup threshold, generate seller-center dropoff instructions instead of scheduling pickup.
- Track seller-center dropoff due time, days waiting, and scan/dispatch confirmation.
- Mark manually booked with DEX consignment number and airway bill number.
- Store DEX contact person, escalation phone, and email in logistics settings.

## API Requirements

All endpoints below are admin-authenticated unless stated otherwise.

### Booking Data Preview

`GET /api/v2/admin/logistics/orders/{orderId}/booking-data?carrier=smartlane`

Returns one normalized parcel plus Smartlane-specific mapped fields.

`GET /api/v2/admin/logistics/orders/{orderId}/booking-data?carrier=dex`

Returns one normalized parcel plus DEX-specific mapped fields.

Response shape:

```json
{
  "carrier": "dex",
  "valid": false,
  "blocking_errors": ["variant SKU missing for item item-1"],
  "warnings": ["parcel dimensions defaulted", "DEX location requires verification"],
  "parcel": {},
  "carrier_payload": {},
  "location_resolution": {
    "province": "Punjab",
    "district": "Lahore",
    "ward": "Gulberg",
    "specific_address": "House 12 Main Boulevard",
    "confidence": 0.92,
    "requires_human_verification": true,
    "location_verified": false
  },
  "export_preview": []
}
```

For `carrier=dex`, `valid=true` means the order has enough order/customer/item data for booking preview. It does not mean the spreadsheet can be generated. DEX spreadsheet generation additionally requires `location_verified=true` for every row.

### Bulk Booking Data

`POST /api/v2/admin/logistics/booking-data/bulk`

Request:

```json
{
  "carrier": "smartlane",
  "order_ids": ["order-1", "order-2"],
  "include_location_resolution": true
}
```

Response:

```json
{
  "carrier": "smartlane",
  "valid_count": 12,
  "invalid_count": 2,
  "rows": [],
  "errors_by_order": {},
  "requires_human_verification_count": 0
}
```

For DEX, bulk booking data should include one export row per item line and repeat the same Juno order number for item lines that should merge into one DEX order.

For DEX, bulk booking data should also include seller-level pickup eligibility:

```json
{
  "seller_id": "seller-1",
  "dex_ready_parcel_count": 3,
  "dex_pickup_threshold": 5,
  "dispatch_mode": "seller_center_dropoff",
  "seller_dispatch_due_at": "2026-05-16T10:00:00Z",
  "days_waiting_for_pickup": 2,
  "pickup_urgency": "aging"
}
```

`dispatch_mode` values:

- `carrier_pickup`: seller has enough DEX-ready parcels for pickup or carrier is Smartlane.
- `seller_center_dropoff`: DEX parcel count is below `5`; seller must drop parcels at nearest DEX seller center.
- `manual_override`: admin explicitly overrides the default dispatch mode with audit reason.

### DEX Location Verification

`POST /api/v2/admin/logistics/orders/{orderId}/dex-location-verification`

Request:

```json
{
  "province": "Punjab",
  "district": "Lahore",
  "ward": "Gulberg",
  "specific_address": "House 12 Main Boulevard",
  "apply_as_override": true
}
```

Response:

```json
{
  "order_id": "order-1",
  "location_verified": true,
  "province": "Punjab",
  "district": "Lahore",
  "ward": "Gulberg",
  "specific_address": "House 12 Main Boulevard",
  "verified_at": "2026-05-15T10:00:00Z"
}
```

Rules:

- Province must exist in `Province_list`.
- District must exist in `City_list` under the selected province.
- Ward, when provided, must exist in `Postcode_list` under selected province + district.
- Admin may leave ward blank after verification because the template marks ward as optional.
- Verified location data should be snapshotted on the booking/export record and should not be recomputed at export time.

### Spreadsheet Export

`POST /api/v2/admin/logistics/exports`

Request:

```json
{
  "carrier": "smartlane",
  "order_ids": ["order-1", "order-2"],
  "format": "xlsx",
  "require_human_verified_locations": true
}
```

Response:

```json
{
  "export_id": "uuid",
  "carrier": "smartlane",
  "file_url": "https://...",
  "status": "ready",
  "order_count": 12,
  "created_at": "2026-05-15T10:00:00Z"
}
```

For `carrier=dex`, export generation must:

- Use `docs/bulk_orders_sample_dex.xlsx` as the workbook template.
- Preserve `Province_list`, `City_list`, `Postcode_list`, `TEMP_MY`, `TEMP_hide`, and `global_hide`.
- Write generated rows into `TEMP` starting at row 5.
- Reject export if any DEX row has unresolved district or unverified location selection.
- Store the template version/hash used for audit.

### Export History

`GET /api/v2/admin/logistics/exports?carrier=smartlane&status=ready&page=1&limit=20`

Returns prior exports, their files, creator, carrier, order count, and booking status.

### Mark Manual Booking

`POST /api/v2/admin/logistics/orders/{orderId}/manual-booking`

Request:

```json
{
  "carrier": "dex",
  "consignment_number": "DEX-CN-123456",
  "airway_bill_number": "DEX123456",
  "tracking_url": "https://...",
  "booked_at": "2026-05-15T12:00:00Z",
  "notes": "Booked through DEX portal by ops"
}
```

Rules:

- `carrier` and `consignment_number` are required for manual booking.
- `airway_bill_number` is required when the carrier provides it separately from consignment number.
- Manual booking must snapshot courier cost using the selected carrier and city lane.
- Updating a booking from exported to booked must be audited with admin ID and timestamp.

### Auto Booking

`POST /api/v2/admin/logistics/orders/{orderId}/book`

This should be implemented after credentials and carrier API contracts are stable. It should use the same normalized parcel model and validations as spreadsheet export.

### Pickup Strike Recording

`POST /api/v2/admin/logistics/sellers/{sellerId}/pickup-strikes`

Request:

```json
{
  "order_id": "order-1",
  "reason": "seller_not_available",
  "carrier": "dex",
  "notes": "DEX rider arrived, seller did not hand over parcel"
}
```

On the third active strike, temporarily delist seller products and mark seller logistics status as `suspended`.

For DEX `seller_center_dropoff`, the same endpoint should be used when the seller misses the required dropoff window:

```json
{
  "order_id": "order-1",
  "reason": "seller_center_dropoff_missed",
  "carrier": "dex",
  "notes": "Seller had fewer than 5 DEX parcels and did not dispatch from seller center by due time"
}
```

### Pickup Aging And Urgency

`GET /api/v2/admin/logistics/operational-config`

Returns current backend policy for DEX threshold, seller-center SLA, strike expiry, strike suspension threshold, configured penalty amounts, seller-center source path, DEX phone export format, COD split behavior, DEX province/ward strictness, and wallet/late-dispatch attribution policy.

`GET /api/v2/admin/logistics/pickup-aging?seller_id=seller-1&carrier=dex`

Returns parcels that are ready but not yet picked up, dropped off, scanned, or cancelled.

Response rows should include:

- Order ID and order number.
- Seller ID and seller name.
- Carrier and dispatch mode.
- Ready-for-dispatch timestamp.
- Seller dispatch due timestamp if dispatch mode is `seller_center_dropoff`.
- Days waiting for pickup/dropoff.
- Pickup urgency.
- Whether the DEX `5` parcel pickup threshold was met when the parcel became ready.
- Strike eligibility and suggested strike reason if overdue.

### Seller Wallet

`GET /api/v2/admin/sellers/{sellerId}/wallet`

`POST /api/v2/admin/sellers/{sellerId}/wallet/adjustments`

Adjustment types:

- `return_deduction`
- `pickup_penalty`
- `late_dispatch_penalty`
- `cancellation_penalty`
- `manual_credit`
- `manual_debit`
- `settlement_payout`

Every wallet entry must have:

- Amount.
- Direction: credit or debit.
- Reason.
- Related order ID if applicable.
- Related return ID if applicable.
- Created by.
- Audit timestamp.

### Financial Reporting

`GET /api/v2/admin/financials/summary?from=2026-05-01&to=2026-05-15&carrier=smartlane`

Returns:

```json
{
  "currency": "PKR",
  "gmv": 1250000,
  "commission_rate": 0.175,
  "commission_revenue": 176400,
  "shipping_revenue": 48200,
  "revenue_generated": 224600,
  "take_rate": 0.1797,
  "courier_shipping_cost": 37120,
  "gross_income": 187480,
  "seller_payout": 831600,
  "order_count": 284,
  "booked_order_count": 251,
  "unbooked_order_count": 33
}
```

`GET /api/v2/admin/financials/orders?from=2026-05-01&to=2026-05-15&page=1&limit=50`

Returns per-order financial rows:

- Order number.
- Seller and brand.
- Carrier and booking state.
- Consignment number.
- Order total / GMV contribution.
- Commission revenue.
- Shipping revenue.
- Courier shipping cost.
- Gross income.
- Seller payout.
- Wallet deductions.
- Net seller payout.

## Order Number Format

Use one canonical public identifier for both Juno and carrier operations. The value shown as `order_number` should be the same value exported to courier templates as the DEX/Smartlane `Order number`, and it should be treated operationally as the order ID in admin, seller, customer support, and carrier workflows.

Use short date-based order IDs/order numbers:

```text
ORD-DDMMYY-NNNN
```

Example:

```text
ORD-150526-0001
```

Rules:

- `DDMMYY` is based on Pakistan local date at order creation.
- `NNNN` is a zero-padded daily sequence.
- Sequence is per calendar day across all orders.
- Do not create a separate carrier-facing order number that differs from Juno's canonical order number/order ID.
- Internal database `_id` and UUID fields may still exist for storage and joins, but staff, sellers, customers, carrier exports, receipts, and support scripts should use the canonical `ORD-DDMMYY-NNNN` identifier.
- Parent order and seller child orders need clear behavior:
  - Parent order: `ORD-150526-0001`
  - Child orders: `ORD-150526-0001-A`, `ORD-150526-0001-B`
- Courier parcel number should use the child order number if one seller parcel is booked separately.
- The daily counter must be generated atomically to avoid duplicate numbers under concurrent checkout.

## SKU Requirements

Every variant must have a seller SKU before the product can be sold.

Rules:

- SKU is required for all active variants.
- SKU must be unique per seller.
- SKU should be immutable once the variant has orders unless an admin creates an audited SKU correction.
- Shopify imported variants should use Shopify SKU where present.
- If Shopify SKU is missing, the product should go to `Needs SKU` state before publication.
- Manual product creation must require SKU per variant.

Admin portal support:

- Product search by title, seller, SKU, and variant option.
- SKU completion dashboard.
- Bulk SKU edit/import for sellers.
- Order creation by SKU and quantity.

## Admin-Created Orders By SKU

Add an admin order creation flow for support and operations.

Admin inputs:

- Customer details.
- Address details.
- Seller SKU.
- Quantity.
- Payment method.
- Discount or manual adjustment if needed.

Flow:

- Admin searches products by SKU or product title.
- Admin selects variant from search results.
- System resolves product title, variant info, seller, price, inventory, weight, and dimensions.
- System creates order using the normal checkout/order pipeline.
- System generates receipt and asks customer for final address confirmation.
- Order moves to logistics `Ready To Book` only after confirmation and validation pass.

## Customer Receipt And Address Confirmation

After checkout or admin-created order:

- Send customer receipt over email/WhatsApp/SMS depending on available integrations.
- Include order number, item names with variant info, quantities, prices, delivery address, payment method, estimated delivery time, and support link.
- Ask for final confirmation that the address is complete.
- Mark address as `confirmed` when customer confirms.
- If unconfirmed, show warning in logistics dashboard but allow admin override.

Expected delivery time:

- Display up to 8 days for standard delivery unless carrier-specific ETA is available.
- Keep this configurable by carrier and city.

## Pickup Strike Policy

Seller pickup failure policy:

- First failed pickup: warning and seller notification.
- Second failed pickup: warning, seller success/admin review, and possible reduced ranking.
- Third failed pickup: temporary delisting.

The same strike policy applies to DEX seller-center dropoff failures. If a seller has fewer than `5` DEX-ready parcels, Juno should instruct the seller to dispatch from the nearest DEX seller center. If the seller does not drop off the parcel by the due time, the failure should be recorded as a seller dispatch failure and can count as a strike.

Seller-center dropoff failure examples:

- Seller does not dispatch sub-threshold DEX parcels by `seller_dispatch_due_at`.
- Seller claims dispatch but cannot provide consignment number, seller-center receipt, or carrier scan.
- Seller drops off after the due time and causes late delivery risk.
- Seller repeatedly waits for Juno pickup even though the DEX pickup threshold was not met.

Late delivery attribution:

- If DEX pickup threshold is met and Juno/DEX fails pickup, the delay is a carrier/Juno ops issue.
- If DEX pickup threshold is not met and seller misses seller-center dropoff, the delay is a seller issue.
- Financial penalties, strike counts, and seller performance metrics should preserve this attribution.

Strike expiry:

- Strikes should expire after a defined period, for example 30 or 45 days, if no further failed pickups occur.

Delisting behavior:

- Seller products become hidden from marketplace listings.
- Existing orders remain operationally visible.
- Seller portal shows suspension reason and required next step.
- Admin can reinstate seller after reviewing pickup readiness.

Wallet impact:

- Pickup penalties should be debited from seller wallet according to seller contract.
- Seller-center dropoff penalties should use the same wallet debit path as pickup penalties when the seller misses the required dispatch window.
- If wallet balance is insufficient, carry negative balance forward against future payouts.
- Financial reporting should show gross seller payout separately from net seller payout after wallet deductions.

## Returns And Penalties

Return workflow:

- Return requested.
- Return approved or rejected.
- Return shipment booked or manually tracked.
- Item received and inspected.
- Refund/adjustment finalized.
- Seller wallet debited for eligible return costs and penalties.

Penalty examples:

- Failed pickup after agreed pickup window.
- Wrong item shipped.
- Wrong size/color shipped.
- SKU mismatch.
- Late dispatch.
- Seller cancellation after customer confirmation.
- Product quality issue confirmed by support.

Each penalty should map to:

- Contract clause.
- Wallet debit amount.
- Evidence requirement.
- Admin override permission.
- Seller appeal window.

## Internal Documents To Produce

Create internal docs and link them from the admin portal where relevant.

| Document | Audience | Purpose |
|---|---|---|
| Seller logistics guide | Sellers | Pickup readiness, packaging, SKU rules, failed pickup consequences |
| Order processing guide | Ops/admins | How to validate, export, book, and mark shipments |
| Customer support guide | Support | Address confirmation, cancellation, return, and delivery scripts |
| Return policy | Customers, support, sellers | Return windows, eligibility, deductions, flow |
| Marketing strategy for app | Growth team | App messaging, seller/customer benefits, launch plan |
| Seller contract | Sellers/legal | Standard terms, wallet deductions, penalties, pickup obligations |
| Order cancellation policy | Customers, support, sellers | Cancellation windows, seller penalties, refund behavior |

## Standard Seller Contract Requirements

The seller contract should include:

- Required SKU per variant.
- Required pickup availability and pickup hours.
- Packaging standards.
- Product title and variant accuracy.
- Seller wallet authorization for deductions.
- Return cost responsibility.
- Penalty schedule.
- Three-strike pickup policy.
- Temporary delisting rights.
- Cancellation policy.
- SLA for dispatch readiness.
- Obligation to maintain accurate inventory.

## B2B Shopify Sizing Extension

Keep this as a separate product track, but include it in seller wallet/billing design.

Initial commercial rule:

- Shopify sizing extension subscription: Rs 1,000 per month.

System implications:

- Add seller subscription ledger entries.
- Wallet can debit monthly B2B subscription fees.
- Seller contract should authorize recurring wallet deductions or external billing.
- Shopify module should expose sizing extension status later.

## Data Model Additions

Recommended collections or embedded documents:

- `logistics_bookings`: order ID, carrier, status, consignment number, airway bill, tracking number, export ID, payload snapshot.
- `logistics_booking_financials`: order ID, booking ID, carrier, city lane, courier cost, customer shipping charged, revenue snapshot, gross income snapshot.
- `logistics_exports`: carrier, generated file, order IDs, validation result, created by, template version/hash, and DEX location verification status.
- `dex_location_reference`: imported DEX workbook reference data from `Province_list`, `City_list`, and `Postcode_list`.
- `dex_location_overrides`: admin-verified mapping from normalized address/city to DEX province, district, and ward.
- `seller_wallets`: seller ID, balance, currency.
- `seller_wallet_entries`: ledger entries with reason and related order/return.
- `order_financial_snapshots`: order ID, GMV contribution, commission rate, commission revenue, shipping revenue, revenue generated, courier cost, gross income, seller payout.
- `seller_pickup_strikes`: seller ID, order ID, carrier, reason, expiry, status.
- `carrier_settings`: Smartlane warehouse codes, DEX contact person, support numbers, default weights/dimensions.
- `order_sequence_counters`: date and next daily sequence.
- `seller_dispatch_requirements`: order ID, seller ID, carrier, dispatch mode, DEX-ready parcel count at assignment, pickup threshold, nearest seller center, ready-for-dispatch timestamp, due timestamp, scan/confirmation timestamp, days waiting, urgency, and breach state.

Important snapshots:

- Store courier payload snapshot at export/booking time.
- Store carrier, consignment number, courier cost, and financial snapshot at manual booking time.
- Store clean item prices and final order total at order creation time.
- Store product name with variant info at order time.
- Store SKU at order time.
- Store customer address confirmation state.
- Store DEX location suggestions, candidates, confidence, and human verification state before bulk export.
- Store the exact DEX template version/hash used for each export.
- Store dispatch mode and whether the DEX `5` parcel pickup threshold was met when a parcel became ready.
- Store `ready_for_dispatch_at`, `seller_dispatch_due_at`, carrier scan time, and days-waiting/urgency snapshots for audit and seller dispute handling.

## Status Model

Suggested logistics statuses:

- `needs_review`
- `ready_to_book`
- `seller_center_dropoff_required`
- `seller_center_dropoff_overdue`
- `exported`
- `prepared_for_booking`
- `booked`
- `pickup_scheduled`
- `pickup_failed`
- `picked_up`
- `in_transit`
- `delivered`
- `return_requested`
- `return_booked`
- `returned`
- `cancelled`
- `booking_failed`

Carrier booking statuses should map into Juno statuses so the admin portal does not expose raw carrier-only state as the primary workflow.

## Implementation Phases

### Phase 1: Admin Booking Foundation

- Add normalized logistics parcel builder.
- Add validation engine for booking readiness.
- Add booking data preview endpoints for Smartlane and DEX.
- Add admin logistics dashboard data endpoints.
- Add carrier-specific pricing constants and courier cost calculator.
- Add clean-pricing helper for product display prices and final order totals.
- Enforce product name plus variant info in booking payloads.
- Add Smartlane export based on current sample columns.
- Add DEX export using `docs/bulk_orders_sample_dex.xlsx`, preserving all lookup/hidden sheets.
- Add DEX location-reference importer for `Province_list`, `City_list`, and `Postcode_list`.
- Add DEX province/district/ward auto-suggestion with human verification workflow.
- Add DEX pickup-threshold evaluator: seller pickup only when the seller has at least `5` DEX-ready parcels.
- Add seller-center dropoff assignment and instructions for DEX batches below the pickup threshold.
- Add pickup/dropoff aging fields and urgency calculation.
- Add manual booking record endpoint with consignment number and airway bill tracking.

### Phase 2: SKU And Order Number Hardening

- Require SKU for every active variant.
- Add seller SKU uniqueness validation.
- Add admin SKU search and product lookup for order creation.
- Add date-based order number generation.
- Backfill or preserve existing order numbers without breaking old tracking links.
- Add admin-created order by SKU and quantity.

### Phase 3: Customer Confirmation And Ops Workflow

- Send order receipt with item variant details.
- Add address confirmation state.
- Add logistics warnings for unconfirmed or incomplete address.
- Add logistics warnings for parcels aging without pickup or seller-center dropoff.
- Add support/admin override with audit log.
- Add configurable 8-day standard delivery ETA.

### Phase 4: Wallet, Returns, And Penalties

- Add seller wallet balance and ledger.
- Add wallet debit/credit endpoints.
- Add order financial snapshots and admin financial summary endpoints.
- Add GMV, take rate, revenue generated, courier shipping cost, gross income, and seller payout reporting.
- Add return deductions and penalty deductions.
- Add pickup strike recording.
- Add seller-center dropoff missed-window strike recording for sub-threshold DEX parcels.
- Add automatic seller temporary delisting after three strikes.
- Add admin reinstatement flow.

### Phase 5: Carrier Automation

- Add Smartlane auto-booking when integration is reliable.
- Add DEX auto-booking when DEX API/process is available.
- Add webhook/status ingestion for both carriers.
- Add retry and idempotency keys for carrier booking calls.
- Add failure queue and alerts for booking errors.

## Acceptance Criteria

- Admin can select one or more ready orders and generate a valid Smartlane spreadsheet.
- Admin can select one or more ready orders and generate a DEX spreadsheet or booking data export.
- DEX bulk export writes rows to `TEMP` row 5 onward and preserves the workbook lookup sheets.
- DEX export repeats the same order number across product rows that should merge into one DEX order.
- DEX bulk export is blocked until district is resolved and province/district/ward suggestions have been human-verified.
- DEX parcels are marked `carrier_pickup` only when the seller has at least `5` DEX-ready parcels in the pickup batch.
- DEX parcels below the pickup threshold are marked `seller_center_dropoff` and show seller dropoff instructions and due time.
- Logistics dashboard shows days waiting for pickup/dropoff and urgency for every ready but unpicked parcel.
- Missed DEX seller-center dropoff can be recorded as a strike using the same seller strike policy.
- Admin can open any order and view all fields required for Smartlane and DEX booking.
- Courier-facing product names always include title and variant info.
- Every active variant has a seller SKU.
- Admin can search products by SKU when creating an order manually.
- Order numbers follow `ORD-DDMMYY-NNNN` and are the same canonical identifier used as order ID in admin, seller, customer, and carrier workflows.
- Booking exports store an audit trail of who exported what and when.
- Admin can mark a parcel manually booked with carrier, consignment number, airway bill number, and booked timestamp.
- Smartlane and DEX courier costs are stored separately and historical orders without a carrier default to Smartlane.
- Product display prices end in `9`.
- Final payable order totals end in `9` when shipping is charged, by increasing shipping by the minimum amount needed.
- Admin financial dashboard shows GMV, commission rate, take rate, revenue generated, courier shipping cost, gross income, and seller payout.
- Gross income equals revenue generated minus courier shipping cost.
- Seller pickup failures can be recorded as strikes.
- Third active pickup strike temporarily delists the seller.
- Seller wallet supports returns and penalty deductions with an audit ledger.
- Customer receipt includes order number, item variant details, final amount, and address confirmation prompt.

## Open Decisions

- Confirm Smartlane required phone format: sample shows `923...`; DEX requires `+92...`.
- Validate DEX phone export behavior with ops after staging export. Backend exports local 10-digit format such as `3001234567` for workbook rows and keeps internal/API copy data in `+92...`.
- Validate DEX COD import behavior with ops after staging export. Backend currently writes the full COD amount on the first row of a merged order and leaves later rows blank.
- Validate DEX province/ward strictness after staging export. Backend requires verified province/district from workbook lookup sheets and validates ward against `Postcode_list` when populated.
- Confirm production DEX sender address labels and warehouse IDs to replace workbook sample values.
- Replace the seeded DEX seller-center CSV with the production ops source, including operating hours, phone number, and accepted parcel categories.
- Confirm whether multiple seller-center dropoff misses in one batch should count as one strike per seller event or one strike per order.
- Confirm whether the current threshold override governance is enough for production. Backend requires an admin-authenticated request, reason, and `approval_reference` for below-threshold carrier pickup/manual override.
- Confirm default parcel weight and dimensions per product category.
- Confirm whether parcel value should be subtotal, total, or COD amount for each carrier.
- Confirm whether revenue generated should include only commission plus shipping revenue, or future platform/subscription fees too.
- Confirm whether free-shipping orders must still force final order totals to end in `9`.
- Confirm how historical orders without booking records should be included in courier-cost reporting beyond the Smartlane default.
- Confirm Juno support number to use as DEX external contact number.
- Confirm Smartlane warehouse codes per seller/Juno warehouse.
- Confirm production penalty amounts. Backend reads penalty amount env vars and defaults to `0` until approved.
- Confirm whether parent order numbers and child order numbers should both be visible to customers.
- Confirm final legal wording for wallet deductions and center-dropoff late-dispatch liability. Backend records ledger/strike attribution, but contract copy still needs legal approval.

## Rollout Notes

- Start with spreadsheet generation and manual booking audit because it removes most typing errors immediately.
- Keep Smartlane and DEX behind the same normalized parcel model so the admin portal does not duplicate carrier logic.
- Treat booking records as financial records: once an order is marked booked, snapshot carrier, consignment number, courier cost, commission, seller payout, revenue, and gross income.
- Treat DEX location resolution as an auditable admin decision, not as a silent automatic transformation, because the workbook has carrier-specific province/district/ward lists.
- Do not auto-book by default until each carrier integration has idempotency, retries, and failure visibility.
- Backfill SKU enforcement carefully: existing products without SKUs should remain visible only if ops accepts the risk, otherwise move them to a review queue.
- Existing order numbers should continue to work; the new format should apply to new orders after launch.
