import React from 'react';
import { Smartphone, Heart, ShoppingBag, Zap, Search } from 'lucide-react';
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
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-400">{description}</p>
    </motion.div>
  );
};

const JunoApp: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: <Heart className="text-secondary" size={24} />,
      title: "Swipe to Like",
      description: "Effortlessly browse through fashion items with a simple swipe interface, liking what catches your eye.",
      delay: 0.2,
    },
    {
      icon: <ShoppingBag className="text-accent" size={24} />,
      title: "Instant Checkout",
      description: "Add items to your cart and checkout in seconds with our streamlined purchase process.",
      delay: 0.3,
    },
    {
      icon: <Zap className="text-primary" size={24} />,
      title: "Personalized Feed",
      description: "Discover fashion that matches your style with our AI-powered recommendation engine.",
      delay: 0.4,
    },
    {
      icon: <Search className="text-success" size={24} />,
      title: "Brand Discovery",
      description: "Find new and trending fashion brands through our curated collections and spotlights.",
      delay: 0.5,
    },
  ];

  return (
    <section id="juno-app" className="section bg-background-light">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="mb-4">
            juno
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            Revolutionize your shopping experience with our innovative swipe-to-shop mobile application.
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
          <a href="https://drive.google.com/file/d/1CpY1F7SO8wC1dimIPTLqBUDuC_rhX42v/view?usp=sharing" className="btn btn-primary inline-flex">
            <Smartphone size={20} className="mr-2" />
            Download Juno App
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default JunoApp;