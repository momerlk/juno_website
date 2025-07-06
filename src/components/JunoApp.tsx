import React from 'react';
import { Smartphone, Heart, ShoppingBag, Zap, Search, Users, Building, Award } from 'lucide-react';
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
      className="card  text-center"
    >
      <h3 className="text-4xl font-bold mb-2">{title}</h3>
      <p className="text-neutral-400">{description}</p>
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
      className="backdrop-blur-sm rounded-lg p-6 flex items-center justify-center hover:bg-white/10 transition-colors"
    >
      <img src={name}/>
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
      icon: <Building className="text-secondary" size={24} />,
      title: "200+",
      description: "Microbusinesses helped through impactX",
      delay: 0.2,
    },
    {
      icon: <Users className="text-accent" size={24} />,
      title: "15+",
      description: "Universities with ambassadors",
      delay: 0.3,
    },
    {
      icon: <Award className="text-primary" size={24} />,
      title: "1000+",
      description: "Users discovering fashion",
      delay: 0.4,
    },
  ];

  

  return (
    <section id="juno-app" className="section bg-background-light">
      <div className="container mx-auto">

        {/* Impact Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold mb-4">Our Impact</h3>
            
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <div className="mb-16">
          <motion.div
            ref={partnersRef}
            initial={{ opacity: 0, y: 20 }}
            animate={partnersInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold mb-4">Our Partners</h3>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Backed by leading investors and accelerators
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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