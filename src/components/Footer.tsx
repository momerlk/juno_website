import React from 'react';
import { Mail, Instagram, Twitter, Linkedin, Github } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Instagram size={24} />, url: 'https://instagram.com/junonow', label: 'Instagram' },
    // Add other social links here if needed
  ];

  return (
    <footer className="bg-background-dark py-16 border-t border-neutral-800/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Logo and Company Info */}
          <div className="lg:col-span-4">
            <a href="/#home" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="font-black text-2xl text-white">J</span>
              </div>
              <span className="font-bold text-2xl text-white">juno</span>
            </a>
            <p className="text-neutral-400 mb-6 max-w-xs">
              Revolutionizing fashion discovery and commerce through innovative technology.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-primary transition-colors duration-300"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Juno App</h4>
              <ul className="space-y-3">
                <li><a href="/#screenshots" className="text-neutral-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="/download" className="text-neutral-400 hover:text-white transition-colors">Download</a></li>
                <li><a href="/download" className="text-neutral-400 hover:text-white transition-colors">iOS App</a></li>
                <li><a href="/download" className="text-neutral-400 hover:text-white transition-colors">Android App</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Juno Studio</h4>
              <ul className="space-y-3">
                <li><a href="/#juno-studio" className="text-neutral-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="/#pricing" className="text-neutral-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/seller" className="text-neutral-400 hover:text-white transition-colors">Seller Login</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="/#team" className="text-neutral-400 hover:text-white transition-colors">Team</a></li>
                <li><a href="/#download" className="text-neutral-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="/privacy-policy" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-and-conditions" className="text-neutral-400 hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="/refund-policy" className="text-neutral-400 hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-800/50 text-center text-neutral-500 text-sm">
          <p>&copy; {currentYear} Juno Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
