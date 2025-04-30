import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
              <div style={{paddingTop : 50}}/>

      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-neutral-300">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Account information (name, email, password)</li>
            <li>Profile information</li>
            <li>Payment information</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Process your transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Communicate with you about products, services, and events</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Service providers who assist in our operations</li>
            <li>Professional advisors</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            Email: privacy@juno.com.pk
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

export default PrivacyPolicy;