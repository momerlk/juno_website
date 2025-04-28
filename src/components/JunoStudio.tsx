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
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="card card-hover"
    >
      <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-400">{description}</p>
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
      icon: <Layers className="text-secondary" size={24} />,
      title: "Collection Builder",
      description: "Create and manage your fashion collections with an intuitive drag-and-drop interface.",
      delay: 0.2,
    },
    {
      icon: <BarChart className="text-primary" size={24} />,
      title: "Sales Analytics",
      description: "Track performance with comprehensive analytics on user engagement and sales.",
      delay: 0.3,
    },
    {
      icon: <Palette className="text-accent" size={24} />,
      title: "Brand Customization",
      description: "Customize your brand presence with powerful styling and presentation tools.",
      delay: 0.4,
    },
    {
      icon: <Settings className="text-success" size={24} />,
      title: "Integration Tools",
      description: "Seamlessly connect with your existing inventory and e-commerce platforms.",
      delay: 0.5,
    },
  ];

  return (
    <section id="juno-studio" className="section">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            juno <span className="gradient-text">studio</span>
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            The ultimate platform for fashion brands to create, manage, and analyze their collections.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <a href="#pricing" className="btn btn-secondary inline-flex items-center group">
            View Pricing
            <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default JunoStudio;