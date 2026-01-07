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
    { name: 'Home', href: '/#home' },
    { name: 'Blog', href: '/blog' },
    { name: 'Features', href: '/#screenshots' },
    { name: 'Studio', href: '/#juno-studio' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Team', href: '/#team' },
    { name: 'Contact', href: '/#download' },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || isOpen ? 'py-4' : 'py-6'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div 
            className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-300 ${
              scrolled || isOpen
                ? 'bg-black/60 backdrop-blur-xl border-white/10 shadow-lg px-6 py-3' 
                : 'bg-transparent border-transparent px-0 py-0'
            }`}
          >
            <div className="flex justify-between items-center">
              {/* Logo */}
              <a href="/#home" className="flex items-center space-x-2 z-50" onClick={closeMenu}>
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-xl blur-sm opacity-70"></div>
                    <div className="relative w-full h-full bg-black rounded-xl flex items-center justify-center border border-white/10">
                        <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-primary to-secondary">J</span>
                    </div>
                </div>
                <span className="font-bold text-2xl text-white tracking-tight">juno</span>
              </a>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white rounded-full hover:bg-white/5 transition-all duration-300"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <a
                  href="/seller"
                  className="px-5 py-2.5 text-sm font-medium text-white hover:text-primary transition-colors"
                >
                  For Brands
                </a>
                <a
                  href="/download"
                  className="group relative px-5 py-2.5 rounded-full bg-white text-black font-bold text-sm overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <span className="relative flex items-center">
                    Download App
                    <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              </div>

              {/* Mobile Toggle */}
              <button
                className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition-colors z-50"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden pt-24 px-4 pb-4"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={closeMenu} />
            <div className="relative z-50 bg-neutral-900/50 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -z-10" />

                <div className="flex flex-col space-y-2">
                    {navLinks.map((link, index) => (
                    <motion.a
                        key={link.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        href={link.href}
                        className="text-xl font-bold text-white/80 hover:text-white py-3 px-4 rounded-xl hover:bg-white/5 transition-all flex items-center justify-between group"
                        onClick={closeMenu}
                    >
                        {link.name}
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </motion.a>
                    ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                    <a
                    href="/download"
                    className="flex items-center justify-center w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-lg shadow-primary/20"
                    onClick={closeMenu}
                    >
                    <Smartphone size={20} className="mr-2" />
                    Download App
                    </a>
                    <a
                    href="/seller"
                    className="flex items-center justify-center w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
                    onClick={closeMenu}
                    >
                    For Brands
                    </a>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;