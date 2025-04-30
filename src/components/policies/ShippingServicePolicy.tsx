import React from 'react';

const ShippingServicePolicy: React.FC = () => {
   return (
    <div className="container mx-auto py-12 px-4">
      <div style={{paddingTop : 50}}/>
      <h1 className="text-3xl font-bold mb-8">Service Policy</h1>
      
      <div className="space-y-6 text-neutral-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Service Standards</h2>
          <p>At Juno, we are committed to providing exceptional service to our customers:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>24/7 customer support availability through our dedicated channels</li>
            <li>Response to all inquiries within 24 hours</li>
            <li>Regular service updates and notifications about your requests</li>
            <li>Professional and courteous service from our trained staff</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Service Level Agreement</h2>
          <p>Our service level commitments include:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Initial response time: Within 24 hours</li>
            <li>Issue resolution time: 2-3 business days for standard requests</li>
            <li>Emergency support: Available 24/7 for critical issues</li>
            <li>Regular status updates throughout the resolution process</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Support Channels</h2>
          <p>We offer multiple channels for service support:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>In-app chat support</li>
            <li>Email support</li>
            <li>Phone support during business hours</li>
            <li>Self-service help center</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Service Quality Guarantee</h2>
          <p>Our commitment to service quality includes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Trained and certified support staff</li>
            <li>Regular quality assessments and improvements</li>
            <li>Customer feedback integration</li>
            <li>Continuous service enhancement</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p>
            For service-related inquiries:
            <br />
            Email: support@juno.com.pk
            <br />
            Phone: + 92 300 0856955
            <br />
            Address: Vogue Towers, MM Alam Road, Block C2, Gulberg III, Lahore, Pakistan
            <br />
            <br />
            Hours: 24/7 for emergency support, 9 AM - 6 PM EST for general inquiries
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingServicePolicy;