import React from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_URL = 'https://wa.me/923158972405?text=I%20need%20help%20with%20an%20exchange.';

const ExchangePolicy: React.FC = () => (
  <main className="container mx-auto max-w-4xl px-4 py-16 sm:py-24">
    <article className="space-y-10 text-neutral-300">
      <header className="border-b border-white/10 pb-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Customer care</p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Exchange Policy</h1>
        <p className="mt-4 leading-7">For eligible size, colour, version, and replacement exchanges on Juno orders.</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-white">Request an exchange within 7 days</h2>
        <p className="mt-3 leading-7">Contact Juno within 7 calendar days of delivery. For a damaged, defective, wrong, counterfeit, incomplete, or materially misdescribed item, please report it as soon as possible—ideally within 48 hours.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Eligibility and stock</h2>
        <p className="mt-3 leading-7">An exchange may be approved for a wrong or defective item, or where the product page permits a size or colour exchange and replacement stock is available. Customer-choice exchanges must be unused, unworn, unwashed, unaltered, and returned complete with tags, seals, accessories, gifts, and packaging. The exclusions in the <Link to="/return-policy" className="text-white underline hover:text-primary">Return Policy</Link> apply.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Price and delivery cost</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
          <li>For the same product and price, there is no item-price difference.</li>
          <li>For a higher-priced approved replacement, you pay the disclosed difference before dispatch.</li>
          <li>For a lower-priced approved replacement, Juno refunds the difference under the <Link to="/refund-policy" className="text-white underline hover:text-primary">Refund Policy</Link>.</li>
          <li>For a confirmed seller or Juno error, we cover reasonable collection and redelivery. For a customer-choice exchange, we confirm any collection or redelivery cost before approval.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7">
          <li>Message Juno with the order number, item and quantity, requested replacement, reason, and helpful evidence.</li>
          <li>We open a case on the seller order and confirm eligibility, stock, price difference, and delivery cost.</li>
          <li>Use only Juno&apos;s authorised return instructions. We inspect the original item when required.</li>
          <li>Once approved, the replacement is sent as a separately tracked shipment; the original tracking number is never reused.</li>
        </ol>
        <p className="mt-3 leading-7">We will not substitute another item without your approval. If the replacement is unavailable or cannot reasonably be completed, you can choose an eligible alternative or refund.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Repeat exchanges</h2>
        <p className="mt-3 leading-7">Customer-choice exchanges are normally limited to one exchange per item. This does not limit a remedy for a replacement that is itself wrong, defective, counterfeit, unsafe, incomplete, or materially misdescribed.</p>
      </section>

      <section className="border-t border-white/10 pt-8">
        <h2 className="text-2xl font-bold text-white">Start an exchange</h2>
        <p className="mt-3 leading-7"><a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="font-bold text-primary hover:text-secondary">Contact Juno support on WhatsApp</a> with your order number.</p>
        <p className="mt-4 text-sm"><Link to="/return-policy" className="text-white underline hover:text-primary">Return Policy</Link> · <Link to="/refund-policy" className="text-white underline hover:text-primary">Refund Policy</Link></p>
      </section>
    </article>
  </main>
);

export default ExchangePolicy;
