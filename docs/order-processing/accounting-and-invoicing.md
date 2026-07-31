# Juno Accounting, Statements and Invoices

Status: working finance plan — a Pakistani chartered accountant and tax lawyer must approve it before launch
Version: 2.0, 30 July 2026

This guide explains how Juno should record money without making order processing difficult for staff.

## 1. The simple idea

Juno must keep three facts separate:

1. **Delivered:** DEX delivered the parcel.
2. **DEX Payment Received:** Daraz/DEX paid Juno for the order.
3. **Brand Paid:** Juno paid the brand and saved the payment proof.

One status must never be used as proof of another.

## 2. Who sold the product?

The current plan treats the brand as the seller of its products. Juno runs the marketplace, collects the money and charges the brand commission.

This means:

- the customer product invoice names the brand as the product seller;
- Juno records its commission as Juno income;
- money still owed to a brand is not Juno income;
- GMV means the total value sold through Juno, not Juno's revenue.

Juno's lawyer and accountant must confirm this matches the signed seller agreement and Pakistan tax rules.

## 3. The DEX statement

The DEX statement tells Juno:

- how much COD DEX collected;
- delivery fees;
- VAT/tax on delivery fees;
- income tax;
- sales tax;
- any return, failed-delivery or other charge;
- how much DEX paid Juno.

Keep every amount separately. Do not save only the final amount.

### Supplied three-order example

| Description | Amount |
| --- | ---: |
| Total COD amount | PKR 8,696.00 |
| Delivery fees | PKR (420.00) |
| Delivery fee VAT | PKR (67.20) |
| Income tax | PKR (173.92) |
| Sales tax | PKR (173.92) |
| **Total paid by DEX** | **PKR 7,860.96** |

The check is:

`8,696.00 − 420.00 − 67.20 − 173.92 − 173.92 = 7,860.96`

The DEX screen also shows “COD and Other Charges” as PKR 8,348.16. That amount is:

`8,696.00 − 173.92 − 173.92 = 8,348.16`

In this statement, income tax and sales tax are each 2% of total COD:

`2% × 8,696.00 = 173.92`

They are not 2% of the amount left after shipping. The system should read the real tax amounts from each DEX statement and check the maths. It should not assume that DEX will always use the same tax rate.

## 4. Importing a DEX statement

Staff upload the original DEX `.xlsx` file. Juno should:

1. save the original file safely;
2. stop the same statement from being uploaded twice;
3. match each tracking number to one Juno order;
4. compare DEX COD with the Juno order total;
5. show unknown tracking numbers or different amounts;
6. total every DEX charge;
7. ask staff to fix or explain a difference before continuing.

The supplied example must always pass this test:

- 3 order rows;
- PKR 8,696.00 COD;
- PKR 835.04 total deductions;
- PKR 7,860.96 paid by DEX.

## 5. Marking DEX payment received

After the matching money reaches Juno's bank account, staff select the related orders and click **Mark DEX Payment Received**.

Save:

- selected orders and DEX tracking numbers;
- DEX statement number/file;
- amount received;
- bank reference/proof if available;
- admin name, date and time.

Only these orders can be added to a brand payment statement.

## 6. Juno commission

Staff enter one commission rate for the selected orders, or a separate rate for a specific order when needed.

Commission uses brand price:

`Juno commission = total brand price × commission rate`

Example:

- total brand price: PKR 10,000;
- commission rate: 20%;
- Juno commission: PKR 2,000.

Do not calculate commission on shipping, DEX fees or the higher customer display price.

Each order uses the brand price saved when the order was placed. The statement keeps every brand price and rate used so the calculation can be checked later.

## 7. Amount to pay the brand

For this working plan, calculate:

`DEX amount received for the selected orders`

`− Juno commission on brand price`

`− approved refunds or brand charges`

`+ approved corrections or credits`

`= final amount to transfer to the brand`

The DEX charges, taxes and their effect must be shown clearly, not hidden inside one number. The signed seller agreement and Juno's accountant must confirm that these DEX deductions are allowed in the brand settlement before launch.

One statement can contain several orders, but every order must belong to the same brand. Use only DEX rows whose tracking numbers match the selected orders; do not include unrelated rows from the same uploaded file.

