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
        bg: 'from-primary/20 to-primary/5',
        border: 'group-hover:border-primary/50',
        iconBg: 'bg-primary'
    },
    secondary: {
        text: 'text-secondary',
        bg: 'from-secondary/20 to-secondary/5',
        border: 'group-hover:border-secondary/50',
        iconBg: 'bg-secondary'
    },
    accent: {
        text: 'text-accent',
        bg: 'from-accent/20 to-accent/5',
        border: 'group-hover:border-accent/50',
        iconBg: 'bg-accent'
    },
    success: {
        text: 'text-green-400',
        bg: 'from-green-500/20 to-green-500/5',
        border: 'group-hover:border-green-500/50',
        iconBg: 'bg-green-500'
    }
};

const MissionItem: React.FC<MissionItemProps> = ({ icon, title, description, index, color }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const styles = colorClasses[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 * index }}
      className={`group relative p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 overflow-hidden ${styles.border}`}
    >
      {/* Gradient Blob */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${styles.bg} blur-[60px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${styles.iconBg} flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
          {React.cloneElement(icon as React.ReactElement, { size: 28, className: 'text-white' })}
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-neutral-400 leading-relaxed text-lg">{description}</p>
      </div>
    </motion.div>
  );
};

const Mission: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const missionItems = [
    {
      icon: <Target />,
      title: "Our Mission",
      description: "To create a seamless and joyful connection between fashion brands and consumers through innovative, intuitive technology.",
      color: "primary" as const
    },
    {
      icon: <Users />,
      title: "The Problem",
      description: "Fragmented and inefficient fashion discovery makes it hard for consumers to find brands that truly match their unique style.",
      color: "secondary" as const
    },
    {
      icon: <Smartphone />,
      title: "Our Solution",
      description: "A mobile-first platform that transforms fashion discovery into an experience as simple and enjoyable as swiping through your favorite content.",
      color: "accent" as const
    },
    {
      icon: <Sparkles />,
      title: "Our Vision",
      description: "To be the world's go-to platform for fashion discovery, connecting millions of consumers with their perfect style matches, anytime, anywhere.",
      color: "success" as const
    }
  ];

  return (
    <section id="mission" className="py-32 bg-black relative">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
            Why We're Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Juno</span>
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            We believe fashion discovery should be personal, effortless, and exciting. Here's what drives us.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-24">
          {missionItems.map((item, index) => (
            <MissionItem key={index} {...item} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-[3rem] blur-xl opacity-50" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 md:p-16 text-center">
            <div className="mb-8 text-primary opacity-50">
              <svg width="60" height="48" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto"><path d="M12.298 48H0L12.298 28.88H18.81L6.512 48H12.298ZM20.596 0H32.894L20.596 19.12H14.084L26.382 0H20.596ZM43.486 0H55.784L43.486 19.12H36.974L49.272 0H43.486ZM54.182 48H41.884L54.182 28.88H60L47.702 48H54.182Z" fill="currentColor"/></svg>
            </div>
            
            <p className="text-2xl md:text-4xl font-medium text-white leading-relaxed mb-10">
              "At Juno, we're crafting an experience. We want discovery to be as fun as finding the perfect outfit. Our technology is the bridge between incredible brands and the people who will love them."
            </p>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary mb-4">
                <img 
                  src="/team/omer.png" 
                  alt="Omer Malik, Founder"
                  className="w-full h-full rounded-full object-cover border-4 border-black"
                />
              </div>
              <p className="font-bold text-xl text-white">Omer Malik</p>
              <p className="text-primary font-medium">Founder & CEO, Juno</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Mission;