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
      className="group bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 p-8 rounded-3xl backdrop-blur-sm transition-all h-full"
    >
      <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
        {React.cloneElement(icon as React.ReactElement, { className: 'text-white' })}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-lg">{description}</p>
    </motion.div>
  );
};

const JunoStudio: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: <Layers size={28} />,
      title: "Intuitive Collection Builder",
      description: "Effortlessly create, organize, and manage your fashion collections with our powerful drag-and-drop interface.",
      delay: 0.2,
    },
    {
      icon: <BarChart size={28} />,
      title: "Actionable Sales Analytics",
      description: "Gain deep insights into product performance and customer behavior with a comprehensive analytics dashboard.",
      delay: 0.3,
    },
    {
      icon: <Palette size={28} />,
      title: "Dynamic Brand Customization",
      description: "Tailor your brand's presence on Juno with powerful styling, presentation tools, and rich media support.",
      delay: 0.4,
    },
    {
      icon: <Settings size={28} />,
      title: "Seamless Platform Integrations",
      description: "Connect with your existing inventory systems and e-commerce platforms like Shopify for streamlined operations.",
      delay: 0.5,
    },
  ];

  return (
    <section id="juno-studio" className="py-32 bg-black relative">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Juno Studio</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            The all-in-one platform for fashion brands to create, manage, and scale their business on Juno. Your command center for growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <a 
            href="/seller" 
            className="inline-flex items-center px-10 py-5 rounded-full bg-white text-black font-bold text-lg hover:bg-neutral-200 transition-all hover:scale-105 group"
          >
            Explore the Studio
            <ArrowRight size={22} className="ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default JunoStudio;