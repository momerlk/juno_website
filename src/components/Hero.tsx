import React from 'react';
import { Smartphone, ArrowRight, Users, ShoppingBag, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import appLandscapeImage from "../assets/screenshots/app_landscape.png";
import appPortraitImage from "../assets/screenshots/app_portrait.png";

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black selection:bg-primary/30">
      
      {/* Liquid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/20 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-accent/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      {/* Grid Texture */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="container relative z-10 pt-32 pb-20 md:pt-40 md:pb-32 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                <span className="text-sm font-medium text-neutral-300">The Future of Fashion Commerce</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-8">
                <span className="block text-white">Swipe.</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Shop.</span>
                <span className="block text-white">Slay.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                Experience the next generation of fashion discovery. Juno connects you with the coolest indie brands through an immersive, video-first shopping experience.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
            >
              <a
                href="/download"
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center">
                  <Smartphone className="mr-2" size={20} />
                  Get the App
                </span>
              </a>
              <a
                href="/seller"
                className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all hover:scale-105 flex items-center justify-center"
              >
                For Brands
                <ArrowRight className="ml-2" size={20} />
              </a>
            </motion.div>
          </div>

          {/* Phone Mockup / Image */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            className="lg:col-span-5 relative perspective-1000 flex justify-center"
          >
            <div className="relative w-full max-w-[350px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[3rem] blur-[60px] opacity-40 animate-pulse" />
                
                {/* Portrait Image */}
                <img
                    src={appPortraitImage}
                    alt="Juno App Preview"
                    className="relative z-10 w-full h-auto drop-shadow-2xl transform transition-transform hover:scale-105 duration-500 rounded-[2.5rem] block landscape:hidden"
                    style={{ transformStyle: 'preserve-3d' }}
                />
                 {/* Landscape Image */}
                <img
                    src={appLandscapeImage}
                    alt="Juno App Preview"
                    className="relative z-10 w-full h-auto drop-shadow-2xl transform transition-transform hover:scale-105 duration-500 rounded-[2.5rem] hidden landscape:block"
                    style={{ transformStyle: 'preserve-3d' }}
                />
                
                {/* Floating Elements */}
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-8 top-1/4 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl z-20 hidden md:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                            <ShoppingBag size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-400">New Drop</p>
                            <p className="font-bold text-white">Winter '26</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -left-8 bottom-1/4 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl z-20 hidden md:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 border-2 border-black" />
                            <div className="w-8 h-8 rounded-full bg-neutral-600 border-2 border-black" />
                            <div className="w-8 h-8 rounded-full bg-neutral-500 border-2 border-black" />
                        </div>
                        <p className="font-bold text-white text-sm">5k+ Users</p>
                    </div>
                </motion.div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="group bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-default">
              <div className="mb-4 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={24} className="text-primary"/>
              </div>
              <div className="text-4xl font-bold text-white mb-1">5000+</div>
              <div className="text-sm text-neutral-400 font-medium tracking-wide">ACTIVE USERS</div>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-default">
              <div className="mb-4 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag size={24} className="text-secondary"/>
              </div>
              <div className="text-4xl font-bold text-white mb-1">50+</div>
              <div className="text-sm text-neutral-400 font-medium tracking-wide">CURATED BRANDS</div>
            </div>

            <div className="group bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-default">
              <div className="mb-4 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase size={24} className="text-accent"/>
              </div>
              <div className="text-4xl font-bold text-white mb-1">35+</div>
              <div className="text-sm text-neutral-400 font-medium tracking-wide">PARTNER INSTITUTES</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;