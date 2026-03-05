import React from 'react';
import { Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import appPortraitImage from "../assets/screenshots/app_portrait.png";

const spotlightPills = [
  'Independent Labels',
  'Curated Drops',
  'Real Stories',
  'Pakistan First',
];

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black selection:bg-primary/30">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/20 blur-[100px] animate-pulse delay-1000" />
      </div>

      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
              <span className="text-sm font-medium text-neutral-300 tracking-wider uppercase">Home of Pakistan&apos;s Indie Brands</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none mb-10">
              <span className="block text-white">Your Gateway to</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary py-2 px-3">Indie Fashion.</span>
            </h1>

            <p className="text-xl md:text-3xl text-neutral-400 max-w-3xl mx-auto leading-relaxed mb-12 font-light italic">
              A curated marketplace for Pakistan&apos;s most distinctive independent labels, brought together for the thoughtful shopper.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-12">
              {spotlightPills.map((pill) => (
                <span
                  key={pill}
                  className="px-6 py-2 rounded-full text-sm font-bold bg-white/5 border border-white/10 text-neutral-200 backdrop-blur-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            <a
              href="/download"
              className="px-10 py-5 bg-white text-black rounded-full font-black text-xl transition-all hover:scale-105 active:scale-95 hover:bg-neutral-200 flex items-center justify-center group"
            >
              <Smartphone className="mr-2" size={24} />
              Download App
            </a>
            <a
              href="/seller"
              className="px-10 py-5 rounded-full bg-white/5 border border-white/10 text-white font-black text-xl hover:bg-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-md"
            >
              Launch Your Label
              <ArrowRight className="ml-2" size={24} />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
