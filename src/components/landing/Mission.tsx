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
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 * index }}
      className="group relative p-10 rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 overflow-hidden hover:border-primary/20"
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-primary/10 to-secondary/10 blur-[60px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-8 shadow-xl shadow-primary/20 transform group-hover:rotate-6 transition-transform duration-300">
          {React.cloneElement(icon as React.ReactElement, { size: 32, className: 'text-white' })}
        </div>
        <h3 className="text-3xl font-black text-white mb-6 tracking-tighter">{title}</h3>
        <p className="text-neutral-400 leading-relaxed text-xl font-light italic">{description}</p>
      </div>
    </motion.div>
  );
};

const Mission: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const missionItems = [
    {
      icon: <Target />,
      title: 'Our Mission',
      description: 'Scale independent Pakistani labels through superior discovery and infrastructure.'
    },
    {
      icon: <Users />,
      title: 'The Problem',
      description: 'Creative original labels are buried by platforms that prioritize mass catalogs over craft.'
    },
    {
      icon: <Smartphone />,
      title: 'Our Solution',
      description: 'A purpose-built mobile ecosystem designed for storytelling and conversion of indie brands.'
    },
    {
      icon: <Sparkles />,
      title: 'Our Vision',
      description: 'The definitive marketplace where every purchase supports homegrown talent and creativity.'
    }
  ];

  return (
    <section id="mission" className="py-32 bg-black relative border-b border-white/5">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">
            Why We Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic py-2 px-3">Juno</span>
          </h2>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto font-light italic leading-relaxed">
            The future of fashion belongs to independent creators, not just mass production.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-32">
          {missionItems.map((item, index) => (
            <MissionItem key={index} {...item} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative max-w-6xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-[3rem] blur-3xl opacity-50" />
          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-12 md:p-20 text-center">
            <p className="text-3xl md:text-5xl font-light text-white leading-tight mb-12 italic tracking-tight">
              &ldquo;Juno exists to make independent brands impossible to ignore.&rdquo;
            </p>

            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary mb-6 shadow-2xl shadow-primary/20">
                <img
                  src="/team/omer.png"
                  alt="Omer Malik, Founder"
                  className="w-full h-full rounded-full object-cover border-4 border-black"
                />
              </div>
              <p className="font-black text-2xl text-white tracking-tighter uppercase">Omer Malik</p>
              <p className="text-primary font-bold tracking-[0.2em] uppercase text-sm mt-1">Founder & CEO, Juno</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Mission;
