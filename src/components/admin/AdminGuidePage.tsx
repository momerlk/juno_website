import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';

type GuideKind = 'processing' | 'support';

const processingSections = [
  ['1. Review the seller order', ['Open Admin → Orders, find the seller order, and open it with the eye icon.', 'Check product, variant, quantity, customer details, delivery address, payment method, and total.', 'Use Edit customer, delivery & payment only when a customer detail needs correction.']],
  ['2. Confirm the address', ['Open Address review and select Create ChatGPT prompt.', 'Copy the prompt, ask the customer for the missing facts through the approved channel, then enter the reviewed address and missing fields.', 'Select Save review; select Customer confirmed address only after the customer approves the final address.']],
  ['3. Confirm and instruct the seller', ['Choose Confirmed in the order status section and select Push status.', 'Ask the seller to open Seller Dashboard → Orders → the order.', 'The seller checks every item, uploads one photo per item plus a sealed-parcel photo with airway bill, and selects Mark packed only after every upload is saved privately.']],
  ['4. Prepare the DEX workbook', ['In Admin → Orders, select one or more seller orders and choose Get DEX booking details.', 'Choose Copy rows and paste into the official DEX workbook.', "Keep this exact order: Order number, Sender address, Recipient's name, Recipient phone number, Province, District, Wards, Specific address, Product's name, Unit price, Quantity, Weight, Length, Width, Height, COD, COD amount collected on behalf, Fail delivery storage, Delivery note.", 'Fill only blank weight and dimensions in the workbook. Do not calculate or alter COD in the portal.']],
  ['5. Record the booking', ['Open the seller order and use Manual DEX booking.', 'Enter the DEX tracking number and upload the airway-bill file.', 'Select Save DEX booking and verify the tracking number and airway-bill link.']],
  ['6. Record DEX payment', ['After the bank payment is matched, select its orders in Admin → Orders and choose Mark DEX payment received.', 'Enter the statement number, upload the .xlsx statement privately, and add optional bank reference/proof.', 'Select Mark DEX payment received and resolve any server errors for individual orders.']],
  ['7. Create and pay the seller statement', ['Select eligible orders from one seller and choose Create brand statement. Set a default commission rate and only needed per-order overrides.', 'Open Statements to review the server-created statement and transfer details.', 'After transfer, enter the bank reference and date, upload proof privately, then select Mark paid.']],
  ['8. Daily close and prohibitions', ['Review orders waiting for customer address confirmation, seller packing, DEX booking, DEX payment recording, statement creation, or seller payment. Assign every exception an owner and next action.', 'Never invent address details, create duplicate bookings, select a carrier, calculate DEX totals in the browser, record DEX money before matching it, or mark a seller statement paid without its transfer reference, date, and private proof.']],
];

const supportSections = [
  ['Use the correct order', ['Use Admin → Orders as the source of truth. A multi-brand checkout may have separate seller orders and tracking numbers.', 'Before sharing or changing information, match at least two order details. Never request an OTP, password, PIN, card information, or banking password.']],
  ['Address help', ['Use Address review → Create ChatGPT prompt, then ask the customer for only the missing facts through an approved channel.', 'Update the reviewed address and use Customer confirmed address only after the customer agrees. The AI prompt does not verify an address.']],
  ['Order and delivery questions', ['Read product, quantity, total, status, and saved DEX booking details directly from the order.', 'Do not promise a delivery date, pickup, address change after booking, COD change, cancellation, or new delivery attempt without operations confirmation.']],
  ['Seller, payment, and privacy questions', ['Sellers complete packing evidence in Seller Dashboard → Orders and see paid statements in Seller Dashboard → Statements.', 'Do not say a seller payment is due because an order was delivered. Juno must receive DEX payment, create the statement, transfer funds, and record payment proof.', 'Never expose private proof files or permanent signed upload URLs.']],
  ['Escalate', ['Escalate suspected fraud, threats, unsafe/fake goods, privacy incidents, lost parcels, delivery disputes, or bank/payment issues to operations.', 'Record the order number, facts, owner, and next update time in the internal workflow.']],
];

const AdminGuidePage: React.FC<{ guide: GuideKind }> = ({ guide }) => {
  const processing = guide === 'processing';
  const sections = processing ? processingSections : supportSections;
  const title = processing ? 'Order processing guide' : 'Customer support guide';
  const intro = processing
    ? 'The exact admin-portal workflow from a new seller order through seller payment.'
    : 'Use this guide while helping customers without replacing the order record.';

  return (
    <VStack gap={6}>
      <VStack gap={2}>
        <Heading level={1}>{title}</Heading>
        <p>{intro}</p>
      </VStack>
      {sections.map(([heading, steps]) => (
        <Card key={heading} padding={4} variant="muted">
          <VStack gap={2}>
            <Heading level={2}>{heading}</Heading>
            <ol>
              {steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </VStack>
        </Card>
      ))}
    </VStack>
  );
};

export default AdminGuidePage;
