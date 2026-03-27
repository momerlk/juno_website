import React from 'react';
import { Layers, BarChart, Palette, Settings, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number; }> = ({ icon, title, description, delay }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      className="group bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/10 p-10 rounded-[2.5rem] backdrop-blur-sm transition-all h-full"
    >
      <div className="mb-8 inline-flex p-4 rounded-2xl bg-gradient-to-tr from-primary/10 to-secondary/10 border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
        {React.cloneElement(icon as React.ReactElement, { size: 32, className: 'text-white' })}
      </div>
      <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-lg font-light italic">{description}</p>
    </motion.div>
  );
};

const JunoStudio: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: <Layers />,
      title: "Inventory Sync",
      description: "Direct connection to your existing shopify or custom stacks for seamless stock management.",
      delay: 0.1,
    },
    {
      icon: <BarChart />,
      title: "Real-time Analytics",
      description: "Understand conversion trends and audience DNA with actionable data visualization.",
      delay: 0.2,
    },
    {
      icon: <Palette />,
      title: "Brand Storytelling",
      description: "Rich media tools to showcase the craft and purpose behind your collections.",
      delay: 0.3,
    },
    {
      icon: <Settings />,
      title: "Automated Ops",
      description: "Optimized 1-hour delivery logistics integrated directly into your order flow.",
      delay: 0.4,
    },
  ];

  return (
    <section id="juno-studio" className="py-32 bg-black relative border-b border-white/5">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">
            Juno <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2 px-3">Studio</span>
          </h2>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto font-light italic leading-relaxed">
            The infrastructure for Pakistani labels to build, manage, and scale global-standard businesses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <a 
            href="/studio" 
            className="inline-flex items-center px-12 py-6 rounded-full bg-white text-black font-black text-xl hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 group shadow-2xl shadow-white/10"
          >
            Launch Your Label
            <ArrowRight size={24} className="ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default JunoStudio;
