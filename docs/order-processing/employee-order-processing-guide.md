# Juno Employee Order Processing Guide

Status: current admin-portal workflow, 31 July 2026

The Juno Admin portal is the record for every order. WhatsApp, Instagram, email and the DEX workbook are working tools; record the completed portal action before moving on.

## 1. Start with the order

1. Open **Admin → Orders**.
2. Use the queue and search to find the seller order. A checkout with several brands creates separate seller orders; process each one on its own.
3. Open the order with the eye icon. Check the product, variant, quantity, customer details, delivery address, payment method and total.
4. If a customer detail is wrong, use **Edit customer, delivery & payment** and save the corrected details on that seller order.

## 2. Confirm the delivery address

1. In the order detail, open **Address review** and select **Create ChatGPT prompt**.
2. Copy the prompt and use the approved support channel to ask the customer for only the missing facts.
3. Paste the reviewed address into **Formatted address**, list only real missing fields, and edit the customer message if needed.
4. Select **Save review**. When the customer confirms the final address, select **Customer confirmed address**.

AI formats wording only. It must not be treated as customer confirmation or used to invent a district, ward, landmark, phone number, or address.

## 3. Confirm the order and ask the seller to prepare it

1. Verify the product, variant, quantity, COD total and confirmed address with the customer where confirmation is required.
2. In the order detail’s status section, choose **Confirmed** and select **Push status**.
3. Ask the seller to open **Seller Dashboard → Orders → the order** and complete the packing steps below. Do not mark the order packed for the seller.

Tell the seller to:

1. Check the correct item, variant, quantity, condition, tags and accessories.
2. Upload one clear photo for every order item.
3. Upload one photo of the sealed parcel with its airway bill attached.
4. Select **Mark packed** only when every item photo and the parcel photo show as saved privately.
5. Keep the parcel ready for DEX handover and report a stock, label, or pickup problem to Juno through the order immediately.

The seller portal blocks **Mark packed** until every item photo and the sealed-parcel photo have been uploaded.

## 4. Prepare the manual DEX workbook

1. In **Admin → Orders**, select one or more seller orders.
2. Select **Get DEX booking details**. One selected order uses the single-order endpoint; multiple selected orders use the bulk endpoint.
3. Select **Copy rows** and paste into the official DEX workbook.
4. The copied columns are exactly: Order number, Sender address, Recipient's name, Recipient phone number, Province, District, Wards, Specific address, Product's name, Unit price, Quantity, Weight, Length, Width, Height, COD, COD amount collected on behalf, Fail delivery storage, and Delivery note.
5. Enter weight and dimensions in the DEX workbook when they are blank. Do not calculate or change COD in the Juno portal: DEX provides the full COD on the first product row and leaves later product rows blank.
6. Submit the workbook in the official DEX process outside Juno.

## 5. Record the DEX booking

1. Return to **Admin → Orders → the seller order**.
2. In **Manual DEX booking**, enter the required **DEX tracking number** and upload the required airway-bill file.
3. Select **Save DEX booking**.
4. Confirm the displayed DEX tracking number and airway-bill link.

DEX is fixed by the server. Staff do not select a carrier and must not create a second booking for the same parcel.

## 6. Monitor delivery and support the seller/customer

Use the order’s saved status and tracking link when answering questions. Do not promise a delivery date, pickup, address change, cancellation, or second attempt unless it has been confirmed through the approved operational process. Keep factual customer conversations in the order workflow; do not replace the order record with chat history.

## 7. Record money received from DEX

Only do this after Juno’s bank has received and matched the DEX payment.

1. In **Admin → Orders**, select the matching orders.
2. Select **Mark DEX payment received**.
3. Enter the DEX statement number.
4. Choose the `.xlsx` DEX statement (maximum 20 MB) and select **Upload statement privately**. Wait for the private upload to finish.
5. Optionally add the bank reference and upload a private bank-proof file.
6. Select **Mark DEX payment received**. Resolve any order-specific server errors shown in the panel before trying again.

The browser does not calculate DEX totals. Private upload object names are used by the server; signed upload URLs are never kept as permanent file links.

## 8. Create and pay the seller statement

1. Select eligible orders for one seller only.
2. Select **Create brand statement**. Set the default commission rate and, only when needed, an order-specific rate. The server determines eligibility and amounts.
3. Open **Statements** to review the saved statement, its orders, transfer details and status. Use the provided printable statement or invoice only when needed.
4. Transfer the displayed amount using the seller’s approved bank details outside Juno.
5. In the selected statement, enter the bank reference and payment date, upload the payment proof privately, then select **Mark paid**.

Never mark a statement paid before the transfer, bank reference, date and proof are available.

## 9. Daily close

Before finishing, review open orders for unconfirmed addresses, confirmed orders waiting for seller packing, packed orders waiting for DEX booking, bookings with missing information, DEX payments waiting to be recorded, and statements waiting for payment. Every exception needs an owner and a next action.

## Never do this

- Do not treat a parent checkout or a chat message as the seller order of record.
- Do not make up address information or customer confirmation.
- Do not calculate DEX row totals in the browser or alter blank parcel measurements there.
- Do not select a carrier; DEX is fixed server-side.
- Do not create a duplicate manual booking.
- Do not record DEX payment before matching the bank payment and statement.
- Do not mark a seller statement paid without the transfer reference, payment date and private proof.
