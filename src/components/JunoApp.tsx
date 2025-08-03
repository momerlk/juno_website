import React from 'react';
import { Users, Building, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

import pmyp from "../assets/partners/pmyp.png"
import impactx from "../assets/partners/impactx.png"
import khantastic from "../assets/partners/khantastic.png"
import tajarba from "../assets/partners/tajarba.png"
import creare from "../assets/partners/creare.png"
import sparktank from "../assets/partners/sparktank.png"

const partners = [
  pmyp,
  impactx,
  khantastic,
  tajarba,
  creare,
  sparktank
];

const ImpactCard: React.FC<{
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
      className="group relative bg-gradient-to-br from-background-light/50 to-background/50 backdrop-blur-sm rounded-2xl p-8 text-center hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-neutral-800/50 hover:border-primary/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="mb-4 flex justify-center">
          <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        <h3 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent group-hover:from-primary group-hover:to-secondary transition-all duration-300">{title}</h3>
        <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors duration-300">{description}</p>
      </div>
    </motion.div>
  );
};

const PartnerLogo: React.FC<{
  name: string;
  delay: number;
}> = ({ name, delay }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group bg-background-light/40 backdrop-blur-sm rounded-xl p-8 flex items-center justify-center hover:bg-white/15 transition-all duration-300 border border-neutral-700/60 hover:border-neutral-500/70 hover:shadow-xl hover:shadow-primary/10 hover:scale-110 min-h-[120px]"
    >
      <img src={name} className="max-h-16 w-auto filter grayscale-0 transition-all duration-300 opacity-90 group-hover:opacity-100 group-hover:scale-105"/>
    </motion.div>
  );
};

const JunoApp: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [partnersRef, partnersInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const impactStats = [
    {
      icon: <Building className="text-secondary" size={28} />,
      title: "200+",
      description: "Microbusinesses helped through impactX",
      delay: 0.2,
    },
    {
      icon: <Users className="text-accent" size={28} />,
      title: "25+",
      description: "Institutes with ambassadors",
      delay: 0.3,
    },
    {
      icon: <TrendingUp className="text-primary" size={28} />,
      title: "400+",
      description: "Beta testers discovering fashion",
      delay: 0.4,
    },
  ];

  

  return (
    <section id="juno-app" className="section bg-gradient-to-b from-background to-background-light relative overflow-hidden">
      <div className="container mx-auto">
        {/* Background decoration */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>

        {/* Impact Section */}
        <div className="mb-24 relative z-10">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
              🚀 Making a Difference
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Our <span className="gradient-text">Impact</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Empowering fashion entrepreneurs and connecting communities across Pakistan
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {impactStats.map((stat, index) => (
              <ImpactCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                description={stat.description}
                delay={stat.delay}
              />
            ))}
          </div>
        </div>

        {/* Partners Section */}
        <div className="relative z-10">
          <motion.div
            ref={partnersRef}
            initial={{ opacity: 0, y: 20 }}
            animate={partnersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-sm font-medium mb-6">
              🤝 Trusted Partners
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Backed by <span className="gradient-text">Industry Leaders</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Supported by Pakistan's leading investors, accelerators, and innovation hubs
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {partners.map((partner, index) => (
              <PartnerLogo
                key={index}
                name={partner}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JunoApp;