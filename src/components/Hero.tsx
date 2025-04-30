import React from 'react';
import { Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import splashImage from "../assets/screenshots/splash.png"


const Hero: React.FC = () => {
  return (
    <section id="home" className="pt-24 pb-20 md:pt-32 md:pb-28 lg:min-h-screen lg:flex lg:items-center relative overflow-hidden">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="mb-6">
              <span className="font-bold block">Shop</span>
              <span className="gradient-text">With a Swipe™</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 mb-8 max-w-xl mx-auto lg:mx-0">
              Discover Juno, the revolutionary fashion app that lets you swipe to shop, and Juno Studio, the platform where brands create stunning collections.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#download"
                className="btn btn-primary"
              >
                <Smartphone size={20} className="mr-2" />
                Download Juno App
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#juno-studio"
                className="btn btn-outline group"
              >
                Explore Juno Studio
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="relative w-[280px] md:w-[320px] animate-float">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-xl rounded-full"></div>
                <img
                  src={splashImage}
                  alt="Juno App Preview"
                  className="relative z-10 rounded-3xl  border-background-light shadow-xl"
                />
                
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
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center"
        >
          <span className="text-neutral-400 text-sm mb-2">Scroll to discover</span>
          <div className="w-6 h-10 border-2 border-neutral-500 rounded-full flex justify-center p-1">
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