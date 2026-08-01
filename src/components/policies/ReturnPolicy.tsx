import React from 'react';
import { Link } from 'react-router-dom';

const SUPPORT_URL = 'https://wa.me/923158972405?text=I%20need%20help%20with%20a%20return.';

const ReturnPolicy: React.FC = () => (
  <main className="container mx-auto max-w-4xl px-4 py-16 sm:py-24">
    <article className="space-y-10 text-neutral-300">
      <header className="border-b border-white/10 pb-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Customer care</p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Return Policy</h1>
        <p className="mt-4 leading-7">For eligible items ordered through Juno. The seller on your order remains responsible for the product; Juno manages the return case and keeps the order record intact.</p>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-white">Request a return within 7 days</h2>
        <p className="mt-3 leading-7">Contact Juno within 7 calendar days of delivery. If an item is damaged, defective, incomplete, counterfeit, unsafe, or different from your order, please report it as soon as possible—ideally within 48 hours—so we can preserve courier and seller evidence.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">What is eligible</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7">
          <li>Wrong item, size, colour, quantity, or variant.</li>
          <li>Damaged, defective, counterfeit, unsafe, incomplete, or materially misdescribed items.</li>
          <li>A change-of-mind return only where the product page says it is eligible.</li>
        </ul>
        <p className="mt-3 leading-7">For a change-of-mind return, the item must be unused, unworn, unwashed, unaltered, and returned with all tags, seals, accessories, gifts, and packaging in resalable condition.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Change-of-mind exclusions</h2>
        <p className="mt-3 leading-7">Unless there is a fault or another legal remedy, we do not normally accept change-of-mind returns for intimate apparel, opened cosmetics or personal-care goods, pierced jewellery, personalised or made-to-order items, perishable goods, opened sealed goods that cannot safely be resold, digital products after supply, gift cards, vouchers, or clearly disclosed final-sale items.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7">
          <li>Message Juno with your order number, affected item and quantity, reason, and any helpful photos.</li>
          <li>We open a case on the relevant seller order and confirm eligibility, evidence needed, and next steps.</li>
          <li>Use only the collection or return instructions Juno authorises. Do not send an item directly to a seller.</li>
          <li>After inspection where needed, we record the decision and arrange the approved refund, exchange, replacement, repair, or another agreed remedy.</li>
        </ol>
        <p className="mt-3 leading-7">An unboxing video can help with a claim, but is not mandatory and its absence alone does not reject a genuine claim.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white">Return shipping</h2>
        <p className="mt-3 leading-7">For a confirmed seller or Juno error, we arrange or repay reasonable return shipping. For an approved change-of-mind return, you may pay the disclosed return cost; we will confirm it before authorising the return.</p>
      </section>

      <section className="border-t border-white/10 pt-8">
        <h2 className="text-2xl font-bold text-white">Need help?</h2>
        <p className="mt-3 leading-7">Keep your authorised return receipt or tracking number until the case closes. <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="font-bold text-primary hover:text-secondary">Contact Juno support on WhatsApp</a>.</p>
        <p className="mt-4 text-sm"><Link to="/refund-policy" className="text-white underline hover:text-primary">Refund Policy</Link> · <Link to="/exchange-policy" className="text-white underline hover:text-primary">Exchange Policy</Link></p>
      </section>
    </article>
  </main>
);

export default ReturnPolicy;
