import React from 'react';
import { Target, Users, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface MissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const MissionItem: React.FC<MissionItemProps> = ({ icon, title, description, index }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="flex items-start space-x-6"
    >
      <div className="mt-1">
        <div className="p-4 bg-primary/10 rounded-xl">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-neutral-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const Mission: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const missionItems = [
    {
      icon: <Target size={32} className="text-primary" />,
      title: "Our Mission",
      description: "To create a seamless and joyful connection between fashion brands and consumers through innovative, intuitive technology."
    },
    {
      icon: <Users size={32} className="text-secondary" />,
      title: "The Problem",
      description: "Fragmented and inefficient fashion discovery makes it hard for consumers to find brands that truly match their unique style."
    },
    {
      icon: <Smartphone size={32} className="text-accent" />,
      title: "Our Solution",
      description: "A mobile-first platform that transforms fashion discovery into an experience as simple and enjoyable as swiping through your favorite content."
    },
    {
      icon: <Sparkles size={32} className="text-success" />,
      title: "Our Vision",
      description: "To be the world's go-to platform for fashion discovery, connecting millions of consumers with their perfect style matches, anytime, anywhere."
    }
  ];

  return (
    <section id="mission" className="section bg-background-dark section-glow">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why We're Building <span className="gradient-text">Juno</span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-3xl mx-auto">
            We believe fashion discovery should be personal, effortless, and exciting. Here's what drives us.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          {missionItems.map((item, index) => (
            <MissionItem key={index} {...item} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="card max-w-4xl mx-auto p-8 md:p-12 text-center">
            <img 
              src="/team/omer.jpg" 
              alt="Omer Malik, Founder"
              className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-primary/20"
            />
            <p className="text-xl md:text-2xl italic text-white leading-relaxed mb-6">
              "At Juno, we're crafting an experience. We want discovery to be as fun as finding the perfect outfit. Our technology is the bridge between incredible brands and the people who will love them."
            </p>
            <div>
              <p className="font-bold text-lg text-white">Omer Malik</p>
              <p className="text-sm text-primary">Founder & CEO, Juno</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Mission;
