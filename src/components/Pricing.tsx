import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Pricing: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    "Unlimited products and collections",
    "Advanced analytics dashboard",
    "Brand customization tools",
    "Integration with existing platforms",
    "Dedicated account manager",
    "Early access to new features",
  ];

  return (
    <section id="pricing" className="section bg-background-light">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Start building your fashion collection on the Juno platform with our straightforward pricing model.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-primary/25 via-secondary/20 to-accent/15 p-[1px] rounded-2xl">
            <div className="card p-8 md:p-12 bg-background-light rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">Juno Studio</h3>
                  <p className="text-neutral-400 text-lg">Everything you need to showcase your fashion brand</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-3xl md:text-4xl font-bold">
                    <span className="gradient-text">Rs. 4,999</span>
                    <span className="text-neutral-400 text-xl">/month</span>
                  </div>
                  <p className="text-neutral-400 text-lg">+ 5% transaction fee</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 bg-primary/20 rounded-full p-1">
                      <Check size={16} className="text-primary" />
                    </div>
                    <span className="text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <a href="#contact" className="btn btn-primary flex-1 max-w-xs mx-auto">
                  Get Started
                </a>
                <a href="#contact" className="btn btn-outline flex-1 max-w-xs mx-auto group">
                  Request Demo
                  <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;