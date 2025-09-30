import React from 'react';
import { Smartphone, ArrowRight, Play, Users, ShoppingBag, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import appLandscapeImage from "../assets/screenshots/app_landscape.png";
import appPortraitImage from "../assets/screenshots/app_portrait.png";

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-pattern bg-cover bg-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)`,
          backgroundSize: '100px 100px',
        }}
      ></div>

      <div className="container relative z-10 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-block px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-bold mb-6">
                Built for the Next Generation of Fashion
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
                <span className="block text-white">The Future of Fashion</span>
                <span className="gradient-text">Is a Swipe Away</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Juno is a revolutionary swipe-to-shop experience connecting you with exclusive indie fashion brands. Discover your unique style, effortlessly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-10"
            >
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/download"
                className="btn btn-primary text-lg px-8 py-4 shadow-lg"
              >
                <Smartphone size={22} className="mr-3" />
                Download the App
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/seller"
                className="btn btn-outline group text-lg px-8 py-4"
              >
                For Brands
                <ArrowRight size={22} className="ml-3 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <div className="relative w-[480px] md:w-[500px] animate-float flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl rounded-full animate-pulse"></div>
              {/* Portrait Image */}
              <img
                src={appPortraitImage}
                alt="Juno App Preview"
                className="relative block landscape:hidden"
                style={{
                  height : 600,
                  width : 333,
                }}
              />
              {/* Landscape Image */}
              <img
                src={appLandscapeImage}
                alt="Juno App Preview"
                className="relative hidden landscape:block"
                style={{
                  height : 612,
                  width : 480,
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 md:mt-32"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <Users size={32} className="mx-auto text-primary mb-3"/>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-neutral-400">Active Beta Users</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <ShoppingBag size={32} className="mx-auto text-primary mb-3"/>
              <div className="text-3xl font-bold text-white">15+</div>
              <div className="text-sm text-neutral-400">Curated Brands</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
              <Briefcase size={32} className="mx-auto text-primary mb-3"/>
              <div className="text-3xl font-bold text-white">35+</div>
              <div className="text-sm text-neutral-400">Partner Institutes</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
