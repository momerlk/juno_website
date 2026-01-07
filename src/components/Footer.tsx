import React from 'react';
import { Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Instagram size={20} />, url: 'https://instagram.com/junonow', label: 'Instagram' },
  ];

  return (
    <footer className="bg-black border-t border-white/5 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Logo and Company Info */}
          <div className="lg:col-span-4 space-y-6">
            <a href="/#home" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center">
                <span className="font-black text-xl text-white">J</span>
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">juno</span>
            </a>
            <p className="text-neutral-400 max-w-sm text-lg leading-relaxed">
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
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-base font-bold text-white mb-6 uppercase tracking-wider">App</h4>
              <ul className="space-y-4">
                <li><a href="/#screenshots" className="text-neutral-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="/download" className="text-neutral-400 hover:text-white transition-colors">Download</a></li>
                <li><a href="/download" className="text-neutral-400 hover:text-white transition-colors">iOS</a></li>
                <li><a href="/download" className="text-neutral-400 hover:text-white transition-colors">Android</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Studio</h4>
              <ul className="space-y-4">
                <li><a href="/#juno-studio" className="text-neutral-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="/#pricing" className="text-neutral-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/seller" className="text-neutral-400 hover:text-white transition-colors">Seller Login</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Company</h4>
              <ul className="space-y-4">
                <li><a href="/#team" className="text-neutral-400 hover:text-white transition-colors">Team</a></li>
                <li><a href="/blog" className="text-neutral-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/#download" className="text-neutral-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-4">
                <li><a href="/privacy-policy" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-and-conditions" className="text-neutral-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="/refund-policy" className="text-neutral-400 hover:text-white transition-colors">Refunds</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            &copy; {currentYear} Juno Technologies Inc. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 text-neutral-600 text-sm">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>in Pakistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;