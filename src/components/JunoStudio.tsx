import React from 'react';
import { Layers, BarChart, Palette, Settings, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, delay }}
      className="min-h-[50vh] bg-gradient-to-br from-background/50 to-background-light/30 backdrop-blur-xl rounded-3xl p-12 hover:shadow-2xl transition-all duration-500 group"
    >
      <div className="h-full flex flex-col justify-between">
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 p-6 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-4 group-hover:text-secondary transition-colors duration-500">{title}</h3>
            <p className="text-xl text-neutral-400 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const JunoStudio: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: <Layers className="text-secondary" size={48} />,
      title: "Collection Builder",
      description: "Create and manage your fashion collections with an intuitive drag-and-drop interface.",
      delay: 0.2,
    },
    {
      icon: <BarChart className="text-primary" size={48} />,
      title: "Sales Analytics",
      description: "Track performance with comprehensive analytics on user engagement and sales.",
      delay: 0.3,
    },
    {
      icon: <Palette className="text-accent" size={48} />,
      title: "Brand Customization",
      description: "Customize your brand presence with powerful styling and presentation tools.",
      delay: 0.4,
    },
    {
      icon: <Settings className="text-success" size={48} />,
      title: "Integration Tools",
      description: "Seamlessly connect with your existing inventory and e-commerce platforms.",
      delay: 0.5,
    },
  ];

  return (
    <section id="juno-studio" className="min-h-screen py-20 relative overflow-hidden">
      <div className="max-w-[90%] mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl lg:text-7xl font-bold mb-8">
            juno <span className="gradient-text">studio</span>
          </h2>
          <p className="text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto">
            The ultimate platform for fashion brands to create, manage, and analyze their collections.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24 text-center"
        >
          <a href="#pricing" className="btn btn-primary inline-flex items-center group text-xl px-8 py-4 rounded-xl">
            View Pricing
            <ArrowRight size={24} className="ml-3 transition-transform group-hover:translate-x-2" />
          </a>
        </motion.div>
      </div>

      {/* Background gradient */}
      <div className="absolute -bottom-40 left-0 right-0 h-96 bg-gradient-conic from-secondary/20 via-primary/10 to-accent/20 blur-3xl opacity-40"></div>
    </section>
  );
};

export default JunoStudio;