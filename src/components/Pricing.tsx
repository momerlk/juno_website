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
    <section id="pricing" className="section bg-background-dark">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            One plan, everything you need. Power your brand's growth on Juno with a straightforward and affordable pricing model.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative card p-8 md:p-12 border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <div className="absolute top-0 right-8 -mt-5">
              <div className="bg-primary text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
              <div>
                <h3 className="text-3xl font-bold mb-2 text-white">Juno Studio Pro</h3>
                <p className="text-neutral-400">Everything you need to showcase your brand and scale your business.</p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-extrabold gradient-text mb-1">
                  Rs. 4,999
                </div>
                <p className="text-neutral-400">per month + 12.5% per transaction</p>
              </div>
            </div>

            <div className="mb-10">
              <h4 className="font-semibold text-white mb-4">What's included:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 bg-primary/20 rounded-full p-1">
                      <Check size={14} className="text-primary" />
                    </div>
                    <span className="text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="/seller" className="btn btn-primary flex-1 text-lg py-4">
                Get Started Now
              </a>
              <a href="/#download" className="btn btn-outline flex-1 text-lg py-4 group">
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
