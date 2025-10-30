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
  { name: 'PMYP', logo: pmyp },
  { name: 'ImpactX', logo: impactx },
  { name: 'Khantastic', logo: khantastic },
  { name: 'Tajarba', logo: tajarba },
  { name: 'Creare', logo: creare },
  { name: 'SparkTank', logo: sparktank },
];

const ImpactCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number; }> = ({ icon, title, description, delay }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="card card-hover text-center p-8"
    >
      <div className="mb-5 flex justify-center">
        <div className="p-4 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
      <h3 className="text-5xl font-extrabold text-white mb-3">{title}</h3>
      <p className="text-neutral-400">{description}</p>
    </motion.div>
  );
};

const PartnerLogo: React.FC<{ logo: string; name: string; delay: number; }> = ({ logo, name, delay }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group flex items-center justify-center p-6 bg-neutral-900/80 rounded-2xl border border-neutral-800 hover:bg-white/5 transition-all duration-300"
    >
      <img src={logo} alt={name} className="max-h-12 w-auto filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"/>
    </motion.div>
  );
};

const JunoApp: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const impactStats = [
    {
      icon: <Building className="text-secondary" size={32} />,
      title: "200+",
      description: "Microbusinesses empowered through our accelerator program",
      delay: 0.2,
    },
    {
      icon: <Users className="text-accent" size={32} />,
      title: "35+",
      description: "University campuses with active student ambassador programs",
      delay: 0.3,
    },
    {
      icon: <TrendingUp className="text-primary" size={32} />,
      title: "5000+",
      description: "Active users shaping the future of fashion discovery",
      delay: 0.4,
    },
  ];

  return (
    <section id="juno-app" className="section section-glow bg-background-dark">
      <div className="container mx-auto">
        {/* Impact Section */}
        <div className="mb-24">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Empowering a <span className="gradient-text">Fashion Revolution</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-3xl mx-auto">
              We're not just building an app; we're fostering a community and creating tangible impact for entrepreneurs and fashion lovers across Pakistan.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {impactStats.map((stat, index) => (
              <ImpactCard key={index} {...stat} />
            ))}
          </div>
        </div>

        {/* Partners Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold mb-2 text-neutral-300">
              Backed by Industry Leaders & Innovators
            </h3>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {partners.map((partner, index) => (
              <PartnerLogo
                key={index}
                logo={partner.logo}
                name={partner.name}
                delay={0.1 * index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JunoApp;
