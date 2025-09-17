import React from 'react';
import { Smartphone, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import splashImage from "../assets/screenshots/swipe.png"

const Hero: React.FC = () => {
  return (
    <section id="home" className="pt-24 pb-20 md:pt-32 md:pb-28 lg:min-h-screen lg:flex lg:items-center relative overflow-hidden bg-gradient-to-br from-background via-background-light/50 to-background">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-4"
              >
                ✨ Revolutionary Fashion Discovery
              </motion.div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-white">Shop</span>
                <span className="gradient-text">With a Swipe™</span>
              </h1>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-neutral-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Discover exclusive indie fashion brands through our revolutionary swipe-to-shop experience. Built for the next generation of fashion lovers.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
            >
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255, 24, 24, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                href="#download"
                className="btn btn-primary text-lg px-8 py-4 shadow-lg"
              >
                <Smartphone size={20} className="mr-2" />
                Download App
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/seller"
                className="btn btn-outline group text-lg px-8 py-4"
              >
                <Play size={20} className="mr-2" />
                Explore Studio
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">400+</div>
                <div className="text-sm text-neutral-400">Active Users</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-neutral-400">Brands</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">35+</div>
                <div className="text-sm text-neutral-400">Institutes</div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="relative w-[480px] md:w-[500px] animate-float">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 blur-2xl rounded-full animate-pulse"></div>
                <img
                  src={splashImage}
                  alt="Juno App Preview"
                  className="relative"
                  style={{
                    height : 600,
                    width : 485,
                  }}
                />
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-primary/20 backdrop-blur-sm rounded-full p-3 animate-bounce">
                  <Smartphone size={20} className="text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-secondary/20 backdrop-blur-sm rounded-full p-3 animate-bounce" style={{ animationDelay: '1s' }}>
                  <ArrowRight size={20} className="text-secondary" />
                </div>
                
              </div>
            </div>

            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-primary/10 to-transparent rounded-full blur-2xl"></div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center cursor-pointer"
          onClick={() => document.getElementById('juno-app')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="text-neutral-400 text-sm mb-2 hover:text-white transition-colors">Scroll to discover</span>
          <div className="w-6 h-10 border-2 border-neutral-500 rounded-full flex justify-center p-1 hover:border-primary transition-colors">
            <motion.div
              animate={{
                y: [0, 12, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5
              }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;