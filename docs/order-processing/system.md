# Juno Order Processing System

Status: working plan, version 2.0, 30 July 2026

This document explains how Juno will process orders. It uses the current Juno backend and improves it step by step. It does not create a second ordering system.

## 1. The main rule

`orders` is the only official place for order information.

If a customer buys from three brands, Juno creates three separate orders. Each order has its own:

- order number;
- brand and products;
- price and shipping charge;
- email and invoice;
- DEX booking and tracking number;
- status;
- return or refund;
- brand payment.

The customer receives three emails because three brands will prepare and ship three parcels.

`parent_orders` may still be kept to answer questions such as “How many checkouts contained more than one brand?” It must not be used to process, update, cancel, track, invoice or pay an order.

## 2. What stays the same

Juno will keep:

- the existing `commerce` and `admin` modules;
- existing seller order numbers and order records;
- the current order statuses;
- the current admin and seller accounts;
- the current receipt, guest tracking and bulk order tools;
- the current DEX Excel export while Daraz Open Platform is unavailable;
- Smartlane, PostEx and manual delivery options.

Juno will improve these parts instead of building a new backend.

## 3. The complete order journey

### Step 1: The order is placed

A customer orders from the website/app, or a Juno employee helps a customer place a DM order through the same checkout.

The backend checks the latest price, stock, size, color, shipping and seller before creating the order.

If the checkout contains products from different brands, it creates one order for each brand and emails the customer separately for each order.

### Step 2: Staff review the address with a ChatGPT prompt

The backend does not call an AI formatter. It creates a ready-to-copy ChatGPT prompt containing the order's delivery information and a safe customer message. Staff paste that prompt into ChatGPT, then paste ChatGPT's reviewed result back into Juno.

The review should:

- put the address into a clean format;
- keep the customer's original words available;
- point out missing information such as house/building number, area, city, province or postal code;
- never invent a missing part;
- never claim that an address is real just because it looks correct.

The admin portal shows:

1. the original address;
2. the formatted address;
3. the missing information;
4. a ready-made message with a **Copy** button.

Example:

> Hi [customer name], we are preparing Juno order [order number]. Please confirm the address below and send the missing information marked in the message. [formatted address and missing fields]

The employee copies the message and sends it to the customer on Instagram or WhatsApp. There should be no need to write a new message by hand.

When the customer replies, the employee updates the address in the admin portal. Juno creates a fresh prompt if another review is needed. The employee confirms the order only after the reviewed result is complete and the customer agrees that the updated address is correct.

### Step 3: Juno emails the brand

After confirmation, Juno emails the brand:

- the packing instructions;
- the order receipt;
- product, size, color and quantity;
- the customer delivery details needed for packing;
- the packing photo rules;
- the packing deadline.

The Juno operations email address is CC'd. This means both the brand and Juno have the same instructions and receipt.

### Step 4: Create the DEX booking

This step is different in Phase 1 and Phase 2.

#### Phase 1: before Daraz Open Platform access

The admin portal has a **Get DEX booking details** option for one order or several selected orders.

Staff copy the returned fields into the official DEX workbook and upload it to Daraz/DEX. Juno does not generate or upload a DEX workbook in Phase 1.

For an order with more than one product:

- use one row per product;
- use the same Juno order number on every row so DEX joins the rows into one parcel;
- put the full order COD on the first product row only;
- leave COD zero on later product rows;
- enter weight and dimensions manually in the official workbook.

Example:

| Row | Product | COD amount |
| --- | --- | ---: |
| 1 | Product A | PKR 4,199 |
| 2 | Product B | PKR 0 |

This is manual entry data, not a generated version of the supplied workbook.

After DEX creates the booking, staff:

1. download the airway bill;
2. save/upload it on the Juno order;
3. make it available to the brand;
4. copy the DEX tracking number into the admin portal.

The tracking number is saved against that order and is used for all later tracking.

#### Phase 2: after Daraz Open Platform access

Juno creates the DEX booking from the admin portal without copying Excel rows.

The DEX tracking number and airway bill are saved automatically when the official integration supports them. Authorized airway-bill download routes are added only if the supplied Daraz URL cannot safely be shared.

If Daraz Open Platform does not provide one of these features, Juno keeps the Phase 1 button for that feature. The order should never be blocked because an API feature is missing.

### Step 5: The brand packs the order

The brand opens the order in the seller portal and uploads:

- one clear picture of each product before it is put into the parcel; and
- one final picture of the closed parcel with the airway bill attached and readable.

For two products, the brand uploads at least three pictures: two product pictures and one final parcel picture.

The seller portal checks that the required pictures are present. The brand then marks the order **Packed**.

Juno emails the Juno operations team that the order is ready to be shipped and CCs the brand. The email contains the order number and a link to the order.

### Step 6: Track the parcel

Juno uses the saved DEX tracking number to check the parcel regularly.

The useful customer statuses remain simple:

- packed;
- picked up;
- travelling;
- out for delivery;
- delivery attempted;
- delivered;
- returned or cancelled.

Juno saves the DEX update and shows it in the admin portal, seller portal and customer tracking page. Important changes can be emailed to the customer.

Until an official DEX tracking API is available, Juno may use the current public DEX tracking response only after DEX confirms that this is allowed. Staff can still correct a wrong status with a reason.

### Step 7: Confirm that DEX paid Juno

“Delivered” means that the parcel reached the customer. It does not mean that Juno has received the money.

After Daraz/DEX pays money into Juno's bank account, staff select one or more matching orders in the admin portal and choose **Mark DEX Payment Received**.

The system records:

- which orders were selected;
- which admin marked them;
- the date and time;
- the DEX statement number/file;
- optional bank payment proof or reference.

Only orders marked **DEX Payment Received** can be used to create a brand payment statement.

