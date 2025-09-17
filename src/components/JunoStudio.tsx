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
      className="card p-8 space-y-4 h-full"
    >
      <div className="p-3 bg-primary/10 rounded-lg inline-block">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const JunoStudio: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: <Layers className="text-primary" size={28} />,
      title: "Intuitive Collection Builder",
      description: "Effortlessly create, organize, and manage your fashion collections with our powerful drag-and-drop interface.",
      delay: 0.2,
    },
    {
      icon: <BarChart className="text-primary" size={28} />,
      title: "Actionable Sales Analytics",
      description: "Gain deep insights into product performance and customer behavior with a comprehensive analytics dashboard.",
      delay: 0.3,
    },
    {
      icon: <Palette className="text-primary" size={28} />,
      title: "Dynamic Brand Customization",
      description: "Tailor your brand's presence on Juno with powerful styling, presentation tools, and rich media support.",
      delay: 0.4,
    },
    {
      icon: <Settings className="text-primary" size={28} />,
      title: "Seamless Platform Integrations",
      description: "Connect with your existing inventory systems and e-commerce platforms like Shopify for streamlined operations.",
      delay: 0.5,
    },
  ];

  return (
    <section id="juno-studio" className="section bg-background section-glow">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to <span className="gradient-text">Juno Studio</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-3xl mx-auto">
            The all-in-one platform for fashion brands to create, manage, and scale their business on Juno. Your command center for growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
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
          <a href="/seller" className="btn btn-primary text-lg px-10 py-4 group">
            Explore the Studio
            <ArrowRight size={22} className="ml-3 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default JunoStudio;
