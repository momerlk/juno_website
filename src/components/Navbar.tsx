import React, { useState, useEffect } from 'react';
import { Menu, X, Smartphone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#screenshots' },
    { name: 'Studio', href: '#juno-studio' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Team', href: '#team' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container mx-auto py-3 px-4 md:px-6">
        <div className="flex justify-between items-center">
          <a href="#home" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="font-black text-2xl text-white">J</span>
            </div>
            <span className="font-bold text-2xl text-white">juno</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-neutral-300 hover:text-white rounded-full hover:bg-white/5 transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/seller"
              className="btn btn-outline text-sm px-5 py-2.5"
            >
              For Brands
            </a>
            <a
              href="/download"
              className="btn btn-primary text-sm px-5 py-2.5 group"
            >
              Download App
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Mobile Navigation Toggle */}
          <button
            className="md:hidden text-neutral-300 hover:text-white z-50"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 bg-background z-40 md:hidden"
          >
            <div className="container mx-auto pt-24 pb-8 px-4 flex flex-col h-full">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-neutral-300 hover:text-white text-2xl font-semibold py-3 transition-colors duration-300"
                    onClick={closeMenu}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="mt-auto pt-8 flex flex-col space-y-4">
                <a
                  href="/download"
                  className="btn btn-primary w-full text-lg"
                  onClick={closeMenu}
                >
                  <Smartphone size={20} className="mr-2" />
                  Download App
                </a>
                <a
                  href="/seller"
                  className="btn btn-outline w-full text-lg"
                  onClick={closeMenu}
                >
                  For Brands
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