## 8. Brand statement and payment screen

Before payment, the admin sees:

- brand name;
- verified account title, bank and account number/IBAN;
- selected orders and tracking numbers;
- customer COD collected;
- every DEX charge and DEX amount received;
- brand price, commission rate and commission;
- refunds/corrections;
- final amount to transfer;
- complete statement and Juno invoice.

After transferring the money, staff add:

- payment date;
- bank transaction reference;
- payment screenshot/proof.

Only then can the statement be marked **Paid**.

The seller portal shows the final statement, Juno invoice, payment proof, amount, date and reference.

## 9. Customer and brand documents

### Customer

Every seller order gets its own email and invoice/receipt. There is no parent-order invoice.

The invoice should show, where required:

- invoice and Juno order number;
- brand's legal name, address, NTN/STRN;
- customer/recipient details;
- date;
- products, quantity and price;
- discount, shipping and taxes;
- total amount;
- FBR invoice/verification information when required.

### Brand

For each payment, the seller receives one downloadable package containing:

1. brand payment statement;
2. Juno commission/service invoice;
3. payment proof after payment;
4. any correction/credit document.

The statement explains the payment. The Juno invoice records Juno's commission/service. They should not be given the same document number or called the same thing.

## 10. Juno's accounting records

Behind the admin portal, Juno needs a balanced accounting journal. Think of it as a notebook where every amount has two sides: where the money came from and where it went.

At minimum, it must track:

- money DEX owes Juno;
- money received in Juno's bank;
- money Juno owes each brand;
- Juno commission income;
- DEX delivery costs and taxes;
- refunds owed to customers;
- taxes Juno owes or may claim;
- money paid to brands.

Staff should not type journal entries while processing ordinary orders. The approved DEX statement, brand statement, refund and payment actions create them automatically.

Once a money record is final, do not edit or delete it. Fix it with a new correction linked to the old record.

## 11. Reports Juno should be able to create

The accounting records should produce:

- profit and loss report;
- balance sheet;
- cash flow statement;
- changes in owners' equity;
- trial balance and full account activity;
- money owed to each brand;
- DEX money waiting to be received;
- bank reconciliation;
- tax report;
- invoice and credit-note list;
- GMV, commission, refunds and delivery-cost reports.

Juno's accountant should choose the final legal layout. Juno can first provide clean exports and supporting records instead of building a complicated report designer.

## 12. Two phases

### Phase 1: before Daraz Open Platform

- Staff upload DEX statements.
- Staff select orders and mark DEX payment received.
- Staff create brand statements.
- Staff upload brand payment proof.
- Juno creates the accounting records from these actions.

### Phase 2: after Daraz Open Platform

- Juno may fetch DEX booking and statement information automatically if the official API provides it.
- Staff still check the Juno bank payment before marking DEX payment received.
- All Phase 1 tools remain as a backup.

## 13. Pakistan law and tax checks

These official sources were used for this draft. A Pakistani lawyer and chartered accountant must check the latest version before launch:

- FBR Income Tax Ordinance: `https://fbr.gov.pk/Categ/Income-Tax-Ordinance/326`
- FBR Sales Tax Act: `https://fbr.gov.pk/categ/sales-tax-act/301`
- FBR digital invoicing notice: `https://download1.fbr.gov.pk/SROs/2025423124414622SRO709dated22April%2C2025.pdf`
- FBR digital invoicing FAQ: `https://fbr.gov.pk/faqs/173967/173969`
- SECP financial statement guide: `https://www.secp.gov.pk/document/guide-on-financial-statements/?filename=Guide-on-Financial-Statements.pdf&ind=1739944008758&refresh=68a59a61e5cfb1755683425&wpdmdl=55637`
- Electronic Transactions Ordinance, 2002: `https://pakistancode.gov.pk/pdffiles/administratordbc98dd49f2df3b1d07bb986dcceb9a3.pdf`

The accountant/lawyer must confirm:

- whether Juno is an agent/marketplace for tax and accounts;
- who issues the customer tax invoice;
- which DEX charges/taxes belong to Juno or the brand;
- whether tax is recoverable, payable or an expense;
- how FBR digital invoicing applies;
- the chart of accounts and final financial statement format.
