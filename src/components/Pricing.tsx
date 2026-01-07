import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Pricing: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    "Unlimited products and collections",
    "Advanced analytics dashboard",
    "Brand customization tools",
    "Integration with existing platforms",
    "Dedicated account manager",
    "Early access to new features",
    "24/7 priority support",
    "AI-powered trend insights"
  ];

  return (
    <section id="pricing" className="py-32 bg-black relative">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
            Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Pricing</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            One plan, everything you need. Power your brand's growth on Juno with a straightforward and affordable pricing model.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-16 backdrop-blur-xl">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
            
            <div className="absolute top-10 right-10">
              <span className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full shadow-lg">
                Most Popular
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <h3 className="text-4xl font-bold mb-4 text-white">Juno Studio Pro</h3>
                <p className="text-neutral-400 text-lg leading-relaxed">Everything you need to showcase your brand and scale your business globally.</p>
              </div>
              <div className="text-left md:text-right">
                <div className="flex items-baseline justify-start md:justify-end">
                  <span className="text-2xl text-neutral-400 mr-2">Rs.</span>
                  <span className="text-6xl font-black text-white tracking-tighter">4,999</span>
                </div>
                <p className="text-neutral-400 mt-2">per month + 12.5% per transaction</p>
              </div>
            </div>

            <div className="h-px w-full bg-white/10 mb-12" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mb-12">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check size={14} className="text-green-400" />
                  </div>
                  <span className="text-lg text-neutral-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/seller" 
                className="flex-1 py-5 rounded-2xl bg-white text-black font-bold text-lg text-center hover:bg-neutral-200 transition-colors"
              >
                Get Started Now
              </a>
              <a 
                href="/#download" 
                className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg text-center hover:bg-white/10 transition-colors flex items-center justify-center group"
              >
                Request a Demo
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;