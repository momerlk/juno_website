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
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="group relative bg-white/5 border border-white/5 hover:border-white/10 p-8 rounded-3xl backdrop-blur-sm transition-all hover:bg-white/10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-5xl font-black text-white mb-4 tracking-tight">{title}</h3>
        <p className="text-neutral-400 text-lg leading-relaxed">{description}</p>
      </div>
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
      className="group flex items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
    >
      <img 
        src={logo} 
        alt={name} 
        className="max-h-16 w-auto filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110"
      />
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
    <section id="juno-app" className="py-32 bg-black relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black to-black opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Impact Section */}
        <div className="mb-32">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">
              Empowering a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Fashion Revolution</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              We're not just building an app; we're fostering a community and creating tangible impact for entrepreneurs and fashion lovers across Pakistan.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
            className="text-center mb-16"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Backed by Industry Leaders
            </h3>
            <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
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