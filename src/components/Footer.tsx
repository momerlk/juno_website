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
          <div className="lg:col-span-4 space-y-8">
            <a href="/#home" className="flex items-center">
              <img
                src="/juno_logos/icon+text_white.png"
                alt="Juno Logo"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </a>
            <p className="text-neutral-400 max-w-sm text-lg leading-relaxed font-light italic">
              Pakistan&apos;s indie fashion destination. Empowering discovery, supporting creators.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 border border-white/10"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-base font-black text-white mb-8 uppercase tracking-[0.2em]">Platform</h4>
              <ul className="space-y-4">
                <li><a href="/#juno-app" className="text-neutral-500 hover:text-white transition-colors">Ecosystem</a></li>
                <li><a href="/download" className="text-neutral-500 hover:text-white transition-colors">Download App</a></li>
                <li><a href="/blog" className="text-neutral-500 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-black text-white mb-8 uppercase tracking-[0.2em]">Studio</h4>
              <ul className="space-y-4">
                <li><a href="/#juno-studio" className="text-neutral-500 hover:text-white transition-colors">Features</a></li>
                <li><a href="/seller" className="text-neutral-500 hover:text-white transition-colors">Launch Label</a></li>
                <li><a href="/studio" className="text-neutral-500 hover:text-white transition-colors">Juno Studio</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-black text-white mb-8 uppercase tracking-[0.2em]">Community</h4>
              <ul className="space-y-4">
                <li><a href="/chapters" className="text-neutral-500 hover:text-white transition-colors">Chapters</a></li>
                <li><a href="/#juno-app" className="text-neutral-500 hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base font-black text-white mb-8 uppercase tracking-[0.2em]">Legal</h4>
              <ul className="space-y-4">
                <li><a href="/privacy-policy" className="text-neutral-500 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="/terms-and-conditions" className="text-neutral-500 hover:text-white transition-colors">Terms</a></li>
                <li><a href="/refund-policy" className="text-neutral-500 hover:text-white transition-colors">Refunds</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">
            &copy; {currentYear} Juno Technologies. Built for Pakistan.
          </p>
          <div className="flex items-center space-x-2 text-neutral-600 text-xs font-bold uppercase tracking-widest">
            <span>Home of Indie Brands</span>
            <span className="text-primary">●</span>
            <span>Est. 2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
