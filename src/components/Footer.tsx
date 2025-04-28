import React from 'react';
import { Mail, Instagram, Twitter, Linkedin, Github } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-dark py-12 border-t border-neutral-800">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-1">
            <a href="#" className="inline-block mb-4">
              <span className="font-bold text-2xl">
                <span className="text-primary">Juno</span>
              </span>
            </a>
            <p className="text-neutral-400 mb-4">
              Revolutionizing fashion discovery and commerce through innovative technology.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                aria-label="Instagram"
                className="text-neutral-400 hover:text-primary transition-colors duration-300"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-neutral-400 hover:text-primary transition-colors duration-300"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-neutral-400 hover:text-primary transition-colors duration-300"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="text-neutral-400 hover:text-primary transition-colors duration-300"
              >
                <Github size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Juno App</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Features
                </a>
              </li>
              <li>
                <a href="#download" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Download
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  App Store
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Google Play
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Juno Studio</h4>
            <ul className="space-y-2">
              <li>
                <a href="#juno-studio" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#mission" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Mission
                </a>
              </li>
              <li>
                <a href="#team" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Team
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Careers
                </a>
              </li>
              <li>
                <a href="#contact" className="text-neutral-400 hover:text-white transition-colors duration-300">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-500 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Juno. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-neutral-500 hover:text-neutral-300 text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-300 text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-300 text-sm">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;