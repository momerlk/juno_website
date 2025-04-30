import React from 'react';

const TermsConditions: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <div style={{paddingTop : 50}}/>

      <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
      
      <div className="space-y-6 text-neutral-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
          <p>
            By accessing or using Juno's services, you agree to be bound by these Terms and Conditions.
            If you disagree with any part of these terms, you may not access our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>You must be 14 years or older to use our services</li>
            <li>You are responsible for maintaining account security</li>
            <li>Account information must be accurate and current</li>
            <li>We reserve the right to terminate accounts for violations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
          <p>All content on this platform is the property of Juno and is protected by copyright laws.</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>You may not use our content without permission</li>
            <li>Trademarks and logos are our exclusive property</li>
            <li>User-generated content remains your property</li>
            <li>We have the right to remove any content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Service Usage</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Services are provided "as is" without warranty</li>
            <li>We may modify or discontinue services at any time</li>
            <li>You agree not to misuse our services</li>
            <li>We are not liable for any service interruptions</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Liability Limitations</h2>
          <p>
            Juno shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p>
            For questions about these Terms & Conditions, contact us at:
            <br />
            Email: legal@juno.com.pk
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

export default TermsConditions;