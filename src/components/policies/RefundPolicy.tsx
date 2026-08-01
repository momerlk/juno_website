import React from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_URL = 'https://wa.me/923158972405?text=I%20need%20help%20with%20a%20refund.';

const RefundPolicy: React.FC = () => (
  <main className="container mx-auto max-w-4xl px-4 py-16 sm:py-24">
    <article className="space-y-10 text-neutral-300">
      <header className="border-b border-white/10 pb-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Customer care</p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Refund Policy</h1>
        <p className="mt-4 leading-7">This explains what happens after Juno approves a refund. Approval and the payment instruction are separate steps.</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-white">When a refund may be approved</h2>
        <p className="mt-3 leading-7">A refund may follow an eligible return, seller cancellation, unavailable item, duplicate or extra payment, failed order, lost parcel, agreed partial refund, or another remedy required by law.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">How we calculate it</h2>
        <p className="mt-3 leading-7">The approved amount can include the affected item price, applicable shipping, and charges or taxes attributable to the refunded item. For a customer-choice partial return, original delivery shipping may not be refundable if it was clearly disclosed and the delivery was completed. We use the prices, discounts, and charges saved when the order was placed—not today&apos;s prices—and show the calculation before the case closes.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">How you receive it</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
          <li>Prepaid orders are refunded to the original payment method where possible.</li>
          <li>COD orders are refunded to a verified Pakistani bank account or supported mobile wallet provided through Juno&apos;s secure process.</li>
          <li>Store credit is only used with your agreement when money is due.</li>
        </ul>
        <p className="mt-3 leading-7">Juno will never ask for your password, OTP, PIN, or full card details to issue a refund.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Timing</h2>
        <p className="mt-3 leading-7">We aim to issue an approved refund within 7 business days after any required return inspection, or after approval where no return is needed. Your bank, wallet, or payment provider may take additional time to show the funds. We will confirm the payment reference and issue date when the payment instruction is sent.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Cancelled orders</h2>
        <p className="mt-3 leading-7">An order cancelled before dispatch is refunded after payment or booking reversal checks. After a parcel has been handed to the carrier, cancellation may be handled as a return and can wait for carrier confirmation and parcel recovery.</p>
      </section>

      <section className="border-t border-white/10 pt-8">
        <h2 className="text-2xl font-bold text-white">Questions about a refund?</h2>
        <p className="mt-3 leading-7">Message us with your order or case number and payment reference. <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="font-bold text-primary hover:text-secondary">Contact Juno support on WhatsApp</a>.</p>
        <p className="mt-4 text-sm"><Link to="/return-policy" className="text-white underline hover:text-primary">Return Policy</Link> · <Link to="/exchange-policy" className="text-white underline hover:text-primary">Exchange Policy</Link></p>
      </section>
    </article>
  </main>
);

export default RefundPolicy;
