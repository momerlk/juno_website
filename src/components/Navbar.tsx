import React, { useState, useEffect } from 'react';
import { Menu, X, Smartphone, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Juno App', href: '#juno-app' },
    { name: 'Juno Studio', href: '#juno-studio' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Team', href: '#team' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container mx-auto py-4 px-4 md:px-6">
        <div className="flex justify-between items-center">
          <a href="#home" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="flex items-center">
              <span className="font-bold text-2xl">
                <span className="text-primary">Juno</span>
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-neutral-300 hover:text-white transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#download"
              className="btn btn-primary"
            >
              <Smartphone size={18} className="mr-2" />
              Download App
            </a>
          </div>

          {/* Mobile Navigation Toggle */}
          <button
            className="md:hidden text-neutral-300 hover:text-white"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-background-light border-t border-neutral-800"
        >
          <div className="container mx-auto py-4 px-4 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-neutral-300 hover:text-white py-2 transition-colors duration-300"
                onClick={closeMenu}
              >
                {link.name}
              </a>
            ))}
            <div className="flex space-x-4 pt-4">
              <a
                href="#download"
                className="btn btn-primary flex-1"
                onClick={closeMenu}
              >
                <Smartphone size={18} className="mr-2" />
                Download App
              </a>
              <a
                href="#juno-studio"
                className="btn btn-outline flex-1"
                onClick={closeMenu}
              >
                <Layers size={18} className="mr-2" />
                Juno Studio
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;