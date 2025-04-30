import React from 'react';

const RefundPolicy: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
              <div style={{paddingTop : 50}}/>

      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      
      <div className="space-y-6 text-neutral-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Refund Eligibility</h2>
          <p>Refunds are available for:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Defective products</li>
            <li>Incorrect items received</li>
            <li>Unused items returned within 30 days</li>
            <li>Cancelled orders before shipping</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
          <p>To request a refund:</p>
          <ol className="list-decimal pl-6 mt-2 space-y-2">
            <li>Log into your account and submit a refund request</li>
            <li>Include order number and reason for refund</li>
            <li>Return item if required (see Return Policy)</li>
            <li>Wait for refund approval and processing</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Refund Timeline</h2>
          <p>Our refund processing times:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>3-5 business days for approval</li>
            <li>5-10 business days for credit card refunds</li>
            <li>1-3 business days for store credit</li>
            <li>Up to 30 days for international orders</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Non-Refundable Items</h2>
          <p>The following are not eligible for refunds:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Digital products once accessed</li>
            <li>Customized or personalized items</li>
            <li>Items marked as final sale</li>
            <li>Gift cards and promotional credits</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            For refund inquiries, please contact us at:
            <br />
            Email: refunds@juno.com.pk
            <br />
            Address: Vogue Towers, MM Alam Road, Block C2, Gulberg III, Lahore, Pakistan
            <br />
            Phone: +92 300 0856955
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;