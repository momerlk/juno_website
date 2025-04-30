import React from 'react';

const ReturnPolicy: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
              <div style={{paddingTop : 50}}/>

      <h1 className="text-3xl font-bold mb-8">Return Policy</h1>
      
      <div className="space-y-6 text-neutral-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Return Period</h2>
          <p>We accept returns within:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>30 days of delivery for unused items</li>
            <li>14 days for defective items</li>
            <li>Items must be in original packaging</li>
            <li>All tags and labels must be attached</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Return Process</h2>
          <p>To return an item:</p>
          <ol className="list-decimal pl-6 mt-2 space-y-2">
            <li>Log into your account and initiate a return request</li>
            <li>Print the provided return shipping label</li>
            <li>Package the item securely</li>
            <li>Drop off at any authorized shipping location</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Non-Returnable Items</h2>
          <p>The following items cannot be returned:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Customized or personalized items</li>
            <li>Digital products and subscriptions</li>
            <li>Items marked as final sale</li>
            <li>Intimate apparel for hygiene reasons</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Return Shipping</h2>
          <p>Return shipping is:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Free for defective items</li>
            <li>Free for incorrect items shipped</li>
            <li>Customer responsibility for change of mind returns</li>
            <li>Calculated based on shipping location</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            For any questions about returns, please contact our customer service:
            <br />
            Email: returns@juno.com.pk
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

export default ReturnPolicy;