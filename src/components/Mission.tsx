import React from 'react';
import { Target, Users, Smartphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface MissionItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  color: 'primary' | 'secondary' | 'accent' | 'success';
}

const colorClasses = {
    primary: {
        text: 'text-primary',
        bg: 'bg-primary/10',
        border: 'hover:border-primary/50',
        glow: 'text-primary/5'
    },
    secondary: {
        text: 'text-secondary',
        bg: 'bg-secondary/10',
        border: 'hover:border-secondary/50',
        glow: 'text-secondary/5'
    },
    accent: {
        text: 'text-accent',
        bg: 'bg-accent/10',
        border: 'hover:border-accent/50',
        glow: 'text-accent/5'
    },
    success: {
        text: 'text-success',
        bg: 'bg-success/10',
        border: 'hover:border-success/50',
        glow: 'text-success/5'
    }
};

const MissionItem: React.FC<MissionItemProps> = ({ icon, title, description, index, color }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const styles = colorClasses[color];
  const iconWithColor = React.cloneElement(icon as React.ReactElement, { className: styles.text });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 * index }}
      className={`relative bg-neutral-900/50 p-8 rounded-2xl border border-neutral-800 overflow-hidden group transition-all duration-300 ${styles.border}`}
    >
      <div className={`absolute -top-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${styles.glow}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 128 })}
      </div>
      <div className="relative z-10">
        <div className={`p-3 rounded-lg inline-block mb-4 ${styles.bg}`}>
          {iconWithColor}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-neutral-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const Mission: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const missionItems = [
    {
      icon: <Target size={32} />,
      title: "Our Mission",
      description: "To create a seamless and joyful connection between fashion brands and consumers through innovative, intuitive technology.",
      color: "primary" as const
    },
    {
      icon: <Users size={32} />,
      title: "The Problem",
      description: "Fragmented and inefficient fashion discovery makes it hard for consumers to find brands that truly match their unique style.",
      color: "secondary" as const
    },
    {
      icon: <Smartphone size={32} />,
      title: "Our Solution",
      description: "A mobile-first platform that transforms fashion discovery into an experience as simple and enjoyable as swiping through your favorite content.",
      color: "accent" as const
    },
    {
      icon: <Sparkles size={32} />,
      title: "Our Vision",
      description: "To be the world's go-to platform for fashion discovery, connecting millions of consumers with their perfect style matches, anytime, anywhere.",
      color: "success" as const
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

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {missionItems.map((item, index) => (
            <MissionItem key={index} {...item} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative max-w-4xl mx-auto bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20"
        >
          <div className="absolute top-8 left-8 text-primary/20">
            <svg width="60" height="48" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.298 48H0L12.298 28.88H18.81L6.512 48H12.298ZM20.596 0H32.894L20.596 19.12H14.084L26.382 0H20.596ZM43.486 0H55.784L43.486 19.12H36.974L49.272 0H43.486ZM54.182 48H41.884L54.182 28.88H60L47.702 48H54.182Z" fill="currentColor"/></svg>
          </div>
          <div className="relative z-10 text-center">
            <p className="text-2xl md:text-3xl font-medium italic text-white leading-relaxed mb-8">
              "At Juno, we're crafting an experience. We want discovery to be as fun as finding the perfect outfit. Our technology is the bridge between incredible brands and the people who will love them."
            </p>
            <div className="flex items-center justify-center">
              <img 
                src="/team/omer.jpg" 
                alt="Omer Malik, Founder"
                className="w-16 h-16 rounded-full mr-4 border-2 border-primary/50"
              />
              <div>
                <p className="font-bold text-xl text-white">Omer Malik</p>
                <p className="text-md text-primary">Founder & CEO, Juno</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Mission;