### Step 8: Create the brand payment statement

Staff select one or more eligible orders. The system separates orders by brand, so one statement never pays two different brands.

Staff provide or confirm:

- one commission rate for all selected orders, or a separate rate for an order when needed;
- the DEX statement;
- the brand's saved bank details;
- any approved refund or correction.

Juno commission is calculated from the **brand price of the products**, not from shipping and not from the customer display price.

The system uses the brand price saved on each order. It uses only the DEX statement rows whose tracking numbers match the selected orders. Other rows in the uploaded DEX statement are not included in that brand payment.

The DEX statement values are copied exactly. The system checks the maths but does not replace DEX's tax values with a guess.

Using the supplied DEX example:

| Description | Amount |
| --- | ---: |
| Total COD collected | PKR 8,696.00 |
| Less delivery fee | PKR 420.00 |
| Less delivery fee VAT | PKR 67.20 |
| Less income tax | PKR 173.92 |
| Less sales tax | PKR 173.92 |
| **DEX paid Juno** | **PKR 7,860.96** |

In this real statement, each tax is 2% of total COD: `2% × 8,696 = 173.92`. The amount called “COD and Other Charges” is `8,696 − 173.92 − 173.92 = 8,348.16`. It is not the amount after shipping.

The brand statement then shows:

1. DEX amount received for the selected orders;
2. Juno commission rate and commission on brand price;
3. any approved refunds or corrections;
4. the final amount Juno must transfer to the brand.

The system also creates Juno's commission invoice for the brand where required.

### Step 9: Pay the brand

Before payment, the admin portal shows:

- brand name;
- verified bank account title, bank and account/IBAN;
- amount to transfer;
- full statement;
- Juno invoice;
- selected orders.

After staff transfer the money, they upload the payment screenshot/proof and enter the bank reference and payment date. The system records which admin completed the payment.

The statement is marked **Paid** only after proof is uploaded. The seller can see the statement record and payment status. Seller downloads of the statement, invoice and proof are a follow-up API route; staff use the admin printable views and accountant export today.

- the payment date and reference.

### Step 10: Handle a problem after delivery

If the customer wants a return, refund or exchange, staff open a case on the order. The original order is not deleted or changed to hide what happened.

The case stores the reason, pictures, customer messages, decision, returned parcel, replacement or refund, and final result. The published return, refund and exchange policies decide what is allowed.

## 4. Who did the work?

Juno already has separate admin accounts. Every important action must save the admin account that performed it.

The admin portal should show who:

- confirmed or corrected the address;
- confirmed or cancelled the order;
- created/exported the DEX booking;
- entered the tracking number;
- corrected a delivery status;
- marked DEX payment received;
- generated or approved the brand statement;
- uploaded payment proof and marked it paid;
- approved a return, refund or exchange.

The record should show the person's name, date, time and reason where needed.

## 5. The two implementation phases

### Phase 1: before Daraz Open Platform integration

Build only what is needed now:

1. Make `orders` the only order source of truth and stop using `parent_orders` for operations.
2. Split multi-brand checkouts into independent orders and emails.
3. Add the ChatGPT prompt/review flow, missing-field checks and the copyable customer message.
4. Replace the brand email with packing instructions and receipt; CC Juno.
5. Add copyable DEX booking fields for one or many orders; staff complete the official workbook manually.
6. Let staff upload the airway bill and enter the tracking number.
7. Add seller packing pictures, the Packed action and ready-to-ship email.
8. Track DEX parcels using the entered tracking number.
9. Add DEX Payment Received selection.
10. Add brand statement generation, commission input, DEX statement upload, bank details, admin invoice/statement views, payment proof and seller statement listing.
11. Show the responsible admin on every important action.

### Phase 2: after Daraz Open Platform integration

Replace only the manual DEX steps that the official platform can perform:

1. create the DEX booking from Juno;
2. save the tracking number automatically;
3. download the airway bill from the seller and admin portals;
4. fetch booking/tracking/statement information automatically when the official API supports it;
5. keep the Phase 1 manual tools as a backup.

Everything else stays the same. Phase 2 is an upgrade, not a new system.

## 6. Keeping the system simple

The order system needs only these main records:

1. **Order** — the products, customer, brand, price and current status.
2. **Delivery booking** — DEX tracking number, airway bill and delivery updates.
3. **Brand statement** — DEX money, commission and amount owed to the brand.
4. **Payment proof** — proof that Juno paid the brand.
5. **Return case** — only when an order has a return, refund or exchange.

Accounting records can be created from these records. Staff should not have to understand accounting entries to process an order.

Do not add a second order model, a workflow engine, a new backend module or a new scheduler library. Keep calculations in one place and keep DEX behind one small connection so it can be replaced later.

## 7. Rules that prevent expensive mistakes

- The manually entered DEX COD must match the Juno order total; the API presents the full COD on the first product row.
- The same order must not create two DEX bookings by accident.
- A tracking number belongs to only one active order shipment.
- “Delivered,” “DEX payment received” and “brand paid” are three different facts.
- A brand statement contains orders from one brand only.
- Commission is charged on brand price.
- A statement cannot be marked paid without payment proof.
- Money records are corrected with a new adjustment; the old record is not deleted.
- Customer and bank details are visible only to staff who need them.

## 8. Related guides and policies

- [Seller logistics guide](seller-logistics-guide.md)
- [Customer support guide](customer-support-guide.md)
- [Juno employee order processing guide](employee-order-processing-guide.md)
- [Return policy](return-policy.md)
- [Refund policy](refund-policy.md)
- [Exchange policy](exchange-policy.md)
- [Seller agreement](seller-terms.md)
- [Accounting and invoicing guide](accounting-and-invoicing.md)
